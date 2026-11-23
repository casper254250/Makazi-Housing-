(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;

  function render(controls) {
    var html = (controls || []).map(function (ctrl) {
      var id = 'filter-' + esc.attr(ctrl.name);
      if (ctrl.type === 'select') {
        var opts = (ctrl.options || []).map(function (o) {
          var sel = String(o.value) === String(ctrl.value || '') ? ' selected' : '';
          return '<option value="' + esc.attr(o.value) + '"' + sel + '>' + esc.html(o.label) + '</option>';
        }).join('');
        return (
          '<div class="field" style="min-width: 160px; flex: 1 1 160px;">' +
            '<label class="field-label" for="' + id + '">' + esc.html(ctrl.label) + '</label>' +
            '<select id="' + id + '" class="field-control" data-filter-name="' + esc.attr(ctrl.name) + '">' + opts + '</select>' +
          '</div>'
        );
      }
      return (
        '<div class="field" style="min-width: 200px; flex: 2 1 220px;">' +
          '<label class="field-label" for="' + id + '">' + esc.html(ctrl.label) + '</label>' +
          '<input id="' + id + '" type="' + esc.attr(ctrl.type || 'search') + '" class="field-control" data-filter-name="' + esc.attr(ctrl.name) + '" value="' + esc.attr(ctrl.value || '') + '" placeholder="' + esc.attr(ctrl.placeholder || '') + '">' +
        '</div>'
      );
    }).join('');

    return '<div class="filter-bar">' + html + '</div>';
  }

  function bind(container, onChange) {
    if (!container || typeof onChange !== 'function') return;
    var inputs = container.querySelectorAll('[data-filter-name]');
    for (var i = 0; i < inputs.length; i++) {
      (function (el) {
        var evt = el.tagName === 'SELECT' || el.type === 'month' ? 'change' : 'input';
        el.addEventListener(evt, function () {
          onChange(el.getAttribute('data-filter-name'), el.value);
        });
      })(inputs[i]);
    }
  }

  Makazi.ui.components.filterBar = {
    render: render,
    bind: bind
  };
})(window);
