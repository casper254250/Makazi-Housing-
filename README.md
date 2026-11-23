# Makazi — Smart Rental Property Management System (Offline Prototype)

**Coursework Project:** Murang'a University of Technology — BSc Information Technology (SDLC Prototype)  
**Local Context:** Murang'a Town, Kihara Constituency, Murang'a County, Kenya.  
**Disclaimer:** All names and figures are sample data.

Makazi is an offline-first browser prototype demonstrating core rental property and water-billing management workflows for landlords, property managers, and caretakers. It runs directly from `index.html` over `file://` with **no backend server, no build step, no frameworks, no external CDN dependencies, and no ES module imports**.

---

## How to Run

1. Open the project folder and double-click `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
2. The application loads immediately using `window.Makazi` and seeds synthetic sample data into browser `localStorage` under the versioned key `makazi.v1`.
3. To run the automated unit and integration test suite in Node.js (v18+):
   ```bash
   node --test tests/*.test.js
   ```

---

## Features Implemented

- **Dashboard**: Portfolio KPIs (total/occupied/vacant/renovation units, occupancy %, active leases, combined rent+water collected, water consumed in m3, water billed/collected, MUWASCO balance owed, student vs community occupied split, open repairs), leases ending within 90 days, vacant units list, and recent payments.
- **Properties & Units**: 9 fictional Murang'a properties across Kihara Constituency areas (`Mumbi`, `Mukuyu`, `Township`, `Mjini`, `Kwa Maji`, `VM`, `Mwangaza`, `Frankfort`, `Kabati`, or `Other`), 40 sample units with assigned water meters (`digital` or `manual`), search/filter table, colour-plus-text status badges, and automatic **Needs renovation** flag.
- **Tenants**: Student (`comrade`) vs Community (`family, working person, other`) categorization, search and category filtering, active unit lookup, and per-tenant lease history modal.
- **Leases**: Vacant-unit lease creation (BR2), rent prefill, end-after-start validation (BR1), unit occupied/vacant transitions (BR3), and `SHORT_TERM` (< 24 months) vs `LONG_TERM` (24+ months) classification (BR6) with project-rule note.
- **Rent Records**: Monthly combined **Rent + Water** invoice breakdown (BR9), manual payment recording against combined invoices, trimmed case-insensitive duplicate reference rejection (BR4), cumulative arrears highlighting, and month filter (`YYYY-MM`).
- **Water & Meters**: Editable sample tariffs (NOT official MUWASCO tariffs), one-click **Simulate digital meter readings**, manual meter reading entry enforcing BR7 (cannot be lower than previous) and BR8 (one reading per meter per month), **Possible leak** flagging (> 2× 3-month average), and **MUWASCO payable, payment recording (BR10 unique reference), balance owed, and water margin** tracking.
- **Maintenance**: Log repair requests, filter by status/priority/unit history, and mark requests complete.
- **Reports & Printing**: Occupancy and income per area, student vs community split, water consumption per property, occupancy/income per property, repairs summary, lease term split, Deposit Refund Calculator (BR5), and clean print layout (`css/print.css`).
- **Data & Limitations**: JSON backup export, confirmed reset to synthetic sample data, and explicit prototype limitations.

---

## What Is NOT Implemented (Planned for Production)

This prototype does **not** connect to real digital meters, MUWASCO systems, M-Pesa, or SMS. Meter readings are simulated or entered by hand, and tariffs are sample figures. Planned for production:

- Smart-meter gateway integration
- Official MUWASCO tariff and payment channel
- M-Pesa Daraja API / STK Push integration
- Automated SMS & email alerts
- User accounts, authentication, and role-based access control (RBAC)
- Shared PostgreSQL database and cloud hosting
- Automated monthly invoicing, document uploads, unit inspections, and deposit escrow ledgers
