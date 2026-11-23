(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});

  var VALID_PRIORITIES = ['low', 'medium', 'high'];

  function validateMaintenanceInput(input, unit) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'Maintenance request details are required.' };
    }
    if (!unit) {
      return { ok: false, error: 'Please select a valid unit.' };
    }
    if (!utils.isNonEmptyString(input.title)) {
      return { ok: false, error: 'Issue title is required.' };
    }
    var priority = input.priority || 'medium';
    if (VALID_PRIORITIES.indexOf(priority) === -1) {
      return { ok: false, error: 'Priority must be low, medium, or high.' };
    }
    var reportedOn = utils.trimString(input.reportedOn) || dates.today();
    if (!dates.isValidIsoDate(reportedOn)) {
      return { ok: false, error: 'Reported date must be a valid YYYY-MM-DD date.' };
    }
    return {
      ok: true,
      data: {
        unitId: unit.id,
        title: utils.trimString(input.title),
        description: utils.trimString(input.description),
        priority: priority,
        reportedOn: reportedOn
      }
    };
  }

  function canMarkComplete(request) {
    if (!request) {
      return { ok: false, error: 'Maintenance request not found.' };
    }
    if (request.status === 'completed') {
      return { ok: false, error: 'Maintenance request is already marked completed.' };
    }
    return { ok: true };
  }

  var maintenanceRules = {
    validateMaintenanceInput: validateMaintenanceInput,
    canMarkComplete: canMarkComplete
  };

  Makazi.rules = Makazi.rules || {};
  Makazi.rules.maintenanceRules = maintenanceRules;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = maintenanceRules;
  }
})(typeof window !== 'undefined' ? window : globalThis);
