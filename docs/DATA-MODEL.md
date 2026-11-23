# Data Model — Makazi

All records are stored as JSON arrays/objects inside `localStorage` under key `makazi.v1` (schema version `2`). Every entity record includes `id`, `createdAt`, and `updatedAt`. All names and figures are sample data.

---

## Entities & Fields

### 1. Property
| Field | Type | Notes |
|---|---|---|
| `name` | string | Fictional property name |
| `area` | enum | `Mumbi`, `Mukuyu`, `Township`, `Mjini`, `Kwa Maji`, `VM`, `Mwangaza`, `Frankfort`, `Kabati`, `Other` |
| `areaOther` | string | Free-text area name when `area === 'Other'` |
| `location` | string | Full display location in Murang'a Town, Kihara Constituency |
| `type` | enum | `student_bedsitter_block`, `apartments`, `maisonette_bungalow`, `hostel`, `commercial` |

### 2. Unit
| Field | Type | Notes |
|---|---|---|
| `propertyId` | string (FK) | References `Property.id` |
| `unitNumber` | string | Unique within a property |
| `type` | enum | `bedsitter`, `single_room`, `1BR`, `2BR`, `3BR_maisonette`, `shop` |
| `monthlyRent` | number | Positive integer in KES (sample figures, editable) |
| `status` | enum | `vacant`, `occupied`, `under_renovation` |
| `lastRenovated` | string \| null | `YYYY-MM-DD` or `null` |
| `notes` | string | Optional unit notes |

### 3. WaterMeter (`waterMeters`)
| Field | Type | Notes |
|---|---|---|
| `unitId` | string (FK) | References `Unit.id` (one meter per unit) |
| `meterNumber` | string | Meter identifier (e.g. `MTR-MB-01`) |
| `type` | enum | `digital`, `manual` |
| `startingReading` | number | Initial reading in cubic metres (`m3`) |

### 4. WaterReading (`waterReadings`)
| Field | Type | Notes |
|---|---|---|
| `meterId` | string (FK) | References `WaterMeter.id` |
| `month` | string | Billing month `YYYY-MM` (BR8: max 1 reading per meter per month) |
| `reading` | number | Cumulative meter reading in `m3` (BR7: `>=` previous reading) |
| `readOn` | string | `YYYY-MM-DD` |
| `source` | string | `"Digital meter (simulated)"` or `"Manual entry"` |

### 5. Tenant
| Field | Type | Notes |
|---|---|---|
| `fullName` | string | Synthetic tenant name |
| `phone` | string | Synthetic contact phone |
| `idNumber` | string | Synthetic ID / reference number |
| `category` | enum | `student` ("Student (comrade)") or `community` ("Community (family, working person, other)") |
| `nextOfKinName` | string | Optional emergency contact name |
| `nextOfKinPhone` | string | Optional emergency contact phone |
| `intendedStay` | enum | `under_2_years`, `2_years_or_more`, `unsure` |

### 6. Lease
| Field | Type | Notes |
|---|---|---|
| `unitId` | string (FK) | References `Unit.id` |
| `tenantId` | string (FK) | References `Tenant.id` |
| `startDate` | string | `YYYY-MM-DD` |
| `endDate` | string | `YYYY-MM-DD` (BR1: strictly after `startDate`) |
| `monthlyRent` | number | Agreed monthly rent in KES |
| `deposit` | number | Refundable security deposit held in KES |
| `status` | enum | `active`, `ended` |
| `termType` | enum | `SHORT_TERM` (< 24 months) or `LONG_TERM` (24+ months) |

### 7. Payment
| Field | Type | Notes |
|---|---|---|
| `leaseId` | string (FK) | References `Lease.id` (recorded against combined rent + water invoice) |
| `period` | string | Billing month `YYYY-MM` |
| `amount` | number | Positive integer in KES |
| `paidOn` | string | `YYYY-MM-DD` |
| `reference` | string | Unique demonstration reference (BR4) |
| `method` | string | `manual_entry` ("Manual entry only") |

### 8. MuwascoPayment (`muwascoPayments`) & TariffSettings (`tariffSettings`)
- `MuwascoPayment`: `propertyId` (FK), `month` (`YYYY-MM`), `paidOn` (`YYYY-MM-DD`), `amount` (KES), `reference` (BR10 unique).
- `TariffSettings`: `tenantRatePerM3`, `tenantFixedCharge`, `muwascoRatePerM3`, `updatedAt` (sample figures only, NOT official MUWASCO tariffs).

### 9. MaintenanceRequest
| Field | Type | Notes |
|---|---|---|
| `unitId` | string (FK) | References `Unit.id` |
| `title` | string | Short repair summary |
| `description` | string | Optional details |
| `priority` | enum | `low`, `medium`, `high` |
| `status` | enum | `open`, `completed` |
| `reportedOn` | string | `YYYY-MM-DD` |
| `completedOn` | string \| null | `YYYY-MM-DD` when completed |
