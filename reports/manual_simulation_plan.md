# Manual Simulation Mode Plan

## Goal

Transition the AgriFlow backend to permanently watch a "Simulation" set of databases. This allows the user to manually insert SQL records (one by one) during a live demo, causing the Dashboard to update in real-time, matching the "Farmer to Plate" narrative.

## 1. Architecture Change

- **Current State**: Backend watches `/root/telangana/V8/Database/` (Static, full data).
- **Target State**: Backend watches `/root/telangana/V8/Simulation/` (Initially Empty).
- **Action**:
  1.  Ensure `V8/Simulation` exists and has empty tables (Schema only).
  2.  Hardcode `V8_DB_PATH` in `sync_service.js` to point to `/root/telangana/V8/Simulation/` (or use a persistent ENV var).
  3.  Truncate the main Postgres Ledger so the Dashboard starts clean (0 blocks).

## 2. The "Play Button" Logic

- The "Play" button in the UI (`Slideshow.jsx` -> `SupplyChainDashboard.jsx`) simply starts the Polling Interval in the frontend code.
- **Real Behavior**: The backend _always_ polls. The Frontend "Play" button just unhides the dashboard or starts the auto-refresh of the API calls.
- **Manual Control**:
  - The user types an SQL command in the terminal.
  - `sync_service.js` (running in background) sees the new row.
  - It inserts into Postgres.
  - The Dashboard (polling every 2s) sees the new block and animates it.

## 3. Manual SQL Sequence (The "Script")

During the demo, the user will run `sqlite3` commands manually. We will prepare a "Cheat Sheet" of these commands for the Golden Record (`TKN-20260117-596D`).

### Phase 1: Farmer Registration

```sql
sqlite3 /root/telangana/V8/Simulation/PPC.db
INSERT INTO farmers (id, name, surname, mobile, survey_no, aadhaar, gender) VALUES ('FMR-999', 'Soham', 'Demo', '9999999999', 'SVY-101', 'XXXXXXXX1234', 'Male');
```

_Effect: "Farmer Registered" block appears._

### Phase 2: Input Generation (Sack/Token)

```sql
INSERT INTO tokens (id, token_no, status, created_at, farmer_id) VALUES ('TKN-001', 'TKN-DEMO-LIVE', 'ACTIVE', datetime('now'), 'FMR-999');
```

_Effect: "Sack Created" block appears._

### Phase 3: Quality Check

```sql
INSERT INTO faq_checks (id, token_no, moisture, foreign_matter, status) VALUES ('QC-001', 'TKN-DEMO-LIVE', 12.5, 0.5, 'PASSED');
```

_Effect: "Quality Verified" block appears._

_(...and so on for Truck Loading, Milling, Warehouse, FPS)_

## 4. Verification Steps

1.  **Stop Backend**: Kill existing process.
2.  **Clean Slate**: Truncate Postgres & Empty Simulation DBs.
3.  **Start Backend**: Run pointing to Simulation DB.
4.  **Test**: Run Step 1 SQL manually. Verify Dashboard update.
