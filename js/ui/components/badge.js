(function (root) {
  'use strict';

  var Makazi = root.Makazi;
  var esc = Makazi.core.escape;

  var UNIT_STATUS_MAP = {
    vacant: { label: 'Vacant', tone: 'success' },
    occupied: { label: 'Occupied', tone: 'info' },
    under_renovation: { label: 'Under renovation', tone: 'warning' }
  };

  var LEASE_STATUS_MAP = {
    active: { label: 'Active', tone: 'info' },
    ended: { label: 'Ended', tone: 'neutral' }
  };

  var LEASE_TERM_MAP = {
    SHORT_TERM: { label: 'Short-term (< 24m)', tone: 'neutral' },
    LONG_TERM: { label: 'Long-term (24m+)', tone: 'info' }
  };

  var PRIORITY_MAP = {
    low: { label: 'Low priority', tone: 'neutral' },
    medium: { label: 'Medium priority', tone: 'warning' },
    high: { label: 'High priority', tone: 'danger' }
  };

  var MAINT_STATUS_MAP = {
    open: { label: 'Open', tone: 'warning' },
    completed: { label: 'Completed', tone: 'success' }
  };

  function render(label, tone) {
    var safeTone = tone || 'neutral';
    return '<span class="badge badge-' + esc.attr(safeTone) + '">' + esc.html(label) + '</span>';
  }

  function unitStatus(status) {
    var entry = UNIT_STATUS_MAP[status] || { label: status || 'Unknown', tone: 'neutral' };
    return render(entry.label, entry.tone);
  }

  function leaseStatus(status) {
    var entry = LEASE_STATUS_MAP[status] || { label: status || 'Unknown', tone: 'neutral' };
    return render(entry.label, entry.tone);
  }

  function leaseTerm(termType) {
    var entry = LEASE_TERM_MAP[termType] || { label: termType || 'Unknown', tone: 'neutral' };
    return render(entry.label, entry.tone);
  }

  function priority(value) {
    var entry = PRIORITY_MAP[value] || { label: value || 'Unknown', tone: 'neutral' };
    return render(entry.label, entry.tone);
  }

  function maintenanceStatus(status) {
    var entry = MAINT_STATUS_MAP[status] || { label: status || 'Unknown', tone: 'neutral' };
    return render(entry.label, entry.tone);
  }

  Makazi.ui.components.badge = {
    render: render,
    unitStatus: unitStatus,
    leaseStatus: leaseStatus,
    leaseTerm: leaseTerm,
    priority: priority,
    maintenanceStatus: maintenanceStatus
  };
})(window);
