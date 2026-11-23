(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});
  var reportRules = (Makazi.rules && Makazi.rules.reportRules) || (typeof require !== 'undefined' ? require('../rules/reportRules') : {});
  var depositRules = (Makazi.rules && Makazi.rules.depositRules) || (typeof require !== 'undefined' ? require('../rules/depositRules') : {});

  function getReports(targetMonth) {
    var store = storage.load();
    var month = dates.isValidYearMonth(targetMonth) ? targetMonth : dates.currentMonth();
    return {
      month: month,
      occupancyByProperty: reportRules.computeOccupancyByProperty(store.properties, store.units),
      incomeByProperty: reportRules.computeIncomeByProperty(store.properties, store.units, store.leases, store.payments),
      occupancyAndIncomeByArea: reportRules.computeOccupancyAndIncomeByArea(store.properties, store.units, store.leases, store.payments),
      studentVsCommunity: reportRules.computeStudentVsCommunitySplit(store.units, store.leases, store.tenants),
      waterByProperty: reportRules.computeWaterByProperty(
        store.properties,
        store.units,
        store.waterMeters,
        store.waterReadings,
        store.tariffSettings,
        store.muwascoPayments,
        month
      ),
      repairsSummary: reportRules.computeRepairsSummary(store.properties, store.units, store.maintenanceRequests),
      leaseTermSplit: reportRules.computeLeaseTermSplit(store.leases)
    };
  }

  function calculateDepositRefund(deposit, deductions) {
    return depositRules.validateDepositInputs(deposit, deductions);
  }

  var reportService = {
    getReports: getReports,
    calculateDepositRefund: calculateDepositRefund
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.reportService = reportService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = reportService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
