(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var constants = Makazi.core.constants;
  var dates = Makazi.core.dates;
  var esc = Makazi.core.escape;
  var money = Makazi.core.money;
  var leaseRules = Makazi.rules.leaseRules;
  var unitService = Makazi.services.unitService;
  var tenantService = Makazi.services.tenantService;
  var leaseService = Makazi.services.leaseService;
  var confirmDialog = Makazi.ui.components.confirm;
  var toast = Makazi.ui.components.toast;
  var badge = Makazi.ui.components.badge;
  var formField = Makazi.ui.components.formField;
  var filterBar = Makazi.ui.components.filterBar;
  var table = Makazi.ui.components.table;

  var localFilters = {
    status: '',
    termType: ''
  };

  function render(ctx) {
    var preselectUnitId = Makazi.ui.state && Makazi.ui.state.preselectLeaseUnitId ? Makazi.ui.state.preselectLeaseUnitId : '';
    if (Makazi.ui.state && Makazi.ui.state.preselectLeaseUnitId) {
      delete Makazi.ui.state.preselectLeaseUnitId;
    }

    var vacantUnits = unitService.listVacant();
    var tenants = tenantService.list();
    var leases = leaseService.list(localFilters);

    ctx.setHeader({
      title: 'Leases',
      subtitle: 'Assign vacant units to tenants, track lease term lengths, and close ended tenancies.'
    });

    var defaultUnit = vacantUnits.find(function (u) { return u.id === preselectUnitId; }) || vacantUnits[0] || null;
    var defaultStart = dates.today();
    var defaultEnd = dates.addMonths(defaultStart, 12);

    var unitOptions = vacantUnits.length
      ? vacantUnits.map(function (u) {
          return { value: u.id, label: u.propertyName + ' — Unit ' + u.unitNumber + ' (' + money.formatKES(u.monthlyRent) + ')' };
        })
      : [{ value: '', label: 'No vacant units available' }];

    var tenantOptions = tenants.length
      ? tenants.map(function (t) {
          return { value: t.id, label: t.fullName + ' (' + t.phone + ')' };
        })
      : [{ value: '', label: 'No tenants available' }];

    var createFormHtml =
      '<section class="panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title-wrap"><h2>Create new lease</h2><span class="text-small text-muted">' + esc.html(constants.PROJECT_TERM_RULE_NOTE) + '</span></div>' +
        '</div>' +
        '<form id="create-lease-form" class="form-grid form-grid-2" novalidate>' +
          '<div class="form-error-summary" data-form-error hidden style="grid-column:1 / -1;"></div>' +
          formField.render({
            name: 'unitId',
            type: 'select',
            label: 'Vacant unit',
            value: defaultUnit ? defaultUnit.id : '',
            options: unitOptions,
            required: true
          }) +
          formField.render({
            name: 'tenantId',
            type: 'select',
            label: 'Tenant',
            value: tenants[0] ? tenants[0].id : '',
            options: tenantOptions,
            required: true
          }) +
          formField.render({
            name: 'startDate',
            type: 'date',
            label: 'Start date',
            value: defaultStart,
            required: true
          }) +
          formField.render({
            name: 'endDate',
            type: 'date',
            label: 'End date',
            value: defaultEnd,
            hint: 'Under 24 months = Short-term; 24+ months = Long-term.',
            required: true
          }) +
          formField.render({
            name: 'monthlyRent',
            type: 'number',
            label: 'Monthly rent (KES)',
            value: defaultUnit ? defaultUnit.monthlyRent : '',
            min: 1,
            step: 100,
            required: true
          }) +
          formField.render({
            name: 'deposit',
            type: 'number',
            label: 'Security deposit (KES)',
            value: defaultUnit ? defaultUnit.monthlyRent : 0,
            min: 0,
            step: 100
          }) +
          '<div style="grid-column:1 / -1; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">' +
            '<div id="lease-term-preview" class="text-small text-muted"></div>' +
            '<button type="submit" class="btn btn-primary"' + (vacantUnits.length === 0 || tenants.length === 0 ? ' disabled' : '') + '>Create lease</button>' +
          '</div>' +
        '</form>' +
      '</section>';

    var filterHtml = filterBar.render([
      {
        name: 'status',
        type: 'select',
        label: 'Lease status',
        value: localFilters.status,
        options: [
          { value: '', label: 'All statuses' },
          { value: 'active', label: 'Active' },
          { value: 'ended', label: 'Ended' }
        ]
      },
      {
        name: 'termType',
        type: 'select',
        label: 'Term classification',
        value: localFilters.termType,
        options: [
          { value: '', label: 'All terms' },
          { value: 'SHORT_TERM', label: 'Short-term (< 24 months)' },
          { value: 'LONG_TERM', label: 'Long-term (24+ months)' }
        ]
      }
    ]);

    var listHtml = table.render({
      rows: leases,
      columns: [
        {
          label: 'Unit & Property',
          render: function (l) {
            return '<strong>Unit ' + esc.html(l.unitNumber) + '</strong><div class="text-small text-muted">' + esc.html(l.propertyName) + '</div>';
          }
        },
        {
          label: 'Tenant',
          key: 'tenantName'
        },
        {
          label: 'Dates',
          render: function (l) {
            return '<span class="mono text-small">' + esc.html(l.startDate) + ' → ' + esc.html(l.endDate) + '</span>';
          }
        },
        {
          label: 'Rent / Deposit',
          numeric: true,
          render: function (l) {
            return '<div>' + esc.html(money.formatKES(l.monthlyRent)) + '/mo</div><div class="text-small text-muted">Dep: ' + esc.html(money.formatKES(l.deposit)) + '</div>';
          }
        },
        {
          label: 'Classification',
          render: function (l) {
            return '<div style="display:flex; gap:6px; flex-wrap:wrap;">' + badge.leaseStatus(l.status) + badge.leaseTerm(l.termType) + '</div>';
          }
        },
        {
          label: 'Actions',
          numeric: true,
          render: function (l) {
            if (l.status !== 'active') {
              return '<span class="text-small text-muted">Closed</span>';
            }
            return '<button type="button" class="btn btn-sm btn-danger" data-end-lease="' + esc.attr(l.id) + '">End lease</button>';
          }
        }
      ],
      emptyState: {
        title: 'No leases match this filter',
        description: 'Adjust the status or term filters above, or create a lease for a vacant unit.'
      }
    });

    ctx.container.innerHTML =
      createFormHtml +
      '<section class="panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title-wrap"><h2>Lease register</h2><span class="text-small text-muted">Active and ended tenancy records</span></div>' +
        '</div>' +
        filterHtml +
        listHtml +
      '</section>';

    var form = document.getElementById('create-lease-form');
    var unitSelect = form.elements.unitId;
    var rentInput = form.elements.monthlyRent;
    var depositInput = form.elements.deposit;
    var startInput = form.elements.startDate;
    var endInput = form.elements.endDate;
    var previewEl = document.getElementById('lease-term-preview');

    function updateTermPreview() {
      var term = leaseRules.classifyLeaseTerm(startInput.value, endInput.value);
      if (!term) {
        previewEl.textContent = 'Enter a valid end date later than start date.';
        return;
      }
      var months = leaseRules.getDurationMonths(startInput.value, endInput.value);
      previewEl.innerHTML = 'Term preview (' + months + ' mo): ' + badge.leaseTerm(term);
    }

    updateTermPreview();
    startInput.addEventListener('change', updateTermPreview);
    endInput.addEventListener('change', updateTermPreview);

    unitSelect.addEventListener('change', function () {
      var chosen = vacantUnits.find(function (u) { return u.id === unitSelect.value; });
      if (chosen) {
        rentInput.value = chosen.monthlyRent;
        depositInput.value = chosen.monthlyRent;
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formField.clearErrors(form);

      var payload = {
        unitId: unitSelect.value,
        tenantId: form.elements.tenantId.value,
        startDate: startInput.value,
        endDate: endInput.value,
        monthlyRent: rentInput.value,
        deposit: depositInput.value
      };

      var res = leaseService.create(payload);
      if (!res.ok) {
        if (/end date/i.test(res.error)) {
          formField.setFieldError(form, 'endDate', res.error);
        } else if (/rent/i.test(res.error)) {
          formField.setFieldError(form, 'monthlyRent', res.error);
        } else if (/deposit/i.test(res.error)) {
          formField.setFieldError(form, 'deposit', res.error);
        } else {
          formField.setFormError(form, res.error);
        }
        toast.error(res.error);
        return;
      }

      toast.success('Lease created and unit marked occupied.');
    });

    filterBar.bind(ctx.container, function (name, value) {
      localFilters[name] = value;
      render(ctx);
    });

    var endBtns = ctx.container.querySelectorAll('[data-end-lease]');
    for (var i = 0; i < endBtns.length; i++) {
      endBtns[i].addEventListener('click', function (e) {
        var leaseId = e.currentTarget.getAttribute('data-end-lease');
        confirmDialog.open({
          title: 'End active lease',
          message: 'End this lease? The lease will be marked Ended and the unit will return to Vacant status.',
          confirmLabel: 'End lease',
          danger: true,
          onConfirm: function () {
            var res = leaseService.endLease(leaseId);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success('Lease ended and unit is now vacant.');
          }
        });
      });
    }
  }

  Makazi.ui.views.leasesView = {
    render: render
  };
})(window);
