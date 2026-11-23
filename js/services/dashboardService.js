(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});
  var leaseRules = (Makazi.rules && Makazi.rules.leaseRules) || (typeof require !== 'undefined' ? require('../rules/leaseRules') : {});
  var reportRules = (Makazi.rules && Makazi.rules.reportRules) || (typeof require !== 'undefined' ? require('../rules/reportRules') : {});
  var waterRules = (Makazi.rules && Makazi.rules.waterRules) || (typeof require !== 'undefined' ? require('../rules/waterRules') : {});
  var waterService = (Makazi.services && Makazi.services.waterService) || (typeof require !== 'undefined' ? require('./waterService') : {});

  function getSummary(asOfDate) {
    var store = storage.load();
    var refDate = dates.isValidIsoDate(asOfDate) ? asOfDate : dates.today();
    var refMonth = refDate.slice(0, 7);

    var totalUnits = store.units.length;
    var occupiedUnits = store.units.filter(function (u) { return u.status === 'occupied'; }).length;
    var vacantList = store.units.filter(function (u) { return u.status === 'vacant'; }).map(function (u) {
      var prop = utils.findById(store.properties, u.propertyId);
      return Object.assign({}, u, { propertyName: prop ? prop.name : 'Unknown' });
    });
    var underRenovationUnits = store.units.filter(function (u) { return u.status === 'under_renovation'; }).length;
    var occupancyPct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    var activeLeases = store.leases.filter(function (l) { return l.status === 'active'; });
    var alertWindow = constants.LEASE_EXPIRY_ALERT_DAYS || 90;

    var endingWithin90 = activeLeases
      .filter(function (l) { return leaseRules.isEndingWithinDays(l, alertWindow, refDate); })
      .map(function (l) {
        var unit = utils.findById(store.units, l.unitId);
        var prop = unit ? utils.findById(store.properties, unit.propertyId) : null;
        var tenant = utils.findById(store.tenants, l.tenantId);
        return Object.assign({}, l, {
          daysRemaining: leaseRules.daysRemaining(l.endDate, refDate),
          unitNumber: unit ? unit.unitNumber : 'Unknown',
          propertyName: prop ? prop.name : 'Unknown',
          tenantName: tenant ? tenant.fullName : 'Unknown'
        });
      })
      .sort(function (a, b) { return a.daysRemaining - b.daysRemaining; });

    var rentCollectedThisMonth = store.payments
      .filter(function (p) { return p.period === refMonth; })
      .reduce(function (sum, p) { return sum + Number(p.amount || 0); }, 0);

    var recentPayments = store.payments.slice().sort(function (a, b) {
      if (b.paidOn > a.paidOn) return 1;
      if (b.paidOn < a.paidOn) return -1;
      return 0;
    }).slice(0, 5).map(function (p) {
      var lease = utils.findById(store.leases, p.leaseId);
      var unit = lease ? utils.findById(store.units, lease.unitId) : null;
      var tenant = lease ? utils.findById(store.tenants, lease.tenantId) : null;
      return Object.assign({}, p, {
        unitNumber: unit ? unit.unitNumber : 'Unknown',
        tenantName: tenant ? tenant.fullName : 'Unknown'
      });
    });

    var openRepairs = store.maintenanceRequests.filter(function (r) { return r.status === 'open'; }).length;

    // Water & MUWASCO metrics
    var waterMonthSummary = waterService.getMonthlySummary(refMonth);
    var totalConsumptionAllTime = 0;
    store.waterMeters.forEach(function (meter) {
      var readings = store.waterReadings
        .filter(function (r) { return r.meterId === meter.id; })
        .sort(function (a, b) { return a.month < b.month ? -1 : (a.month > b.month ? 1 : 0); });
      if (readings.length > 0) {
        var lastRead = Number(readings[readings.length - 1].reading);
        var cons = waterRules.calculateConsumption(meter.startingReading, lastRead);
        if (!isNaN(cons) && cons > 0) totalConsumptionAllTime += cons;
      }
    });
    var totalMuwascoPayableAll = waterRules.muwascoPayable(totalConsumptionAllTime, store.tariffSettings.muwascoRatePerM3);
    var totalMuwascoPaidAll = store.muwascoPayments.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
    var muwascoBalanceOwed = Math.max(0, totalMuwascoPayableAll - totalMuwascoPaidAll);

    var split = reportRules.computeStudentVsCommunitySplit(store.units, store.leases, store.tenants);

    return {
      stats: {
        totalUnits: totalUnits,
        occupiedUnits: occupiedUnits,
        vacantUnits: vacantList.length,
        underRenovationUnits: underRenovationUnits,
        occupancyPct: occupancyPct,
        activeLeases: activeLeases.length,
        rentCollectedThisMonth: rentCollectedThisMonth,
        currentMonth: refMonth,
        openRepairs: openRepairs,
        waterConsumedThisMonth: waterMonthSummary.totals.consumptionM3,
        waterBilledThisMonth: waterMonthSummary.totals.tenantWaterBilled,
        waterCollectedThisMonth: waterMonthSummary.totals.waterCollected,
        muwascoBalanceOwed: muwascoBalanceOwed,
        studentOccupied: split.occupiedStudent,
        communityOccupied: split.occupiedCommunity,
        studentTenantsTotal: split.studentTenantsTotal,
        communityTenantsTotal: split.communityTenantsTotal
      },
      endingWithin90: endingWithin90,
      vacantUnits: vacantList,
      recentPayments: recentPayments
    };
  }

  var dashboardService = {
    getSummary: getSummary
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.dashboardService = dashboardService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = dashboardService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
