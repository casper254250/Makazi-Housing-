(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});

  var REQUIRED_COLLECTIONS = [
    'properties',
    'units',
    'tenants',
    'leases',
    'payments',
    'maintenanceRequests',
    'waterMeters',
    'waterReadings',
    'muwascoPayments'
  ];

  function createDefaultTariffs() {
    var d = constants.DEFAULT_TARIFFS || { tenantRatePerM3: 180, tenantFixedCharge: 150, muwascoRatePerM3: 110 };
    return {
      tenantRatePerM3: d.tenantRatePerM3,
      tenantFixedCharge: d.tenantFixedCharge,
      muwascoRatePerM3: d.muwascoRatePerM3,
      updatedAt: null
    };
  }

  function createEmptyStore() {
    return {
      version: constants.SCHEMA_VERSION || 2,
      properties: [],
      units: [],
      tenants: [],
      leases: [],
      payments: [],
      maintenanceRequests: [],
      waterMeters: [],
      waterReadings: [],
      muwascoPayments: [],
      tariffSettings: createDefaultTariffs()
    };
  }

  function validateStore(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, error: 'Store payload must be an object.' };
    }
    for (var i = 0; i < REQUIRED_COLLECTIONS.length; i++) {
      var key = REQUIRED_COLLECTIONS[i];
      if (!Array.isArray(data[key])) {
        return { ok: false, error: 'Collection "' + key + '" must be an array.' };
      }
    }
    if (!data.tariffSettings || typeof data.tariffSettings !== 'object') {
      return { ok: false, error: 'tariffSettings must be an object.' };
    }
    return { ok: true, data: data };
  }

  function normalizeStore(data) {
    var base = createEmptyStore();
    if (!data || typeof data !== 'object') return base;
    base.version = typeof data.version === 'number' ? data.version : (constants.SCHEMA_VERSION || 2);
    for (var i = 0; i < REQUIRED_COLLECTIONS.length; i++) {
      var key = REQUIRED_COLLECTIONS[i];
      base[key] = Array.isArray(data[key]) ? data[key] : [];
    }
    if (data.tariffSettings && typeof data.tariffSettings === 'object') {
      var def = createDefaultTariffs();
      base.tariffSettings = {
        tenantRatePerM3: typeof data.tariffSettings.tenantRatePerM3 === 'number' ? data.tariffSettings.tenantRatePerM3 : def.tenantRatePerM3,
        tenantFixedCharge: typeof data.tariffSettings.tenantFixedCharge === 'number' ? data.tariffSettings.tenantFixedCharge : def.tenantFixedCharge,
        muwascoRatePerM3: typeof data.tariffSettings.muwascoRatePerM3 === 'number' ? data.tariffSettings.muwascoRatePerM3 : def.muwascoRatePerM3,
        updatedAt: data.tariffSettings.updatedAt || null
      };
    }
    return base;
  }

  var schema = {
    REQUIRED_COLLECTIONS: REQUIRED_COLLECTIONS,
    createDefaultTariffs: createDefaultTariffs,
    createEmptyStore: createEmptyStore,
    validateStore: validateStore,
    normalizeStore: normalizeStore
  };

  Makazi.data = Makazi.data || {};
  Makazi.data.schema = schema;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = schema;
  }
})(typeof window !== 'undefined' ? window : globalThis);
