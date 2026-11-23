(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var constants = Makazi.core.constants;
  var esc = Makazi.core.escape;
  var utils = Makazi.core.utils;
  var propertyService = Makazi.services.propertyService;
  var modal = Makazi.ui.components.modal;
  var confirmDialog = Makazi.ui.components.confirm;
  var toast = Makazi.ui.components.toast;
  var formField = Makazi.ui.components.formField;
  var emptyState = Makazi.ui.components.emptyState;
  var tabs = Makazi.ui.components.tabs;

  var filterBar = Makazi.ui.components.filterBar;
  var localFilters = { search: '', area: '' };

  function openPropertyModal(existing, defaultArea) {
    var isEdit = Boolean(existing);
    var selectedArea = existing && existing.area ? existing.area : (defaultArea || 'Mumbi');

    var form = document.createElement('form');
    form.noValidate = true;
    form.className = 'form-grid';
    form.innerHTML =
      '<div class="form-error-summary" data-form-error hidden></div>' +
      formField.render({
        name: 'name',
        label: 'Property name',
        value: existing ? existing.name : '',
        placeholder: 'e.g. Mumbi Comrades Court',
        required: true
      }) +
      formField.render({
        name: 'area',
        type: 'select',
        label: 'Murang\'a area (Kihara Constituency)',
        value: selectedArea,
        options: constants.PROPERTY_AREAS,
        required: true
      }) +
      '<div id="area-other-wrap"' + (selectedArea === 'Other' ? '' : ' hidden') + '>' +
      formField.render({
        name: 'areaOther',
        label: 'Specify other area',
        value: existing ? (existing.areaOther || '') : '',
        placeholder: 'e.g. Kiharu / Maragi'
      }) +
      '</div>' +
      formField.render({
        name: 'type',
        type: 'select',
        label: 'Property type',
        value: existing ? existing.type : 'student_bedsitter_block',
        options: constants.PROPERTY_TYPES,
        required: true
      });

    var footer = document.createElement('div');
    footer.className = 'form-actions';
    footer.innerHTML =
      '<button type="button" class="btn" data-cancel>Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Save changes' : 'Add property') + '</button>';

    var m = modal.open({
      title: isEdit ? 'Edit property' : 'Add property',
      content: form,
      footer: footer
    });

    var areaSelect = form.elements.area;
    var otherWrap = form.querySelector('#area-other-wrap');
    areaSelect.addEventListener('change', function () {
      otherWrap.hidden = areaSelect.value !== 'Other';
    });

    footer.querySelector('[data-cancel]').addEventListener('click', m.close);
    footer.querySelector('[type="submit"]').addEventListener('click', function () {
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formField.clearErrors(form);
      var payload = {
        name: form.elements.name.value,
        area: form.elements.area.value,
        areaOther: form.elements.areaOther.value,
        type: form.elements.type.value
      };

      var hasClientError = false;
      if (!utils.isNonEmptyString(payload.name)) {
        formField.setFieldError(form, 'name', 'Property name is required.');
        hasClientError = true;
      }
      if (payload.area === 'Other' && !utils.isNonEmptyString(payload.areaOther)) {
        formField.setFieldError(form, 'areaOther', 'Please enter the area name.');
        hasClientError = true;
      }
      if (hasClientError) return;

      var res = isEdit
        ? propertyService.update(existing.id, payload)
        : propertyService.create(payload);

      if (!res.ok) {
        formField.setFormError(form, res.error);
        toast.error(res.error);
        return;
      }

      toast.success(isEdit ? 'Property updated.' : 'Property added.');
      m.close();
    });
  }

  function render(ctx) {
    var allProperties = propertyService.list();
    var properties = propertyService.list(localFilters);
    var hasActiveFilter = Boolean(localFilters.search || localFilters.area);

    ctx.setHeader({
      title: 'Properties',
      subtitle: 'Fictional properties across Murang\'a Town (Kihara Constituency): Mumbi, Mukuyu, Township, Mjini, Kwa Maji, VM, Mwangaza, Frankfort & Kabati. ' + constants.SAMPLE_DATA_NOTE,
      actionsHtml:
        '<button type="button" class="btn btn-primary" id="btn-add-property">Add property</button>' +
        '<button type="button" class="btn" id="btn-goto-units">View all units</button>'
    });

    document.getElementById('btn-add-property').addEventListener('click', function () {
      openPropertyModal(null, localFilters.area || 'Mumbi');
    });
    document.getElementById('btn-goto-units').addEventListener('click', function () {
      Makazi.ui.router.navigate('units');
    });

    var tabsHtml = tabs.render([
      { id: 'properties', label: 'Properties' },
      { id: 'units', label: 'Units' }
    ], 'properties');

    if (allProperties.length === 0) {
      ctx.container.innerHTML =
        '<div>' + tabsHtml + '</div>' +
        emptyState.render({
          title: 'No properties added yet',
          description: 'Start by adding your first rental property in one of the Murang\'a Town areas, then add units under it.',
          actionLabel: 'Add property',
          actionAttr: 'data-empty-add-property="1"'
        });
      tabs.bind(ctx.container, function (tabId) {
        if (tabId !== 'properties') Makazi.ui.router.navigate(tabId);
      });
      ctx.container.querySelector('[data-empty-add-property]').addEventListener('click', function () {
        openPropertyModal(null);
      });
      return;
    }

    var areaOptions = [{ value: '', label: 'All areas (' + allProperties.length + ')' }].concat(
      constants.PROPERTY_AREAS.map(function (a) {
        return { value: a.value, label: a.label };
      })
    );

    var filtersHtml = filterBar.render([
      { name: 'search', type: 'search', label: 'Search properties', value: localFilters.search, placeholder: 'Property name, area, or type...' },
      { name: 'area', type: 'select', label: 'Murang\'a area', value: localFilters.area, options: areaOptions }
    ]);

    var bodyHtml;
    if (properties.length === 0 && hasActiveFilter) {
      bodyHtml = emptyState.render({
        title: 'No properties match this filter',
        description: 'Clear your search or Murang\'a area filter, or add a property in ' + (localFilters.area || 'this area') + '.',
        actionLabel: 'Clear filters',
        actionAttr: 'data-clear-prop-filters="1"'
      });
    } else {
      var cardsHtml = properties.map(function (prop) {
        var typeLabel = utils.labelFromOptions(constants.PROPERTY_TYPES, prop.type, prop.type);
        return (
          '<article class="property-card">' +
            '<div>' +
              '<h2>' + esc.html(prop.name) + '</h2>' +
              '<div class="property-meta">' +
                '<span>Area: ' + esc.html(prop.areaDisplay) + '</span>' +
                '<span aria-hidden="true">·</span>' +
                '<span>' + esc.html(typeLabel) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="property-counts">' +
              '<div class="property-count-item"><span class="property-count-num">' + prop.unitCounts.total + '</span><span class="property-count-label">Total units</span></div>' +
              '<div class="property-count-item"><span class="property-count-num">' + prop.unitCounts.occupied + '</span><span class="property-count-label">Occupied</span></div>' +
              '<div class="property-count-item"><span class="property-count-num">' + prop.unitCounts.vacant + '</span><span class="property-count-label">Vacant</span></div>' +
            '</div>' +
            '<div class="card-actions">' +
              '<button type="button" class="btn btn-sm btn-primary" data-view-units="' + esc.attr(prop.id) + '">View units</button>' +
              '<button type="button" class="btn btn-sm" data-edit-prop="' + esc.attr(prop.id) + '">Edit</button>' +
              '<button type="button" class="btn btn-sm btn-danger" data-del-prop="' + esc.attr(prop.id) + '">Delete</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');
      bodyHtml = '<div class="grid-cards">' + cardsHtml + '</div>';
    }

    ctx.container.innerHTML =
      '<div>' + tabsHtml + '</div>' +
      '<section class="panel" style="margin-bottom: var(--space-4);">' + filtersHtml + '</section>' +
      bodyHtml;

    tabs.bind(ctx.container, function (tabId) {
      if (tabId !== 'properties') Makazi.ui.router.navigate(tabId);
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

    var clearBtn = ctx.container.querySelector('[data-clear-prop-filters]');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        localFilters.search = '';
        localFilters.area = '';
        render(ctx);
      });
    }

    var viewUnitBtns = ctx.container.querySelectorAll('[data-view-units]');
    for (var i = 0; i < viewUnitBtns.length; i++) {
      viewUnitBtns[i].addEventListener('click', function (e) {
        Makazi.ui.state = Makazi.ui.state || {};
        Makazi.ui.state.unitFilterPropertyId = e.currentTarget.getAttribute('data-view-units');
        Makazi.ui.router.navigate('units');
      });
    }

    var editBtns = ctx.container.querySelectorAll('[data-edit-prop]');
    for (var j = 0; j < editBtns.length; j++) {
      editBtns[j].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-edit-prop');
        openPropertyModal(propertyService.getById(id));
      });
    }

    var delBtns = ctx.container.querySelectorAll('[data-del-prop]');
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-del-prop');
        var prop = propertyService.getById(id);
        confirmDialog.open({
          title: 'Delete property',
          message: 'Delete "' + (prop ? prop.name : 'property') + '"? Properties with units or leases cannot be deleted.',
          confirmLabel: 'Delete',
          danger: true,
          onConfirm: function () {
            var res = propertyService.remove(id);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success('Property deleted.');
          }
        });
      });
    }
  }

  Makazi.ui.views.propertiesView = {
    render: render,
    openPropertyModal: openPropertyModal
  };
})(window);
