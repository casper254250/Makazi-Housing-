(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var money = (Makazi.core && Makazi.core.money) || (typeof require !== 'undefined' ? require('../core/money') : {});
  var unitRules = (Makazi.rules && Makazi.rules.unitRules) || (typeof require !== 'undefined' ? require('./unitRules') : {});

  function validateLeaseDates(startDate, endDate) {
    if (!dates.isValidIsoDate(startDate)) {
      return { ok: false, error: 'Start date must be a valid YYYY-MM-DD date.' };
    }
    if (!dates.isValidIsoDate(endDate)) {
      return { ok: false, error: 'End date must be a valid YYYY-MM-DD date.' };
    }
    if (dates.diffDays(startDate, endDate) <= 0) {
      return { ok: false, error: 'Lease end date must be later than start date.' };
    }
    return { ok: true };
  }

  function classifyLeaseTerm(startDate, endDate) {
    var dateCheck = validateLeaseDates(startDate, endDate);
    if (!dateCheck.ok) return null;
    var months = dates.diffMonths(startDate, endDate);
    var threshold = constants.PROJECT_TERM_RULE_MONTHS || 24;
    if (months >= threshold) {
      return constants.LEASE_TERMS ? constants.LEASE_TERMS.LONG_TERM : 'LONG_TERM';
    }
    return constants.LEASE_TERMS ? constants.LEASE_TERMS.SHORT_TERM : 'SHORT_TERM';
  }

  function getDurationMonths(startDate, endDate) {
    var dateCheck = validateLeaseDates(startDate, endDate);
    if (!dateCheck.ok) return 0;
    return Math.max(0, dates.diffMonths(startDate, endDate));
  }

  function daysRemaining(endDate, asOfDate) {
    var ref = dates.isValidIsoDate(asOfDate) ? asOfDate : dates.today();
    if (!dates.isValidIsoDate(endDate)) return NaN;
    return dates.diffDays(ref, endDate);
  }

  function isEndingWithinDays(lease, maxDays, asOfDate) {
    if (!lease || lease.status !== 'active') return false;
    var days = daysRemaining(lease.endDate, asOfDate);
    if (isNaN(days)) return false;
    return days >= 0 && days <= Number(maxDays);
  }

  function validateNewLease(input, unit, tenant) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'Lease details are required.' };
    }
    var eligibility = unitRules.canLeaseUnit(unit);
    if (!eligibility.ok) {
      return eligibility;
    }
    if (!tenant) {
      return { ok: false, error: 'Please select a valid tenant.' };
    }
    var dateCheck = validateLeaseDates(input.startDate, input.endDate);
    if (!dateCheck.ok) {
      return dateCheck;
    }
    var rent = money.toAmount(input.monthlyRent);
    if (isNaN(rent) || rent <= 0) {
      return { ok: false, error: 'Monthly rent must be greater than zero.' };
    }
    var deposit = input.deposit === '' || input.deposit === undefined || input.deposit === null
      ? 0
      : money.toAmount(input.deposit);
    if (isNaN(deposit) || deposit < 0) {
      return { ok: false, error: 'Deposit cannot be negative.' };
    }
    return {
      ok: true,
      data: {
        monthlyRent: rent,
        deposit: deposit,
        termType: classifyLeaseTerm(input.startDate, input.endDate)
      }
    };
  }

  var leaseRules = {
    validateLeaseDates: validateLeaseDates,
    classifyLeaseTerm: classifyLeaseTerm,
    getDurationMonths: getDurationMonths,
    daysRemaining: daysRemaining,
    isEndingWithinDays: isEndingWithinDays,
    validateNewLease: validateNewLease
  };

  Makazi.rules = Makazi.rules || {};
  Makazi.rules.leaseRules = leaseRules;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = leaseRules;
  }
})(typeof window !== 'undefined' ? window : globalThis);
