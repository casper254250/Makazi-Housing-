(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var events = (Makazi.core && Makazi.core.events) || (typeof require !== 'undefined' ? require('../core/events') : {});
  var schema = (Makazi.data && Makazi.data.schema) || (typeof require !== 'undefined' ? require('./schema') : {});
  var migrations = (Makazi.data && Makazi.data.migrations) || (typeof require !== 'undefined' ? require('./migrations') : {});
  var sampleData = (Makazi.data && Makazi.data.sampleData) || (typeof require !== 'undefined' ? require('./sampleData') : {});

  var STORAGE_KEY = constants.STORAGE_KEY || 'makazi.v1';

  var memoryFallbackMap = {};
  var memoryAdapter = {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(memoryFallbackMap, key) ? memoryFallbackMap[key] : null;
    },
    setItem: function (key, value) {
      memoryFallbackMap[key] = String(value);
    },
    removeItem: function (key) {
      delete memoryFallbackMap[key];
    }
  };

  var customAdapter = null;
  var usingMemoryFallback = false;
  var lastWarning = null;

  function resolveAdapter() {
    if (customAdapter) return customAdapter;
    try {
      if (typeof root !== 'undefined' && root.localStorage) {
        var testKey = '__makazi_probe__';
        root.localStorage.setItem(testKey, '1');
        root.localStorage.removeItem(testKey);
        usingMemoryFallback = false;
        return root.localStorage;
      }
    } catch (err) {
      usingMemoryFallback = true;
      lastWarning = 'Browser localStorage unavailable; using temporary in-memory storage.';
    }
    usingMemoryFallback = true;
    return memoryAdapter;
  }

  function setAdapter(adapter) {
    customAdapter = adapter || null;
  }

  function clearMemoryFallback() {
    memoryFallbackMap = {};
  }

  function save(data) {
    var validated = schema.validateStore(data);
    if (!validated.ok) {
      return { ok: false, error: validated.error };
    }
    var payload = schema.normalizeStore(data);
    var serialized;
    try {
      serialized = JSON.stringify(payload);
    } catch (err) {
      return { ok: false, error: 'Unable to serialize store data.' };
    }

    var adapter = resolveAdapter();
    try {
      adapter.setItem(STORAGE_KEY, serialized);
      return { ok: true, data: utils.clone(payload) };
    } catch (err) {
      // Fallback safely to in-memory storage if quota exceeded or blocked
      usingMemoryFallback = true;
      lastWarning = 'Storage write failed; fell back to temporary memory.';
      memoryAdapter.setItem(STORAGE_KEY, serialized);
      return { ok: true, data: utils.clone(payload), warning: lastWarning };
    }
  }

  function load() {
    var adapter = resolveAdapter();
    var raw = null;
    try {
      raw = adapter.getItem(STORAGE_KEY);
    } catch (err) {
      raw = memoryAdapter.getItem(STORAGE_KEY);
      usingMemoryFallback = true;
      lastWarning = 'Storage read failed; using temporary memory.';
    }

    if (!raw) {
      var initial = sampleData.createSampleData();
      save(initial);
      return utils.clone(initial);
    }

    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      lastWarning = 'Stored data was corrupted and has been restored to sample data.';
      var recovered = sampleData.createSampleData();
      save(recovered);
      return utils.clone(recovered);
    }

    var migrated = migrations.migrate(parsed);
    var check = schema.validateStore(migrated);
    if (!check.ok) {
      lastWarning = 'Stored data failed schema check and was restored to sample data.';
      var fresh = sampleData.createSampleData();
      save(fresh);
      return utils.clone(fresh);
    }

    if (!parsed.version || parsed.version !== migrated.version) {
      save(migrated);
    }

    return utils.clone(migrated);
  }

  function reset(referenceDate) {
    var fresh = sampleData.createSampleData(referenceDate);
    var res = save(fresh);
    if (res.ok && events && typeof events.emit === 'function') {
      events.emit('data:changed', { source: 'reset' });
    }
    return res;
  }

  function getStatus() {
    return {
      key: STORAGE_KEY,
      usingMemoryFallback: usingMemoryFallback,
      lastWarning: lastWarning
    };
  }

  var storage = {
    STORAGE_KEY: STORAGE_KEY,
    setAdapter: setAdapter,
    clearMemoryFallback: clearMemoryFallback,
    load: load,
    save: save,
    reset: reset,
    getStatus: getStatus
  };

  Makazi.data = Makazi.data || {};
  Makazi.data.storage = storage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = storage;
  }
})(typeof window !== 'undefined' ? window : globalThis);
