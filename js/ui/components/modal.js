(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;
  var activeBackdrop = null;
  var previousFocus = null;

  function close() {
    if (activeBackdrop && activeBackdrop.parentNode) {
      activeBackdrop.parentNode.removeChild(activeBackdrop);
    }
    activeBackdrop = null;
    document.removeEventListener('keydown', onKeyDown);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      close();
    }
  }

  function open(options) {
    close();
    var opts = options || {};
    previousFocus = document.activeElement;

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    var titleId = 'makazi-modal-title';
    var dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', titleId);

    dialog.innerHTML =
      '<div class="modal-header">' +
        '<h2 id="' + titleId + '">' + esc.html(opts.title || '') + '</h2>' +
        '<button type="button" class="modal-close" aria-label="Close dialog">&times;</button>' +
      '</div>' +
      '<div class="modal-body"></div>';

    var bodyEl = dialog.querySelector('.modal-body');
    if (typeof opts.content === 'string') {
      bodyEl.innerHTML = opts.content;
    } else if (opts.content instanceof HTMLElement) {
      bodyEl.appendChild(opts.content);
    }

    if (opts.footer) {
      var footerEl = document.createElement('div');
      footerEl.className = 'modal-footer';
      if (typeof opts.footer === 'string') {
        footerEl.innerHTML = opts.footer;
      } else if (opts.footer instanceof HTMLElement) {
        footerEl.appendChild(opts.footer);
      }
      dialog.appendChild(footerEl);
    }

    dialog.querySelector('.modal-close').addEventListener('click', close);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    activeBackdrop = backdrop;
    document.addEventListener('keydown', onKeyDown);

    var firstInput = dialog.querySelector('input, select, textarea, button.btn-primary, button');
    if (firstInput) firstInput.focus();

    return {
      close: close,
      dialog: dialog,
      body: bodyEl
    };
  }

  Makazi.ui.components.modal = {
    open: open,
    close: close
  };
})(window);
