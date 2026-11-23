(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});

  function exportJsonPayload() {
    var store = storage.load();
    var payload = {
      exportedAt: dates.nowIso(),
      app: 'Makazi Prototype (Coursework)',
      data: store
    };
    return {
      ok: true,
      data: {
        filename: 'makazi-backup-' + dates.today() + '.json',
        json: JSON.stringify(payload, null, 2)
      }
    };
  }

  function resetToSampleData() {
    var res = storage.reset();
    if (!res.ok) return res;
    return { ok: true, data: res.data };
  }

  var exportService = {
    exportJsonPayload: exportJsonPayload,
    resetToSampleData: resetToSampleData
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.exportService = exportService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
