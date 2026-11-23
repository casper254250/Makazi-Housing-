(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var money = (Makazi.core && Makazi.core.money) || (typeof require !== 'undefined' ? require('../core/money') : {});

  function calculateDepositRefund(deposit, deductions) {
    var dep = money.toAmount(deposit);
    var ded = money.toAmount(deductions);

    if (isNaN(dep) || dep < 0) dep = 0;
    if (isNaN(ded) || ded < 0) ded = 0;

    var rawRefund = dep - ded;
    var refund = Math.max(0, rawRefund);
    var shortfall = rawRefund < 0 ? Math.abs(rawRefund) : 0;

    return {
      deposit: dep,
      deductions: ded,
      refund: refund,
      shortfall: shortfall
    };
  }

  function validateDepositInputs(deposit, deductions) {
    var dep = money.toAmount(deposit);
    var ded = money.toAmount(deductions);
    if (isNaN(dep) || dep < 0) {
      return { ok: false, error: 'Deposit amount must be zero or greater.' };
    }
    if (isNaN(ded) || ded < 0) {
      return { ok: false, error: 'Approved deductions must be zero or greater.' };
    }
    return {
      ok: true,
      data: calculateDepositRefund(dep, ded)
    };
  }

  var depositRules = {
    calculateDepositRefund: calculateDepositRefund,
    validateDepositInputs: validateDepositInputs
  };

  Makazi.rules = Makazi.rules || {};
  Makazi.rules.depositRules = depositRules;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = depositRules;
  }
})(typeof window !== 'undefined' ? window : globalThis);
