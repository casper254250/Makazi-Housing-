# User Guide — Makazi Prototype

All workflows run offline in the browser with synthetic sample data from Murang'a Town, Kihara Constituency. All names and figures are sample data.

---

## 1. Landlord (Portfolio, MUWASCO & Financial Oversight)

1. **Review Portfolio & Water Summary (`Dashboard`)**:
   - View unit occupancy, Student vs Community occupied split, rent+water collected, water consumed (`m3`), water billed/collected, and MUWASCO balance owed.
2. **Manage Properties (`Properties`)**:
   - Click **Add property**, select one of the Murang'a Town areas (`Mumbi`, `Mukuyu`, `Township`, `Mjini`, `Kwa Maji`, `VM`, `Mwangaza`, `Frankfort`, `Kabati`, or `Other` with custom text), select property type, and save.
3. **Monitor MUWASCO Payables & Water Margin (`Water & Meters`)**:
   - Adjust sample tariff rates in **Tariff settings** (clearly labelled as sample figures, not official MUWASCO tariffs).
   - Record bulk utility settlements under **Record MUWASCO payment** (BR10 rejects duplicate references) and review **Balance owed** and **Water margin**.
4. **Review Area & Property Reports (`Reports`)**:
   - Inspect **Occupancy & income per area**, **Student vs Community split**, **Water consumption per property**, repairs, lease term split, and the **Deposit refund calculator** (BR5). Click **Print report** for a paper/PDF copy.

---

## 2. Property Manager (Leasing, Combined Rent + Water Billing)

1. **Manage Units & Meters (`Units`)**:
   - Add or edit units with sample rent figures, unit type (`Bedsitter`, `Single room`, `1BR`, `2BR`, `3BR / maisonette`, `Shop`), and water meter details (`meterNumber`, `digital`/`manual`, `startingReading`).
2. **Register Tenants (`Tenants`)**:
   - Categorize each tenant as **Student (comrade)** or **Community (family, working person, other)**, record intended stay, and inspect lease history.
3. **Create or End Leases (`Leases`)**:
   - Assign vacant units (rent prefills automatically). Ending a lease frees the unit back to `Vacant`.
4. **Collect Combined Rent + Water Invoices (`Rent Records`)**:
   - Review the **Monthly invoice breakdown** (Base Rent + Water Bill = Combined Total, BR9).
   - Record manual demonstration payments (BR4 rejects duplicate references) and follow up on leases highlighted in **Arrears**.

---

## 3. Caretaker (Meter Readings, Leaks & Maintenance)

1. **Capture Monthly Water Readings (`Water & Meters`)**:
   - Click **Simulate digital meter readings** to generate simulated monthly readings for occupied digital-metered units, or enter manual readings using **Record manual meter reading** (BR7 prevents lower readings; BR8 allows one reading per meter per month).
   - Inspect any rows flagged **Possible leak** (usage above double the unit's 3-month average).
2. **Log & Complete Repairs (`Maintenance`)**:
   - Log new repair requests (including suspected leaks), filter by status/priority/unit history, and click **Mark complete** when resolved.
