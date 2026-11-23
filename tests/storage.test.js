'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var fakeStorageHelper = require('./helpers/fakeStorage');
var storage = require('../js/data/storage');

test('Storage saves and loads store payloads cleanly', function () {
  var fake = fakeStorageHelper.createFakeStorage();
  storage.setAdapter(fake);

  var loadedInitial = storage.load();
  assert.equal(loadedInitial.properties.length, 9);
  assert.equal(loadedInitial.units.length, 40);
  assert.equal(loadedInitial.waterMeters.length, 40);
  assert.equal(loadedInitial.leases.length, 20);

  loadedInitial.properties.push({
    id: 'prop_extra',
    name: 'Kiharu New Block',
    area: 'Other',
    areaOther: 'Kiharu',
    location: 'Kiharu, Murang\'a Town',
    type: 'apartments',
    createdAt: '2026-11-17T00:00:00.000Z',
    updatedAt: '2026-11-17T00:00:00.000Z'
  });

  var saveRes = storage.save(loadedInitial);
  assert.equal(saveRes.ok, true);

  var reloaded = storage.load();
  assert.equal(reloaded.properties.length, 10);
  assert.equal(reloaded.properties[9].name, 'Kiharu New Block');
});

test('Storage reset restores synthetic Murang\'a sample data', function () {
  var fake = fakeStorageHelper.createFakeStorage();
  storage.setAdapter(fake);

  var data = storage.load();
  data.properties = [];
  storage.save(data);
  assert.equal(storage.load().properties.length, 0);

  var resetRes = storage.reset('2026-11-17');
  assert.equal(resetRes.ok, true);
  assert.equal(storage.load().properties.length, 9);
  assert.equal(storage.load().units.length, 40);
  assert.equal(storage.load().tenants.length, 25);
});

test('Corrupted JSON in storage falls back safely to sample data', function () {
  var fake = fakeStorageHelper.createFakeStorage({
    'makazi.v1': '{corrupted_json: [1, 2, '
  });
  storage.setAdapter(fake);

  var recovered = storage.load();
  assert.equal(recovered.properties.length, 9);
  assert.equal(recovered.units.length, 40);
  assert.equal(recovered.leases.length, 20);

  var status = storage.getStatus();
  assert.match(status.lastWarning, /corrupted/i);
});

test('Untouched legacy v1 sample store upgrades to 9 Murang\'a area properties', function () {
  var legacyV1Sample = {
    version: 1,
    properties: [
      { id: 'prop_kiharu', name: 'Kiharu Ridge Apartments', location: 'Kiharu', type: 'apartments', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'prop_mukuyu', name: 'Mukuyu Court Bedsitters', location: 'Mukuyu', type: 'bedsitters', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    ],
    units: [],
    tenants: [],
    leases: [],
    payments: [],
    maintenanceRequests: []
  };

  var fake = fakeStorageHelper.createFakeStorage({
    'makazi.v1': JSON.stringify(legacyV1Sample)
  });
  storage.setAdapter(fake);

  var upgraded = storage.load();
  assert.equal(upgraded.version, 2);
  assert.equal(upgraded.properties.length, 9);

  var areas = upgraded.properties.map(function (p) { return p.area; });
  ['Mumbi', 'Mukuyu', 'Township', 'Mjini', 'Kwa Maji', 'VM', 'Mwangaza', 'Frankfort', 'Kabati'].forEach(function (area) {
    assert.ok(areas.indexOf(area) !== -1, 'Expected upgraded sample data to include area ' + area);
  });
});

test('Custom legacy v1 store preserves custom properties during v2 migration', function () {
  var customV1 = {
    version: 1,
    properties: [
      { id: 'prop_custom_1', name: 'Custom Murang\'a Block', location: 'Maragi', type: 'apartments', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    ],
    units: [],
    tenants: [],
    leases: [],
    payments: [],
    maintenanceRequests: []
  };

  var fake = fakeStorageHelper.createFakeStorage({
    'makazi.v1': JSON.stringify(customV1)
  });
  storage.setAdapter(fake);

  var migrated = storage.load();
  assert.equal(migrated.version, 2);
  assert.equal(migrated.properties.length, 1);
  assert.equal(migrated.properties[0].id, 'prop_custom_1');
  assert.equal(migrated.properties[0].area, 'Other');
});

