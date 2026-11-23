(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;

  function render(options) {
    var opts = options || {};
    var actionBtn = '';
    if (opts.actionLabel && opts.actionAttr) {
      actionBtn =
        '<button type="button" class="btn btn-primary" ' + opts.actionAttr + '>' +
          esc.html(opts.actionLabel) +
        '</button>';
    }
    return (
      '<div class="empty-state">' +
        '<p class="empty-state-title">' + esc.html(opts.title || 'Nothing to show') + '</p>' +
        '<p class="empty-state-desc">' + esc.html(opts.description || '') + '</p>' +
        actionBtn +
      '</div>'
    );
  }

  Makazi.ui.components.emptyState = {
    render: render
  };
})(window);
