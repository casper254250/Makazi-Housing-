(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var dates = Makazi.core.dates;
  var esc = Makazi.core.escape;
  var money = Makazi.core.money;
  var leaseService = Makazi.services.leaseService;
  var paymentService = Makazi.services.paymentService;
  var toast = Makazi.ui.components.toast;
  var badge = Makazi.ui.components.badge;
  var formField = Makazi.ui.components.formField;
  var filterBar = Makazi.ui.components.filterBar;
  var table = Makazi.ui.components.table;

  var invoiceMonth = dates.currentMonth();
  var periodFilter = '';

  function render(ctx) {
    var activeLeases = leaseService.list({ status: 'active' });
    var invoices = paymentService.listMonthlyInvoices(invoiceMonth);
    var balances = paymentService.listLeaseBalances();
    var payments = paymentService.list(periodFilter ? { period: periodFilter } : {});

    ctx.setHeader({
      title: 'Rent Records',
      subtitle: 'Combined monthly rent + water invoices (BR9), manual payment entries, and per-lease arrears.'
    });

    var invoiceByLeaseId = {};
    invoices.forEach(function (inv) { invoiceByLeaseId[inv.leaseId] = inv; });

    var leaseOptions = activeLeases.length
      ? activeLeases.map(function (l) {
          var inv = invoiceByLeaseId[l.id];
          var totalStr = inv ? money.formatKES(inv.invoiceTotal) : money.formatKES(l.monthlyRent);
          return {
            value: l.id,
            label: l.propertyName + ' — Unit ' + l.unitNumber + ' (' + l.tenantName + ', ' + invoiceMonth + ' invoice: ' + totalStr + ')'
          };
        })
      : [{ value: '', label: 'No active leases available' }];

    var defaultLease = activeLeases[0] || null;
    var defaultInv = defaultLease ? invoiceByLeaseId[defaultLease.id] : null;
    var defaultAmount = defaultInv ? defaultInv.invoiceTotal : (defaultLease ? defaultLease.monthlyRent : '');

    var recordFormHtml =
      '<section class="panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title-wrap"><h2>Record combined rent + water payment</h2><span class="text-small text-muted">Manual entry only · Duplicate demonstration references are rejected (BR4)</span></div>' +
        '</div>' +
        '<form id="record-payment-form" class="form-grid form-grid-2" novalidate>' +
          '<div class="form-error-summary" data-form-error hidden style="grid-column:1 / -1;"></div>' +
          '<div style="grid-column:1 / -1;">' +
          formField.render({
            name: 'leaseId',
            type: 'select',
            label: 'Active lease',
            value: defaultLease ? defaultLease.id : '',
            options: leaseOptions,
            required: true
          }) +
          '</div>' +
          formField.render({
            name: 'period',
            type: 'month',
            label: 'Billing period (YYYY-MM)',
            value: invoiceMonth,
            required: true
          }) +
          formField.render({
            name: 'amount',
            type: 'number',
            label: 'Amount paid (KES)',
            value: defaultAmount,
            min: 1,
            step: 50,
            hint: 'Prefilled from rent + water invoice for the selected period.',
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
            name: 'reference',
            label: 'Demonstration reference',
            placeholder: 'e.g. DEMO-REF-2001',
            hint: 'Must be unique (case-insensitive). Manual entry only.',
            required: true
          }) +
          '<div style="grid-column:1 / -1; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">' +
            '<span class="text-small text-muted">Payment method: Manual entry only</span>' +
            '<button type="submit" class="btn btn-primary"' + (activeLeases.length === 0 ? ' disabled' : '') + '>Record payment</button>' +
          '</div>' +
        '</form>' +
      '</section>';

    var invoiceTableHtml = table.render({
      rows: invoices,
      rowClass: function (row) {
        return row.balanceInMonth > 0 ? 'row-arrears' : '';
      },
      columns: [
        {
          label: 'Unit & Tenant',
          render: function (inv) {
            return '<strong>Unit ' + esc.html(inv.unitNumber) + '</strong> (' + esc.html(inv.propertyName) + ')<div class="text-small text-muted">' + esc.html(inv.tenantName) + '</div>';
          }
        },
        {
          label: 'Rent',
          numeric: true,
          render: function (inv) { return esc.html(money.formatKES(inv.rentAmount)); }
        },
        {
          label: 'Water bill',
          numeric: true,
          render: function (inv) {
            if (!inv.hasWaterReading) return '<span class="text-muted text-small">No reading</span>';
            return esc.html(money.formatKES(inv.waterAmount)) + '<div class="text-small text-muted">' + esc.html(inv.waterConsumption) + ' m3</div>';
          }
        },
        {
          label: 'Combined invoice',
          numeric: true,
          render: function (inv) { return '<strong>' + esc.html(money.formatKES(inv.invoiceTotal)) + '</strong>'; }
        },
        {
          label: 'Paid (' + invoiceMonth + ')',
          numeric: true,
          render: function (inv) { return esc.html(money.formatKES(inv.paidInMonth)); }
        },
        {
          label: 'Period status',
          render: function (inv) {
            if (inv.balanceInMonth > 0) return badge.render('Due ' + money.formatKES(inv.balanceInMonth), 'warning');
            return badge.render('Settled', 'success');
          }
        }
      ],
      emptyState: {
        title: 'No active leases for ' + invoiceMonth,
        description: 'Create a lease to generate monthly rent + water invoices.'
      }
    });

    var balancesTableHtml = table.render({
      rows: balances,
      rowClass: function (row) {
        return row.inArrears ? 'row-arrears' : '';
      },
      columns: [
        {
          label: 'Unit & Tenant',
          render: function (b) {
            return '<strong>Unit ' + esc.html(b.unitNumber) + '</strong> (' + esc.html(b.propertyName) + ')<div class="text-small text-muted">' + esc.html(b.tenantName) + '</div>';
          }
        },
        {
          label: 'Expected rent',
          numeric: true,
          render: function (b) { return esc.html(money.formatKES(b.expectedRentTotal)) + '<div class="text-small text-muted">' + b.monthsElapsed + ' mo</div>'; }
        },
        {
          label: 'Water billed',
          numeric: true,
          render: function (b) { return esc.html(money.formatKES(b.waterBilledTotal)); }
        },
        {
          label: 'Total billed',
          numeric: true,
          render: function (b) { return '<strong>' + esc.html(money.formatKES(b.expectedTotal)) + '</strong>'; }
        },
        {
          label: 'Paid to date',
          numeric: true,
          render: function (b) { return esc.html(money.formatKES(b.paidTotal)); }
        },
        {
          label: 'Balance',
          numeric: true,
          render: function (b) {
            var absBal = money.formatKES(Math.abs(b.balance));
            if (b.balance > 0) return '<strong style="color:var(--status-danger-text);">' + esc.html(absBal) + '</strong>';
            if (b.balance < 0) return '<span style="color:var(--status-success-text);">+' + esc.html(absBal) + '</span>';
            return esc.html(money.formatKES(0));
          }
        },
        {
          label: 'Standing',
          render: function (b) {
            if (b.balance > 0) return badge.render('Arrears', 'danger');
            if (b.balance < 0) return badge.render('Credit', 'success');
            return badge.render('Settled', 'success');
          }
        }
      ],
      emptyState: {
        title: 'No lease balances yet',
        description: 'Create a lease to start tracking combined rent and water balances.'
      }
    });

    var filterHtml = filterBar.render([
      { name: 'period', type: 'month', label: 'Filter payment history by month (YYYY-MM)', value: periodFilter }
    ]);

    var paymentsTableHtml = table.render({
      rows: payments,
      columns: [
        {
          label: 'Paid on',
          render: function (p) { return '<span class="mono">' + esc.html(p.paidOn) + '</span>'; }
        },
        {
          label: 'Period',
          render: function (p) { return '<span class="mono">' + esc.html(p.period) + '</span>'; }
        },
        {
          label: 'Tenant & Unit',
          render: function (p) {
            return '<strong>' + esc.html(p.tenantName) + '</strong><div class="text-small text-muted">' + esc.html(p.propertyName) + ' — Unit ' + esc.html(p.unitNumber) + '</div>';
          }
        },
        {
          label: 'Reference',
          render: function (p) { return '<span class="mono">' + esc.html(p.reference) + '</span>'; }
        },
        {
          label: 'Method',
          render: function () { return 'Manual entry only'; }
        },
        {
          label: 'Amount',
          numeric: true,
          render: function (p) { return '<strong>' + esc.html(money.formatKES(p.amount)) + '</strong>'; }
        }
      ],
      emptyState: {
        title: 'No payments found',
        description: periodFilter ? 'No payments recorded for ' + periodFilter + '. Clear the month filter to view all payments.' : 'Record a payment using the form above.',
        actionLabel: periodFilter ? 'Show all months' : '',
        actionAttr: periodFilter ? 'data-clear-period="1"' : ''
      }
    });

    ctx.container.innerHTML =
      recordFormHtml +
      '<section class="panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title-wrap"><h2>Monthly invoice breakdown (' + esc.html(invoiceMonth) + ')</h2><span class="text-small text-muted">BR9: Monthly invoice = rent + water bill</span></div>' +
          '<div class="field" style="min-width:170px;"><label class="sr-only" for="invoice-month-picker">Invoice month</label><input id="invoice-month-picker" type="month" class="field-control" value="' + esc.attr(invoiceMonth) + '"></div>' +
        '</div>' +
        invoiceTableHtml +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Cumulative per-lease balances &amp; arrears</h2><span class="text-small text-muted">Expected rent + water billed minus payments recorded</span></div></div>' +
        balancesTableHtml +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Payment history</h2><span class="text-small text-muted">Recorded demonstration transactions</span></div>' +
          (periodFilter ? '<button type="button" class="btn btn-sm" id="btn-clear-month">Clear month filter</button>' : '') +
        '</div>' +
        filterHtml +
        paymentsTableHtml +
      '</section>';

    var invMonthInput = document.getElementById('invoice-month-picker');
    invMonthInput.addEventListener('change', function (e) {
      if (e.target.value) {
        invoiceMonth = e.target.value;
        render(ctx);
      }
    });

    var form = document.getElementById('record-payment-form');
    var leaseSelect = form.elements.leaseId;
    var amountInput = form.elements.amount;

    leaseSelect.addEventListener('change', function () {
      var inv = invoiceByLeaseId[leaseSelect.value];
      if (inv) {
        amountInput.value = inv.invoiceTotal;
      } else {
        var chosen = activeLeases.find(function (l) { return l.id === leaseSelect.value; });
        if (chosen) amountInput.value = chosen.monthlyRent;
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formField.clearErrors(form);

      var payload = {
        leaseId: leaseSelect.value,
        period: form.elements.period.value,
        amount: form.elements.amount.value,
        paidOn: form.elements.paidOn.value,
        reference: form.elements.reference.value
      };

      var res = paymentService.record(payload);
      if (!res.ok) {
        if (/reference/i.test(res.error)) {
          formField.setFieldError(form, 'reference', res.error);
        } else if (/amount/i.test(res.error)) {
          formField.setFieldError(form, 'amount', res.error);
        } else if (/period/i.test(res.error)) {
          formField.setFieldError(form, 'period', res.error);
        } else {
          formField.setFormError(form, res.error);
        }
        toast.error(res.error);
        return;
      }

      toast.success('Payment recorded.');
    });

    filterBar.bind(ctx.container, function (name, value) {
      if (name === 'period') {
        periodFilter = value;
        render(ctx);
      }
    });

    var clearMonthBtn = document.getElementById('btn-clear-month');
    if (clearMonthBtn) {
      clearMonthBtn.addEventListener('click', function () {
        periodFilter = '';
        render(ctx);
      });
    }

    var clearEmptyBtn = ctx.container.querySelector('[data-clear-period]');
    if (clearEmptyBtn) {
      clearEmptyBtn.addEventListener('click', function () {
        periodFilter = '';
        render(ctx);
      });
    }
  }

  Makazi.ui.views.rentView = {
    render: render
  };
})(window);
