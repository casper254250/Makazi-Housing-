(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var ids = (Makazi.core && Makazi.core.ids) || (typeof require !== 'undefined' ? require('../core/ids') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var events = (Makazi.core && Makazi.core.events) || (typeof require !== 'undefined' ? require('../core/events') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});

  function validateTenantInput(input) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'Tenant details are required.' };
    }
    var fullName = utils.trimString(input.fullName);
    var phone = utils.trimString(input.phone);
    var idNumber = utils.trimString(input.idNumber);
    var nextOfKinName = utils.trimString(input.nextOfKinName);
    var nextOfKinPhone = utils.trimString(input.nextOfKinPhone);
    var intendedStay = input.intendedStay || 'unsure';
    var category = input.category || 'student';

    if (!fullName) return { ok: false, error: 'Full name is required.' };
    if (!phone) return { ok: false, error: 'Phone number is required.' };
    if (!idNumber) return { ok: false, error: 'National ID or reference number is required.' };

    var validCategories = (constants.TENANT_CATEGORIES || []).map(function (c) { return c.value; });
    if (validCategories.indexOf(category) === -1) {
      return { ok: false, error: 'Please select a valid tenant category.' };
    }

    var validStays = (constants.INTENDED_STAYS || []).map(function (s) { return s.value; });
    if (validStays.indexOf(intendedStay) === -1) {
      return { ok: false, error: 'Please select a valid intended stay option.' };
    }

    return {
      ok: true,
      data: {
        fullName: fullName,
        phone: phone,
        idNumber: idNumber,
        category: category,
        nextOfKinName: nextOfKinName,
        nextOfKinPhone: nextOfKinPhone,
        intendedStay: intendedStay
      }
    };
  }

  function list(filters) {
    var store = storage.load();
    var opts = filters || {};
    var query = utils.trimString(opts.search).toLowerCase();

    return store.tenants.map(function (tenant) {
      var tenantLeases = store.leases.filter(function (l) { return l.tenantId === tenant.id; });
      var activeLease = tenantLeases.find(function (l) { return l.status === 'active'; }) || null;
      var currentUnit = activeLease ? utils.findById(store.units, activeLease.unitId) : null;
      var currentProp = currentUnit ? utils.findById(store.properties, currentUnit.propertyId) : null;

      var leaseHistory = tenantLeases.map(function (l) {
        var unit = utils.findById(store.units, l.unitId);
        var prop = unit ? utils.findById(store.properties, unit.propertyId) : null;
        return Object.assign({}, l, {
          unitNumber: unit ? unit.unitNumber : 'Unknown',
          propertyName: prop ? prop.name : 'Unknown'
        });
      });

      var categoryValue = tenant.category || 'community';

      return Object.assign({}, tenant, {
        category: categoryValue,
        categoryLabel: utils.labelFromOptions(constants.TENANT_CATEGORIES, categoryValue, categoryValue),
        intendedStayLabel: utils.labelFromOptions(constants.INTENDED_STAYS, tenant.intendedStay, 'Unsure'),
        currentUnitLabel: currentUnit
          ? (currentProp ? currentProp.name + ' - ' + currentUnit.unitNumber : currentUnit.unitNumber)
          : null,
        activeLeaseId: activeLease ? activeLease.id : null,
        leaseHistory: leaseHistory
      });
    }).filter(function (t) {
      if (opts.category && t.category !== opts.category) return false;
      if (!query) return true;
      var hay = (t.fullName + ' ' + t.phone + ' ' + t.idNumber + ' ' + t.categoryLabel + ' ' + (t.currentUnitLabel || '')).toLowerCase();
      return hay.indexOf(query) !== -1;
    });
  }

  function getById(id) {
    var store = storage.load();
    return utils.findById(store.tenants, id);
  }

  function create(input) {
    var check = validateTenantInput(input);
    if (!check.ok) return check;
    var store = storage.load();
    var now = dates.nowIso();
    var record = Object.assign({
      id: ids.nextId('ten'),
      createdAt: now,
      updatedAt: now
    }, check.data);
    store.tenants.push(record);
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'tenant', action: 'create', id: record.id });
    return { ok: true, data: record };
  }

  function update(id, input) {
    var check = validateTenantInput(input);
    if (!check.ok) return check;
    var store = storage.load();
    var existing = utils.findById(store.tenants, id);
    if (!existing) return { ok: false, error: 'Tenant not found.' };
    Object.assign(existing, check.data, { updatedAt: dates.nowIso() });
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'tenant', action: 'update', id: existing.id });
    return { ok: true, data: existing };
  }

  function remove(id) {
    var store = storage.load();
    var existing = utils.findById(store.tenants, id);
    if (!existing) return { ok: false, error: 'Tenant not found.' };
    var linkedLeases = store.leases.filter(function (l) { return l.tenantId === id; });
    if (linkedLeases.length > 0) {
      return {
        ok: false,
        error: 'Cannot delete tenant because they have ' + linkedLeases.length + ' linked lease record(s).'
      };
    }
    store.tenants = store.tenants.filter(function (t) { return t.id !== id; });
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'tenant', action: 'delete', id: id });
    return { ok: true, data: existing };
  }

  var tenantService = {
    list: list,
    getById: getById,
    create: create,
    update: update,
    remove: remove
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.tenantService = tenantService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = tenantService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
