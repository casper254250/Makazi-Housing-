(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('./namespace') : {});

  function trimString(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function isNonEmptyString(value) {
    return trimString(value).length > 0;
  }

  function clone(value) {
    if (value === null || typeof value !== 'object') return value;
    return JSON.parse(JSON.stringify(value));
  }

  function findById(list, id) {
    if (!Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  function labelFromOptions(options, value, fallback) {
    if (!Array.isArray(options)) return fallback || value || '';
    for (var i = 0; i < options.length; i++) {
      if (options[i].value === value) return options[i].label;
    }
    return fallback !== undefined ? fallback : (value || '');
  }

  function sortByCreatedDesc(list) {
    return (list || []).slice().sort(function (a, b) {
      var ta = a && a.createdAt ? a.createdAt : '';
      var tb = b && b.createdAt ? b.createdAt : '';
      if (tb > ta) return 1;
      if (tb < ta) return -1;
      return 0;
    });
  }

  var utils = {
    trimString: trimString,
    isNonEmptyString: isNonEmptyString,
    clone: clone,
    findById: findById,
    labelFromOptions: labelFromOptions,
    sortByCreatedDesc: sortByCreatedDesc
  };

  Makazi.core = Makazi.core || {};
  Makazi.core.utils = utils;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  }
})(typeof window !== 'undefined' ? window : globalThis);
