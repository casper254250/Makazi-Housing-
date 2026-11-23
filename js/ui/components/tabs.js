(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;

  function render(items, activeId) {
    var buttons = (items || []).map(function (item) {
      var isActive = item.id === activeId;
      return (
        '<button type="button" role="tab" aria-selected="' + (isActive ? 'true' : 'false') + '" ' +
        'class="tab-btn' + (isActive ? ' is-active' : '') + '" data-tab-id="' + esc.attr(item.id) + '">' +
          esc.html(item.label) +
        '</button>'
      );
    }).join('');
    return '<div class="tabs" role="tablist">' + buttons + '</div>';
  }

  function bind(container, onSelect) {
    if (!container || typeof onSelect !== 'function') return;
    var buttons = container.querySelectorAll('[data-tab-id]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        onSelect(e.currentTarget.getAttribute('data-tab-id'));
      });
    }
  }

  Makazi.ui.components.tabs = {
    render: render,
    bind: bind
  };
})(window);
