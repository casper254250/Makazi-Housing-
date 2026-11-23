(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var ids = (Makazi.core && Makazi.core.ids) || (typeof require !== 'undefined' ? require('../core/ids') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var events = (Makazi.core && Makazi.core.events) || (typeof require !== 'undefined' ? require('../core/events') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});
  var unitRules = (Makazi.rules && Makazi.rules.unitRules) || (typeof require !== 'undefined' ? require('../rules/unitRules') : {});

  function list(filters) {
    var store = storage.load();
    var opts = filters || {};
    var query = utils.trimString(opts.search).toLowerCase();

    return store.units.map(function (unit) {
      var prop = utils.findById(store.properties, unit.propertyId);
      var activeLease = store.leases.find(function (l) {
        return l.unitId === unit.id && l.status === 'active';
      }) || null;
      var tenant = activeLease ? utils.findById(store.tenants, activeLease.tenantId) : null;
      var meter = store.waterMeters.find(function (m) { return m.unitId === unit.id; }) || null;
      return Object.assign({}, unit, {
        propertyName: prop ? prop.name : 'Unknown property',
        propertyArea: prop ? (prop.area === 'Other' && prop.areaOther ? prop.areaOther : prop.area) : '',
        needsRenovation: unitRules.needsRenovation(unit),
        currentTenantName: tenant ? tenant.fullName : null,
        meterNumber: meter ? meter.meterNumber : '',
        meterType: meter ? meter.type : 'manual',
        startingReading: meter ? meter.startingReading : 0
      });
    }).filter(function (u) {
      if (opts.propertyId && u.propertyId !== opts.propertyId) return false;
      if (opts.status && u.status !== opts.status) return false;
      if (opts.type && u.type !== opts.type) return false;
      if (query) {
        var hay = (u.unitNumber + ' ' + u.propertyName + ' ' + u.propertyArea + ' ' + u.type + ' ' + u.meterNumber + ' ' + (u.notes || '')).toLowerCase();
        if (hay.indexOf(query) === -1) return false;
      }
      return true;
    });
  }

  function listVacant() {
    return list({ status: 'vacant' });
  }

  function getById(id) {
    var store = storage.load();
    var unit = utils.findById(store.units, id);
    if (!unit) return null;
    var meter = store.waterMeters.find(function (m) { return m.unitId === unit.id; }) || null;
    return Object.assign({}, unit, {
      meterNumber: meter ? meter.meterNumber : '',
      meterType: meter ? meter.type : 'manual',
      startingReading: meter ? meter.startingReading : 0
    });
  }

  function create(input) {
    var check = unitRules.validateUnitInput(input);
    if (!check.ok) return check;

    var store = storage.load();
    var prop = utils.findById(store.properties, check.data.propertyId);
    if (!prop) return { ok: false, error: 'Selected property does not exist.' };

    var duplicate = store.units.some(function (u) {
      return u.propertyId === check.data.propertyId &&
        u.unitNumber.toLowerCase() === check.data.unitNumber.toLowerCase();
    });
    if (duplicate) {
      return { ok: false, error: 'Unit "' + check.data.unitNumber + '" already exists in ' + prop.name + '.' };
    }

    var meterNumber = utils.trimString(input.meterNumber) || ('MTR-' + check.data.unitNumber.toUpperCase());
    var meterType = input.meterType === 'digital' ? 'digital' : 'manual';
    var startRead = input.startingReading !== undefined && input.startingReading !== '' ? Number(input.startingReading) : 0;
    if (!isFinite(startRead) || startRead < 0) {
      return { ok: false, error: 'Starting meter reading must be zero or greater.' };
    }

    var now = dates.nowIso();
    var record = Object.assign({
      id: ids.nextId('unit'),
      createdAt: now,
      updatedAt: now
    }, check.data);

    var meterRecord = {
      id: ids.nextId('meter'),
      unitId: record.id,
      meterNumber: meterNumber,
      type: meterType,
      startingReading: Math.round(startRead * 100) / 100,
      createdAt: now,
      updatedAt: now
    };

    store.units.push(record);
    store.waterMeters.push(meterRecord);
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'unit', action: 'create', id: record.id });
    return { ok: true, data: record };
  }

  function update(id, input) {
    var check = unitRules.validateUnitInput(input);
    if (!check.ok) return check;

    var store = storage.load();
    var existing = utils.findById(store.units, id);
    if (!existing) return { ok: false, error: 'Unit not found.' };

    var prop = utils.findById(store.properties, check.data.propertyId);
    if (!prop) return { ok: false, error: 'Selected property does not exist.' };

    var hasActiveLease = store.leases.some(function (l) {
      return l.unitId === id && l.status === 'active';
    });
    if (hasActiveLease && check.data.status !== 'occupied') {
      return { ok: false, error: 'Unit has an active lease and must remain occupied until the lease ends.' };
    }
    if (!hasActiveLease && check.data.status === 'occupied') {
      return { ok: false, error: 'Create a lease to mark a unit as occupied.' };
    }

    var duplicate = store.units.some(function (u) {
      return u.id !== id &&
        u.propertyId === check.data.propertyId &&
        u.unitNumber.toLowerCase() === check.data.unitNumber.toLowerCase();
    });
    if (duplicate) {
      return { ok: false, error: 'Unit "' + check.data.unitNumber + '" already exists in ' + prop.name + '.' };
    }

    var now = dates.nowIso();
    Object.assign(existing, check.data, { updatedAt: now });

    var meter = store.waterMeters.find(function (m) { return m.unitId === id; });
    if (input.meterNumber !== undefined || input.meterType !== undefined || input.startingReading !== undefined) {
      var meterNum = utils.trimString(input.meterNumber) || (meter ? meter.meterNumber : 'MTR-' + check.data.unitNumber);
      var meterType = input.meterType === 'digital' ? 'digital' : (input.meterType === 'manual' ? 'manual' : (meter ? meter.type : 'manual'));
      var startRead = input.startingReading !== undefined && input.startingReading !== '' ? Number(input.startingReading) : (meter ? meter.startingReading : 0);
      if (!isFinite(startRead) || startRead < 0) {
        return { ok: false, error: 'Starting meter reading must be zero or greater.' };
      }
      if (meter) {
        meter.meterNumber = meterNum;
        meter.type = meterType;
        meter.startingReading = Math.round(startRead * 100) / 100;
        meter.updatedAt = now;
      } else {
        store.waterMeters.push({
          id: ids.nextId('meter'),
          unitId: id,
          meterNumber: meterNum,
          type: meterType,
          startingReading: Math.round(startRead * 100) / 100,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'unit', action: 'update', id: existing.id });
    return { ok: true, data: existing };
  }

  function remove(id) {
    var store = storage.load();
    var existing = utils.findById(store.units, id);
    if (!existing) return { ok: false, error: 'Unit not found.' };

    var guard = unitRules.canDeleteUnit(id, store.leases);
    if (!guard.ok) return guard;

    var meterIds = store.waterMeters
      .filter(function (m) { return m.unitId === id; })
      .map(function (m) { return m.id; });

    store.units = store.units.filter(function (u) { return u.id !== id; });
    store.waterMeters = store.waterMeters.filter(function (m) { return m.unitId !== id; });
    store.waterReadings = store.waterReadings.filter(function (r) { return meterIds.indexOf(r.meterId) === -1; });
    store.maintenanceRequests = store.maintenanceRequests.filter(function (m) { return m.unitId !== id; });
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'unit', action: 'delete', id: id });
    return { ok: true, data: existing };
  }

  var unitService = {
    list: list,
    listVacant: listVacant,
    getById: getById,
    create: create,
    update: update,
    remove: remove
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.unitService = unitService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = unitService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
