(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var constants = Makazi.core.constants;
  var esc = Makazi.core.escape;
  var money = Makazi.core.money;
  var utils = Makazi.core.utils;
  var tenantService = Makazi.services.tenantService;
  var modal = Makazi.ui.components.modal;
  var confirmDialog = Makazi.ui.components.confirm;
  var toast = Makazi.ui.components.toast;
  var badge = Makazi.ui.components.badge;
  var formField = Makazi.ui.components.formField;
  var filterBar = Makazi.ui.components.filterBar;
  var table = Makazi.ui.components.table;

  var localFilters = {
    search: '',
    category: ''
  };

  function openTenantModal(existing) {
    var isEdit = Boolean(existing);
    var form = document.createElement('form');
    form.noValidate = true;
    form.className = 'form-grid form-grid-2';
    form.innerHTML =
      '<div class="form-error-summary" data-form-error hidden style="grid-column:1 / -1;"></div>' +
      formField.render({
        name: 'fullName',
        label: 'Full name',
        value: existing ? existing.fullName : '',
        placeholder: 'e.g. Grace Wanjiku',
        required: true
      }) +
      formField.render({
        name: 'phone',
        label: 'Phone number',
        value: existing ? existing.phone : '',
        placeholder: 'e.g. 0700 000 111',
        required: true
      }) +
      formField.render({
        name: 'idNumber',
        label: 'ID / Reference number',
        value: existing ? existing.idNumber : '',
        placeholder: 'e.g. SIM-100901',
        required: true
      }) +
      formField.render({
        name: 'category',
        type: 'select',
        label: 'Tenant category',
        value: existing ? (existing.category || 'student') : 'student',
        options: constants.TENANT_CATEGORIES,
        required: true
      }) +
      formField.render({
        name: 'intendedStay',
        type: 'select',
        label: 'Intended stay',
        value: existing ? existing.intendedStay : 'under_2_years',
        options: constants.INTENDED_STAYS,
        required: true
      }) +
      formField.render({
        name: 'nextOfKinName',
        label: 'Next of kin name',
        value: existing ? existing.nextOfKinName : '',
        placeholder: 'Optional'
      }) +
      '<div style="grid-column:1 / -1;">' +
      formField.render({
        name: 'nextOfKinPhone',
        label: 'Next of kin phone',
        value: existing ? existing.nextOfKinPhone : '',
        placeholder: 'Optional'
      }) +
      '</div>';

    var footer = document.createElement('div');
    footer.className = 'form-actions';
    footer.innerHTML =
      '<button type="button" class="btn" data-cancel>Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Save changes' : 'Add tenant') + '</button>';

    var m = modal.open({
      title: isEdit ? 'Edit tenant' : 'Add tenant',
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
        fullName: form.elements.fullName.value,
        phone: form.elements.phone.value,
        idNumber: form.elements.idNumber.value,
        category: form.elements.category.value,
        intendedStay: form.elements.intendedStay.value,
        nextOfKinName: form.elements.nextOfKinName.value,
        nextOfKinPhone: form.elements.nextOfKinPhone.value
      };

      var invalid = false;
      if (!utils.isNonEmptyString(payload.fullName)) {
        formField.setFieldError(form, 'fullName', 'Full name is required.');
        invalid = true;
      }
      if (!utils.isNonEmptyString(payload.phone)) {
        formField.setFieldError(form, 'phone', 'Phone number is required.');
        invalid = true;
      }
      if (!utils.isNonEmptyString(payload.idNumber)) {
        formField.setFieldError(form, 'idNumber', 'ID or reference number is required.');
        invalid = true;
      }
      if (invalid) return;

      var res = isEdit
        ? tenantService.update(existing.id, payload)
        : tenantService.create(payload);

      if (!res.ok) {
        formField.setFormError(form, res.error);
        toast.error(res.error);
        return;
      }

      toast.success(isEdit ? 'Tenant updated.' : 'Tenant added.');
      m.close();
    });
  }

  function openHistoryModal(tenant) {
    var content = document.createElement('div');
    if (!tenant.leaseHistory || tenant.leaseHistory.length === 0) {
      content.innerHTML = '<p class="text-muted">No leases recorded for ' + esc.html(tenant.fullName) + ' yet.</p>';
    } else {
      content.innerHTML =
        '<ul class="simple-list">' +
          tenant.leaseHistory.map(function (l) {
            return (
              '<li class="simple-list-item">' +
                '<div>' +
                  '<div class="simple-list-primary">' + esc.html(l.propertyName) + ' — Unit ' + esc.html(l.unitNumber) + '</div>' +
                  '<div class="simple-list-secondary">' + esc.html(l.startDate) + ' to ' + esc.html(l.endDate) + ' · ' + esc.html(money.formatKES(l.monthlyRent)) + '/mo</div>' +
                '</div>' +
                '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
                  badge.leaseStatus(l.status) +
                  badge.leaseTerm(l.termType) +
                '</div>' +
              '</li>'
            );
          }).join('') +
        '</ul>';
    }

    var footer = document.createElement('div');
    footer.className = 'form-actions';
    footer.innerHTML = '<button type="button" class="btn btn-primary" data-close>Close</button>';

    var m = modal.open({
      title: 'Lease history — ' + tenant.fullName,
      content: content,
      footer: footer
    });
    footer.querySelector('[data-close]').addEventListener('click', m.close);
  }

  function render(ctx) {
    var tenants = tenantService.list(localFilters);

    ctx.setHeader({
      title: 'Tenants',
      subtitle: 'Student (comrade) and community tenants in Murang\'a Town. ' + constants.SAMPLE_DATA_NOTE,
      actionsHtml: '<button type="button" class="btn btn-primary" id="btn-add-tenant">Add tenant</button>'
    });

    document.getElementById('btn-add-tenant').addEventListener('click', function () {
      openTenantModal(null);
    });

    var categoryFilterOpts = [{ value: '', label: 'All categories' }].concat(constants.TENANT_CATEGORIES);

    var filtersHtml = filterBar.render([
      { name: 'search', type: 'search', label: 'Search tenants', value: localFilters.search, placeholder: 'Name, phone, ID number, unit...' },
      { name: 'category', type: 'select', label: 'Category', value: localFilters.category, options: categoryFilterOpts }
    ]);

    var tableHtml = table.render({
      rows: tenants,
      columns: [
        {
          label: 'Tenant',
          render: function (t) {
            return '<strong>' + esc.html(t.fullName) + '</strong><div class="text-small text-muted mono">' + esc.html(t.idNumber) + '</div>';
          }
        },
        {
          label: 'Category',
          render: function (t) {
            return t.category === 'student'
              ? badge.render('Student (comrade)', 'info')
              : badge.render('Community', 'neutral');
          }
        },
        {
          label: 'Contact',
          render: function (t) {
            var nok = t.nextOfKinName ? '<div class="text-small text-muted">Kin: ' + esc.html(t.nextOfKinName) + '</div>' : '';
            return '<span class="mono">' + esc.html(t.phone) + '</span>' + nok;
          }
        },
        {
          label: 'Intended stay',
          render: function (t) {
            return esc.html(t.intendedStayLabel);
          }
        },
        {
          label: 'Current unit',
          render: function (t) {
            return t.currentUnitLabel
              ? esc.html(t.currentUnitLabel)
              : '<span class="text-muted">No active unit</span>';
          }
        },
        {
          label: 'Actions',
          numeric: true,
          render: function (t) {
            return (
              '<div class="table-actions">' +
                '<button type="button" class="btn btn-sm" data-history-tenant="' + esc.attr(t.id) + '">History (' + t.leaseHistory.length + ')</button>' +
                '<button type="button" class="btn btn-sm" data-edit-tenant="' + esc.attr(t.id) + '">Edit</button>' +
                '<button type="button" class="btn btn-sm btn-danger" data-del-tenant="' + esc.attr(t.id) + '">Delete</button>' +
              '</div>'
            );
          }
        }
      ],
      emptyState: {
        title: 'No tenants found',
        description: 'Add a tenant record or clear your search filter.',
        actionLabel: 'Add tenant',
        actionAttr: 'data-empty-add-tenant="1"'
      }
    });

    ctx.container.innerHTML =
      '<section class="panel">' +
        filtersHtml +
        tableHtml +
      '</section>';

    filterBar.bind(ctx.container, function (name, value) {
      localFilters[name] = value;
      render(ctx);
      var input = ctx.container.querySelector('[data-filter-name="' + name + '"]');
      if (input && input.type === 'search') {
        input.focus();
        var len = input.value.length;
        input.setSelectionRange(len, len);
      }
    });

    var emptyAdd = ctx.container.querySelector('[data-empty-add-tenant]');
    if (emptyAdd) {
      emptyAdd.addEventListener('click', function () {
        openTenantModal(null);
      });
    }

    var tenantById = {};
    for (var i = 0; i < tenants.length; i++) tenantById[tenants[i].id] = tenants[i];

    var histBtns = ctx.container.querySelectorAll('[data-history-tenant]');
    for (var h = 0; h < histBtns.length; h++) {
      histBtns[h].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-history-tenant');
        if (tenantById[id]) openHistoryModal(tenantById[id]);
      });
    }

    var editBtns = ctx.container.querySelectorAll('[data-edit-tenant]');
    for (var j = 0; j < editBtns.length; j++) {
      editBtns[j].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-edit-tenant');
        openTenantModal(tenantService.getById(id));
      });
    }

    var delBtns = ctx.container.querySelectorAll('[data-del-tenant]');
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-del-tenant');
        var t = tenantService.getById(id);
        confirmDialog.open({
          title: 'Delete tenant',
          message: 'Delete "' + (t ? t.fullName : 'tenant') + '"? Tenants with linked leases cannot be deleted.',
          confirmLabel: 'Delete',
          danger: true,
          onConfirm: function () {
            var res = tenantService.remove(id);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success('Tenant deleted.');
          }
        });
      });
    }
  }

  Makazi.ui.views.tenantsView = {
    render: render
  };
})(window);
