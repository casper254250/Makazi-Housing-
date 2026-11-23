(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var dates = Makazi.core.dates;
  var esc = Makazi.core.escape;
  var utils = Makazi.core.utils;
  var unitService = Makazi.services.unitService;
  var maintenanceService = Makazi.services.maintenanceService;
  var toast = Makazi.ui.components.toast;
  var badge = Makazi.ui.components.badge;
  var formField = Makazi.ui.components.formField;
  var filterBar = Makazi.ui.components.filterBar;
  var table = Makazi.ui.components.table;

  var localFilters = {
    status: '',
    priority: '',
    unitId: ''
  };

  function render(ctx) {
    var units = unitService.list();
    var requests = maintenanceService.list(localFilters);

    ctx.setHeader({
      title: 'Maintenance',
      subtitle: 'Log repair requests, filter by status or priority, and inspect per-unit maintenance history.'
    });

    var unitOptions = units.length
      ? units.map(function (u) {
          return { value: u.id, label: u.propertyName + ' — Unit ' + u.unitNumber };
        })
      : [{ value: '', label: 'No units available' }];

    var addFormHtml =
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Log maintenance request</h2><span class="text-small text-muted">Assign to a unit and set priority</span></div></div>' +
        '<form id="add-maintenance-form" class="form-grid form-grid-2" novalidate>' +
          '<div class="form-error-summary" data-form-error hidden style="grid-column:1 / -1;"></div>' +
          formField.render({
            name: 'unitId',
            type: 'select',
            label: 'Unit',
            value: localFilters.unitId || (units[0] ? units[0].id : ''),
            options: unitOptions,
            required: true
          }) +
          formField.render({
            name: 'priority',
            type: 'select',
            label: 'Priority',
            value: 'medium',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ],
            required: true
          }) +
          formField.render({
            name: 'title',
            label: 'Issue title',
            placeholder: 'e.g. Leaking bathroom tap',
            required: true
          }) +
          formField.render({
            name: 'reportedOn',
            type: 'date',
            label: 'Reported on',
            value: dates.today(),
            required: true
          }) +
          '<div style="grid-column:1 / -1;">' +
          formField.render({
            name: 'description',
            type: 'textarea',
            label: 'Description (optional)',
            placeholder: 'Describe location and severity of the repair...'
          }) +
          '</div>' +
          '<div style="grid-column:1 / -1; display:flex; justify-content:flex-end;">' +
            '<button type="submit" class="btn btn-primary"' + (units.length === 0 ? ' disabled' : '') + '>Log request</button>' +
          '</div>' +
        '</form>' +
      '</section>';

    var unitFilterOpts = [{ value: '', label: 'All units' }].concat(
      units.map(function (u) { return { value: u.id, label: u.propertyName + ' — ' + u.unitNumber }; })
    );

    var filtersHtml = filterBar.render([
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        value: localFilters.status,
        options: [
          { value: '', label: 'All statuses' },
          { value: 'open', label: 'Open' },
          { value: 'completed', label: 'Completed' }
        ]
      },
      {
        name: 'priority',
        type: 'select',
        label: 'Priority',
        value: localFilters.priority,
        options: [
          { value: '', label: 'All priorities' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' }
        ]
      },
      {
        name: 'unitId',
        type: 'select',
        label: 'Per-unit history',
        value: localFilters.unitId,
        options: unitFilterOpts
      }
    ]);

    var listHtml = table.render({
      rows: requests,
      columns: [
        {
          label: 'Unit',
          render: function (r) {
            return '<strong>Unit ' + esc.html(r.unitNumber) + '</strong><div class="text-small text-muted">' + esc.html(r.propertyName) + '</div>';
          }
        },
        {
          label: 'Issue',
          render: function (r) {
            var desc = r.description ? '<div class="text-small text-muted">' + esc.html(r.description) + '</div>' : '';
            return '<strong>' + esc.html(r.title) + '</strong>' + desc;
          }
        },
        {
          label: 'Priority',
          render: function (r) { return badge.priority(r.priority); }
        },
        {
          label: 'Status',
          render: function (r) { return badge.maintenanceStatus(r.status); }
        },
        {
          label: 'Dates',
          render: function (r) {
            var comp = r.completedOn ? '<div class="text-small text-muted">Done: ' + esc.html(r.completedOn) + '</div>' : '';
            return '<span class="mono text-small">' + esc.html(r.reportedOn) + '</span>' + comp;
          }
        },
        {
          label: 'Actions',
          numeric: true,
          render: function (r) {
            if (r.status === 'completed') {
              return '<span class="text-small text-muted">Completed</span>';
            }
            return '<button type="button" class="btn btn-sm btn-primary" data-complete-maint="' + esc.attr(r.id) + '">Mark complete</button>';
          }
        }
      ],
      emptyState: {
        title: 'No maintenance requests match',
        description: 'Clear filters to view all requests, or log a new repair above.',
        actionLabel: (localFilters.status || localFilters.priority || localFilters.unitId) ? 'Clear filters' : '',
        actionAttr: (localFilters.status || localFilters.priority || localFilters.unitId) ? 'data-clear-maint="1"' : ''
      }
    });

    ctx.container.innerHTML =
      addFormHtml +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Maintenance queue &amp; unit history</h2><span class="text-small text-muted">Filter by unit to inspect per-unit repair history</span></div></div>' +
        filtersHtml +
        listHtml +
      '</section>';

    var form = document.getElementById('add-maintenance-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formField.clearErrors(form);

      var payload = {
        unitId: form.elements.unitId.value,
        priority: form.elements.priority.value,
        title: form.elements.title.value,
        reportedOn: form.elements.reportedOn.value,
        description: form.elements.description.value
      };

      if (!utils.isNonEmptyString(payload.title)) {
        formField.setFieldError(form, 'title', 'Issue title is required.');
        return;
      }

      var res = maintenanceService.create(payload);
      if (!res.ok) {
        formField.setFormError(form, res.error);
        toast.error(res.error);
        return;
      }
      toast.success('Maintenance request logged.');
    });

    filterBar.bind(ctx.container, function (name, value) {
      localFilters[name] = value;
      render(ctx);
    });

    var clearBtn = ctx.container.querySelector('[data-clear-maint]');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        localFilters = { status: '', priority: '', unitId: '' };
        render(ctx);
      });
    }

    var completeBtns = ctx.container.querySelectorAll('[data-complete-maint]');
    for (var i = 0; i < completeBtns.length; i++) {
      completeBtns[i].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-complete-maint');
        var res = maintenanceService.markComplete(id);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success('Maintenance request marked complete.');
      });
    }
  }

  Makazi.ui.views.maintenanceView = {
    render: render
  };
})(window);
