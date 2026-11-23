(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var constants = Makazi.core.constants;
  var dates = Makazi.core.dates;
  var esc = Makazi.core.escape;
  var money = Makazi.core.money;
  var leaseService = Makazi.services.leaseService;
  var reportService = Makazi.services.reportService;
  var formField = Makazi.ui.components.formField;
  var table = Makazi.ui.components.table;
  var toast = Makazi.ui.components.toast;

  var reportMonth = dates.currentMonth();

  function render(ctx) {
    var reports = reportService.getReports(reportMonth);
    var leases = leaseService.list();

    ctx.setHeader({
      title: 'Reports',
      subtitle: 'Area & property occupancy, income, water consumption, student vs community split, repairs, and deposit calculator.',
      actionsHtml: '<button type="button" class="btn btn-primary no-print" id="btn-print-reports">Print report</button>'
    });

    document.getElementById('btn-print-reports').addEventListener('click', function () {
      window.print();
    });

    var areaTable = table.render({
      rows: reports.occupancyAndIncomeByArea,
      columns: [
        { label: 'Area', key: 'area' },
        { label: 'Properties', numeric: true, key: 'propertyCount' },
        { label: 'Units', numeric: true, key: 'totalUnits' },
        { label: 'Occupied', numeric: true, key: 'occupied' },
        { label: 'Vacant', numeric: true, key: 'vacant' },
        {
          label: 'Occupancy %',
          numeric: true,
          render: function (r) { return '<strong>' + r.occupancyRate + '%</strong>'; }
        },
        {
          label: 'Total collected',
          numeric: true,
          render: function (r) { return '<strong>' + esc.html(money.formatKES(r.totalCollected)) + '</strong>'; }
        }
      ],
      emptyState: {
        title: 'No area data available',
        description: 'Add properties and units to view area breakdowns.'
      }
    });

    var occupancyTable = table.render({
      rows: reports.occupancyByProperty,
      columns: [
        { label: 'Property', key: 'propertyName' },
        { label: 'Area', key: 'area' },
        { label: 'Total', numeric: true, key: 'totalUnits' },
        { label: 'Occupied', numeric: true, key: 'occupied' },
        { label: 'Vacant', numeric: true, key: 'vacant' },
        { label: 'Renovation', numeric: true, key: 'underRenovation' },
        {
          label: 'Occupancy %',
          numeric: true,
          render: function (r) { return '<strong>' + r.occupancyRate + '%</strong>'; }
        }
      ],
      emptyState: {
        title: 'No property occupancy data',
        description: 'Add properties and units to view occupancy breakdowns.'
      }
    });

    var incomeTable = table.render({
      rows: reports.incomeByProperty,
      columns: [
        { label: 'Property', key: 'propertyName' },
        { label: 'Area', key: 'area' },
        { label: 'Recorded payments', numeric: true, key: 'paymentCount' },
        {
          label: 'Occupied monthly rent run-rate',
          numeric: true,
          render: function (r) { return esc.html(money.formatKES(r.monthlyOccupiedRunRate)); }
        },
        {
          label: 'Total collected',
          numeric: true,
          render: function (r) { return '<strong>' + esc.html(money.formatKES(r.totalCollected)) + '</strong>'; }
        }
      ],
      emptyState: {
        title: 'No income data yet',
        description: 'Record payments to generate per-property totals.'
      }
    });

    var waterTable = table.render({
      rows: reports.waterByProperty,
      columns: [
        { label: 'Property', key: 'propertyName' },
        { label: 'Area', key: 'area' },
        { label: 'Meters read', numeric: true, key: 'metersRead' },
        { label: 'Consumed', numeric: true, render: function (r) { return esc.html(r.consumptionM3 + ' m3'); } },
        { label: 'Tenant water billed', numeric: true, render: function (r) { return esc.html(money.formatKES(r.tenantWaterBilled)); } },
        { label: 'MUWASCO payable', numeric: true, render: function (r) { return esc.html(money.formatKES(r.muwascoPayable)); } },
        { label: 'MUWASCO balance', numeric: true, render: function (r) { return '<strong>' + esc.html(money.formatKES(r.muwascoBalance)) + '</strong>'; } }
      ],
      emptyState: {
        title: 'No water readings for ' + reportMonth,
        description: 'Simulate or record water readings on the Water & Meters view.'
      }
    });

    var sc = reports.studentVsCommunity;
    var repairs = reports.repairsSummary;
    var repairsTable = table.render({
      rows: repairs.byProperty,
      columns: [
        { label: 'Property', key: 'propertyName' },
        { label: 'Open', numeric: true, key: 'open' },
        { label: 'Completed', numeric: true, key: 'completed' },
        { label: 'Total requests', numeric: true, key: 'total' }
      ],
      emptyState: {
        title: 'No maintenance data',
        description: 'Log maintenance requests to see repairs by property.'
      }
    });

    var split = reports.leaseTermSplit;
    var leaseOptions = [{ value: '', label: 'Custom amounts (enter manually)' }].concat(
      leases.map(function (l) {
        return {
          value: String(l.deposit),
          label: l.propertyName + ' — Unit ' + l.unitNumber + ' (' + l.tenantName + ', Deposit ' + money.formatKES(l.deposit) + ')'
        };
      })
    );

    ctx.container.innerHTML =
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Occupancy &amp; income per area (Murang\'a Town)</h2><span class="text-small text-muted">' + esc.html(constants.SAMPLE_DATA_NOTE) + '</span></div></div>' +
        areaTable +
      '</section>' +
      '<div class="grid-2">' +
        '<section class="panel">' +
          '<div class="panel-header"><div class="panel-title-wrap"><h2>Student vs Community split</h2><span class="text-small text-muted">Active occupancy and tenant mix</span></div></div>' +
          '<div class="table-wrap"><table class="data-table">' +
            '<thead><tr><th>Segment</th><th class="is-numeric">Occupied units</th><th class="is-numeric">Registered tenants</th></tr></thead>' +
            '<tbody>' +
              '<tr><td>Student (comrade)</td><td class="is-numeric">' + sc.occupiedStudent + '</td><td class="is-numeric">' + sc.studentTenantsTotal + '</td></tr>' +
              '<tr><td>Community (family / working / other)</td><td class="is-numeric">' + sc.occupiedCommunity + '</td><td class="is-numeric">' + sc.communityTenantsTotal + '</td></tr>' +
            '</tbody>' +
          '</table></div>' +
        '</section>' +
        '<section class="panel">' +
          '<div class="panel-header"><div class="panel-title-wrap"><h2>Lease term split</h2><span class="text-small text-muted">' + esc.html(constants.PROJECT_TERM_RULE_NOTE) + '</span></div></div>' +
          '<div class="table-wrap"><table class="data-table">' +
            '<thead><tr><th>Term category</th><th class="is-numeric">Active</th><th class="is-numeric">All leases</th></tr></thead>' +
            '<tbody>' +
              '<tr><td>Short-term (&lt; 24 months)</td><td class="is-numeric">' + split.activeShort + '</td><td class="is-numeric">' + split.totalShort + '</td></tr>' +
              '<tr><td>Long-term (24+ months)</td><td class="is-numeric">' + split.activeLong + '</td><td class="is-numeric">' + split.totalLong + '</td></tr>' +
            '</tbody>' +
          '</table></div>' +
        '</section>' +
      '</div>' +
      '<section class="panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title-wrap"><h2>Water consumption per property (' + esc.html(reportMonth) + ')</h2><span class="text-small text-muted">' + esc.html(constants.TARIFF_DISCLAIMER) + '</span></div>' +
          '<div class="field no-print" style="min-width:170px;"><label class="sr-only" for="report-water-month">Water report month</label><input id="report-water-month" type="month" class="field-control" value="' + esc.attr(reportMonth) + '"></div>' +
        '</div>' +
        waterTable +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Occupancy per property</h2><span class="text-small text-muted">Current unit status distribution</span></div></div>' +
        occupancyTable +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Income per property</h2><span class="text-small text-muted">Recorded manual demonstration payments (rent + water)</span></div></div>' +
        incomeTable +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Repairs summary</h2><span class="text-small text-muted">Open: ' + repairs.open + ' · Completed: ' + repairs.completed + ' · High priority: ' + repairs.byPriority.high + '</span></div></div>' +
        repairsTable +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Deposit refund calculator</h2><span class="text-small text-muted">BR5: Refund equals deposit minus approved deductions, never below KES 0</span></div></div>' +
        '<form id="deposit-calc-form" class="form-grid form-grid-2" novalidate>' +
          '<div style="grid-column:1 / -1;">' +
          formField.render({
            name: 'leasePreset',
            type: 'select',
            label: 'Load deposit from lease (optional)',
            value: '',
            options: leaseOptions
          }) +
          '</div>' +
          formField.render({
            name: 'deposit',
            type: 'number',
            label: 'Security deposit held (KES)',
            value: '30000',
            min: 0,
            step: 100,
            required: true
          }) +
          formField.render({
            name: 'deductions',
            type: 'number',
            label: 'Approved deductions (KES)',
            value: '8500',
            min: 0,
            step: 100,
            required: true
          }) +
          '<div style="grid-column:1 / -1; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">' +
            '<div id="deposit-calc-result" class="notice-box" style="flex:1 1 280px;"></div>' +
            '<button type="submit" class="btn btn-primary no-print">Calculate refund</button>' +
          '</div>' +
        '</form>' +
      '</section>';

    document.getElementById('report-water-month').addEventListener('change', function (e) {
      if (e.target.value) {
        reportMonth = e.target.value;
        render(ctx);
      }
    });

    var calcForm = document.getElementById('deposit-calc-form');
    var resultBox = document.getElementById('deposit-calc-result');
    var presetSelect = calcForm.elements.leasePreset;

    function updateCalculator() {
      formField.clearErrors(calcForm);
      var res = reportService.calculateDepositRefund(
        calcForm.elements.deposit.value,
        calcForm.elements.deductions.value
      );
      if (!res.ok) {
        resultBox.innerHTML = '<span style="color:var(--status-danger-text);">' + esc.html(res.error) + '</span>';
        return res;
      }
      var d = res.data;
      var shortfallNote = d.shortfall > 0
        ? ' · Remaining balance owed by tenant: <strong>' + esc.html(money.formatKES(d.shortfall)) + '</strong>'
        : '';
      resultBox.innerHTML =
        'Refund payable to tenant: <strong class="tabular-nums">' + esc.html(money.formatKES(d.refund)) + '</strong>' +
        ' <span class="text-small text-muted">(' + esc.html(money.formatKES(d.deposit)) + ' − ' + esc.html(money.formatKES(d.deductions)) + ')' + shortfallNote + '</span>';
      return res;
    }

    updateCalculator();

    presetSelect.addEventListener('change', function () {
      if (presetSelect.value !== '') {
        calcForm.elements.deposit.value = presetSelect.value;
        updateCalculator();
      }
    });

    calcForm.elements.deposit.addEventListener('input', updateCalculator);
    calcForm.elements.deductions.addEventListener('input', updateCalculator);

    calcForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var res = updateCalculator();
      if (!res.ok) toast.error(res.error);
    });
  }

  Makazi.ui.views.reportsView = {
    render: render
  };
})(window);
