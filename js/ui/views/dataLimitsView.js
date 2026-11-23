(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var constants = Makazi.core.constants;
  var esc = Makazi.core.escape;
  var storage = Makazi.data.storage;
  var exportService = Makazi.services.exportService;
  var confirmDialog = Makazi.ui.components.confirm;
  var toast = Makazi.ui.components.toast;

  var PLANNED_FEATURES = [
    { name: 'Smart-meter gateway integration', detail: 'Automated telemetry ingestion from real digital water meters.' },
    { name: 'Official MUWASCO tariff & payment channel', detail: 'Synced official utility tariffs and verified MUWASCO billing settlement.' },
    { name: 'M-Pesa Daraja API integration', detail: 'Automated Paybill/STK Push reconciliation against combined rent + water invoices.' },
    { name: 'SMS & email alerts', detail: 'Automated reminders for rent/water due dates, leaks, and lease renewals.' },
    { name: 'User accounts & role-based access control', detail: 'Separate Landlord, Property Manager, and Caretaker sign-in sessions.' },
    { name: 'PostgreSQL relational database', detail: 'Centralized server-side storage with audit logs and backups.' },
    { name: 'Automatic monthly invoicing', detail: 'Scheduled combined rent and water statement generation.' },
    { name: 'Document storage', detail: 'Signed PDF lease agreements and tenant ID document uploads.' },
    { name: 'Unit inspection checklists', detail: 'Move-in and move-out condition photos and sign-off sheets.' },
    { name: 'Deposit escrow & ledger', detail: 'Dedicated refundable deposit accounting and itemized deduction receipts.' }
  ];

  function triggerDownload(filename, jsonString) {
    var blob = new Blob([jsonString], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function render(ctx) {
    var status = storage.getStatus();

    ctx.setHeader({
      title: 'Data & Limitations',
      subtitle: 'Offline prototype scope, browser data management, and planned production capabilities.'
    });

    var plannedRows = PLANNED_FEATURES.map(function (item) {
      return (
        '<li class="simple-list-item">' +
          '<div>' +
            '<div class="simple-list-primary">' + esc.html(item.name) + '</div>' +
            '<div class="simple-list-secondary">' + esc.html(item.detail) + '</div>' +
          '</div>' +
          '<span class="badge badge-neutral">Planned (Not implemented)</span>' +
        '</li>'
      );
    }).join('');

    ctx.container.innerHTML =
      '<section class="notice-box is-warning" role="note">' +
        '<p><strong>Coursework Prototype Notice:</strong> Makazi is a university SDLC offline browser prototype (Murang\'a University of Technology, BSc Information Technology). ' +
        'This prototype does not connect to real digital meters, MUWASCO systems, M-Pesa or SMS. Meter readings are simulated or entered by hand, and tariffs are sample figures.</p>' +
        '<p style="margin-top:8px;">All data stays inside this browser using localStorage (<span class="mono">' + esc.html(status.key) + '</span>). It is not encrypted or shared across devices, and must NOT be used for real personal or financial information. ' +
        '<strong>' + esc.html(constants.SAMPLE_DATA_NOTE) + '</strong></p>' +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Backup &amp; sample data controls</h2><span class="text-small text-muted">Export your browser dataset as JSON or restore the synthetic Murang\'a sample dataset</span></div></div>' +
        '<div style="display:flex; flex-wrap:wrap; gap:12px;">' +
          '<button type="button" class="btn btn-primary" id="btn-export-json">Export JSON backup</button>' +
          '<button type="button" class="btn btn-danger" id="btn-reset-sample">Reset to sample data</button>' +
        '</div>' +
        '<p class="text-small text-muted">' +
          (status.usingMemoryFallback
            ? 'Browser localStorage is blocked or unavailable; changes are held in temporary memory for this session only.'
            : 'Storage mode: browser localStorage active on this device.') +
        '</p>' +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-header"><div class="panel-title-wrap"><h2>Planned for production</h2><span class="text-small text-muted">Features intentionally outside the offline prototype scope</span></div></div>' +
        '<ul class="simple-list">' + plannedRows + '</ul>' +
      '</section>';

    document.getElementById('btn-export-json').addEventListener('click', function () {
      var res = exportService.exportJsonPayload();
      if (!res.ok) {
        toast.error(res.error || 'Failed to export JSON.');
        return;
      }
      triggerDownload(res.data.filename, res.data.json);
      toast.success('Exported ' + res.data.filename + '.');
    });

    document.getElementById('btn-reset-sample').addEventListener('click', function () {
      confirmDialog.open({
        title: 'Reset to sample data',
        message: 'Replace all current browser records with the synthetic Murang\'a sample dataset? This cannot be undone.',
        confirmLabel: 'Reset data',
        danger: true,
        onConfirm: function () {
          var res = exportService.resetToSampleData();
          if (!res.ok) {
            toast.error(res.error || 'Reset failed.');
            return;
          }
          toast.success('Sample data restored.');
        }
      });
    });
  }

  Makazi.ui.views.dataLimitsView = {
    render: render
  };
})(window);
