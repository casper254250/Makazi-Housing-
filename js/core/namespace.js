(function (root) {
  'use strict';

  var Makazi = root.Makazi || {};

  Makazi.core = Makazi.core || {};
  Makazi.data = Makazi.data || {};
  Makazi.rules = Makazi.rules || {};
  Makazi.services = Makazi.services || {};
  Makazi.ui = Makazi.ui || {};
  Makazi.ui.components = Makazi.ui.components || {};
  Makazi.ui.views = Makazi.ui.views || {};

  root.Makazi = Makazi;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Makazi;
  }
})(typeof window !== 'undefined' ? window : globalThis);
