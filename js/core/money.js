(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('./namespace') : {});

  function toAmount(value) {
    if (typeof value === 'number') {
      return isFinite(value) ? Math.round(value) : NaN;
    }
    if (typeof value === 'string') {
      var cleaned = value.replace(/,/g, '').trim();
      if (!cleaned) return NaN;
      var num = Number(cleaned);
      return isFinite(num) ? Math.round(num) : NaN;
    }
    return NaN;
  }

  function formatKES(amount) {
    var num = Number(amount);
    if (!isFinite(num)) return 'KES 0';
    var rounded = Math.round(num);
    var sign = rounded < 0 ? '-' : '';
    var absStr = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + 'KES ' + absStr;
  }

  var money = {
    toAmount: toAmount,
    formatKES: formatKES
  };

  Makazi.core = Makazi.core || {};
  Makazi.core.money = money;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = money;
  }
})(typeof window !== 'undefined' ? window : globalThis);
