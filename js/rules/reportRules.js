(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var waterRules = (Makazi.rules && Makazi.rules.waterRules) || (typeof require !== 'undefined' ? require('./waterRules') : {});

  function getPropertyAreaLabel(prop) {
    if (!prop) return 'Other';
    if (prop.area === 'Other' && prop.areaOther) return prop.areaOther;
    return prop.area || prop.location || 'Other';
  }

  function computeOccupancyByProperty(properties, units) {
    return (properties || []).map(function (prop) {
      var propUnits = (units || []).filter(function (u) { return u.propertyId === prop.id; });
      var total = propUnits.length;
      var occupied = 0;
      var vacant = 0;
      var underRenovation = 0;
      for (var i = 0; i < propUnits.length; i++) {
        if (propUnits[i].status === 'occupied') occupied += 1;
        else if (propUnits[i].status === 'vacant') vacant += 1;
        else if (propUnits[i].status === 'under_renovation') underRenovation += 1;
      }
      var occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return {
        propertyId: prop.id,
        propertyName: prop.name,
        area: getPropertyAreaLabel(prop),
        location: prop.location,
        totalUnits: total,
        occupied: occupied,
        vacant: vacant,
        underRenovation: underRenovation,
        occupancyRate: occupancyRate
      };
    });
  }

  function computeIncomeByProperty(properties, units, leases, payments) {
    var unitToProperty = {};
    for (var i = 0; i < (units || []).length; i++) {
      unitToProperty[units[i].id] = units[i].propertyId;
    }
    var leaseToProperty = {};
    for (var j = 0; j < (leases || []).length; j++) {
      leaseToProperty[leases[j].id] = unitToProperty[leases[j].unitId] || null;
    }

    var totals = {};
    var counts = {};
    for (var k = 0; k < (payments || []).length; k++) {
      var p = payments[k];
      var propId = leaseToProperty[p.leaseId];
      if (!propId) continue;
      totals[propId] = (totals[propId] || 0) + Number(p.amount || 0);
      counts[propId] = (counts[propId] || 0) + 1;
    }

    return (properties || []).map(function (prop) {
      var activePotential = (units || [])
        .filter(function (u) { return u.propertyId === prop.id && u.status === 'occupied'; })
        .reduce(function (sum, u) { return sum + Number(u.monthlyRent || 0); }, 0);
      return {
        propertyId: prop.id,
        propertyName: prop.name,
        area: getPropertyAreaLabel(prop),
        paymentCount: counts[prop.id] || 0,
        totalCollected: totals[prop.id] || 0,
        monthlyOccupiedRunRate: activePotential
      };
    });
  }

  function computeOccupancyAndIncomeByArea(properties, units, leases, payments) {
    var propOcc = computeOccupancyByProperty(properties, units);
    var propInc = computeIncomeByProperty(properties, units, leases, payments);
    var incByPropId = {};
    for (var i = 0; i < propInc.length; i++) {
      incByPropId[propInc[i].propertyId] = propInc[i];
    }

    var areaMap = {};
    for (var j = 0; j < propOcc.length; j++) {
      var row = propOcc[j];
      var area = row.area;
      if (!areaMap[area]) {
        areaMap[area] = {
          area: area,
          propertyCount: 0,
          totalUnits: 0,
          occupied: 0,
          vacant: 0,
          underRenovation: 0,
          totalCollected: 0,
          monthlyOccupiedRunRate: 0
        };
      }
      var bucket = areaMap[area];
      bucket.propertyCount += 1;
      bucket.totalUnits += row.totalUnits;
      bucket.occupied += row.occupied;
      bucket.vacant += row.vacant;
      bucket.underRenovation += row.underRenovation;
      var inc = incByPropId[row.propertyId];
      if (inc) {
        bucket.totalCollected += inc.totalCollected;
        bucket.monthlyOccupiedRunRate += inc.monthlyOccupiedRunRate;
      }
    }

    return Object.keys(areaMap).map(function (areaName) {
      var b = areaMap[areaName];
      b.occupancyRate = b.totalUnits > 0 ? Math.round((b.occupied / b.totalUnits) * 100) : 0;
      return b;
    });
  }

  function computeStudentVsCommunitySplit(units, leases, tenants) {
    var tenantMap = {};
    for (var i = 0; i < (tenants || []).length; i++) {
      tenantMap[tenants[i].id] = tenants[i];
    }

    var activeStudentLeases = 0;
    var activeCommunityLeases = 0;
    var activeStudentUnitIds = {};
    var activeCommunityUnitIds = {};

    for (var j = 0; j < (leases || []).length; j++) {
      var l = leases[j];
      if (l.status !== 'active') continue;
      var t = tenantMap[l.tenantId];
      if (t && t.category === 'student') {
        activeStudentLeases += 1;
        activeStudentUnitIds[l.unitId] = true;
      } else {
        activeCommunityLeases += 1;
        activeCommunityUnitIds[l.unitId] = true;
      }
    }

    var studentTenantsTotal = (tenants || []).filter(function (t) { return t.category === 'student'; }).length;
    var communityTenantsTotal = (tenants || []).filter(function (t) { return t.category !== 'student'; }).length;

    var studentStyleUnits = (units || []).filter(function (u) {
      return u.type === 'bedsitter' || u.type === 'single_room';
    }).length;
    var communityStyleUnits = (units || []).length - studentStyleUnits;

    return {
      occupiedStudent: Object.keys(activeStudentUnitIds).length,
      occupiedCommunity: Object.keys(activeCommunityUnitIds).length,
      activeStudentLeases: activeStudentLeases,
      activeCommunityLeases: activeCommunityLeases,
      studentTenantsTotal: studentTenantsTotal,
      communityTenantsTotal: communityTenantsTotal,
      studentStyleUnits: studentStyleUnits,
      communityStyleUnits: communityStyleUnits
    };
  }

  function computeWaterByProperty(properties, units, waterMeters, waterReadings, tariffSettings, muwascoPayments, targetMonth) {
    var unitById = {};
    (units || []).forEach(function (u) { unitById[u.id] = u; });

    var propStats = {};
    (properties || []).forEach(function (p) {
      propStats[p.id] = {
        propertyId: p.id,
        propertyName: p.name,
        area: getPropertyAreaLabel(p),
        metersRead: 0,
        consumptionM3: 0,
        tenantWaterBilled: 0,
        muwascoPayable: 0,
        muwascoPaid: 0
      };
    });

    var tariffs = tariffSettings || { tenantRatePerM3: 180, tenantFixedCharge: 150, muwascoRatePerM3: 110 };

    (waterMeters || []).forEach(function (meter) {
      var unit = unitById[meter.unitId];
      if (!unit || !propStats[unit.propertyId]) return;
      var meterReadings = (waterReadings || [])
        .filter(function (r) { return r.meterId === meter.id; })
        .sort(function (a, b) { return a.month < b.month ? -1 : (a.month > b.month ? 1 : 0); });

      var targetIdx = -1;
      for (var i = 0; i < meterReadings.length; i++) {
        if (!targetMonth || meterReadings[i].month === targetMonth) {
          if (targetMonth) {
            targetIdx = i;
            break;
          }
        }
      }
      if (!targetMonth && meterReadings.length > 0) {
        targetIdx = meterReadings.length - 1;
      }
      if (targetIdx === -1) return;

      var curr = meterReadings[targetIdx];
      var prevVal = targetIdx > 0 ? meterReadings[targetIdx - 1].reading : meter.startingReading;
      var cons = waterRules.calculateConsumption(prevVal, curr.reading);
      if (isNaN(cons)) cons = 0;
      var bill = unit.status === 'occupied'
        ? waterRules.waterBill(cons, tariffs.tenantRatePerM3, tariffs.tenantFixedCharge)
        : 0;

      var bucket = propStats[unit.propertyId];
      bucket.metersRead += 1;
      bucket.consumptionM3 += cons;
      bucket.tenantWaterBilled += bill;
    });

    (muwascoPayments || []).forEach(function (mp) {
      if (targetMonth && mp.month !== targetMonth) return;
      if (propStats[mp.propertyId]) {
        propStats[mp.propertyId].muwascoPaid += Number(mp.amount || 0);
      }
    });

    return Object.keys(propStats).map(function (id) {
      var row = propStats[id];
      row.muwascoPayable = waterRules.muwascoPayable(row.consumptionM3, tariffs.muwascoRatePerM3);
      row.muwascoBalance = row.muwascoPayable - row.muwascoPaid;
      return row;
    });
  }

  function computeRepairsSummary(properties, units, maintenanceRequests) {
    var total = (maintenanceRequests || []).length;
    var open = 0;
    var completed = 0;
    var byPriority = { high: 0, medium: 0, low: 0 };

    var unitToProperty = {};
    for (var i = 0; i < (units || []).length; i++) {
      unitToProperty[units[i].id] = units[i].propertyId;
    }

    var byPropertyMap = {};
    for (var j = 0; j < (properties || []).length; j++) {
      byPropertyMap[properties[j].id] = {
        propertyId: properties[j].id,
        propertyName: properties[j].name,
        open: 0,
        completed: 0,
        total: 0
      };
    }

    for (var k = 0; k < total; k++) {
      var req = maintenanceRequests[k];
      if (req.status === 'completed') completed += 1;
      else open += 1;

      if (req.priority && Object.prototype.hasOwnProperty.call(byPriority, req.priority)) {
        byPriority[req.priority] += 1;
      }

      var propId = unitToProperty[req.unitId];
      if (propId && byPropertyMap[propId]) {
        byPropertyMap[propId].total += 1;
        if (req.status === 'completed') byPropertyMap[propId].completed += 1;
        else byPropertyMap[propId].open += 1;
      }
    }

    var byProperty = Object.keys(byPropertyMap).map(function (id) {
      return byPropertyMap[id];
    });

    return {
      total: total,
      open: open,
      completed: completed,
      byPriority: byPriority,
      byProperty: byProperty
    };
  }

  function computeLeaseTermSplit(leases) {
    var activeShort = 0;
    var activeLong = 0;
    var totalShort = 0;
    var totalLong = 0;

    for (var i = 0; i < (leases || []).length; i++) {
      var l = leases[i];
      if (l.termType === 'LONG_TERM') {
        totalLong += 1;
        if (l.status === 'active') activeLong += 1;
      } else {
        totalShort += 1;
        if (l.status === 'active') activeShort += 1;
      }
    }

    return {
      activeShort: activeShort,
      activeLong: activeLong,
      totalShort: totalShort,
      totalLong: totalLong,
      total: (leases || []).length
    };
  }

  var reportRules = {
    getPropertyAreaLabel: getPropertyAreaLabel,
    computeOccupancyByProperty: computeOccupancyByProperty,
    computeIncomeByProperty: computeIncomeByProperty,
    computeOccupancyAndIncomeByArea: computeOccupancyAndIncomeByArea,
    computeStudentVsCommunitySplit: computeStudentVsCommunitySplit,
    computeWaterByProperty: computeWaterByProperty,
    computeRepairsSummary: computeRepairsSummary,
    computeLeaseTermSplit: computeLeaseTermSplit
  };

  Makazi.rules = Makazi.rules || {};
  Makazi.rules.reportRules = reportRules;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = reportRules;
  }
})(typeof window !== 'undefined' ? window : globalThis);
