(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var constants = Makazi.core.constants;
  var dates = Makazi.core.dates;
  var esc = Makazi.core.escape;
  var money = Makazi.core.money;
  var propertyService = Makazi.services.propertyService;
  var waterService = Makazi.services.waterService;
  var statCard = Makazi.ui.components.statCard;
  var badge = Makazi.ui.components.badge;
  var formField = Makazi.ui.components.formField;
  var filterBar = Makazi.ui.components.filterBar;
  var table = Makazi.ui.components.table;
  var toast = Makazi.ui.components.toast;

  var selectedMonth = dates.currentMonth();
  var meterFilters = {
    propertyId: '',
    meterType: '',
    onlyLeaks: false
  };

  function render(ctx) {
    var properties = propertyService.list();
    var summary = waterService.getMonthlySummary(selectedMonth);
    var meterRows = waterService.listMetersWithReadings(selectedMonth, meterFilters);
    var allMeters = waterService.listMetersWithReadings(selectedMonth, {});
    var muwascoPayments = waterService.listMuwascoPayments(selectedMonth);
    var t = summary.totals;
    var tariffs = summary.tariffs;

    ctx.setHeader({
      title: 'Water & Meters',
      subtitle: 'Digital meter simulation, manual meter readings, leak flags, and MUWASCO billing reconciliation.',
      actionsHtml:
        '<button type="button" class="btn btn-primary" id="btn-simulate-digital">Simulate digital meter readings</button>'
    });

    document.getElementById('btn-simulate-digital').addEventListener('click', function () {
      var res = waterService.simulateDigitalReadings(selectedMonth, dates.today());
      if (!res.ok) {
        toast.info(res.error);
        return;
      }
      toast.success('Simulated ' + res.data.count + ' digital meter reading(s) for ' + res.data.month + '.');
    });

    var statsHtml =
      '<section class="stat-grid" aria-label="Monthly water metrics">' +
        statCard.render({ label: 'Consumed (' + selectedMonth + ')', value: t.consumptionM3 + ' m3' }) +
        statCard.render({ label: 'Tenant water billed', value: money.formatKES(t.tenantWaterBilled) }) +
        statCard.render({ label: 'Water collected', value: money.formatKES(t.waterCollected) }) +
        statCard.render({ label: 'MUWASCO payable', value: money.formatKES(t.muwascoPayable) }) +
        statCard.render({ label: 'MUWASCO paid', value: money.formatKES(t.muwascoPaid) }) +
        statCard.render({ label: 'MUWASCO balance', value: money.formatKES(t.muwascoBalance) }) +
        statCard.render({ label: 'Water margin', value: money.formatKES(t.margin), note: 'Collected − MUWASCO payable' }) +
        statCard.render({ label: 'Possible leaks flagged', value: summary.leaksCount, note: '> 2× 3-month average' }) +
      '</section>';

    var monthPickerHtml =
      '<section class="panel">' +
        '<div class="filter-bar">' +
          '<div class="field" style="min-width:200px; max-width:260px;">' +
            '<label class="field-label" for="water-month-select">Billing month (YYYY-MM)</label>' +
            '<input id="water-month-select" type="month" class="field-control" value="' + esc.attr(selectedMonth) + '">' +
          '</div>' +
          '<div class="notice-box" style="flex:1 1 300px;">' +
            '<strong>Simulation Notice:</strong> Digital readings are simulated locally in-browser and labelled <em>"Digital meter (simulated)"</em>. ' +
            esc.html(constants.TARIFF_DISCLAIMER) +
          '</div>' +
        '</div>' +
      '</section>';

    var meterOptions = allMeters.length
      ? allMeters.map(function (m) {
          return {
            value: m.meterId,
            label: m.propertyName + ' — Unit ' + m.unitNumber + ' (' + m.meterNumber + ', prev ' + m.previousReading + ' m3)'
          };
        })
      : [{ value: '', label: 'No water meters available' }];

    var manualFormHtml =
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Record manual meter reading</h2><span class="text-small text-muted">BR7: Cannot be lower than previous reading · BR8: One reading per meter per month</span></div></div>' +
        '<form id="manual-reading-form" class="form-grid form-grid-2" novalidate>' +
          '<div class="form-error-summary" data-form-error hidden style="grid-column:1 / -1;"></div>' +
          '<div style="grid-column:1 / -1;">' +
          formField.render({
            name: 'meterId',
            type: 'select',
            label: 'Unit water meter',
            value: allMeters[0] ? allMeters[0].meterId : '',
            options: meterOptions,
            required: true
          }) +
          '</div>' +
          formField.render({
            name: 'month',
            type: 'month',
            label: 'Reading month (YYYY-MM)',
            value: selectedMonth,
            required: true
          }) +
          formField.render({
            name: 'reading',
            type: 'number',
            label: 'Current reading (m3)',
            step: '0.1',
            min: 0,
            placeholder: 'e.g. 135',
            required: true
          }) +
          formField.render({
            name: 'readOn',
            type: 'date',
            label: 'Read on',
            value: dates.today(),
            required: true
          }) +
          '<div style="display:flex; align-items:flex-end; justify-content:flex-end;">' +
            '<button type="submit" class="btn btn-primary"' + (allMeters.length === 0 ? ' disabled' : '') + '>Save reading</button>' +
          '</div>' +
        '</form>' +
      '</section>';

    var tariffFormHtml =
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Tariff settings</h2><span class="text-small text-muted">' + esc.html(constants.TARIFF_DISCLAIMER) + '</span></div></div>' +
        '<form id="tariff-settings-form" class="form-grid form-grid-2" novalidate>' +
          '<div class="form-error-summary" data-form-error hidden style="grid-column:1 / -1;"></div>' +
          formField.render({
            name: 'tenantRatePerM3',
            type: 'number',
            label: 'Tenant rate per m3 (KES)',
            value: tariffs.tenantRatePerM3,
            min: 0,
            step: 5,
            required: true
          }) +
          formField.render({
            name: 'tenantFixedCharge',
            type: 'number',
            label: 'Tenant fixed monthly charge (KES)',
            value: tariffs.tenantFixedCharge,
            min: 0,
            step: 10,
            required: true
          }) +
          formField.render({
            name: 'muwascoRatePerM3',
            type: 'number',
            label: 'MUWASCO bulk rate per m3 (KES)',
            value: tariffs.muwascoRatePerM3,
            min: 0,
            step: 5,
            required: true
          }) +
          '<div style="display:flex; align-items:flex-end; justify-content:flex-end;">' +
            '<button type="submit" class="btn">Update sample tariffs</button>' +
          '</div>' +
        '</form>' +
      '</section>';

    var propFilterOpts = [{ value: '', label: 'All properties' }].concat(
      properties.map(function (p) { return { value: p.id, label: p.name }; })
    );

    var meterFilterBar = filterBar.render([
      { name: 'propertyId', type: 'select', label: 'Property', value: meterFilters.propertyId, options: propFilterOpts },
      {
        name: 'meterType',
        type: 'select',
        label: 'Meter type',
        value: meterFilters.meterType,
        options: [
          { value: '', label: 'All meter types' },
          { value: 'digital', label: 'Digital meter' },
          { value: 'manual', label: 'Manual meter' }
        ]
      },
      {
        name: 'onlyLeaks',
        type: 'select',
        label: 'Leak alerts',
        value: meterFilters.onlyLeaks ? 'yes' : '',
        options: [
          { value: '', label: 'All meters' },
          { value: 'yes', label: 'Possible leaks only' }
        ]
      }
    ]);

    var metersTableHtml = table.render({
      rows: meterRows,
      columns: [
        {
          label: 'Unit & Property',
          render: function (r) {
            return '<strong>Unit ' + esc.html(r.unitNumber) + '</strong><div class="text-small text-muted">' + esc.html(r.propertyName) + '</div>';
          }
        },
        {
          label: 'Meter',
          render: function (r) {
            var typeLabel = r.meterType === 'digital' ? 'Digital' : 'Manual';
            return '<span class="mono">' + esc.html(r.meterNumber) + '</span><div class="text-small text-muted">' + esc.html(typeLabel) + '</div>';
          }
        },
        {
          label: 'Previous (m3)',
          numeric: true,
          render: function (r) { return esc.html(r.previousReading); }
        },
        {
          label: 'Current (m3)',
          numeric: true,
          render: function (r) {
            return r.currentReading !== null
              ? '<strong>' + esc.html(r.currentReading) + '</strong><div class="text-small text-muted">' + esc.html(r.source || '') + '</div>'
              : '<span class="text-muted">Not read</span>';
          }
        },
        {
          label: 'Used (m3)',
          numeric: true,
          render: function (r) {
            if (r.consumption === null) return '<span class="text-muted">—</span>';
            var leakBadge = r.leakSuspected
              ? '<div style="margin-top:4px;">' + badge.render('Possible leak (avg ' + r.threeMonthAvg + ')', 'danger') + '</div>'
              : '';
            return '<strong>' + esc.html(r.consumption) + ' m3</strong>' + leakBadge;
          }
        },
        {
          label: 'Tenant bill',
          numeric: true,
          render: function (r) {
            if (r.currentReading === null) return '<span class="text-muted">—</span>';
            if (r.unitStatus !== 'occupied') return '<span class="text-small text-muted">Vacant/Reno</span>';
            return '<strong>' + esc.html(money.formatKES(r.waterBill)) + '</strong><div class="text-small text-muted">' + esc.html(r.tenantName || '') + '</div>';
          }
        }
      ],
      emptyState: {
        title: 'No water meters match filters',
        description: 'Clear filters or add a unit with a water meter.'
      }
    });

    var muwPropOpts = properties.map(function (p) { return { value: p.id, label: p.name }; });
    var muwFormHtml =
      '<form id="muwasco-payment-form" class="form-grid form-grid-2" novalidate>' +
        '<div class="form-error-summary" data-form-error hidden style="grid-column:1 / -1;"></div>' +
        formField.render({
          name: 'propertyId',
          type: 'select',
          label: 'Property',
          value: properties[0] ? properties[0].id : '',
          options: muwPropOpts,
          required: true
        }) +
        formField.render({
          name: 'month',
          type: 'month',
          label: 'Billing month (YYYY-MM)',
          value: selectedMonth,
          required: true
        }) +
        formField.render({
          name: 'paidOn',
          type: 'date',
          label: 'Paid on',
          value: dates.today(),
          required: true
        }) +
        formField.render({
          name: 'amount',
          type: 'number',
          label: 'Amount paid to MUWASCO (KES)',
          min: 1,
          step: 50,
          placeholder: 'e.g. 2200',
          required: true
        }) +
        formField.render({
          name: 'reference',
          label: 'MUWASCO payment reference',
          placeholder: 'e.g. MUW-DEMO-601',
          hint: 'BR10: Reference must be unique.',
          required: true
        }) +
        '<div style="display:flex; align-items:flex-end; justify-content:flex-end;">' +
          '<button type="submit" class="btn btn-primary"' + (properties.length === 0 ? ' disabled' : '') + '>Record MUWASCO payment</button>' +
        '</div>' +
      '</form>';

    var muwPropertyTable = table.render({
      rows: summary.byProperty,
      columns: [
        { label: 'Property', key: 'propertyName' },
        { label: 'Consumed', numeric: true, render: function (r) { return esc.html(r.consumptionM3 + ' m3'); } },
        { label: 'MUWASCO payable', numeric: true, render: function (r) { return esc.html(money.formatKES(r.muwascoPayable)); } },
        { label: 'MUWASCO paid', numeric: true, render: function (r) { return esc.html(money.formatKES(r.muwascoPaid)); } },
        { label: 'Balance owed', numeric: true, render: function (r) { return '<strong>' + esc.html(money.formatKES(r.muwascoBalance)) + '</strong>'; } },
        { label: 'Water collected', numeric: true, render: function (r) { return esc.html(money.formatKES(r.waterCollected)); } },
        { label: 'Margin', numeric: true, render: function (r) { return '<strong>' + esc.html(money.formatKES(r.margin)) + '</strong>'; } }
      ],
      emptyState: {
        title: 'No properties found',
        description: 'Add a property to track MUWASCO water payables.'
      }
    });

    var muwHistoryTable = table.render({
      rows: muwascoPayments,
      columns: [
        { label: 'Paid on', render: function (p) { return '<span class="mono">' + esc.html(p.paidOn) + '</span>'; } },
        { label: 'Month', render: function (p) { return '<span class="mono">' + esc.html(p.month) + '</span>'; } },
        { label: 'Property', key: 'propertyName' },
        { label: 'Reference', render: function (p) { return '<span class="mono">' + esc.html(p.reference) + '</span>'; } },
        { label: 'Amount', numeric: true, render: function (p) { return '<strong>' + esc.html(money.formatKES(p.amount)) + '</strong>'; } }
      ],
      emptyState: {
        title: 'No MUWASCO payments for ' + selectedMonth,
        description: 'Use the form above to record a payment to MUWASCO for this billing month.'
      }
    });

    ctx.container.innerHTML =
      monthPickerHtml +
      statsHtml +
      '<div class="grid-2">' +
        manualFormHtml +
        tariffFormHtml +
      '</div>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Water meters &amp; monthly bills (' + esc.html(selectedMonth) + ')</h2><span class="text-small text-muted">Consumption = current − previous · Unusual usage (&gt; 2× 3-month average) is flagged</span></div></div>' +
        meterFilterBar +
        metersTableHtml +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>MUWASCO payable, payments &amp; water margin (' + esc.html(selectedMonth) + ')</h2><span class="text-small text-muted">Payable = consumption × MUWASCO sample rate · Margin = tenant water collected − MUWASCO payable</span></div></div>' +
        muwFormHtml +
        muwPropertyTable +
        '<h3>Recorded MUWASCO payments (' + esc.html(selectedMonth) + ')</h3>' +
        muwHistoryTable +
      '</section>';

    document.getElementById('water-month-select').addEventListener('change', function (e) {
      if (e.target.value) {
        selectedMonth = e.target.value;
        render(ctx);
      }
    });

    var manualForm = document.getElementById('manual-reading-form');
    manualForm.addEventListener('submit', function (e) {
      e.preventDefault();
      formField.clearErrors(manualForm);
      var res = waterService.recordManualReading({
        meterId: manualForm.elements.meterId.value,
        month: manualForm.elements.month.value,
        reading: manualForm.elements.reading.value,
        readOn: manualForm.elements.readOn.value
      });
      if (!res.ok) {
        if (/lower/i.test(res.error)) {
          formField.setFieldError(manualForm, 'reading', res.error);
        } else if (/already been recorded/i.test(res.error)) {
          formField.setFieldError(manualForm, 'month', res.error);
        } else {
          formField.setFormError(manualForm, res.error);
        }
        toast.error(res.error);
        return;
      }
      selectedMonth = manualForm.elements.month.value;
      toast.success('Water meter reading saved.');
    });

    var tariffForm = document.getElementById('tariff-settings-form');
    tariffForm.addEventListener('submit', function (e) {
      e.preventDefault();
      formField.clearErrors(tariffForm);
      var res = waterService.updateTariffSettings({
        tenantRatePerM3: tariffForm.elements.tenantRatePerM3.value,
        tenantFixedCharge: tariffForm.elements.tenantFixedCharge.value,
        muwascoRatePerM3: tariffForm.elements.muwascoRatePerM3.value
      });
      if (!res.ok) {
        formField.setFormError(tariffForm, res.error);
        toast.error(res.error);
        return;
      }
      toast.success('Sample water tariffs updated.');
    });

    filterBar.bind(ctx.container, function (name, value) {
      if (name === 'onlyLeaks') {
        meterFilters.onlyLeaks = value === 'yes';
      } else {
        meterFilters[name] = value;
      }
      render(ctx);
    });

    var muwForm = document.getElementById('muwasco-payment-form');
    muwForm.addEventListener('submit', function (e) {
      e.preventDefault();
      formField.clearErrors(muwForm);
      var res = waterService.recordMuwascoPayment({
        propertyId: muwForm.elements.propertyId.value,
        month: muwForm.elements.month.value,
        paidOn: muwForm.elements.paidOn.value,
        amount: muwForm.elements.amount.value,
        reference: muwForm.elements.reference.value
      });
      if (!res.ok) {
        if (/reference/i.test(res.error)) {
          formField.setFieldError(muwForm, 'reference', res.error);
        } else {
          formField.setFormError(muwForm, res.error);
        }
        toast.error(res.error);
        return;
      }
      selectedMonth = muwForm.elements.month.value;
      toast.success('MUWASCO payment recorded.');
    });
  }

  Makazi.ui.views.waterView = {
    render: render
  };
})(window);
