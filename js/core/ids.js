(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('./namespace') : {});
  var counter = 0;

  function nextId(prefix) {
    counter += 1;
    var p = prefix ? String(prefix).replace(/[^a-zA-Z0-9_-]/g, '') : 'rec';
    var timePart = Date.now().toString(36);
    var randPart = Math.floor(Math.random() * 46656).toString(36);
    return p + '_' + timePart + '_' + randPart + '_' + counter;
  }

  var ids = {
    nextId: nextId
  };

  Makazi.core = Makazi.core || {};
  Makazi.core.ids = ids;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ids;
  }
})(typeof window !== 'undefined' ? window : globalThis);
