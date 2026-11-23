(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var schema = (Makazi.data && Makazi.data.schema) || (typeof require !== 'undefined' ? require('./schema') : {});

  function getSampleDataModule() {
    return (Makazi.data && Makazi.data.sampleData) || (typeof require !== 'undefined' ? require('./sampleData') : null);
  }

  function isUntouchedV1Sample(rawData) {
    if (!rawData || (rawData.version && rawData.version >= 2)) return false;
    if (Array.isArray(rawData.waterMeters) && rawData.waterMeters.length > 0) return false;
    if (!Array.isArray(rawData.properties) || rawData.properties.length === 0 || rawData.properties.length > 2) return false;
    return rawData.properties.every(function (p) {
      return p && (p.id === 'prop_kiharu' || p.id === 'prop_mukuyu');
    });
  }

  function migrate(rawData) {
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      return null;
    }

    // Legacy payloads must still have core collections as arrays to avoid treating corrupted payloads as valid
    if (!Array.isArray(rawData.properties) || !Array.isArray(rawData.units) || !Array.isArray(rawData.leases)) {
      return null;
    }

    if (isUntouchedV1Sample(rawData)) {
      var sampleMod = getSampleDataModule();
      if (sampleMod && typeof sampleMod.createSampleData === 'function') {
        return sampleMod.createSampleData();
      }
    }

    var currentVersion = constants.SCHEMA_VERSION || 2;
    var data = schema.normalizeStore(rawData);

    if (!rawData.version || rawData.version < 2) {
      // Backfill area on custom legacy properties and category on legacy tenants
      data.properties = data.properties.map(function (p) {
        return Object.assign({ area: p.area || 'Other', areaOther: p.areaOther || p.location || '' }, p);
      });
      data.tenants = data.tenants.map(function (t) {
        return Object.assign({ category: t.category || 'community' }, t);
      });
      data.version = currentVersion;
    }

    data.version = currentVersion;
    return data;
  }

  var migrations = {
    migrate: migrate
  };

  Makazi.data = Makazi.data || {};
  Makazi.data.migrations = migrations;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = migrations;
  }
})(typeof window !== 'undefined' ? window : globalThis);
