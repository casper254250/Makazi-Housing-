(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var money = (Makazi.core && Makazi.core.money) || (typeof require !== 'undefined' ? require('../core/money') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});

  function normalizeReference(ref) {
    return utils.trimString(ref).toUpperCase();
  }

  function isDuplicateReference(ref, list, excludeId) {
    var normalized = normalizeReference(ref);
    if (!normalized) return false;
    var items = list || [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item || (excludeId && item.id === excludeId)) continue;
      if (normalizeReference(item.reference) === normalized) {
        return true;
      }
    }
    return false;
  }

  function calculateConsumption(previous, current) {
    var prev = Number(previous);
    var curr = Number(current);
    if (!isFinite(prev) || !isFinite(curr)) return NaN;
    if (curr < prev) return NaN;
    return Math.round((curr - prev) * 100) / 100;
  }

  function waterBill(consumption, rate, fixedCharge) {
    var cons = Number(consumption);
    var r = Number(rate);
    var fixed = Number(fixedCharge || 0);
    if (!isFinite(cons) || cons < 0 || !isFinite(r) || r < 0 || !isFinite(fixed) || fixed < 0) {
      return 0;
    }
    return Math.round(cons * r + fixed);
  }

  function invoiceTotal(rent, water) {
    var r = Number(rent || 0);
    var w = Number(water || 0);
    return Math.round((isFinite(r) ? r : 0) + (isFinite(w) ? w : 0));
  }

  function muwascoPayable(totalConsumption, rate) {
    var cons = Number(totalConsumption);
    var r = Number(rate);
    if (!isFinite(cons) || cons < 0 || !isFinite(r) || r < 0) return 0;
    return Math.round(cons * r);
  }

  function waterMargin(collected, payable) {
    var col = Number(collected || 0);
    var pay = Number(payable || 0);
    return Math.round((isFinite(col) ? col : 0) - (isFinite(pay) ? pay : 0));
  }

  function validateReading(previous, current) {
    var prev = Number(previous);
    var curr = Number(current);
    if (!isFinite(curr) || curr < 0) {
      return { ok: false, error: 'Meter reading must be zero or a positive number (m3).' };
    }
    if (!isFinite(prev) || prev < 0) {
      return { ok: false, error: 'Previous meter reading is invalid.' };
    }
    if (curr < prev) {
      return {
        ok: false,
        error: 'New meter reading (' + curr + ' m3) cannot be lower than previous reading (' + prev + ' m3).'
      };
    }
    return { ok: true, data: { previous: prev, current: curr, consumption: calculateConsumption(prev, curr) } };
  }

  function hasReadingForMonth(meterId, month, readings) {
    if (!meterId || !month) return false;
    var list = readings || [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r && r.meterId === meterId && r.month === month) {
        return true;
      }
    }
    return false;
  }

  function isLeakSuspected(current, history) {
    var curr = Number(current);
    if (!isFinite(curr) || curr <= 0) return false;
    if (!Array.isArray(history) || history.length === 0) return false;
    var valid = history.map(Number).filter(function (n) { return isFinite(n) && n >= 0; });
    if (valid.length === 0) return false;
    var sum = valid.reduce(function (acc, n) { return acc + n; }, 0);
    var avg = sum / valid.length;
    if (avg <= 0) return false;
    return curr > avg * 2;
  }

  function validateTariffSettings(input) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'Tariff settings are required.' };
    }
    var tenantRate = money.toAmount(input.tenantRatePerM3);
    var fixedCharge = money.toAmount(input.tenantFixedCharge);
    var muwascoRate = money.toAmount(input.muwascoRatePerM3);

    if (isNaN(tenantRate) || tenantRate < 0) {
      return { ok: false, error: 'Tenant rate per m3 must be zero or greater.' };
    }
    if (isNaN(fixedCharge) || fixedCharge < 0) {
      return { ok: false, error: 'Tenant fixed monthly charge must be zero or greater.' };
    }
    if (isNaN(muwascoRate) || muwascoRate < 0) {
      return { ok: false, error: 'MUWASCO rate per m3 must be zero or greater.' };
    }
    return {
      ok: true,
      data: {
        tenantRatePerM3: tenantRate,
        tenantFixedCharge: fixedCharge,
        muwascoRatePerM3: muwascoRate
      }
    };
  }

  function validateMuwascoPaymentInput(input, property, existingPayments) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'MUWASCO payment details are required.' };
    }
    if (!property) {
      return { ok: false, error: 'Please select a valid property.' };
    }
    if (!dates.isValidYearMonth(input.month)) {
      return { ok: false, error: 'Billing month must be in YYYY-MM format.' };
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
      return { ok: false, error: 'A MUWASCO payment reference is required.' };
    }
    if (isDuplicateReference(trimmedRef, existingPayments, input.id)) {
      return { ok: false, error: 'MUWASCO payment reference "' + trimmedRef + '" has already been recorded.' };
    }
    return {
      ok: true,
      data: {
        propertyId: property.id,
        month: input.month,
        paidOn: input.paidOn,
        amount: amount,
        reference: trimmedRef
      }
    };
  }

  var waterRules = {
    calculateConsumption: calculateConsumption,
    waterBill: waterBill,
    invoiceTotal: invoiceTotal,
    muwascoPayable: muwascoPayable,
    waterMargin: waterMargin,
    validateReading: validateReading,
    hasReadingForMonth: hasReadingForMonth,
    isLeakSuspected: isLeakSuspected,
    isDuplicateReference: isDuplicateReference,
    validateTariffSettings: validateTariffSettings,
    validateMuwascoPaymentInput: validateMuwascoPaymentInput
  };

  Makazi.rules = Makazi.rules || {};
  Makazi.rules.waterRules = waterRules;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = waterRules;
  }
})(typeof window !== 'undefined' ? window : globalThis);
