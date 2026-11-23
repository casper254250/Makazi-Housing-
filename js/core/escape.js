(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('./namespace') : {});

  var HTML_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  function html(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, function (ch) {
      return HTML_MAP[ch];
    });
  }

  function attr(value) {
    return html(value);
  }

  var escapeApi = {
    html: html,
    attr: attr
  };

  Makazi.core = Makazi.core || {};
  Makazi.core.escape = escapeApi;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = escapeApi;
  }
})(typeof window !== 'undefined' ? window : globalThis);
