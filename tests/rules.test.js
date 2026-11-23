'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var leaseRules = require('../js/rules/leaseRules');
var unitRules = require('../js/rules/unitRules');
var paymentRules = require('../js/rules/paymentRules');
var depositRules = require('../js/rules/depositRules');
var waterRules = require('../js/rules/waterRules');
var dates = require('../js/core/dates');

test('BR1: lease date validation rejects end before start and equal dates', function () {
  var valid = leaseRules.validateLeaseDates('2026-01-01', '2026-12-31');
  assert.equal(valid.ok, true);

  var endBeforeStart = leaseRules.validateLeaseDates('2026-06-01', '2026-05-01');
  assert.equal(endBeforeStart.ok, false);
  assert.match(endBeforeStart.error, /later than start/i);

  var equalDates = leaseRules.validateLeaseDates('2026-06-01', '2026-06-01');
  assert.equal(equalDates.ok, false);
  assert.match(equalDates.error, /later than start/i);
});

test('BR2 & Extra: unit eligibility allows vacant and rejects occupied or under_renovation', function () {
  var vacantRes = unitRules.canLeaseUnit({ id: 'u1', unitNumber: 'A1', status: 'vacant' });
  assert.equal(vacantRes.ok, true);

  var occupiedRes = unitRules.canLeaseUnit({ id: 'u2', unitNumber: 'A2', status: 'occupied' });
  assert.equal(occupiedRes.ok, false);
  assert.match(occupiedRes.error, /occupied/i);

  var renoRes = unitRules.canLeaseUnit({ id: 'u3', unitNumber: 'A3', status: 'under_renovation' });
  assert.equal(renoRes.ok, false);
  assert.match(renoRes.error, /renovation/i);
});

test('BR6: lease term classification for 18, 24, and 36 months', function () {
  assert.equal(leaseRules.classifyLeaseTerm('2026-01-01', '2027-07-01'), 'SHORT_TERM');
  assert.equal(leaseRules.classifyLeaseTerm('2026-01-01', '2028-01-01'), 'LONG_TERM');
  assert.equal(leaseRules.classifyLeaseTerm('2026-01-01', '2029-01-01'), 'LONG_TERM');
});

test('BR5: deposit refund calculation and zero floor', function () {
  var standard = depositRules.calculateDepositRefund(30000, 8500);
  assert.equal(standard.refund, 21500);
  assert.equal(standard.shortfall, 0);

  var exceeded = depositRules.calculateDepositRefund(15000, 22000);
  assert.equal(exceeded.refund, 0);
  assert.equal(exceeded.shortfall, 7000);
});

test('BR4: duplicate payment reference detection trims whitespace and ignores case', function () {
  var existing = [
    { id: 'p1', reference: 'DEMO-REF-1001' }
  ];

  assert.equal(paymentRules.isDuplicateReference('demo-ref-1001', existing), true);
  assert.equal(paymentRules.isDuplicateReference('  DEMO-ref-1001  ', existing), true);
  assert.equal(paymentRules.isDuplicateReference('DEMO-REF-1002', existing), false);
});

test('Lease ending within 90 days check (85 days yes, 120 days no)', function () {
  var asOf = '2026-01-01';
  var lease85 = { id: 'l1', status: 'active', endDate: dates.addDays(asOf, 85) };
  var lease120 = { id: 'l2', status: 'active', endDate: dates.addDays(asOf, 120) };
  var ended85 = { id: 'l3', status: 'ended', endDate: dates.addDays(asOf, 85) };

  assert.equal(leaseRules.isEndingWithinDays(lease85, 90, asOf), true);
  assert.equal(leaseRules.isEndingWithinDays(lease120, 90, asOf), false);
  assert.equal(leaseRules.isEndingWithinDays(ended85, 90, asOf), false);
});

test('Water consumption calculation: 120 to 135 = 15 m3', function () {
  assert.equal(waterRules.calculateConsumption(120, 135), 15);
  assert.equal(waterRules.calculateConsumption(120, 120), 0);
});

test('BR7: reading lower than previous is rejected', function () {
  var invalid = waterRules.validateReading(135, 128);
  assert.equal(invalid.ok, false);
  assert.match(invalid.error, /lower than previous/i);

  var valid = waterRules.validateReading(120, 135);
  assert.equal(valid.ok, true);
  assert.equal(valid.data.consumption, 15);
});

test('BR8: second reading in the same month for the same meter is detected', function () {
  var readings = [
    { id: 'r1', meterId: 'meter_01', month: '2026-11', reading: 140 }
  ];
  assert.equal(waterRules.hasReadingForMonth('meter_01', '2026-11', readings), true);
  assert.equal(waterRules.hasReadingForMonth('meter_01', '2026-12', readings), false);
  assert.equal(waterRules.hasReadingForMonth('meter_02', '2026-11', readings), false);
});

test('Water bill calculation with rate and fixed charge, plus BR9 combined invoice', function () {
  var bill = waterRules.waterBill(15, 180, 150);
  assert.equal(bill, 2850); // 15 * 180 + 150

  var total = waterRules.invoiceTotal(6500, bill);
  assert.equal(total, 9350); // 6500 + 2850
});

test('MUWASCO payable and water margin calculation', function () {
  var payable = waterRules.muwascoPayable(45, 110);
  assert.equal(payable, 4950);

  var margin = waterRules.waterMargin(8250, payable);
  assert.equal(margin, 3300);
});

test('Leak detection flags unusual consumption above double the 3-month average', function () {
  var history = [4, 5, 6]; // average = 5, double = 10
  assert.equal(waterRules.isLeakSuspected(10, history), false); // exactly double is not > double
  assert.equal(waterRules.isLeakSuspected(11, history), true);  // > 10 triggers leak flag
  assert.equal(waterRules.isLeakSuspected(12, []), false);
});

test('BR10: duplicate MUWASCO reference detection is trimmed and case-insensitive', function () {
  var muwList = [{ id: 'm1', reference: 'MUW-DEMO-501' }];
  assert.equal(waterRules.isDuplicateReference('muw-demo-501', muwList), true);
  assert.equal(waterRules.isDuplicateReference('  MUW-demo-501 ', muwList), true);
  assert.equal(waterRules.isDuplicateReference('MUW-DEMO-502', muwList), false);
});
