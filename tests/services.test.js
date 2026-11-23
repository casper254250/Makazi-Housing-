'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var fakeStorageHelper = require('./helpers/fakeStorage');
var storage = require('../js/data/storage');
var propertyService = require('../js/services/propertyService');
var unitService = require('../js/services/unitService');
var tenantService = require('../js/services/tenantService');
var leaseService = require('../js/services/leaseService');
var paymentService = require('../js/services/paymentService');
var maintenanceService = require('../js/services/maintenanceService');
var waterService = require('../js/services/waterService');

function setupFreshStore() {
  var fake = fakeStorageHelper.createFakeStorage();
  storage.setAdapter(fake);
  storage.reset('2026-11-17');
  return fake;
}

test('Creating a lease sets unit occupied and rejects second lease on same unit', function () {
  setupFreshStore();

  var vacantUnit = unitService.listVacant()[0];
  assert.ok(vacantUnit, 'Expected a vacant unit in sample data');

  var tenants = tenantService.list();
  var tenant = tenants[20];

  var leaseRes = leaseService.create({
    unitId: vacantUnit.id,
    tenantId: tenant.id,
    startDate: '2026-11-01',
    endDate: '2027-11-01',
    monthlyRent: vacantUnit.monthlyRent,
    deposit: vacantUnit.monthlyRent
  });

  assert.equal(leaseRes.ok, true);
  assert.equal(leaseRes.data.termType, 'SHORT_TERM');

  var updatedUnit = unitService.getById(vacantUnit.id);
  assert.equal(updatedUnit.status, 'occupied');

  var secondAttempt = leaseService.create({
    unitId: vacantUnit.id,
    tenantId: tenant.id,
    startDate: '2026-11-05',
    endDate: '2027-11-05',
    monthlyRent: vacantUnit.monthlyRent,
    deposit: vacantUnit.monthlyRent
  });

  assert.equal(secondAttempt.ok, false);
  assert.match(secondAttempt.error, /occupied/i);
});

test('Ending a lease frees the unit back to vacant', function () {
  setupFreshStore();

  var activeLeases = leaseService.list({ status: 'active' });
  assert.ok(activeLeases.length > 0);

  var target = activeLeases[0];
  var endRes = leaseService.endLease(target.id);
  assert.equal(endRes.ok, true);
  assert.equal(endRes.data.status, 'ended');

  var freedUnit = unitService.getById(target.unitId);
  assert.equal(freedUnit.status, 'vacant');
});

test('Duplicate payment reference is rejected (case-insensitive, trimmed)', function () {
  setupFreshStore();

  var activeLease = leaseService.list({ status: 'active' })[0];

  var first = paymentService.record({
    leaseId: activeLease.id,
    period: '2026-11',
    amount: 7000,
    paidOn: '2026-11-10',
    reference: 'DEMO-TEST-9001'
  });
  assert.equal(first.ok, true);

  var duplicate = paymentService.record({
    leaseId: activeLease.id,
    period: '2026-11',
    amount: 7000,
    paidOn: '2026-11-11',
    reference: '  demo-test-9001  '
  });
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.error, /already been recorded/i);
});

test('Deleting a property or unit with linked leases is blocked with a clear message', function () {
  setupFreshStore();

  var activeLease = leaseService.list({ status: 'active' })[0];
  var occupiedUnit = unitService.getById(activeLease.unitId);

  var delUnitRes = unitService.remove(occupiedUnit.id);
  assert.equal(delUnitRes.ok, false);
  assert.match(delUnitRes.error, /lease/i);

  var delPropRes = propertyService.remove(occupiedUnit.propertyId);
  assert.equal(delPropRes.ok, false);
  assert.match(delPropRes.error, /lease/i);
});

test('Maintenance request creation and completion workflow', function () {
  setupFreshStore();

  var unit = unitService.list()[0];
  var created = maintenanceService.create({
    unitId: unit.id,
    title: 'Broken door handle',
    description: 'Front lock handle needs tightening.',
    priority: 'medium',
    reportedOn: '2026-11-15'
  });
  assert.equal(created.ok, true);
  assert.equal(created.data.status, 'open');

  var completed = maintenanceService.markComplete(created.data.id, '2026-11-17');
  assert.equal(completed.ok, true);
  assert.equal(completed.data.status, 'completed');
  assert.equal(completed.data.completedOn, '2026-11-17');
});

test('Water reading enforces BR7 (not lower than previous) and BR8 (one per meter per month)', function () {
  setupFreshStore();

  var meters = waterService.listMetersWithReadings('2026-11');
  // Pick a digital occupied meter without a 2026-11 reading yet
  var target = meters.find(function (m) { return m.meterType === 'digital' && m.unitStatus === 'occupied' && m.currentReading === null; });
  assert.ok(target, 'Expected digital occupied meter awaiting 2026-11 reading');

  var lowerRes = waterService.recordManualReading({
    meterId: target.meterId,
    month: '2026-11',
    reading: target.previousReading - 1,
    readOn: '2026-11-17'
  });
  assert.equal(lowerRes.ok, false);
  assert.match(lowerRes.error, /lower than previous/i);

  var okRes = waterService.recordManualReading({
    meterId: target.meterId,
    month: '2026-11',
    reading: target.previousReading + 5,
    readOn: '2026-11-17'
  });
  assert.equal(okRes.ok, true);

  var secondSameMonth = waterService.recordManualReading({
    meterId: target.meterId,
    month: '2026-11',
    reading: target.previousReading + 7,
    readOn: '2026-11-18'
  });
  assert.equal(secondSameMonth.ok, false);
  assert.match(secondSameMonth.error, /already been recorded/i);
});

test('Digital meter simulation creates readings and updates combined rent + water invoice', function () {
  setupFreshStore();

  var simRes = waterService.simulateDigitalReadings('2026-11', '2026-11-17');
  assert.equal(simRes.ok, true);
  assert.ok(simRes.data.count > 0);

  var invoices = paymentService.listMonthlyInvoices('2026-11');
  assert.equal(invoices.length, 20);
  invoices.forEach(function (inv) {
    assert.equal(inv.invoiceTotal, inv.rentAmount + inv.waterAmount);
  });
});

test('MUWASCO payment enforces BR10 unique reference and updates property balance', function () {
  setupFreshStore();

  var props = propertyService.list();
  var first = waterService.recordMuwascoPayment({
    propertyId: props[0].id,
    month: '2026-11',
    paidOn: '2026-11-17',
    amount: 1500,
    reference: 'MUW-TEST-77'
  });
  assert.equal(first.ok, true);

  var dup = waterService.recordMuwascoPayment({
    propertyId: props[0].id,
    month: '2026-11',
    paidOn: '2026-11-17',
    amount: 1500,
    reference: '  muw-test-77  '
  });
  assert.equal(dup.ok, false);
  assert.match(dup.error, /already been recorded/i);
});

test('Properties span all 9 Murang\'a Town areas and filter cleanly by area and search', function () {
  setupFreshStore();

  var allProps = propertyService.list();
  var expectedAreas = ['Mumbi', 'Mukuyu', 'Township', 'Mjini', 'Kwa Maji', 'VM', 'Mwangaza', 'Frankfort', 'Kabati'];
  expectedAreas.forEach(function (area) {
    assert.ok(allProps.some(function (p) { return p.area === area; }), 'Expected property in area ' + area);
    var filtered = propertyService.list({ area: area });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].area, area);
  });

  var searchProps = propertyService.list({ search: 'Kwa Maji' });
  assert.equal(searchProps.length, 1);
  assert.equal(searchProps[0].name, 'Kwa Maji Gardens');
});

