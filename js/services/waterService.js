(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});
  var ids = (Makazi.core && Makazi.core.ids) || (typeof require !== 'undefined' ? require('../core/ids') : {});
  var utils = (Makazi.core && Makazi.core.utils) || (typeof require !== 'undefined' ? require('../core/utils') : {});
  var events = (Makazi.core && Makazi.core.events) || (typeof require !== 'undefined' ? require('../core/events') : {});
  var storage = (Makazi.data && Makazi.data.storage) || (typeof require !== 'undefined' ? require('../data/storage') : {});
  var waterRules = (Makazi.rules && Makazi.rules.waterRules) || (typeof require !== 'undefined' ? require('../rules/waterRules') : {});

  function getSortedReadingsForMeter(meterId, readings) {
    return (readings || [])
      .filter(function (r) { return r.meterId === meterId; })
      .sort(function (a, b) {
        if (a.month < b.month) return -1;
        if (a.month > b.month) return 1;
        return 0;
      });
  }

  function getPreviousReadingValue(meter, meterReadings, beforeMonth) {
    var sorted = meterReadings || [];
    var prevVal = Number(meter.startingReading || 0);
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].month < beforeMonth) {
        prevVal = Number(sorted[i].reading);
      }
    }
    return prevVal;
  }

  function getPriorConsumptions(meter, meterReadings, beforeMonth, limit) {
    var sorted = meterReadings || [];
    var prior = [];
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].month >= beforeMonth) break;
      var prev = i === 0 ? Number(meter.startingReading || 0) : Number(sorted[i - 1].reading);
      var cons = waterRules.calculateConsumption(prev, sorted[i].reading);
      if (!isNaN(cons) && cons >= 0) prior.push(cons);
    }
    var count = limit || 3;
    return prior.slice(Math.max(0, prior.length - count));
  }

  function getTariffSettings() {
    var store = storage.load();
    return Object.assign({}, store.tariffSettings);
  }

  function updateTariffSettings(input) {
    var check = waterRules.validateTariffSettings(input);
    if (!check.ok) return check;
    var store = storage.load();
    store.tariffSettings = Object.assign({}, check.data, { updatedAt: dates.nowIso() });
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'tariffs', action: 'update' });
    return { ok: true, data: store.tariffSettings };
  }

  function listMetersWithReadings(targetMonth, filters) {
    var store = storage.load();
    var month = dates.isValidYearMonth(targetMonth) ? targetMonth : dates.currentMonth();
    var opts = filters || {};
    var tariffs = store.tariffSettings;

    return store.waterMeters.map(function (meter) {
      var unit = utils.findById(store.units, meter.unitId);
      var prop = unit ? utils.findById(store.properties, unit.propertyId) : null;
      var activeLease = unit
        ? store.leases.find(function (l) { return l.unitId === unit.id && l.status === 'active'; })
        : null;
      var tenant = activeLease ? utils.findById(store.tenants, activeLease.tenantId) : null;

      var sortedReadings = getSortedReadingsForMeter(meter.id, store.waterReadings);
      var monthReading = sortedReadings.find(function (r) { return r.month === month; }) || null;
      var prevReadingValue = getPreviousReadingValue(meter, sortedReadings, month);
      var priorHistory = getPriorConsumptions(meter, sortedReadings, month, 3);
      var avgHistory = priorHistory.length > 0
        ? Math.round((priorHistory.reduce(function (s, n) { return s + n; }, 0) / priorHistory.length) * 10) / 10
        : 0;

      var consumption = monthReading
        ? waterRules.calculateConsumption(prevReadingValue, monthReading.reading)
        : null;
      var bill = monthReading && consumption !== null && !isNaN(consumption) && unit && unit.status === 'occupied'
        ? waterRules.waterBill(consumption, tariffs.tenantRatePerM3, tariffs.tenantFixedCharge)
        : 0;
      var leakSuspected = monthReading && consumption !== null && !isNaN(consumption)
        ? waterRules.isLeakSuspected(consumption, priorHistory)
        : false;

      return {
        meterId: meter.id,
        meterNumber: meter.meterNumber,
        meterType: meter.type,
        startingReading: meter.startingReading,
        unitId: unit ? unit.id : null,
        unitNumber: unit ? unit.unitNumber : 'Unknown',
        unitStatus: unit ? unit.status : 'vacant',
        propertyId: prop ? prop.id : null,
        propertyName: prop ? prop.name : 'Unknown',
        tenantName: tenant ? tenant.fullName : null,
        leaseId: activeLease ? activeLease.id : null,
        month: month,
        previousReading: prevReadingValue,
        currentReading: monthReading ? monthReading.reading : null,
        readOn: monthReading ? monthReading.readOn : null,
        source: monthReading ? monthReading.source : null,
        consumption: consumption,
        waterBill: bill,
        threeMonthAvg: avgHistory,
        leakSuspected: leakSuspected
      };
    }).filter(function (row) {
      if (opts.propertyId && row.propertyId !== opts.propertyId) return false;
      if (opts.meterType && row.meterType !== opts.meterType) return false;
      if (opts.onlyLeaks && !row.leakSuspected) return false;
      return true;
    });
  }

  function recordManualReading(input) {
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'Reading details are required.' };
    }
    var store = storage.load();
    var meter = utils.findById(store.waterMeters, input.meterId);
    if (!meter) return { ok: false, error: 'Please select a valid water meter.' };

    var month = utils.trimString(input.month);
    if (!dates.isValidYearMonth(month)) {
      return { ok: false, error: 'Reading month must be in YYYY-MM format.' };
    }

    if (waterRules.hasReadingForMonth(meter.id, month, store.waterReadings)) {
      return { ok: false, error: 'A reading for meter ' + meter.meterNumber + ' in ' + month + ' has already been recorded.' };
    }

    var sortedReadings = getSortedReadingsForMeter(meter.id, store.waterReadings);
    var prevVal = getPreviousReadingValue(meter, sortedReadings, month);
    var readCheck = waterRules.validateReading(prevVal, input.reading);
    if (!readCheck.ok) return readCheck;

    // Also guard against inserting a reading higher than an already-recorded future month
    var nextReading = sortedReadings.find(function (r) { return r.month > month; });
    if (nextReading && readCheck.data.current > Number(nextReading.reading)) {
      return {
        ok: false,
        error: 'Reading (' + readCheck.data.current + ' m3) cannot exceed later month reading (' + nextReading.reading + ' m3).'
      };
    }

    var readOn = utils.trimString(input.readOn) || dates.today();
    if (!dates.isValidIsoDate(readOn)) {
      return { ok: false, error: 'Read date must be a valid YYYY-MM-DD date.' };
    }

    var now = dates.nowIso();
    var record = {
      id: ids.nextId('wread'),
      meterId: meter.id,
      month: month,
      reading: readCheck.data.current,
      readOn: readOn,
      source: (constants.READING_SOURCES && constants.READING_SOURCES.MANUAL_ENTRY) || 'Manual entry',
      createdAt: now,
      updatedAt: now
    };

    store.waterReadings.push(record);
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'waterReading', action: 'create', id: record.id });
    return { ok: true, data: record };
  }

  function simulateDigitalReadings(monthInput, readOnInput) {
    var month = dates.isValidYearMonth(monthInput) ? monthInput : dates.currentMonth();
    var readOn = dates.isValidIsoDate(readOnInput) ? readOnInput : dates.today();
    var store = storage.load();
    var now = dates.nowIso();
    var created = [];

    store.waterMeters.forEach(function (meter, idx) {
      if (meter.type !== 'digital') return;
      var unit = utils.findById(store.units, meter.unitId);
      if (!unit || unit.status !== 'occupied') return;
      if (waterRules.hasReadingForMonth(meter.id, month, store.waterReadings)) return;

      var sorted = getSortedReadingsForMeter(meter.id, store.waterReadings);
      var prevVal = getPreviousReadingValue(meter, sorted, month);
      var isStudent = unit.type === 'bedsitter' || unit.type === 'single_room';
      var delta = isStudent ? (3 + (idx % 4)) : (6 + (idx % 5));
      var nextVal = Math.round((prevVal + delta) * 100) / 100;

      // Ensure simulated value doesn't exceed a future reading if user simulates a past month
      var futureReading = sorted.find(function (r) { return r.month > month; });
      if (futureReading && nextVal > Number(futureReading.reading)) {
        nextVal = Number(futureReading.reading);
      }

      var rec = {
        id: ids.nextId('wread'),
        meterId: meter.id,
        month: month,
        reading: nextVal,
        readOn: readOn,
        source: (constants.READING_SOURCES && constants.READING_SOURCES.DIGITAL_SIMULATED) || 'Digital meter (simulated)',
        createdAt: now,
        updatedAt: now
      };
      store.waterReadings.push(rec);
      created.push(rec);
    });

    if (created.length === 0) {
      return { ok: false, error: 'All digital meters on occupied units already have readings for ' + month + '.' };
    }

    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'waterReading', action: 'simulate', month: month, count: created.length });
    return { ok: true, data: { month: month, count: created.length, readings: created } };
  }

  function recordMuwascoPayment(input) {
    var store = storage.load();
    var property = utils.findById(store.properties, input && input.propertyId);
    var check = waterRules.validateMuwascoPaymentInput(input, property, store.muwascoPayments);
    if (!check.ok) return check;

    var now = dates.nowIso();
    var record = Object.assign({
      id: ids.nextId('muw'),
      createdAt: now,
      updatedAt: now
    }, check.data);

    store.muwascoPayments.push(record);
    var saved = storage.save(store);
    if (!saved.ok) return saved;
    events.emit('data:changed', { entity: 'muwascoPayment', action: 'create', id: record.id });
    return { ok: true, data: record };
  }

  function listMuwascoPayments(month) {
    var store = storage.load();
    return store.muwascoPayments
      .filter(function (mp) { return !month || mp.month === month; })
      .map(function (mp) {
        var prop = utils.findById(store.properties, mp.propertyId);
        return Object.assign({}, mp, { propertyName: prop ? prop.name : 'Unknown' });
      })
      .sort(function (a, b) {
        return b.paidOn > a.paidOn ? 1 : (b.paidOn < a.paidOn ? -1 : 0);
      });
  }

  // Computes water bill for a specific unit/lease in a given YYYY-MM from a loaded store
  function computeLeaseWaterForMonthInStore(store, lease, month) {
    if (!lease || !month) return { consumption: 0, waterBill: 0, hasReading: false };
    var meter = store.waterMeters.find(function (m) { return m.unitId === lease.unitId; });
    if (!meter) return { consumption: 0, waterBill: 0, hasReading: false };
    var sorted = getSortedReadingsForMeter(meter.id, store.waterReadings);
    var readingObj = sorted.find(function (r) { return r.month === month; });
    if (!readingObj) return { consumption: 0, waterBill: 0, hasReading: false };
    var prevVal = getPreviousReadingValue(meter, sorted, month);
    var cons = waterRules.calculateConsumption(prevVal, readingObj.reading);
    if (isNaN(cons)) cons = 0;
    var tariffs = store.tariffSettings;
    return {
      consumption: cons,
      waterBill: waterRules.waterBill(cons, tariffs.tenantRatePerM3, tariffs.tenantFixedCharge),
      hasReading: true
    };
  }

  // Computes cumulative water billed during a lease's active months
  function computeCumulativeWaterForLeaseInStore(store, lease) {
    if (!lease) return 0;
    var meter = store.waterMeters.find(function (m) { return m.unitId === lease.unitId; });
    if (!meter) return 0;
    var startMonth = lease.startDate.slice(0, 7);
    var endMonth = lease.status === 'ended' ? lease.endDate.slice(0, 7) : '9999-12';
    var sorted = getSortedReadingsForMeter(meter.id, store.waterReadings);
    var tariffs = store.tariffSettings;
    var total = 0;
    for (var i = 0; i < sorted.length; i++) {
      var r = sorted[i];
      if (r.month < startMonth || r.month > endMonth) continue;
      var prev = i === 0 ? Number(meter.startingReading || 0) : Number(sorted[i - 1].reading);
      var cons = waterRules.calculateConsumption(prev, r.reading);
      if (!isNaN(cons) && cons >= 0) {
        total += waterRules.waterBill(cons, tariffs.tenantRatePerM3, tariffs.tenantFixedCharge);
      }
    }
    return total;
  }

  // Estimates how much of a lease's water bills have been collected based on combined rent+water payments
  function computeWaterCollectedInMonthInStore(store, month) {
    var collected = 0;
    store.leases.forEach(function (lease) {
      var info = computeLeaseWaterForMonthInStore(store, lease, month);
      if (!info.hasReading || info.waterBill <= 0) return;
      var invoiceAmt = waterRules.invoiceTotal(lease.monthlyRent, info.waterBill);
      var paidForMonth = store.payments
        .filter(function (p) { return p.leaseId === lease.id && p.period === month; })
        .reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
      if (paidForMonth <= 0 || invoiceAmt <= 0) return;
      // Allocate payments proportionally against combined rent + water invoice (capped at full waterBill)
      var waterShare = Math.min(info.waterBill, Math.round(paidForMonth * (info.waterBill / invoiceAmt)));
      collected += waterShare;
    });
    return collected;
  }

  function getMonthlySummary(targetMonth) {
    var store = storage.load();
    var month = dates.isValidYearMonth(targetMonth) ? targetMonth : dates.currentMonth();
    var tariffs = store.tariffSettings;
    var meterRows = listMetersWithReadings(month);

    var byPropertyMap = {};
    store.properties.forEach(function (p) {
      byPropertyMap[p.id] = {
        propertyId: p.id,
        propertyName: p.name,
        consumptionM3: 0,
        tenantWaterBilled: 0,
        waterCollected: 0,
        muwascoPayable: 0,
        muwascoPaid: 0,
        muwascoBalance: 0,
        margin: 0
      };
    });

    meterRows.forEach(function (row) {
      var bucket = byPropertyMap[row.propertyId];
      if (!bucket) return;
      if (row.consumption !== null && !isNaN(row.consumption)) {
        bucket.consumptionM3 += row.consumption;
      }
      bucket.tenantWaterBilled += row.waterBill;
    });

    // Allocate water collected per property for this month
    store.leases.forEach(function (lease) {
      var unit = utils.findById(store.units, lease.unitId);
      if (!unit || !byPropertyMap[unit.propertyId]) return;
      var info = computeLeaseWaterForMonthInStore(store, lease, month);
      if (!info.hasReading || info.waterBill <= 0) return;
      var invoiceAmt = waterRules.invoiceTotal(lease.monthlyRent, info.waterBill);
      var paidForMonth = store.payments
        .filter(function (p) { return p.leaseId === lease.id && p.period === month; })
        .reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
      if (paidForMonth > 0 && invoiceAmt > 0) {
        var share = Math.min(info.waterBill, Math.round(paidForMonth * (info.waterBill / invoiceAmt)));
        byPropertyMap[unit.propertyId].waterCollected += share;
      }
    });

    store.muwascoPayments.forEach(function (mp) {
      if (mp.month === month && byPropertyMap[mp.propertyId]) {
        byPropertyMap[mp.propertyId].muwascoPaid += Number(mp.amount || 0);
      }
    });

    var totals = {
      month: month,
      consumptionM3: 0,
      tenantWaterBilled: 0,
      waterCollected: 0,
      muwascoPayable: 0,
      muwascoPaid: 0,
      muwascoBalance: 0,
      margin: 0
    };

    var byProperty = Object.keys(byPropertyMap).map(function (id) {
      var b = byPropertyMap[id];
      b.muwascoPayable = waterRules.muwascoPayable(b.consumptionM3, tariffs.muwascoRatePerM3);
      b.muwascoBalance = b.muwascoPayable - b.muwascoPaid;
      b.margin = waterRules.waterMargin(b.waterCollected, b.muwascoPayable);

      totals.consumptionM3 += b.consumptionM3;
      totals.tenantWaterBilled += b.tenantWaterBilled;
      totals.waterCollected += b.waterCollected;
      totals.muwascoPayable += b.muwascoPayable;
      totals.muwascoPaid += b.muwascoPaid;
      return b;
    });

    totals.muwascoBalance = totals.muwascoPayable - totals.muwascoPaid;
    totals.margin = waterRules.waterMargin(totals.waterCollected, totals.muwascoPayable);

    return {
      month: month,
      tariffs: tariffs,
      totals: totals,
      byProperty: byProperty,
      leaksCount: meterRows.filter(function (r) { return r.leakSuspected; }).length
    };
  }

  var waterService = {
    getTariffSettings: getTariffSettings,
    updateTariffSettings: updateTariffSettings,
    listMetersWithReadings: listMetersWithReadings,
    recordManualReading: recordManualReading,
    simulateDigitalReadings: simulateDigitalReadings,
    recordMuwascoPayment: recordMuwascoPayment,
    listMuwascoPayments: listMuwascoPayments,
    getMonthlySummary: getMonthlySummary,
    computeLeaseWaterForMonthInStore: computeLeaseWaterForMonthInStore,
    computeCumulativeWaterForLeaseInStore: computeCumulativeWaterForLeaseInStore,
    computeWaterCollectedInMonthInStore: computeWaterCollectedInMonthInStore
  };

  Makazi.services = Makazi.services || {};
  Makazi.services.waterService = waterService;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = waterService;
  }
})(typeof window !== 'undefined' ? window : globalThis);
