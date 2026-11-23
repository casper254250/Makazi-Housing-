(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var constants = Makazi.core.constants;
  var esc = Makazi.core.escape;
  var money = Makazi.core.money;
  var utils = Makazi.core.utils;
  var propertyService = Makazi.services.propertyService;
  var unitService = Makazi.services.unitService;
  var modal = Makazi.ui.components.modal;
  var confirmDialog = Makazi.ui.components.confirm;
  var toast = Makazi.ui.components.toast;
  var badge = Makazi.ui.components.badge;
  var formField = Makazi.ui.components.formField;
  var filterBar = Makazi.ui.components.filterBar;
  var table = Makazi.ui.components.table;
  var tabs = Makazi.ui.components.tabs;

  var localFilters = {
    search: '',
    propertyId: '',
    status: '',
    type: ''
  };

  function openUnitModal(existing) {
    var properties = propertyService.list();
    if (properties.length === 0) {
      toast.error('Add a property first before creating a unit.');
      return;
    }

    var isEdit = Boolean(existing);
    var propOptions = properties.map(function (p) {
      return { value: p.id, label: p.name + ' (' + p.areaDisplay + ')' };
    });

    var unitTypeOptions = constants.UNIT_TYPES.map(function (t) {
      return { value: t.value, label: t.label + (t.sampleRange ? ' — ' + t.sampleRange : '') };
    });

    var statusOptions = [
      { value: 'vacant', label: 'Vacant' },
      { value: 'under_renovation', label: 'Under renovation' }
    ];
    if (isEdit && existing.status === 'occupied') {
      statusOptions.unshift({ value: 'occupied', label: 'Occupied (via active lease)' });
    }

    var form = document.createElement('form');
    form.noValidate = true;
    form.className = 'form-grid form-grid-2';
    form.innerHTML =
      '<div class="form-error-summary" data-form-error hidden style="grid-column:1 / -1;"></div>' +
      formField.render({
        name: 'propertyId',
        type: 'select',
        label: 'Property',
        value: existing ? existing.propertyId : (localFilters.propertyId || properties[0].id),
        options: propOptions,
        required: true
      }) +
      formField.render({
        name: 'unitNumber',
        label: 'Unit number / code',
        value: existing ? existing.unitNumber : '',
        placeholder: 'e.g. MB-07',
        required: true
      }) +
      formField.render({
        name: 'type',
        type: 'select',
        label: 'Unit type',
        value: existing ? existing.type : 'bedsitter',
        options: unitTypeOptions,
        required: true
      }) +
      formField.render({
        name: 'monthlyRent',
        type: 'number',
        label: 'Monthly rent (KES)',
        value: existing ? existing.monthlyRent : '6500',
        min: 1,
        step: 100,
        hint: 'Sample rent figure (editable).',
        required: true
      }) +
      formField.render({
        name: 'status',
        type: 'select',
        label: 'Status',
        value: existing ? existing.status : 'vacant',
        options: statusOptions,
        required: true
      }) +
      formField.render({
        name: 'lastRenovated',
        type: 'date',
        label: 'Last renovated (optional)',
        value: existing && existing.lastRenovated ? existing.lastRenovated : '',
        hint: 'Units over 3 years since renovation are flagged.'
      }) +
      formField.render({
        name: 'meterNumber',
        label: 'Water meter number',
        value: existing ? existing.meterNumber : '',
        placeholder: 'Auto-generated if blank (e.g. MTR-MB-07)'
      }) +
      formField.render({
        name: 'meterType',
        type: 'select',
        label: 'Water meter type',
        value: existing ? existing.meterType : 'digital',
        options: constants.METER_TYPES
      }) +
      formField.render({
        name: 'startingReading',
        type: 'number',
        label: 'Starting reading (m3)',
        value: existing ? existing.startingReading : '0',
        min: 0,
        step: '0.1'
      }) +
      formField.render({
        name: 'notes',
        label: 'Notes (optional)',
        value: existing ? existing.notes : '',
        placeholder: 'Condition notes, location...'
      });

    var footer = document.createElement('div');
    footer.className = 'form-actions';
    footer.innerHTML =
      '<button type="button" class="btn" data-cancel>Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Save changes' : 'Add unit') + '</button>';

    var m = modal.open({
      title: isEdit ? 'Edit unit ' + existing.unitNumber : 'Add unit',
      content: form,
      footer: footer
    });

    footer.querySelector('[data-cancel]').addEventListener('click', m.close);
    footer.querySelector('[type="submit"]').addEventListener('click', function () {
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formField.clearErrors(form);
      var payload = {
        propertyId: form.elements.propertyId.value,
        unitNumber: form.elements.unitNumber.value,
        type: form.elements.type.value,
        monthlyRent: form.elements.monthlyRent.value,
        status: form.elements.status.value,
        lastRenovated: form.elements.lastRenovated.value || null,
        meterNumber: form.elements.meterNumber.value,
        meterType: form.elements.meterType.value,
        startingReading: form.elements.startingReading.value,
        notes: form.elements.notes.value
      };

      var res = isEdit
        ? unitService.update(existing.id, payload)
        : unitService.create(payload);

      if (!res.ok) {
        formField.setFormError(form, res.error);
        toast.error(res.error);
        return;
      }

      toast.success(isEdit ? 'Unit updated.' : 'Unit added with water meter.');
      m.close();
    });
  }

  function render(ctx) {
    if (Makazi.ui.state && Makazi.ui.state.unitFilterPropertyId !== undefined) {
      localFilters.propertyId = Makazi.ui.state.unitFilterPropertyId;
      delete Makazi.ui.state.unitFilterPropertyId;
    }

    var properties = propertyService.list();
    var units = unitService.list(localFilters);

    ctx.setHeader({
      title: 'Units',
      subtitle: 'Units, sample rent figures, water meters, and renovation tracking. ' + constants.SAMPLE_DATA_NOTE,
      actionsHtml: '<button type="button" class="btn btn-primary" id="btn-add-unit">Add unit</button>'
    });

    document.getElementById('btn-add-unit').addEventListener('click', function () {
      openUnitModal(null);
    });

    var propFilterOpts = [{ value: '', label: 'All properties' }].concat(
      properties.map(function (p) { return { value: p.id, label: p.name }; })
    );
    var statusFilterOpts = [
      { value: '', label: 'All statuses' },
      { value: 'vacant', label: 'Vacant' },
      { value: 'occupied', label: 'Occupied' },
      { value: 'under_renovation', label: 'Under renovation' }
    ];
    var typeFilterOpts = [{ value: '', label: 'All types' }].concat(
      constants.UNIT_TYPES.map(function (t) { return { value: t.value, label: t.label }; })
    );

    var filtersHtml = filterBar.render([
      { name: 'search', type: 'search', label: 'Search units', value: localFilters.search, placeholder: 'Unit, property, area, meter...' },
      { name: 'propertyId', type: 'select', label: 'Property', value: localFilters.propertyId, options: propFilterOpts },
      { name: 'status', type: 'select', label: 'Status', value: localFilters.status, options: statusFilterOpts },
      { name: 'type', type: 'select', label: 'Unit type', value: localFilters.type, options: typeFilterOpts }
    ]);

    var tableHtml = table.render({
      rows: units,
      columns: [
        {
          label: 'Unit',
          render: function (u) {
            return '<strong>' + esc.html(u.unitNumber) + '</strong><div class="text-small text-muted">' + esc.html(u.propertyName) + ' (' + esc.html(u.propertyArea) + ')</div>';
          }
        },
        {
          label: 'Type & Meter',
          render: function (u) {
            var typeLabel = utils.labelFromOptions(constants.UNIT_TYPES, u.type, u.type);
            var meterTag = u.meterNumber ? (u.meterNumber + ' · ' + (u.meterType === 'digital' ? 'Digital' : 'Manual')) : 'No meter';
            return esc.html(typeLabel) + '<div class="text-small text-muted mono">' + esc.html(meterTag) + '</div>';
          }
        },
        {
          label: 'Monthly rent',
          numeric: true,
          render: function (u) {
            return esc.html(money.formatKES(u.monthlyRent));
          }
        },
        {
          label: 'Status',
          render: function (u) {
            var html = badge.unitStatus(u.status);
            if (u.currentTenantName) {
              html += '<div class="text-small text-muted" style="margin-top:4px;">' + esc.html(u.currentTenantName) + '</div>';
            }
            return html;
          }
        },
        {
          label: 'Renovation',
          render: function (u) {
            var dateLabel = u.lastRenovated ? esc.html(u.lastRenovated) : 'Not recorded';
            var flag = u.needsRenovation ? '<div style="margin-top:4px;">' + badge.render('Needs renovation', 'warning') + '</div>' : '';
            return '<span class="mono text-small">' + dateLabel + '</span>' + flag;
          }
        },
        {
          label: 'Actions',
          numeric: true,
          render: function (u) {
            return (
              '<div class="table-actions">' +
                '<button type="button" class="btn btn-sm" data-edit-unit="' + esc.attr(u.id) + '">Edit</button>' +
                '<button type="button" class="btn btn-sm btn-danger" data-del-unit="' + esc.attr(u.id) + '">Delete</button>' +
              '</div>'
            );
          }
        }
      ],
      emptyState: {
        title: 'No matching units',
        description: 'Adjust your search or filter criteria, or add a new unit.',
        actionLabel: 'Add unit',
        actionAttr: 'data-empty-add-unit="1"'
      }
    });

    var tabsHtml = tabs.render([
      { id: 'properties', label: 'Properties' },
      { id: 'units', label: 'Units' }
    ], 'units');

    ctx.container.innerHTML =
      '<div>' + tabsHtml + '</div>' +
      '<section class="panel">' +
        filtersHtml +
        '<div id="units-table-region">' + tableHtml + '</div>' +
      '</section>';

    tabs.bind(ctx.container, function (tabId) {
      if (tabId !== 'units') Makazi.ui.router.navigate(tabId);
    });

    filterBar.bind(ctx.container, function (name, value) {
      localFilters[name] = value;
      render(ctx);
      var focusTarget = ctx.container.querySelector('[data-filter-name="' + name + '"]');
      if (focusTarget && focusTarget.type === 'search') {
        focusTarget.focus();
        var len = focusTarget.value.length;
        focusTarget.setSelectionRange(len, len);
      }
    });

    var emptyAdd = ctx.container.querySelector('[data-empty-add-unit]');
    if (emptyAdd) {
      emptyAdd.addEventListener('click', function () {
        openUnitModal(null);
      });
    }

    var editBtns = ctx.container.querySelectorAll('[data-edit-unit]');
    for (var i = 0; i < editBtns.length; i++) {
      editBtns[i].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-edit-unit');
        openUnitModal(unitService.getById(id));
      });
    }

    var delBtns = ctx.container.querySelectorAll('[data-del-unit]');
    for (var j = 0; j < delBtns.length; j++) {
      delBtns[j].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-del-unit');
        var unit = unitService.getById(id);
        confirmDialog.open({
          title: 'Delete unit',
          message: 'Delete unit "' + (unit ? unit.unitNumber : '') + '"? Units with linked leases cannot be deleted.',
          confirmLabel: 'Delete',
          danger: true,
          onConfirm: function () {
            var res = unitService.remove(id);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success('Unit deleted.');
          }
        });
      });
    }
  }

  Makazi.ui.views.unitsView = {
    render: render
  };
})(window);
