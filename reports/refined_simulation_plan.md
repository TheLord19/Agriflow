# Refined Simulation & Data Ingestion Plan

## 1. Goal

Transition the entire project to a **"Pure Simulation" Architecture**.

- **Data Source**: We will create a fresh set of SQLite databases (`V8/Simulation_Refined`).
- **Data Content**: Only specific tables will be copied from the Source V8 DBs. No other data will exist.
- **Backend Logic**: The `sync_service.js` will be permanently pointed to this new location.

## 2. Table Selection (Strict Scope)

We will replicate **ONLY** these tables. All other tables will be ignored.

| Database | Tables to Include (Exact Names)                          |
| :------- | :------------------------------------------------------- |
| **PPC**  | `farmers`, `tokens`, `truck_chits`, `lots`, `faq_checks` |
| **CMR**  | `deport`, `FRK_blending`, `paddy_consignments`           |
| **MLS**  | `imports`, `deport`, `lotting`                           |
| **FPS**  | `imports`, `inventory`, `fps_qrs`                        |

## 3. Data Ingestion Strategy ("Golden Path Enforcement")

Instead of forcing 100% of raw data, we will **Curate** the data to ensure **every single record** in the simulation DB represents a success story.

1.  **Filter for Completeness**: We will write a script to identify _only_ the tokens that have a completed lifecycle (Farmer -> Mill -> Warehouse -> FPS).
2.  **Prune Dead Ends**: Any partial records (e.g., a Farmer token that never reached the Mill) will be excluded.
3.  **Result**: Every ID the user picks in the demo will yield a perfect, full history result. No "data not found" errors.

## 4. The "95% + 5%" Manual Entry Model

To demonstrate the system is "live":

1.  **Pre-load 95%**: We populate the bulk of these "Golden Records" so the Dashboard looks busy and rich with history.
2.  **The "Last Mile" (5%)**:
    - We intentionally **leave out** the final step (e.g., the FPS Sale) for a specific set of tokens (e.g., the "Demo Set").
    - **During the Demo**: You manually run the SQL command to "complete" this lifecycle.
    - **Effect**: The audience sees an _incomplete_ history suddenly become _complete_ in real-time.

## 4. Execution Plan (The "Shift")

### Phase 1: Database Reconstruction

1.  **Create New Path**: `/root/telangana/V8/Simulation_Final/`
2.  **Schema Only**: Create empty DB files for PPC, CMR, MLS, FPS.
3.  **Data Injection**: Run a one-time script to copy **all rows** from the targeted tables (Source -> Simulation_Final).

### Phase 2: Backend Reconfiguration

1.  Modify `sync_service.js` to **ONLY** read from the tables listed above. (Currently, it reads most, but we will strictly prune any extra logic).
2.  Hardcode the path to `/root/telangana/V8/Simulation_Final/`.
3.  Restart Backend.

### Phase 3: Verification

1.  **Golden Record Check**: We will search for `TKN-20260119-1268` in the Dashboard. It should appear immediately because the data is pre-loaded.
2.  **Scrollbar Check**: View verification window for this token.
3.  **Lifecycle Check**: Confirm it shows Farmer -> Plate flow.

## 5. Manual "One by One" Option

- If you still want to add data manually:
  - We can leave the databases **EMPTY** initially (Schema only).
  - I will provide the **SQL Commands** to insert the data for `TKN-20260119-1268` manually.
  - _Recommendation_: For the best demo, we can pre-load 95% of data, and let you manually insert the **last few steps** (or a brand new token) to show it appearing live.

**Awaiting Confirmation:**

- Do you want the Simulation DBs to be **Pre-filled** with all source data (for browsing)?
- OR **Empty** (so you can build it from scratch manually)?
  _(Based on your request "take equal portions... completely ingested", I assume Pre-filled)._
