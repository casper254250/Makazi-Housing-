(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;

  function render(options) {
    var opts = options || {};
    var noteHtml = opts.note
      ? '<span class="stat-note">' + esc.html(opts.note) + '</span>'
      : '';
    return (
      '<article class="stat-card">' +
        '<span class="stat-label">' + esc.html(opts.label || '') + '</span>' +
        '<span class="stat-value tabular-nums">' + esc.html(opts.value !== undefined ? opts.value : '0') + '</span>' +
        noteHtml +
      '</article>'
    );
  }

  Makazi.ui.components.statCard = {
    render: render
  };
})(window);
