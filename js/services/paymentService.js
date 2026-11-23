(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var ids = (Makazi.core && Makazi.core.ids) || (typeof require !== 'undefined' ? require('../core/ids') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var events = (Makazi.core && Makazi.core.events) || (typeof require !== 'undefined' ? require('../core/events') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});
  var paymentRules = (Makazi.rules && Makazi.rules.paymentRules) || (typeof require !== 'undefined' ? require('../rules/paymentRules') : {});
  var waterRules = (Makazi.rules && Makazi.rules.waterRules) || (typeof require !== 'undefined' ? require('../rules/waterRules') : {});
  var waterService = (Makazi.services && Makazi.services.waterService) || (typeof require !== 'undefined' ? require('./waterService') : {});

  function list(filters) {
    var store = storage.load();
    var opts = filters || {};

    return store.payments.map(function (payment) {
      var lease = utils.findById(store.leases, payment.leaseId);
      var unit = lease ? utils.findById(store.units, lease.unitId) : null;
      var prop = unit ? utils.findById(store.properties, unit.propertyId) : null;
      var tenant = lease ? utils.findById(store.tenants, lease.tenantId) : null;
      return Object.assign({}, payment, {
        tenantName: tenant ? tenant.fullName : 'Unknown',
        unitNumber: unit ? unit.unitNumber : 'Unknown',
        propertyName: prop ? prop.name : 'Unknown'
      });
    }).filter(function (p) {
      if (opts.period && p.period !== opts.period) return false;
      if (opts.leaseId && p.leaseId !== opts.leaseId) return false;
      return true;
    }).sort(function (a, b) {
      if (b.paidOn > a.paidOn) return 1;
      if (b.paidOn < a.paidOn) return -1;
      return 0;
    });
  }

  function listMonthlyInvoices(targetMonth) {
    var store = storage.load();
    var month = dates.isValidYearMonth(targetMonth) ? targetMonth : dates.currentMonth();

    return store.leases.filter(function (l) { return l.status === 'active'; }).map(function (lease) {
      var unit = utils.findById(store.units, lease.unitId);
      var prop = unit ? utils.findById(store.properties, unit.propertyId) : null;
      var tenant = utils.findById(store.tenants, lease.tenantId);
      var waterInfo = waterService.computeLeaseWaterForMonthInStore(store, lease, month);
      var rent = Number(lease.monthlyRent || 0);
      var water = waterInfo.waterBill;
      var total = waterRules.invoiceTotal(rent, water);
      var paidInMonth = store.payments
        .filter(function (p) { return p.leaseId === lease.id && p.period === month; })
        .reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
      var balance = total - paidInMonth;

      return {
        leaseId: lease.id,
        month: month,
        unitNumber: unit ? unit.unitNumber : 'Unknown',
        propertyName: prop ? prop.name : 'Unknown',
        tenantName: tenant ? tenant.fullName : 'Unknown',
        rentAmount: rent,
        waterConsumption: waterInfo.consumption,
        hasWaterReading: waterInfo.hasReading,
        waterAmount: water,
        invoiceTotal: total,
        paidInMonth: paidInMonth,
        balanceInMonth: balance
      };
    });
  }

  function listLeaseBalances(asOfDate) {
    var store = storage.load();
    return store.leases.map(function (lease) {
      var unit = utils.findById(store.units, lease.unitId);
      var prop = unit ? utils.findById(store.properties, unit.propertyId) : null;
      var tenant = utils.findById(store.tenants, lease.tenantId);
      var leasePayments = store.payments.filter(function (p) { return p.leaseId === lease.id; });
      var waterBilledTotal = waterService.computeCumulativeWaterForLeaseInStore(store, lease);
      var summary = paymentRules.calculateLeaseBalance(lease, leasePayments, asOfDate, waterBilledTotal);
      return Object.assign({}, summary, {
        leaseId: lease.id,
        leaseStatus: lease.status,
        monthlyRent: lease.monthlyRent,
        startDate: lease.startDate,
        endDate: lease.endDate,
        tenantName: tenant ? tenant.fullName : 'Unknown',
        unitNumber: unit ? unit.unitNumber : 'Unknown',
        propertyName: prop ? prop.name : 'Unknown'
      });
    });
  }

  function record(input) {
    var store = storage.load();
    var lease = utils.findById(store.leases, input && input.leaseId);
    var check = paymentRules.validatePaymentInput(input, lease, store.payments);
    if (!check.ok) return check;

    var now = dates.nowIso();
    var payment = Object.assign({
      id: ids.nextId('pay'),
      createdAt: now,
      updatedAt: now
    }, check.data);

    store.payments.push(payment);
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'payment', action: 'create', id: payment.id });
    return { ok: true, data: payment };
  }

  var paymentService = {
    list: list,
    listMonthlyInvoices: listMonthlyInvoices,
    listLeaseBalances: listLeaseBalances,
    record: record
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.paymentService = paymentService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = paymentService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
