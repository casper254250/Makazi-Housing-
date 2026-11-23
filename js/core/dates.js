(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('./namespace') : {});

  var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var YEAR_MONTH_RE = /^\d{4}-\d{2}$/;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function today() {
    var now = new Date();
    return now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
  }

  function currentMonth() {
    return today().slice(0, 7);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function isValidIsoDate(str) {
    if (typeof str !== 'string' || !ISO_DATE_RE.test(str)) return false;
    var parts = str.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    var d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  }

  function isValidYearMonth(str) {
    if (typeof str !== 'string' || !YEAR_MONTH_RE.test(str)) return false;
    var parts = str.split('-');
    var month = parseInt(parts[1], 10);
    return month >= 1 && month <= 12;
  }

  function parseIsoUtc(str) {
    if (!isValidIsoDate(str)) return null;
    var parts = str.split('-');
    return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
  }

  function formatUtcIso(date) {
    return date.getUTCFullYear() + '-' + pad2(date.getUTCMonth() + 1) + '-' + pad2(date.getUTCDate());
  }

  function addDays(isoDate, days) {
    var d = parseIsoUtc(isoDate);
    if (!d) return null;
    d.setUTCDate(d.getUTCDate() + Number(days));
    return formatUtcIso(d);
  }

  function addMonths(isoDate, months) {
    var d = parseIsoUtc(isoDate);
    if (!d) return null;
    var origDay = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + Number(months));
    var maxDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(origDay, maxDay));
    return formatUtcIso(d);
  }

  function diffDays(startIso, endIso) {
    var start = parseIsoUtc(startIso);
    var end = parseIsoUtc(endIso);
    if (!start || !end) return NaN;
    var msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((end.getTime() - start.getTime()) / msPerDay);
  }

  // Whole completed calendar months between startIso and endIso (plus partial month adjustment)
  function diffMonths(startIso, endIso) {
    var start = parseIsoUtc(startIso);
    var end = parseIsoUtc(endIso);
    if (!start || !end) return NaN;
    var years = end.getUTCFullYear() - start.getUTCFullYear();
    var months = end.getUTCMonth() - start.getUTCMonth();
    var total = years * 12 + months;
    if (end.getUTCDate() < start.getUTCDate()) {
      total -= 1;
    }
    return total;
  }

  // Inclusive count of billing months elapsed between startDate and asOfDate
  function monthsElapsedInclusive(startIso, asOfIso) {
    var start = parseIsoUtc(startIso);
    var asOf = parseIsoUtc(asOfIso);
    if (!start || !asOf) return 0;
    if (asOf.getTime() < start.getTime()) return 0;
    var months = (asOf.getUTCFullYear() - start.getUTCFullYear()) * 12 + (asOf.getUTCMonth() - start.getUTCMonth());
    return months + 1;
  }

  function yearsBetween(startIso, endIso) {
    var days = diffDays(startIso, endIso);
    if (isNaN(days)) return NaN;
    return days / 365.25;
  }

  var dates = {
    today: today,
    currentMonth: currentMonth,
    nowIso: nowIso,
    isValidIsoDate: isValidIsoDate,
    isValidYearMonth: isValidYearMonth,
    addDays: addDays,
    addMonths: addMonths,
    diffDays: diffDays,
    diffMonths: diffMonths,
    monthsElapsedInclusive: monthsElapsedInclusive,
    yearsBetween: yearsBetween
  };

  Makazi.core = Makazi.core || {};
  Makazi.core.dates = dates;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = dates;
  }
})(typeof window !== 'undefined' ? window : globalThis);
