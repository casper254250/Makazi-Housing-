(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var ids = (Makazi.core && Makazi.core.ids) || (typeof require !== 'undefined' ? require('../core/ids') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var events = (Makazi.core && Makazi.core.events) || (typeof require !== 'undefined' ? require('../core/events') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});
  var maintenanceRules = (Makazi.rules && Makazi.rules.maintenanceRules) || (typeof require !== 'undefined' ? require('../rules/maintenanceRules') : {});

  function list(filters) {
    var store = storage.load();
    var opts = filters || {};

    return store.maintenanceRequests.map(function (req) {
      var unit = utils.findById(store.units, req.unitId);
      var prop = unit ? utils.findById(store.properties, unit.propertyId) : null;
      return Object.assign({}, req, {
        unitNumber: unit ? unit.unitNumber : 'Unknown',
        propertyName: prop ? prop.name : 'Unknown'
      });
    }).filter(function (r) {
      if (opts.status && r.status !== opts.status) return false;
      if (opts.priority && r.priority !== opts.priority) return false;
      if (opts.unitId && r.unitId !== opts.unitId) return false;
      return true;
    }).sort(function (a, b) {
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
      if (b.reportedOn > a.reportedOn) return 1;
      if (b.reportedOn < a.reportedOn) return -1;
      return 0;
    });
  }

  function create(input) {
    var store = storage.load();
    var unit = utils.findById(store.units, input && input.unitId);
    var check = maintenanceRules.validateMaintenanceInput(input, unit);
    if (!check.ok) return check;

    var now = dates.nowIso();
    var record = Object.assign({
      id: ids.nextId('maint'),
      status: 'open',
      completedOn: null,
      createdAt: now,
      updatedAt: now
    }, check.data);

    store.maintenanceRequests.push(record);
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'maintenance', action: 'create', id: record.id });
    return { ok: true, data: record };
  }

  function markComplete(id, completedOn) {
    var store = storage.load();
    var req = utils.findById(store.maintenanceRequests, id);
    var check = maintenanceRules.canMarkComplete(req);
    if (!check.ok) return check;

    var doneDate = dates.isValidIsoDate(completedOn) ? completedOn : dates.today();
    req.status = 'completed';
    req.completedOn = doneDate;
    req.updatedAt = dates.nowIso();

    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'maintenance', action: 'complete', id: req.id });
    return { ok: true, data: req };
  }

  var maintenanceService = {
    list: list,
    create: create,
    markComplete: markComplete
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.maintenanceService = maintenanceService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = maintenanceService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
