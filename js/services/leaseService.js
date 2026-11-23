(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var ids = (Makazi.core && Makazi.core.ids) || (typeof require !== 'undefined' ? require('../core/ids') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var events = (Makazi.core && Makazi.core.events) || (typeof require !== 'undefined' ? require('../core/events') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});
  var leaseRules = (Makazi.rules && Makazi.rules.leaseRules) || (typeof require !== 'undefined' ? require('../rules/leaseRules') : {});

  function list(filters) {
    var store = storage.load();
    var opts = filters || {};

    return store.leases.map(function (lease) {
      var unit = utils.findById(store.units, lease.unitId);
      var prop = unit ? utils.findById(store.properties, unit.propertyId) : null;
      var tenant = utils.findById(store.tenants, lease.tenantId);
      var remaining = leaseRules.daysRemaining(lease.endDate);
      return Object.assign({}, lease, {
        unitNumber: unit ? unit.unitNumber : 'Unknown',
        propertyName: prop ? prop.name : 'Unknown',
        tenantName: tenant ? tenant.fullName : 'Unknown',
        daysRemaining: remaining,
        endingSoon: leaseRules.isEndingWithinDays(lease, constants.LEASE_EXPIRY_ALERT_DAYS || 90)
      });
    }).filter(function (l) {
      if (opts.status && l.status !== opts.status) return false;
      if (opts.termType && l.termType !== opts.termType) return false;
      return true;
    });
  }

  function create(input) {
    var store = storage.load();
    var unit = utils.findById(store.units, input && input.unitId);
    var tenant = utils.findById(store.tenants, input && input.tenantId);

    var check = leaseRules.validateNewLease(input, unit, tenant);
    if (!check.ok) return check;

    var now = dates.nowIso();
    var record = {
      id: ids.nextId('lease'),
      unitId: unit.id,
      tenantId: tenant.id,
      startDate: input.startDate,
      endDate: input.endDate,
      monthlyRent: check.data.monthlyRent,
      deposit: check.data.deposit,
      status: 'active',
      termType: check.data.termType,
      createdAt: now,
      updatedAt: now
    };

    unit.status = 'occupied';
    unit.updatedAt = now;
    store.leases.push(record);

    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'lease', action: 'create', id: record.id });
    return { ok: true, data: record };
  }

  function endLease(leaseId) {
    var store = storage.load();
    var lease = utils.findById(store.leases, leaseId);
    if (!lease) return { ok: false, error: 'Lease record not found.' };
    if (lease.status === 'ended') {
      return { ok: false, error: 'Lease is already ended.' };
    }

    var now = dates.nowIso();
    lease.status = 'ended';
    lease.updatedAt = now;

    var unit = utils.findById(store.units, lease.unitId);
    if (unit) {
      unit.status = 'vacant';
      unit.updatedAt = now;
    }

    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'lease', action: 'end', id: lease.id });
    return { ok: true, data: lease };
  }

  var leaseService = {
    list: list,
    create: create,
    endLease: endLease
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.leaseService = leaseService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = leaseService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
