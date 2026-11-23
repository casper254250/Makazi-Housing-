(function (root) {
  'use strict';

  var Makazi = root.Makazi || (typeof require !== 'undefined' ? require('./namespace') : {});

  var CONSTANTS = {
    STORAGE_KEY: 'makazi.v1',
    SCHEMA_VERSION: 2,
    CURRENCY_CODE: 'KES',
    PROJECT_TERM_RULE_MONTHS: 24,
    PROJECT_TERM_RULE_NOTE: 'This is a project rule, not a statement of Kenyan tenancy law.',
    SAMPLE_DATA_NOTE: 'All names and figures are sample data.',
    TARIFF_DISCLAIMER: 'Sample figures only — NOT official MUWASCO tariffs.',
    LEASE_EXPIRY_ALERT_DAYS: 90,
    RENOVATION_THRESHOLD_YEARS: 3,

    PROPERTY_AREAS: [
      { value: 'Mumbi', label: 'Mumbi' },
      { value: 'Mukuyu', label: 'Mukuyu' },
      { value: 'Township', label: 'Township' },
      { value: 'Mjini', label: 'Mjini' },
      { value: 'Kwa Maji', label: 'Kwa Maji' },
      { value: 'VM', label: 'VM' },
      { value: 'Mwangaza', label: 'Mwangaza' },
      { value: 'Frankfort', label: 'Frankfort' },
      { value: 'Kabati', label: 'Kabati' },
      { value: 'Other', label: 'Other' }
    ],

    PROPERTY_TYPES: [
      { value: 'student_bedsitter_block', label: 'Student bedsitter block' },
      { value: 'apartments', label: 'Apartments' },
      { value: 'maisonette_bungalow', label: 'Maisonette / Bungalow' },
      { value: 'hostel', label: 'Hostel' },
      { value: 'commercial', label: 'Commercial' }
    ],

    UNIT_TYPES: [
      { value: 'bedsitter', label: 'Bedsitter (for students)', sampleRange: 'KES 5,500–7,500' },
      { value: 'single_room', label: 'Single room', sampleRange: 'KES 3,500–5,000' },
      { value: '1BR', label: '1 bedroom', sampleRange: 'KES 9,000–13,000' },
      { value: '2BR', label: '2 bedroom', sampleRange: 'KES 14,000–20,000' },
      { value: '3BR_maisonette', label: '3 bedroom / maisonette', sampleRange: 'KES 22,000–30,000' },
      { value: 'shop', label: 'Shop', sampleRange: 'KES 8,000–15,000' }
    ],

    UNIT_STATUSES: {
      VACANT: 'vacant',
      OCCUPIED: 'occupied',
      UNDER_RENOVATION: 'under_renovation'
    },

    TENANT_CATEGORIES: [
      { value: 'student', label: 'Student (comrade)' },
      { value: 'community', label: 'Community (family, working person, other)' }
    ],

    INTENDED_STAYS: [
      { value: 'under_2_years', label: 'Under 2 years' },
      { value: '2_years_or_more', label: '2 years or more' },
      { value: 'unsure', label: 'Unsure' }
    ],

    LEASE_STATUSES: {
      ACTIVE: 'active',
      ENDED: 'ended'
    },

    LEASE_TERMS: {
      SHORT_TERM: 'SHORT_TERM',
      LONG_TERM: 'LONG_TERM'
    },

    METER_TYPES: [
      { value: 'digital', label: 'Digital meter' },
      { value: 'manual', label: 'Manual meter' }
    ],

    READING_SOURCES: {
      DIGITAL_SIMULATED: 'Digital meter (simulated)',
      MANUAL_ENTRY: 'Manual entry'
    },

    DEFAULT_TARIFFS: {
      tenantRatePerM3: 180,
      tenantFixedCharge: 150,
      muwascoRatePerM3: 110
    },

    PAYMENT_METHODS: [
      { value: 'manual_entry', label: 'Manual entry only' }
    ],

    MAINTENANCE_PRIORITIES: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high'
    },

    MAINTENANCE_STATUSES: {
      OPEN: 'open',
      COMPLETED: 'completed'
    }
  };

  Makazi.core = Makazi.core || {};
  Makazi.core.constants = CONSTANTS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
  }
})(typeof window !== 'undefined' ? window : globalThis);
