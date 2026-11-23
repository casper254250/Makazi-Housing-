(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('../core/namespace') : {});
  var constants = (Makazi.core && Makazi.core.constants) || (typeof require !== 'undefined' ? require('../core/constants') : {});
  var dates = (Makazi.core && Makazi.core.dates) || (typeof require !== 'undefined' ? require('../core/dates') : {});

  function createSampleData(referenceDate) {
    var refDate = dates.isValidIsoDate(referenceDate) ? referenceDate : dates.today();
    var m0 = refDate.slice(0, 7);
    var m1 = dates.addMonths(refDate, -1).slice(0, 7);
    var m2 = dates.addMonths(refDate, -2).slice(0, 7);
    var m3 = dates.addMonths(refDate, -3).slice(0, 7);
    var createdStamp = refDate + 'T08:00:00.000Z';

    var properties = [
      {
        id: 'prop_mumbi',
        name: 'Mumbi Comrades Court',
        area: 'Mumbi',
        areaOther: '',
        location: 'Mumbi, Murang\'a Town (Kihara Constituency)',
        type: 'student_bedsitter_block',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'prop_mukuyu',
        name: 'Mukuyu Heights Apartments',
        area: 'Mukuyu',
        areaOther: '',
        location: 'Mukuyu, Murang\'a Town (Kihara Constituency)',
        type: 'apartments',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'prop_township',
        name: 'Township Bedsitters Block A',
        area: 'Township',
        areaOther: '',
        location: 'Township, Murang\'a Town (Kihara Constituency)',
        type: 'student_bedsitter_block',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'prop_mjini',
        name: 'Mjini Plaza Residences',
        area: 'Mjini',
        areaOther: '',
        location: 'Mjini, Murang\'a Town (Kihara Constituency)',
        type: 'commercial',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'prop_kwamaji',
        name: 'Kwa Maji Gardens',
        area: 'Kwa Maji',
        areaOther: '',
        location: 'Kwa Maji, Murang\'a Town (Kihara Constituency)',
        type: 'apartments',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'prop_vm',
        name: 'VM Student Hostel',
        area: 'VM',
        areaOther: '',
        location: 'VM, Murang\'a Town (Kihara Constituency)',
        type: 'hostel',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'prop_mwangaza',
        name: 'Mwangaza Villas',
        area: 'Mwangaza',
        areaOther: '',
        location: 'Mwangaza, Murang\'a Town (Kihara Constituency)',
        type: 'maisonette_bungalow',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'prop_frankfort',
        name: 'Frankfort Family Homes',
        area: 'Frankfort',
        areaOther: '',
        location: 'Frankfort, Murang\'a Town (Kihara Constituency)',
        type: 'maisonette_bungalow',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'prop_kabati',
        name: 'Kabati Terrace',
        area: 'Kabati',
        areaOther: '',
        location: 'Kabati, Murang\'a Town (Kihara Constituency)',
        type: 'apartments',
        createdAt: createdStamp,
        updatedAt: createdStamp
      }
    ];

    // 40 units total: 20 student-focused (bedsitter / single_room) and 20 community-focused (1BR / 2BR / 3BR_maisonette / shop)
    // Statuses: 20 occupied (matching 20 active leases), 15 vacant, 5 under_renovation
    var unitSpecs = [
      // Mumbi Comrades Court (6 units: 6 student)
      { id: 'u_01', prop: 'prop_mumbi', num: 'MB-01', type: 'bedsitter', rent: 6500, status: 'occupied', renoMonths: -10, meterType: 'digital', startRead: 112 },
      { id: 'u_02', prop: 'prop_mumbi', num: 'MB-02', type: 'bedsitter', rent: 6500, status: 'occupied', renoMonths: -10, meterType: 'digital', startRead: 140 },
      { id: 'u_03', prop: 'prop_mumbi', num: 'MB-03', type: 'bedsitter', rent: 7000, status: 'occupied', renoMonths: -14, meterType: 'manual', startRead: 95 },
      { id: 'u_04', prop: 'prop_mumbi', num: 'MB-04', type: 'bedsitter', rent: 6000, status: 'vacant', renoMonths: -6, meterType: 'digital', startRead: 68 },
      { id: 'u_05', prop: 'prop_mumbi', num: 'MB-05', type: 'single_room', rent: 4500, status: 'occupied', renoMonths: -40, meterType: 'manual', startRead: 77 },
      { id: 'u_06', prop: 'prop_mumbi', num: 'MB-06', type: 'bedsitter', rent: 6500, status: 'under_renovation', renoMonths: -44, meterType: 'digital', startRead: 84 },

      // Mukuyu Heights Apartments (5 units: 5 community)
      { id: 'u_07', prop: 'prop_mukuyu', num: 'MK-A1', type: '1BR', rent: 11500, status: 'occupied', renoMonths: -12, meterType: 'digital', startRead: 210 },
      { id: 'u_08', prop: 'prop_mukuyu', num: 'MK-A2', type: '2BR', rent: 17500, status: 'occupied', renoMonths: -18, meterType: 'digital', startRead: 318 },
      { id: 'u_09', prop: 'prop_mukuyu', num: 'MK-A3', type: '1BR', rent: 11000, status: 'vacant', renoMonths: -8, meterType: 'digital', startRead: 155 },
      { id: 'u_10', prop: 'prop_mukuyu', num: 'MK-B1', type: '2BR', rent: 18000, status: 'occupied', renoMonths: -22, meterType: 'manual', startRead: 274 },
      { id: 'u_11', prop: 'prop_mukuyu', num: 'MK-B2', type: '1BR', rent: 12000, status: 'vacant', renoMonths: -42, meterType: 'digital', startRead: 190 },

      // Township Bedsitters Block A (6 units: 5 student, 1 shop)
      { id: 'u_12', prop: 'prop_township', num: 'TW-01', type: 'bedsitter', rent: 7000, status: 'occupied', renoMonths: -9, meterType: 'digital', startRead: 132 },
      { id: 'u_13', prop: 'prop_township', num: 'TW-02', type: 'bedsitter', rent: 7000, status: 'occupied', renoMonths: -9, meterType: 'digital', startRead: 148 },
      { id: 'u_14', prop: 'prop_township', num: 'TW-03', type: 'single_room', rent: 4800, status: 'occupied', renoMonths: -15, meterType: 'manual', startRead: 89 },
      { id: 'u_15', prop: 'prop_township', num: 'TW-04', type: 'bedsitter', rent: 7500, status: 'vacant', renoMonths: -5, meterType: 'digital', startRead: 102 },
      { id: 'u_16', prop: 'prop_township', num: 'TW-05', type: 'single_room', rent: 4200, status: 'under_renovation', renoMonths: -46, meterType: 'manual', startRead: 64 },
      { id: 'u_17', prop: 'prop_township', num: 'TW-S1', type: 'shop', rent: 11000, status: 'occupied', renoMonths: -16, meterType: 'manual', startRead: 175 },

      // Mjini Plaza Residences (4 units: 4 community/commercial)
      { id: 'u_18', prop: 'prop_mjini', num: 'MJ-S1', type: 'shop', rent: 14500, status: 'occupied', renoMonths: -12, meterType: 'digital', startRead: 245 },
      { id: 'u_19', prop: 'prop_mjini', num: 'MJ-S2', type: 'shop', rent: 12000, status: 'vacant', renoMonths: -7, meterType: 'digital', startRead: 118 },
      { id: 'u_20', prop: 'prop_mjini', num: 'MJ-101', type: '1BR', rent: 12500, status: 'occupied', renoMonths: -20, meterType: 'digital', startRead: 196 },
      { id: 'u_21', prop: 'prop_mjini', num: 'MJ-102', type: '2BR', rent: 16500, status: 'vacant', renoMonths: -11, meterType: 'manual', startRead: 142 },

      // Kwa Maji Gardens (4 units: 4 community)
      { id: 'u_22', prop: 'prop_kwamaji', num: 'KM-01', type: '1BR', rent: 10500, status: 'occupied', renoMonths: -14, meterType: 'digital', startRead: 188 },
      { id: 'u_23', prop: 'prop_kwamaji', num: 'KM-02', type: '2BR', rent: 15500, status: 'occupied', renoMonths: -19, meterType: 'digital', startRead: 261 },
      { id: 'u_24', prop: 'prop_kwamaji', num: 'KM-03', type: '1BR', rent: 9800, status: 'vacant', renoMonths: -6, meterType: 'manual', startRead: 98 },
      { id: 'u_25', prop: 'prop_kwamaji', num: 'KM-04', type: '2BR', rent: 16000, status: 'under_renovation', renoMonths: -45, meterType: 'digital', startRead: 224 },

      // VM Student Hostel (7 units: 7 student)
      { id: 'u_26', prop: 'prop_vm', num: 'VM-01', type: 'bedsitter', rent: 5800, status: 'occupied', renoMonths: -8, meterType: 'digital', startRead: 105 },
      { id: 'u_27', prop: 'prop_vm', num: 'VM-02', type: 'bedsitter', rent: 5800, status: 'occupied', renoMonths: -8, meterType: 'digital', startRead: 118 },
      { id: 'u_28', prop: 'prop_vm', num: 'VM-03', type: 'single_room', rent: 3800, status: 'occupied', renoMonths: -13, meterType: 'manual', startRead: 72 },
      { id: 'u_29', prop: 'prop_vm', num: 'VM-04', type: 'single_room', rent: 3800, status: 'vacant', renoMonths: -4, meterType: 'digital', startRead: 51 },
      { id: 'u_30', prop: 'prop_vm', num: 'VM-05', type: 'bedsitter', rent: 6200, status: 'vacant', renoMonths: -9, meterType: 'digital', startRead: 88 },
      { id: 'u_31', prop: 'prop_vm', num: 'VM-06', type: 'single_room', rent: 4000, status: 'vacant', renoMonths: -39, meterType: 'manual', startRead: 66 },
      { id: 'u_32', prop: 'prop_vm', num: 'VM-07', type: 'bedsitter', rent: 5500, status: 'under_renovation', renoMonths: -43, meterType: 'digital', startRead: 91 },

      // Mwangaza Villas (3 units: 3 community maisonettes)
      { id: 'u_33', prop: 'prop_mwangaza', num: 'MW-01', type: '3BR_maisonette', rent: 26000, status: 'occupied', renoMonths: -15, meterType: 'digital', startRead: 410 },
      { id: 'u_34', prop: 'prop_mwangaza', num: 'MW-02', type: '3BR_maisonette', rent: 28000, status: 'vacant', renoMonths: -5, meterType: 'digital', startRead: 350 },
      { id: 'u_35', prop: 'prop_mwangaza', num: 'MW-03', type: '3BR_maisonette', rent: 24500, status: 'vacant', renoMonths: -12, meterType: 'manual', startRead: 295 },

      // Frankfort Family Homes (2 units: 2 community)
      { id: 'u_36', prop: 'prop_frankfort', num: 'FF-01', type: '3BR_maisonette', rent: 25000, status: 'occupied', renoMonths: -18, meterType: 'digital', startRead: 382 },
      { id: 'u_37', prop: 'prop_frankfort', num: 'FF-02', type: '2BR', rent: 19000, status: 'under_renovation', renoMonths: -48, meterType: 'manual', startRead: 260 },

      // Kabati Terrace (3 units: 2 student, 1 community)
      { id: 'u_38', prop: 'prop_kabati', num: 'KB-01', type: 'bedsitter', rent: 6000, status: 'vacant', renoMonths: -6, meterType: 'digital', startRead: 79 },
      { id: 'u_39', prop: 'prop_kabati', num: 'KB-02', type: '1BR', rent: 10000, status: 'vacant', renoMonths: -10, meterType: 'digital', startRead: 134 },
      { id: 'u_40', prop: 'prop_kabati', num: 'KB-03', type: '2BR', rent: 14500, status: 'vacant', renoMonths: -14, meterType: 'manual', startRead: 168 }
    ];

    var units = unitSpecs.map(function (spec) {
      return {
        id: spec.id,
        propertyId: spec.prop,
        unitNumber: spec.num,
        type: spec.type,
        monthlyRent: spec.rent,
        status: spec.status,
        lastRenovated: dates.addMonths(refDate, spec.renoMonths),
        notes: spec.status === 'under_renovation'
          ? 'Scheduled plumbing and paint refresh.'
          : (spec.type === 'bedsitter' || spec.type === 'single_room' ? 'Near MUT campus route.' : 'Standard metered connection.'),
        createdAt: createdStamp,
        updatedAt: createdStamp
      };
    });

    var waterMeters = unitSpecs.map(function (spec, idx) {
      var numStr = (idx + 1) < 10 ? '0' + (idx + 1) : String(idx + 1);
      return {
        id: 'meter_' + numStr,
        unitId: spec.id,
        meterNumber: 'MTR-' + spec.num,
        type: spec.meterType,
        startingReading: spec.startRead,
        createdAt: createdStamp,
        updatedAt: createdStamp
      };
    });

    // 25 synthetic tenants (13 students, 12 community)
    var tenantSpecs = [
      { id: 'ten_01', name: 'Grace Wanjiku Njoroge', phone: '0700 000 101', idNum: 'SIM-100101', cat: 'student', stay: 'under_2_years', kin: 'Peter Njoroge', kinPh: '0700 000 201' },
      { id: 'ten_02', name: 'Samuel Kiprop Mutai', phone: '0700 000 102', idNum: 'SIM-100102', cat: 'student', stay: 'under_2_years', kin: 'Beatrice Chebet', kinPh: '0700 000 202' },
      { id: 'ten_03', name: 'Faith Mwende Musyoka', phone: '0700 000 103', idNum: 'SIM-100103', cat: 'student', stay: 'under_2_years', kin: 'David Musyoka', kinPh: '0700 000 203' },
      { id: 'ten_04', name: 'Brian Ochieng Otieno', phone: '0700 000 104', idNum: 'SIM-100104', cat: 'student', stay: '2_years_or_more', kin: 'Mary Akinyi', kinPh: '0700 000 204' },
      { id: 'ten_05', name: 'Esther Nyambura Kamau', phone: '0700 000 105', idNum: 'SIM-100105', cat: 'community', stay: '2_years_or_more', kin: 'Joseph Kamau', kinPh: '0700 000 205' },
      { id: 'ten_06', name: 'Kevin Kariuki Mwangi', phone: '0700 000 106', idNum: 'SIM-100106', cat: 'community', stay: '2_years_or_more', kin: 'Hannah Wambui', kinPh: '0700 000 206' },
      { id: 'ten_07', name: 'Mercy Chepkoech Ruto', phone: '0700 000 107', idNum: 'SIM-100107', cat: 'student', stay: 'under_2_years', kin: 'Joel Ruto', kinPh: '0700 000 207' },
      { id: 'ten_08', name: 'Dennis Kioko Nzioka', phone: '0700 000 108', idNum: 'SIM-100108', cat: 'student', stay: 'under_2_years', kin: 'Ruth Ndunge', kinPh: '0700 000 208' },
      { id: 'ten_09', name: 'Lucy Muthoni Gacheru', phone: '0700 000 109', idNum: 'SIM-100109', cat: 'student', stay: '2_years_or_more', kin: 'Paul Gacheru', kinPh: '0700 000 209' },
      { id: 'ten_10', name: 'Stephen Wafula Simiyu', phone: '0700 000 110', idNum: 'SIM-100110', cat: 'community', stay: '2_years_or_more', kin: 'Alice Nekesa', kinPh: '0700 000 210' },
      { id: 'ten_11', name: 'Joyce Wairimu Karanja', phone: '0700 000 111', idNum: 'SIM-100111', cat: 'community', stay: '2_years_or_more', kin: 'Simon Karanja', kinPh: '0700 000 211' },
      { id: 'ten_12', name: 'Allan Kiptoo Korir', phone: '0700 000 112', idNum: 'SIM-100112', cat: 'community', stay: 'under_2_years', kin: 'Sarah Jeptoo', kinPh: '0700 000 212' },
      { id: 'ten_13', name: 'Beatrice Njeri Maina', phone: '0700 000 113', idNum: 'SIM-100113', cat: 'community', stay: '2_years_or_more', kin: 'Francis Maina', kinPh: '0700 000 213' },
      { id: 'ten_14', name: 'Collins Barasa Wanjala', phone: '0700 000 114', idNum: 'SIM-100114', cat: 'community', stay: 'unsure', kin: 'Janet Naliaka', kinPh: '0700 000 214' },
      { id: 'ten_15', name: 'Sharon Auma Onyango', phone: '0700 000 115', idNum: 'SIM-100115', cat: 'student', stay: 'under_2_years', kin: 'George Onyango', kinPh: '0700 000 215' },
      { id: 'ten_16', name: 'Victor Mutuku Kilonzo', phone: '0700 000 116', idNum: 'SIM-100116', cat: 'student', stay: 'under_2_years', kin: 'Agnes Mumbua', kinPh: '0700 000 216' },
      { id: 'ten_17', name: 'Caroline Wangari Ndungu', phone: '0700 000 117', idNum: 'SIM-100117', cat: 'student', stay: 'under_2_years', kin: 'Benson Ndungu', kinPh: '0700 000 217' },
      { id: 'ten_18', name: 'Patrick Irungu Macharia', phone: '0700 000 118', idNum: 'SIM-100118', cat: 'community', stay: '2_years_or_more', kin: 'Rose Wambui', kinPh: '0700 000 218' },
      { id: 'ten_19', name: 'Miriam Moraa Omwenga', phone: '0700 000 119', idNum: 'SIM-100119', cat: 'community', stay: '2_years_or_more', kin: 'Charles Omwenga', kinPh: '0700 000 219' },
      { id: 'ten_20', name: 'Felix Kimani Ngugi', phone: '0700 000 120', idNum: 'SIM-100120', cat: 'community', stay: '2_years_or_more', kin: 'Jane Wangui', kinPh: '0700 000 220' },
      { id: 'ten_21', name: 'Nancy Mwikali Mutua', phone: '0700 000 121', idNum: 'SIM-100121', cat: 'student', stay: 'under_2_years', kin: 'Daniel Mutua', kinPh: '0700 000 221' },
      { id: 'ten_22', name: 'Edwin Cheruiyot Langat', phone: '0700 000 122', idNum: 'SIM-100122', cat: 'student', stay: 'under_2_years', kin: 'Esther Chelangat', kinPh: '0700 000 222' },
      { id: 'ten_23', name: 'Lydia Wambui Gitau', phone: '0700 000 123', idNum: 'SIM-100123', cat: 'community', stay: 'unsure', kin: 'John Gitau', kinPh: '0700 000 223' },
      { id: 'ten_24', name: 'Oscar Nyongesa Juma', phone: '0700 000 124', idNum: 'SIM-100124', cat: 'student', stay: 'under_2_years', kin: 'Florence Nasimiyu', kinPh: '0700 000 224' },
      { id: 'ten_25', name: 'Irene Nyokabi Wachira', phone: '0700 000 125', idNum: 'SIM-100125', cat: 'community', stay: '2_years_or_more', kin: 'Martin Wachira', kinPh: '0700 000 225' }
    ];

    var tenants = tenantSpecs.map(function (t) {
      return {
        id: t.id,
        fullName: t.name,
        phone: t.phone,
        idNumber: t.idNum,
        category: t.cat,
        nextOfKinName: t.kin,
        nextOfKinPhone: t.kinPh,
        intendedStay: t.stay,
        createdAt: createdStamp,
        updatedAt: createdStamp
      };
    });

    // 20 active leases mapped to the 20 occupied units (2 ending within 60 days!)
    var occupiedSpecs = unitSpecs.filter(function (s) { return s.status === 'occupied'; });
    var leases = occupiedSpecs.map(function (uSpec, idx) {
      var tenant = tenants[idx];
      var isExpiringSoon1 = idx === 0; // +38 days
      var isExpiringSoon2 = idx === 5; // +52 days
      var startDate;
      var endDate;
      var termType;

      if (isExpiringSoon1) {
        startDate = dates.addMonths(refDate, -10).slice(0, 7) + '-01';
        endDate = dates.addDays(refDate, 38);
        termType = 'SHORT_TERM';
      } else if (isExpiringSoon2) {
        startDate = dates.addMonths(refDate, -10).slice(0, 7) + '-01';
        endDate = dates.addDays(refDate, 52);
        termType = 'SHORT_TERM';
      } else {
        var monthsAgo = (idx % 4) + 2; // 2..5 months ago
        startDate = dates.addMonths(refDate, -monthsAgo).slice(0, 7) + '-01';
        var duration = tenant.category === 'community' ? 24 : 12;
        endDate = dates.addMonths(startDate, duration);
        termType = duration >= 24 ? 'LONG_TERM' : 'SHORT_TERM';
      }

      return {
        id: 'lease_' + (idx + 1 < 10 ? '0' + (idx + 1) : String(idx + 1)),
        unitId: uSpec.id,
        tenantId: tenant.id,
        startDate: startDate,
        endDate: endDate,
        monthlyRent: uSpec.rent,
        deposit: uSpec.rent,
        status: 'active',
        termType: termType,
        createdAt: createdStamp,
        updatedAt: createdStamp
      };
    });

    // Water readings for last 3 months (m3, m2, m1) for all 40 meters,
    // PLUS m0 (current month) for manual occupied meters so Dashboard has live current-month water figures
    // while digital meters remain ready for the "Simulate digital meter readings" button!
    var waterReadings = [];
    var readCounter = 1;
    var monthsHistory = [m3, m2, m1];

    waterMeters.forEach(function (meter, idx) {
      var unit = unitSpecs[idx];
      var isStudent = unit.type === 'bedsitter' || unit.type === 'single_room';
      var baseMonthly = unit.status === 'occupied' ? (isStudent ? 4 : 8) : (unit.status === 'under_renovation' ? 2 : 0);
      var running = meter.startingReading;

      monthsHistory.forEach(function (monthStr, mIdx) {
        var inc = baseMonthly === 0 ? 0 : baseMonthly + ((idx + mIdx) % 3);
        running += inc;
        waterReadings.push({
          id: 'wread_' + readCounter++,
          meterId: meter.id,
          month: monthStr,
          reading: running,
          readOn: monthStr + '-26',
          source: meter.type === 'digital' ? constants.READING_SOURCES.DIGITAL_SIMULATED : constants.READING_SOURCES.MANUAL_ENTRY,
          createdAt: createdStamp,
          updatedAt: createdStamp
        });
      });

      // Seed current month for occupied MANUAL meters; inject 1 high usage (possible leak) on u_05 (MB-05)
      if (unit.status === 'occupied' && meter.type === 'manual') {
        var currentInc = unit.id === 'u_05' ? 18 : (baseMonthly + (idx % 2) + 1);
        running += currentInc;
        waterReadings.push({
          id: 'wread_' + readCounter++,
          meterId: meter.id,
          month: m0,
          reading: running,
          readOn: refDate,
          source: constants.READING_SOURCES.MANUAL_ENTRY,
          createdAt: createdStamp,
          updatedAt: createdStamp
        });
      }
    });

    // Payments across the 20 active leases (prior month + partial/full current month so some arrears show)
    var payments = [];
    var payCounter = 1001;
    leases.forEach(function (lease, idx) {
      // Prior month payment (rent + sample water estimate)
      var prevAmount = lease.monthlyRent + 900;
      payments.push({
        id: 'pay_' + payCounter,
        leaseId: lease.id,
        period: m1,
        amount: prevAmount,
        paidOn: m1 + '-05',
        reference: 'DEMO-REF-' + payCounter,
        method: 'manual_entry',
        createdAt: createdStamp,
        updatedAt: createdStamp
      });
      payCounter += 1;

      // Current month payment for first 14 leases (leaving 6 in current-month arrears)
      if (idx < 14) {
        var currAmount = idx === 2 ? Math.round(lease.monthlyRent * 0.6) : lease.monthlyRent + 800;
        payments.push({
          id: 'pay_' + payCounter,
          leaseId: lease.id,
          period: m0,
          amount: currAmount,
          paidOn: m0 + '-04',
          reference: 'DEMO-REF-' + payCounter,
          method: 'manual_entry',
          createdAt: createdStamp,
          updatedAt: createdStamp
        });
        payCounter += 1;
      }
    });

    // Sample MUWASCO payments for prior months
    var muwascoPayments = [
      {
        id: 'muw_01',
        propertyId: 'prop_mumbi',
        month: m1,
        paidOn: m1 + '-28',
        amount: 2200,
        reference: 'MUW-DEMO-501',
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'muw_02',
        propertyId: 'prop_mukuyu',
        month: m1,
        paidOn: m1 + '-28',
        amount: 2600,
        reference: 'MUW-DEMO-502',
        createdAt: createdStamp,
        updatedAt: createdStamp
      }
    ];

    // 5 maintenance requests
    var maintenanceRequests = [
      {
        id: 'maint_01',
        unitId: 'u_05',
        title: 'Suspected toilet cistern leak',
        description: 'Continuous trickle noticed alongside higher monthly meter reading.',
        priority: 'high',
        status: 'open',
        reportedOn: dates.addDays(refDate, -3),
        completedOn: null,
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'maint_02',
        unitId: 'u_07',
        title: 'Kitchen sink trap drip',
        description: 'PVC U-bend seal weeping under sink cabinet.',
        priority: 'medium',
        status: 'open',
        reportedOn: dates.addDays(refDate, -7),
        completedOn: null,
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'maint_03',
        unitId: 'u_14',
        title: 'Window latch replacement',
        description: 'Steel casement latch loose on front window.',
        priority: 'low',
        status: 'open',
        reportedOn: dates.addDays(refDate, -10),
        completedOn: null,
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'maint_04',
        unitId: 'u_25',
        title: 'Bathroom tiling & waterproofing',
        description: 'Scheduled unit renovation before re-letting.',
        priority: 'medium',
        status: 'open',
        reportedOn: dates.addDays(refDate, -15),
        completedOn: null,
        createdAt: createdStamp,
        updatedAt: createdStamp
      },
      {
        id: 'maint_05',
        unitId: 'u_26',
        title: 'Instant shower element replaced',
        description: 'Installed new heating element and tested breaker.',
        priority: 'high',
        status: 'completed',
        reportedOn: dates.addDays(refDate, -20),
        completedOn: dates.addDays(refDate, -18),
        createdAt: createdStamp,
        updatedAt: createdStamp
      }
    ];

    var defTariffs = constants.DEFAULT_TARIFFS || { tenantRatePerM3: 180, tenantFixedCharge: 150, muwascoRatePerM3: 110 };

    return {
      version: constants.SCHEMA_VERSION || 2,
      properties: properties,
      units: units,
      tenants: tenants,
      leases: leases,
      payments: payments,
      maintenanceRequests: maintenanceRequests,
      waterMeters: waterMeters,
      waterReadings: waterReadings,
      muwascoPayments: muwascoPayments,
      tariffSettings: {
        tenantRatePerM3: defTariffs.tenantRatePerM3,
        tenantFixedCharge: defTariffs.tenantFixedCharge,
        muwascoRatePerM3: defTariffs.muwascoRatePerM3,
        updatedAt: createdStamp
      }
    };
  }

  var sampleData = {
    createSampleData: createSampleData
  };

  Makazi.data = Makazi.data || {};
  Makazi.data.sampleData = sampleData;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = sampleData;
  }
})(typeof window !== 'undefined' ? window : globalThis);
