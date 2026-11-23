(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var money = (Makazi.core && Makazi.core.money) || (typeof require !== 'undefined' ? require('../core/money') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});

  function normalizeReference(reference) {
    return utils.trimString(reference).toUpperCase();
  }

  function isDuplicateReference(reference, existingPayments, excludeId) {
    var normalized = normalizeReference(reference);
    if (!normalized) return false;
    var list = existingPayments || [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!p || (excludeId && p.id === excludeId)) continue;
      if (normalizeReference(p.reference) === normalized) {
        return true;
      }
    }
    return false;
  }

  function validatePaymentInput(input, lease, existingPayments) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'Payment details are required.' };
    }
    if (!lease) {
      return { ok: false, error: 'Please select a valid lease.' };
    }
    if (lease.status !== 'active') {
      return { ok: false, error: 'Payments can only be recorded against an active lease.' };
    }
    if (!dates.isValidYearMonth(input.period)) {
      return { ok: false, error: 'Rent period must be in YYYY-MM format.' };
    }
    var amount = money.toAmount(input.amount);
    if (isNaN(amount) || amount <= 0) {
      return { ok: false, error: 'Payment amount must be greater than zero.' };
    }
    if (!dates.isValidIsoDate(input.paidOn)) {
      return { ok: false, error: 'Payment date must be a valid YYYY-MM-DD date.' };
    }
    var trimmedRef = utils.trimString(input.reference);
    if (!trimmedRef) {
      return { ok: false, error: 'A demonstration payment reference is required.' };
    }
    if (isDuplicateReference(trimmedRef, existingPayments, input.id)) {
      return { ok: false, error: 'Payment reference "' + trimmedRef + '" has already been recorded.' };
    }
    return {
      ok: true,
      data: {
        leaseId: lease.id,
        period: input.period,
        amount: amount,
        paidOn: input.paidOn,
        reference: trimmedRef,
        method: 'manual_entry'
      }
    };
  }

  function calculateLeaseBalance(lease, leasePayments, asOfDate, waterBilledTotal) {
    if (!lease) {
      return {
        monthsElapsed: 0,
        expectedRentTotal: 0,
        waterBilledTotal: 0,
        expectedTotal: 0,
        paidTotal: 0,
        balance: 0,
        inArrears: false
      };
    }
    var ref = dates.isValidIsoDate(asOfDate) ? asOfDate : dates.today();
    var effectiveEnd = lease.status === 'ended' && lease.endDate < ref ? lease.endDate : ref;
    var monthsElapsed = dates.monthsElapsedInclusive(lease.startDate, effectiveEnd);
    var expectedRentTotal = monthsElapsed * Number(lease.monthlyRent || 0);
    var waterTotal = Number(waterBilledTotal || 0);
    var expectedTotal = expectedRentTotal + waterTotal;
    var paidTotal = (leasePayments || []).reduce(function (sum, p) {
      return sum + Number(p && p.amount ? p.amount : 0);
    }, 0);
    var balance = expectedTotal - paidTotal;
    return {
      monthsElapsed: monthsElapsed,
      expectedRentTotal: expectedRentTotal,
      waterBilledTotal: waterTotal,
      expectedTotal: expectedTotal,
      paidTotal: paidTotal,
      balance: balance,
      inArrears: balance > 0
    };
  }

  var paymentRules = {
    normalizeReference: normalizeReference,
    isDuplicateReference: isDuplicateReference,
    validatePaymentInput: validatePaymentInput,
    calculateLeaseBalance: calculateLeaseBalance
  };

  Makazi.rules = Makazi.rules || {};
  Makazi.rules.paymentRules = paymentRules;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = paymentRules;
  }
})(typeof window !== 'undefined' ? window : globalThis);
