(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var ids = (Makazi.core && Makazi.core.ids) || (typeof require !== 'undefined' ? require('../core/ids') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var events = (Makazi.core && Makazi.core.events) || (typeof require !== 'undefined' ? require('../core/events') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});
  var unitRules = (Makazi.rules && Makazi.rules.unitRules) || (typeof require !== 'undefined' ? require('../rules/unitRules') : {});

  function resolveAreaDisplay(area, areaOther, fallbackLocation) {
    if (area === 'Other') {
      return utils.trimString(areaOther) || utils.trimString(fallbackLocation) || 'Other';
    }
    return area || utils.trimString(fallbackLocation) || 'Other';
  }

  function validatePropertyInput(input) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'Property details are required.' };
    }
    var name = utils.trimString(input.name);
    if (!name) return { ok: false, error: 'Property name is required.' };

    var validAreas = (constants.PROPERTY_AREAS || []).map(function (a) { return a.value; });
    var area = utils.trimString(input.area) || 'Other';
    if (validAreas.indexOf(area) === -1) {
      return { ok: false, error: 'Please select a valid Murang\'a area.' };
    }
    var areaOther = utils.trimString(input.areaOther);
    if (area === 'Other' && !areaOther && !utils.trimString(input.location)) {
      return { ok: false, error: 'Please specify the area name when "Other" is selected.' };
    }

    var areaLabel = resolveAreaDisplay(area, areaOther, input.location);
    var location = utils.trimString(input.location) || (areaLabel + ', Murang\'a Town (Kihara Constituency)');

    var validTypes = (constants.PROPERTY_TYPES || []).map(function (t) { return t.value; });
    if (validTypes.indexOf(input.type) === -1) {
      return { ok: false, error: 'Please select a valid property type.' };
    }

    return {
      ok: true,
      data: {
        name: name,
        area: area,
        areaOther: area === 'Other' ? (areaOther || areaLabel) : '',
        location: location,
        type: input.type
      }
    };
  }

  function list(filters) {
    var store = storage.load();
    var opts = filters || {};
    var search = utils.trimString(opts.search).toLowerCase();

    var items = store.properties.map(function (prop) {
      var propUnits = store.units.filter(function (u) { return u.propertyId === prop.id; });
      var occupied = propUnits.filter(function (u) { return u.status === 'occupied'; }).length;
      var vacant = propUnits.filter(function (u) { return u.status === 'vacant'; }).length;
      var underRenovation = propUnits.filter(function (u) { return u.status === 'under_renovation'; }).length;
      return Object.assign({}, prop, {
        areaDisplay: resolveAreaDisplay(prop.area, prop.areaOther, prop.location),
        unitCounts: {
          total: propUnits.length,
          occupied: occupied,
          vacant: vacant,
          underRenovation: underRenovation
        }
      });
    });

    if (opts.area) {
      items = items.filter(function (p) { return p.area === opts.area; });
    }
    if (search) {
      items = items.filter(function (p) {
        var typeLabel = utils.labelFromOptions(constants.PROPERTY_TYPES, p.type, p.type);
        var hay = (p.name + ' ' + p.areaDisplay + ' ' + p.location + ' ' + typeLabel).toLowerCase();
        return hay.indexOf(search) !== -1;
      });
    }

    return items;
  }

  function getById(id) {
    var store = storage.load();
    return utils.findById(store.properties, id);
  }

  function create(input) {
    var check = validatePropertyInput(input);
    if (!check.ok) return check;
    var store = storage.load();
    var now = dates.nowIso();
    var record = Object.assign({
      id: ids.nextId('prop'),
      createdAt: now,
      updatedAt: now
    }, check.data);
    store.properties.push(record);
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'property', action: 'create', id: record.id });
    return { ok: true, data: record };
  }

  function update(id, input) {
    var check = validatePropertyInput(input);
    if (!check.ok) return check;
    var store = storage.load();
    var existing = utils.findById(store.properties, id);
    if (!existing) return { ok: false, error: 'Property not found.' };
    Object.assign(existing, check.data, { updatedAt: dates.nowIso() });
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'property', action: 'update', id: existing.id });
    return { ok: true, data: existing };
  }

  function remove(id) {
    var store = storage.load();
    var existing = utils.findById(store.properties, id);
    if (!existing) return { ok: false, error: 'Property not found.' };
    var guard = unitRules.canDeleteProperty(id, store.units, store.leases);
    if (!guard.ok) return guard;
    store.properties = store.properties.filter(function (p) { return p.id !== id; });
    store.muwascoPayments = store.muwascoPayments.filter(function (m) { return m.propertyId !== id; });
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'property', action: 'delete', id: id });
    return { ok: true, data: existing };
  }

  var propertyService = {
    list: list,
    getById: getById,
    create: create,
    update: update,
    remove: remove
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.propertyService = propertyService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = propertyService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
