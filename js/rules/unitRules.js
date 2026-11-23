(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var money = (Makazi.core && Makazi.core.money) || (typeof require !== 'undefined' ? require('../core/money') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});

  function canLeaseUnit(unit) {
    if (!unit) {
      return { ok: false, error: 'Selected unit was not found.' };
    }
    if (unit.status === 'occupied') {
      return { ok: false, error: 'Unit ' + unit.unitNumber + ' is already occupied and cannot receive a new lease.' };
    }
    if (unit.status === 'under_renovation') {
      return { ok: false, error: 'Unit ' + unit.unitNumber + ' is under renovation and cannot be leased.' };
    }
    if (unit.status !== 'vacant') {
      return { ok: false, error: 'Only a vacant unit can receive a new lease.' };
    }
    return { ok: true };
  }

  function needsRenovation(unit, asOfDate) {
    if (!unit) return false;
    if (unit.status === 'under_renovation') return true;
    if (!unit.lastRenovated || !dates.isValidIsoDate(unit.lastRenovated)) return false;
    var ref = dates.isValidIsoDate(asOfDate) ? asOfDate : dates.today();
    var threshold = constants.RENOVATION_THRESHOLD_YEARS || 3;
    return dates.yearsBetween(unit.lastRenovated, ref) > threshold;
  }

  function validateUnitInput(input) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'Unit details are required.' };
    }
    if (!utils.isNonEmptyString(input.propertyId)) {
      return { ok: false, error: 'Please select a property for this unit.' };
    }
    if (!utils.isNonEmptyString(input.unitNumber)) {
      return { ok: false, error: 'Unit number is required.' };
    }
    var validTypes = (constants.UNIT_TYPES || []).map(function (t) { return t.value; });
    if (validTypes.indexOf(input.type) === -1) {
      return { ok: false, error: 'Please select a valid unit type.' };
    }
    var rent = money.toAmount(input.monthlyRent);
    if (isNaN(rent) || rent <= 0) {
      return { ok: false, error: 'Monthly rent must be a positive amount in KES.' };
    }
    var validStatuses = ['vacant', 'occupied', 'under_renovation'];
    var status = input.status || 'vacant';
    if (validStatuses.indexOf(status) === -1) {
      return { ok: false, error: 'Please select a valid unit status.' };
    }
    var lastRenovated = utils.trimString(input.lastRenovated) || null;
    if (lastRenovated !== null && !dates.isValidIsoDate(lastRenovated)) {
      return { ok: false, error: 'Last renovated date must be YYYY-MM-DD.' };
    }
    return {
      ok: true,
      data: {
        propertyId: utils.trimString(input.propertyId),
        unitNumber: utils.trimString(input.unitNumber),
        type: input.type,
        monthlyRent: rent,
        status: status,
        lastRenovated: lastRenovated,
        notes: utils.trimString(input.notes)
      }
    };
  }

  function canDeleteUnit(unitId, leases) {
    var linked = (leases || []).filter(function (lease) {
      return lease && lease.unitId === unitId;
    });
    if (linked.length > 0) {
      return {
        ok: false,
        error: 'Cannot delete unit because it has ' + linked.length + ' linked lease record(s).'
      };
    }
    return { ok: true };
  }

  function canDeleteProperty(propertyId, units, leases) {
    var propUnits = (units || []).filter(function (u) {
      return u && u.propertyId === propertyId;
    });
    if (propUnits.length === 0) {
      return { ok: true };
    }
    var unitIds = {};
    for (var i = 0; i < propUnits.length; i++) {
      unitIds[propUnits[i].id] = true;
    }
    var linkedLeases = (leases || []).filter(function (lease) {
      return lease && unitIds[lease.unitId];
    });
    if (linkedLeases.length > 0) {
      return {
        ok: false,
        error: 'Cannot delete property because its units have ' + linkedLeases.length + ' linked lease record(s).'
      };
    }
    return {
      ok: false,
      error: 'Cannot delete property while it still has ' + propUnits.length + ' unit(s). Delete the units first.'
    };
  }

  var unitRules = {
    canLeaseUnit: canLeaseUnit,
    needsRenovation: needsRenovation,
    validateUnitInput: validateUnitInput,
    canDeleteUnit: canDeleteUnit,
    canDeleteProperty: canDeleteProperty
  };

  Makazi.rules = Makazi.rules || {};
  Makazi.rules.unitRules = unitRules;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = unitRules;
  }
})(typeof window !== 'undefined' ? window : globalThis);
