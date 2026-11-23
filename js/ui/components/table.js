(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;
  var emptyState = Makazi.ui.components.emptyState;

  function render(options) {
    var opts = options || {};
    var rows = opts.rows || [];
    var columns = opts.columns || [];

    if (rows.length === 0 && opts.emptyState) {
      return emptyState.render(opts.emptyState);
    }

    var headHtml = columns.map(function (col) {
      var cls = col.numeric ? ' class="is-numeric"' : '';
      return '<th scope="col"' + cls + '>' + esc.html(col.label) + '</th>';
    }).join('');

    var bodyHtml = rows.map(function (row) {
      var rowClass = typeof opts.rowClass === 'function' ? opts.rowClass(row) : '';
      var clsAttr = rowClass ? ' class="' + esc.attr(rowClass) + '"' : '';
      var cells = columns.map(function (col) {
        var tdCls = col.numeric ? ' class="is-numeric"' : '';
        var cellContent = '';
        if (typeof col.render === 'function') {
          cellContent = col.render(row);
        } else {
          var rawVal = row && col.key ? row[col.key] : '';
          cellContent = esc.html(rawVal !== null && rawVal !== undefined ? rawVal : '');
        }
        return '<td' + tdCls + '>' + cellContent + '</td>';
      }).join('');
      return '<tr' + clsAttr + '>' + cells + '</tr>';
    }).join('');

    return (
      '<div class="table-wrap">' +
        '<table class="data-table">' +
          '<thead><tr>' + headHtml + '</tr></thead>' +
          '<tbody>' + bodyHtml + '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  Makazi.ui.components.table = {
    render: render
  };
})(window);
