(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;

  function open(options) {
    var opts = options || {};
    var modal = Makazi.ui.components.modal;

    var body = document.createElement('div');
    body.innerHTML = '<p>' + esc.html(opts.message || 'Please confirm this action.') + '</p>';

    var footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.gap = '8px';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn';
    cancelBtn.textContent = opts.cancelLabel || 'Cancel';

    var confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
    confirmBtn.textContent = opts.confirmLabel || 'Confirm';

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    var instance = modal.open({
      title: opts.title || 'Confirm action',
      content: body,
      footer: footer
    });

    cancelBtn.addEventListener('click', function () {
      instance.close();
      if (typeof opts.onCancel === 'function') opts.onCancel();
    });

    confirmBtn.addEventListener('click', function () {
      instance.close();
      if (typeof opts.onConfirm === 'function') opts.onConfirm();
    });
  }

  Makazi.ui.components.confirm = {
    open: open
  };
})(window);
