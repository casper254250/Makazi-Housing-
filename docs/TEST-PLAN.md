# System Test Plan — Makazi Prototype

Run these acceptance test cases in the browser by opening `index.html`. Record observations in the **Actual result / date** column during UAT sign-off.

| ID | Test Case | Steps | Expected Result | Actual result / date |
|---|---|---|---|---|
| **TC1** | Add a property | Open **Properties**, click **Add property**, enter Name, Area (e.g. `Mumbi` or `Other`), Type, and submit. | Property card appears with 0 units and success toast is shown. | |
| **TC2** | Add a unit | Open **Units**, click **Add unit**, select property, enter Unit Number, Type, Rent, Status (`vacant`), and Meter details, and submit. | Unit appears in Units table with formatted KES rent, meter details, and `Vacant` badge. | |
| **TC3** | Add a tenant | Open **Tenants**, click **Add tenant**, enter Full Name, Phone, ID Number, Category (`Student` or `Community`), Intended Stay, and submit. | Tenant appears in Tenants table with category badge and "No active unit". | |
| **TC4** | Lease on a vacant unit with valid dates | Open **Leases**, choose a vacant unit and tenant, enter valid Start Date and later End Date, and click **Create lease**. | Lease is created with `Active` status and term classification; unit status changes to `Occupied`. | |
| **TC5** | Lease with end date before start date | Open **Leases**, enter an End Date earlier than (or equal to) Start Date, and click **Create lease**. | Submission is rejected with an inline error next to End Date and an error toast. | |
| **TC6** | Lease on an occupied unit | Inspect the **Vacant unit** dropdown in **Leases** (and verify via `services.test.js`). | Occupied units are excluded from the dropdown; service-level attempts reject with an "occupied" error. | |
| **TC7** | Record a payment | Open **Rent Records**, select an active lease, confirm combined rent + water amount, enter unique reference (`DEMO-TC-01`), and submit. | Payment is saved in Payment History; combined balance updates immediately. | |
| **TC8** | Repeat a payment reference | In **Rent Records**, submit another payment using ` demo-tc-01 ` (different case/spaces). | Submission is rejected with a duplicate-reference inline error and error toast. | |
| **TC9** | Create a maintenance request | Open **Maintenance**, select a unit, choose priority, enter title and description, and click **Log request**. | Request appears with `Open` badge and priority badge. | |
| **TC10** | Mark maintenance request complete | On an `Open` request in **Maintenance**, click **Mark complete**. | Status updates to `Completed` and `completedOn` date is recorded. | |
| **TC11** | Export data | Open **Data & Limitations** and click **Export JSON backup**. | Browser downloads `makazi-backup-YYYY-MM-DD.json`. | |
| **TC12** | Reset data | Open **Data & Limitations**, click **Reset to sample data**, and confirm. | Original 9-property, 40-unit Murang'a sample dataset is restored. | |
| **TC13** | Simulate digital meter readings | Open **Water & Meters** and click **Simulate digital meter readings**. | Occupied digital meters without a reading for the selected month receive simulated readings and tenant water bills update. | |
| **TC14** | Reject lower meter reading (BR7) | In **Water & Meters**, submit a manual reading lower than the meter's previous reading. | Submission is rejected with an inline error and error toast. | |
| **TC15** | Reject duplicate monthly meter reading (BR8) | In **Water & Meters**, submit a second manual reading for the same meter and month. | Submission is rejected stating a reading for that month already exists. | |
| **TC16** | Combined rent + water invoice (BR9) | Open **Rent Records** and inspect **Monthly invoice breakdown**. | Each active lease shows Rent + Water bill = Combined invoice total. | |
| **TC17** | Record MUWASCO payment & reject duplicate ref (BR10) | In **Water & Meters**, record a MUWASCO payment (`MUW-TC-01`), then repeat the same reference. | First payment reduces MUWASCO balance owed; second is rejected as duplicate. | |
