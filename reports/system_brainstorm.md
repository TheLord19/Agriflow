# System Logic & Architecture Brainstorm

**Date**: 2026-01-28
**To**: Commissioner (User)
**Subject**: Honest Breakdown of Logic, IDs, and Data Flow

---

## 1. How do we confirm hashes across different phases?

**The Common Thread: `sack_id`**

- **The Problem**: A Farmer calls it "Paddy Batch", the Mill calls it "Rice Lot", the Shop calls it "Bag".
- **The Fix**: We use **`sack_id`** as the persistent "Golden Thread".
- **Logic**:
  1.  **Farmer Phase**: We create `sack_id = TKN-2026...`. Hash `H1` is created.
  2.  **Milling Phase**: The Miller scans that SAME `sack_id`. We calculate Hash `H2`.
  3.  **Verification**: The system looks up `H1` in the Ledger. If the data matches, we link `H2` to `H1` via `previous_hash`.
- **Result**: We don't just "confirm" hashes; we **chain** them. `H3` contains `H2`, which contains `H1`. You cannot fake Phase 3 without faking Phase 1.

## 2. How is a "Change" tracked in a new block?

**Scenario**:

1.  **Block 10**: `Sack_55` has `weight: 50kg`. (Hash: `abc...`)
2.  **Corruption/Update**: Someone edits the V8 DB to say `weight: 45kg`.
3.  **Detection**:
    - Our `sync_service` waits 3 seconds.
    - It re-hashes the row: `New Hash = def...`
    - It compares `def...` vs `abc...`.
    - **Mismatch Detected!**
4.  **Action**:
    - It does **NOT** overwrite Block 10. (Blockchain is Immutable).
    - It creates **Block 11**.
    - **Block 11 Content**: "UPDATE `Sack_55`: Weight changed from 50kg -> 45kg. Marked as TAMPERED/CORRECTION."
    - **Result**: The Timeline shows _both_ values. The User sees the history of the fraud.

## 3. How to access PgAdmin 4 on Web?

To see the raw tables I created:

1.  **URL**: `http://localhost:81/pgadmin4/`
2.  **Login**: `admin@agriflow.com` / `password`
3.  **Steps inside UI**:
    - Right click `Servers` > `Register` > `Server`.
    - **Name**: `AgriFlow DB`
    - **Connection Tab**:
      - **Host name**: `db`
      - **Username**: `postgres`
      - **Password**: `password`
    - Click Save.
    - Navigate: `AgriFlow DB` > `Databases` > `agriflow` > `Schemas` > `public` > `Tables`.
    - Right click `operational_logs` > `View/Edit Data`.

## 4. Backend Verification Structure

**Design Pattern**: "Shadow Ledger"

- **Source**: V8 SQLite (The "Real World").
- **Mirror**: `sync_service.js` (The "Spy").
- **Ledger**: Postgres (The "Truth").
- **Process**:
  1.  **Spy**: Reads V8 row.
  2.  **Hash**: Generates `SHA-256(row)`.
  3.  **Check**: "Have I seen this hash before?"
  4.  **Write**: If No, write to Postgres `operational_logs`.
  5.  **Chain**: Frontend reads Postgres and builds the "Block".

## 5. The "sk-xxxxx" Mystery & Lifecycle ID

- **Clarification**: I do not generate `sk-xxxxx`.
- **What you likely see**: `TKN-xxxxx` (Token Number) or `REG-xxxxx` (Registry).
- **The Generated ID**:
  - In `sync_service.js`, lines 100-110, I verify: `id: r.token_no` or `id: REG-${r.id}`.
  - **The Single Lifecycle Value**: **`token_no`**.
  - This ID starts at the Farmer (`tokens` table) and travels to PPC (`truck_chits` table) and connects to CMR (`tokens_linking` field). This is the key.

## 6. Logs vs Source DB Discrepancy

**Honest Answer**:

- If you see data in the "Logs" (our Grid) that is NOT in the "Source DB" (V8), it means **Ghost Data** from a previous run was left in the `operational_logs` table.
- **Fix**: I ran `TRUNCATE` commands, so _now_ it should be 100% matched.
- **Exception**: If you have `demo-mode` logic that generates "dummy" rows for visualization (which I removed earlier).
- **Current State**: Only data physically present in `PPC.db`, `CMR.db`, etc., is shown.

## 7. Parameters Copied (The Mapping)

Here is the exact map from the code:

| Phase       | Source Table (SQLite) | Our Field     | Source Field   | Why?               |
| :---------- | :-------------------- | :------------ | :------------- | :----------------- |
| **Farmer**  | `farmers`             | `entity`      | `name`         | Who grew it?       |
| **Farmer**  | `tokens`              | **`sack_id`** | **`token_no`** | **THE MASTER KEY** |
| **PPC**     | `truck_chits`         | `weight_kg`   | `quantity`     | Fraud Check 1      |
| **Quality** | `faq_checks`          | `moisture`    | `moisture`     | Quality Check      |
| **Miller**  | `deport`              | `yield`       | `67%` (Fixed)  | Efficiency Check   |
| **Shop**    | `fps_qrs`             | `status`      | `sold`         | Final Sale         |

---

**Verdict**:
The system relies entirely on `token_no` (Sack ID) passing from table to table. If that link breaks in the source V8 DB, the chain breaks in our Demo.
