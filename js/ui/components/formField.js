(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;

  function render(options) {
    var opts = options || {};
    var id = opts.id || ('field-' + (opts.name || 'input'));
    var name = opts.name || '';
    var type = opts.type || 'text';
    var requiredMark = opts.required ? '<span class="field-required" aria-hidden="true">*</span>' : '';
    var requiredAttr = opts.required ? ' required' : '';
    var placeholderAttr = opts.placeholder ? ' placeholder="' + esc.attr(opts.placeholder) + '"' : '';
    var minAttr = opts.min !== undefined ? ' min="' + esc.attr(opts.min) + '"' : '';
    var stepAttr = opts.step !== undefined ? ' step="' + esc.attr(opts.step) + '"' : '';
    var val = opts.value !== undefined && opts.value !== null ? String(opts.value) : '';
    var errorId = id + '-error';

    var controlHtml = '';
    if (type === 'select') {
      var optionsHtml = (opts.options || []).map(function (opt) {
        var selected = String(opt.value) === val ? ' selected' : '';
        return '<option value="' + esc.attr(opt.value) + '"' + selected + '>' + esc.html(opt.label) + '</option>';
      }).join('');
      controlHtml =
        '<select id="' + esc.attr(id) + '" name="' + esc.attr(name) + '" class="field-control" aria-describedby="' + esc.attr(errorId) + '"' + requiredAttr + '>' +
          optionsHtml +
        '</select>';
    } else if (type === 'textarea') {
      controlHtml =
        '<textarea id="' + esc.attr(id) + '" name="' + esc.attr(name) + '" class="field-control" aria-describedby="' + esc.attr(errorId) + '"' + placeholderAttr + requiredAttr + '>' +
          esc.html(val) +
        '</textarea>';
    } else {
      controlHtml =
        '<input id="' + esc.attr(id) + '" name="' + esc.attr(name) + '" type="' + esc.attr(type) + '" class="field-control" value="' + esc.attr(val) + '" aria-describedby="' + esc.attr(errorId) + '"' + placeholderAttr + minAttr + stepAttr + requiredAttr + '>';
    }

    var hintHtml = opts.hint
      ? '<span class="field-hint">' + esc.html(opts.hint) + '</span>'
      : '';

    return (
      '<div class="field">' +
        '<label class="field-label" for="' + esc.attr(id) + '">' + esc.html(opts.label || '') + requiredMark + '</label>' +
        controlHtml +
        hintHtml +
        '<span class="field-error" id="' + esc.attr(errorId) + '" data-error-for="' + esc.attr(name) + '" role="alert"></span>' +
      '</div>'
    );
  }

  function clearErrors(formEl) {
    if (!formEl) return;
    var errNodes = formEl.querySelectorAll('[data-error-for]');
    for (var i = 0; i < errNodes.length; i++) {
      errNodes[i].textContent = '';
    }
    var controls = formEl.querySelectorAll('.field-control.has-error');
    for (var j = 0; j < controls.length; j++) {
      controls[j].classList.remove('has-error');
    }
    var summary = formEl.querySelector('[data-form-error]');
    if (summary) {
      summary.hidden = true;
      summary.textContent = '';
    }
  }

  function setFieldError(formEl, fieldName, message) {
    if (!formEl) return;
    var errNode = formEl.querySelector('[data-error-for="' + fieldName + '"]');
    if (errNode) errNode.textContent = message;
    var control = formEl.querySelector('[name="' + fieldName + '"]');
    if (control) control.classList.add('has-error');
  }

  function setFormError(formEl, message) {
    if (!formEl) return;
    var summary = formEl.querySelector('[data-form-error]');
    if (summary) {
      summary.hidden = false;
      summary.textContent = message;
    }
  }

  Makazi.ui.components.formField = {
    render: render,
    clearErrors: clearErrors,
    setFieldError: setFieldError,
    setFormError: setFormError
  };
})(window);
