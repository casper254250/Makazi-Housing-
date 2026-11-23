# Scope & Limitations — Makazi Offline Prototype

**All names and figures are sample data.**

## 1. Prototype Boundaries

- **No Real Meters, MUWASCO, M-Pesa, or SMS**: This prototype does not connect to real digital meters, MUWASCO systems, M-Pesa, or SMS. Meter readings are simulated or entered by hand, and tariffs are sample figures (NOT official MUWASCO tariffs).
- **Single-Browser Storage (`localStorage`)**: Data is saved locally under key `makazi.v1` in one browser profile on one device. Clearing browser site data removes changes unless exported first via **Data & Limitations → Export JSON backup**.
- **No Security or Authentication**: Anyone with access to the device and browser can view or edit records. There are no user logins, sessions, or role permissions.
- **Synthetic Data Only**: Do not enter real tenant names, national IDs, phone numbers, or real financial records into this prototype.
- **Project-Specific Lease Term Rule (BR6)**: Leases under 24 months are classified as `SHORT_TERM` and leases of 24 months or more as `LONG_TERM`. **This is a project rule, not a statement of Kenyan tenancy law.**

---

## 2. Planned for Future Production Release (Not Implemented)

1. **Smart-Meter Gateway Integration**: Automated telemetry ingestion from physical digital water meters.
2. **Official MUWASCO Tariff & Payment Channel**: Synchronized official utility tariffs and direct bulk payment settlement.
3. **M-Pesa Daraja Integration**: Automated Paybill/STK Push verification and instant receipt matching against combined rent + water invoices.
4. **SMS & Email Alerts**: Automated reminders for due dates, leak warnings, arrears, and expiring leases.
5. **Accounts & Roles**: Authenticated Landlord, Property Manager, and Caretaker accounts with role-based permissions.
6. **Server Database (PostgreSQL)**: Multi-device, concurrent data access with transactional integrity and automated backups.
7. **Automatic Monthly Invoicing**: Scheduled combined rent and water statements.
8. **Document Storage**: Upload and store signed lease PDFs and inspection photos.
9. **Structured Move-In/Move-Out Inspections**: Itemized room checklists linked to deposit deductions.
10. **Dedicated Deposit Escrow Ledger**: Audited refundable deposit sub-accounts.
