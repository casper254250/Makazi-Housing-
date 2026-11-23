(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;
  var regionEl = null;

  function ensureRegion() {
    if (regionEl && document.body.contains(regionEl)) return regionEl;
    regionEl = document.getElementById('makazi-toast-region');
    if (!regionEl) {
      regionEl = document.createElement('div');
      regionEl.id = 'makazi-toast-region';
      regionEl.className = 'toast-region';
      regionEl.setAttribute('aria-live', 'polite');
      regionEl.setAttribute('aria-atomic', 'true');
      document.body.appendChild(regionEl);
    }
    return regionEl;
  }

  function show(message, type) {
    var region = ensureRegion();
    var kind = type === 'error' || type === 'success' ? type : 'info';

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + kind;
    toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    toast.innerHTML =
      '<span>' + esc.html(message) + '</span>' +
      '<button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>';

    var closeBtn = toast.querySelector('.toast-close');
    function removeToast() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }
    closeBtn.addEventListener('click', removeToast);

    region.appendChild(toast);
    setTimeout(removeToast, 4200);
  }

  Makazi.ui.components.toast = {
    show: show,
    success: function (msg) { show(msg, 'success'); },
    error: function (msg) { show(msg, 'error'); },
    info: function (msg) { show(msg, 'info'); }
  };
})(window);
