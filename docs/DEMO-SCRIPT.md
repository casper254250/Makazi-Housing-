# 12-Step Demonstration Script — Makazi

Use this script when presenting the offline Makazi prototype (Murang'a Town, Kihara Constituency) during coursework evaluation.

1. **Open `index.html`**
   - Double-click `index.html` directly from the file explorer (`file://`).
   - Show the **Dashboard** preloaded with Murang'a sample data: 9 fictional properties, 40 units, 25 tenants (Student vs Community), 20 active leases (2 ending within 60 days), water metrics, and MUWASCO balance owed.

2. **Add a Property and Units**
   - Navigate to **Properties**, click **Add property**, add *Kiharu Springs Court* (`Other` → `Kiharu`, `apartments`).
   - Switch to the **Units** tab, click **Add unit**, and add unit `KS-01` (`1BR`, `KES 11,000`, `vacant`, digital meter `MTR-KS-01`).

3. **Add a Tenant**
   - Navigate to **Tenants**, click **Add tenant**, and create *Daniel Mwangi* (`0700 000 399`, `SIM-100999`, `Community`, `2_years_or_more`).

4. **Create a Lease and Observe Unit Become Occupied**
   - Navigate to **Leases**, select unit `KS-01`, select *Daniel Mwangi*, keep a 12-month date range, and click **Create lease**.
   - Show the `Short-term (< 24m)` classification and project-rule note, and confirm `KS-01` becomes `Occupied`.

5. **Test an Invalid End Date**
   - Return to **Leases**, set **End date** earlier than **Start date**, and submit.
   - Show the inline error and error toast rejecting the invalid date range (BR1).

6. **Record a Payment, Then Repeat the Reference**
   - Navigate to **Rent Records**, select an active lease, enter reference `DEMO-LIVE-01`, and click **Record payment**.
   - Re-submit with `  demo-live-01  ` and show that duplicate-reference validation rejects it (BR4).

7. **Create a Maintenance Request and Mark It Complete**
   - Navigate to **Maintenance**, log *Repair kitchen tap* for unit `KS-01` (`high` priority).
   - Click **Mark complete** and show status changing to `Completed`.

8. **Open Reports, Export JSON, and Reset Sample Data**
   - Navigate to **Reports** to review area occupancy/income, student vs community split, water consumption per property, deposit refund calculator, and **Print report**.
   - Navigate to **Data & Limitations**, verify **Export JSON backup** downloads, and click **Reset to sample data** (or run after step 12 to keep newly simulated data during the water demo!).

9. **Open Water & Meters, Simulate Readings, and See Tenant Water Bills**
   - Navigate to **Water & Meters**, click **Simulate digital meter readings**.
   - Show the simulated readings (`"Digital meter (simulated)"`), consumption (`m3`), **Possible leak** flags (`MB-05`), and calculated tenant water bills.

10. **Inspect Combined Rent + Water Invoice for a Lease**
    - Navigate to **Rent Records** and inspect **Monthly invoice breakdown** to show `Rent + Water bill = Combined invoice` (BR9).

11. **Record a MUWASCO Payment and Inspect Balance & Margin**
    - Return to **Water & Meters**, record a MUWASCO payment (e.g. *Mumbi Comrades Court*, reference `MUW-DEMO-901`), and observe **Balance owed** and **Water margin** update.
    - Attempt to reuse `muw-demo-901` to demonstrate BR10 duplicate rejection.

12. **Try a Lower Meter Reading and See It Rejected**
    - In **Water & Meters → Record manual meter reading**, pick a meter and enter a reading lower than its previous reading (`m3`).
    - Show that BR7 rejects the reading with a clear inline error and toast.
