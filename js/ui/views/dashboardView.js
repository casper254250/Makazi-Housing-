(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var constants = Makazi.core.constants;
  var esc = Makazi.core.escape;
  var money = Makazi.core.money;
  var dashboardService = Makazi.services.dashboardService;
  var statCard = Makazi.ui.components.statCard;
  var badge = Makazi.ui.components.badge;
  var emptyState = Makazi.ui.components.emptyState;

  function render(ctx) {
    var summary = dashboardService.getSummary();
    var s = summary.stats;

    ctx.setHeader({
      title: 'Dashboard',
      subtitle: 'Murang\'a Town (Kihara Constituency) portfolio summary. ' + constants.SAMPLE_DATA_NOTE,
      actionsHtml:
        '<button type="button" class="btn btn-primary" data-nav-target="leases">New lease</button>' +
        '<button type="button" class="btn" data-nav-target="water">Water &amp; Meters</button>' +
        '<button type="button" class="btn" data-nav-target="rent">Record payment</button>'
    });

    var statsHtml =
      '<section class="stat-grid" aria-label="Portfolio key metrics">' +
        statCard.render({ label: 'Total units', value: s.totalUnits }) +
        statCard.render({ label: 'Occupied / Vacant', value: s.occupiedUnits + ' / ' + s.vacantUnits, note: s.underRenovationUnits + ' under renovation' }) +
        statCard.render({ label: 'Occupancy rate', value: s.occupancyPct + '%', note: s.activeLeases + ' active leases' }) +
        statCard.render({ label: 'Rent+Water collected (' + s.currentMonth + ')', value: money.formatKES(s.rentCollectedThisMonth) }) +
        statCard.render({ label: 'Water consumed (' + s.currentMonth + ')', value: s.waterConsumedThisMonth + ' m3' }) +
        statCard.render({ label: 'Water billed (' + s.currentMonth + ')', value: money.formatKES(s.waterBilledThisMonth), note: 'Collected: ' + money.formatKES(s.waterCollectedThisMonth) }) +
        statCard.render({ label: 'MUWASCO balance owed', value: money.formatKES(s.muwascoBalanceOwed) }) +
        statCard.render({ label: 'Student vs Community occupied', value: s.studentOccupied + ' / ' + s.communityOccupied, note: s.openRepairs + ' open repairs' }) +
      '</section>';

    var expiringHtml = '';
    if (summary.endingWithin90.length === 0) {
      expiringHtml = emptyState.render({
        title: 'No leases ending within 90 days',
        description: 'All active leases have more than 90 days remaining.',
        actionLabel: 'View all leases',
        actionAttr: 'data-nav-target="leases"'
      });
    } else {
      expiringHtml =
        '<ul class="simple-list">' +
          summary.endingWithin90.map(function (lease) {
            return (
              '<li class="simple-list-item">' +
                '<div>' +
                  '<div class="simple-list-primary">' + esc.html(lease.propertyName) + ' — Unit ' + esc.html(lease.unitNumber) + '</div>' +
                  '<div class="simple-list-secondary">' + esc.html(lease.tenantName) + ' · Ends ' + esc.html(lease.endDate) + '</div>' +
                '</div>' +
                '<div>' +
                  badge.render(lease.daysRemaining + ' days left', lease.daysRemaining <= 60 ? 'warning' : 'info') +
                '</div>' +
              '</li>'
            );
          }).join('') +
        '</ul>';
    }

    var vacantHtml = '';
    if (summary.vacantUnits.length === 0) {
      vacantHtml = emptyState.render({
        title: 'No vacant units right now',
        description: 'All units are currently occupied or undergoing renovation.',
        actionLabel: 'Manage units',
        actionAttr: 'data-nav-target="units"'
      });
    } else {
      vacantHtml =
        '<ul class="simple-list">' +
          summary.vacantUnits.slice(0, 8).map(function (unit) {
            return (
              '<li class="simple-list-item">' +
                '<div>' +
                  '<div class="simple-list-primary">' + esc.html(unit.propertyName) + ' — Unit ' + esc.html(unit.unitNumber) + '</div>' +
                  '<div class="simple-list-secondary">' + esc.html(unit.type) + ' · ' + esc.html(money.formatKES(unit.monthlyRent)) + '/mo</div>' +
                '</div>' +
                '<button type="button" class="btn btn-sm" data-lease-unit="' + esc.attr(unit.id) + '">Create lease</button>' +
              '</li>'
            );
          }).join('') +
        '</ul>';
    }

    var paymentsHtml = '';
    if (summary.recentPayments.length === 0) {
      paymentsHtml = emptyState.render({
        title: 'No payments recorded yet',
        description: 'Recorded rent and water payments will appear here.',
        actionLabel: 'Record payment',
        actionAttr: 'data-nav-target="rent"'
      });
    } else {
      paymentsHtml =
        '<ul class="simple-list">' +
          summary.recentPayments.map(function (pay) {
            return (
              '<li class="simple-list-item">' +
                '<div>' +
                  '<div class="simple-list-primary">' + esc.html(pay.tenantName) + ' · Unit ' + esc.html(pay.unitNumber) + '</div>' +
                  '<div class="simple-list-secondary">' + esc.html(pay.paidOn) + ' · Period ' + esc.html(pay.period) + ' · Ref: <span class="mono">' + esc.html(pay.reference) + '</span></div>' +
                '</div>' +
                '<div class="tabular-nums" style="font-weight:700;">' + esc.html(money.formatKES(pay.amount)) + '</div>' +
              '</li>'
            );
          }).join('') +
        '</ul>';
    }

    ctx.container.innerHTML =
      statsHtml +
      '<div class="grid-2">' +
        '<section class="panel">' +
          '<div class="panel-header">' +
            '<div class="panel-title-wrap"><h2>Leases ending within 90 days</h2><span class="text-small text-muted">Active agreements requiring renewal follow-up</span></div>' +
            '<a href="#leases" class="text-small">View leases</a>' +
          '</div>' +
          expiringHtml +
        '</section>' +
        '<section class="panel">' +
          '<div class="panel-header">' +
            '<div class="panel-title-wrap"><h2>Vacant units (' + s.vacantUnits + ')</h2><span class="text-small text-muted">Ready for lease assignment</span></div>' +
            '<a href="#units" class="text-small">All units</a>' +
          '</div>' +
          vacantHtml +
        '</section>' +
      '</div>' +
      '<section class="panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title-wrap"><h2>Recent payments</h2><span class="text-small text-muted">Manual demonstration entries against rent + water invoices</span></div>' +
          '<a href="#rent" class="text-small">Rent ledger</a>' +
        '</div>' +
        paymentsHtml +
      '</section>';

    var navBtns = ctx.container.querySelectorAll('[data-nav-target]');
    for (var i = 0; i < navBtns.length; i++) {
      navBtns[i].addEventListener('click', function (e) {
        Makazi.ui.router.navigate(e.currentTarget.getAttribute('data-nav-target'));
      });
    }

    var headerNavBtns = document.querySelectorAll('#page-actions [data-nav-target]');
    for (var h = 0; h < headerNavBtns.length; h++) {
      headerNavBtns[h].addEventListener('click', function (e) {
        Makazi.ui.router.navigate(e.currentTarget.getAttribute('data-nav-target'));
      });
    }

    var leaseBtns = ctx.container.querySelectorAll('[data-lease-unit]');
    for (var j = 0; j < leaseBtns.length; j++) {
      leaseBtns[j].addEventListener('click', function (e) {
        Makazi.ui.state = Makazi.ui.state || {};
        Makazi.ui.state.preselectLeaseUnitId = e.currentTarget.getAttribute('data-lease-unit');
        Makazi.ui.router.navigate('leases');
      });
    }
  }

  Makazi.ui.views.dashboardView = {
    render: render
  };
})(window);
