(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var events = Makazi.core.events;
  var storage = Makazi.data.storage;
  var layout = Makazi.ui.layout;
  var router = Makazi.ui.router;
  var toast = Makazi.ui.components.toast;

  function boot() {
    var rootEl = document.getElementById('app');
    if (!rootEl) return;

    storage.load();
    var status = storage.getStatus();

    layout.mount(rootEl);

    events.on('data:changed', function () {
      router.renderCurrent();
    });

    router.start();

    if (status.lastWarning) {
      toast.info(status.lastWarning);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  Makazi.ui.app = {
    boot: boot
  };
})(window);
