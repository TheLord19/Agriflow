# Data Mapping & Architecture Plan

## 1. Data Source Validation

We are strictly determining the "Single Source of Truth" from the V8 SQLite databases located at `/root/telangana/V8/Database/`.
The **Sync Service** (`backend/sync_service.js`) reads directly from these files.

## 2. "SK-xxxxx" ID Generation Mystery

**Current findings:**

- The backend `sync_service.js` does **NOT** generate any "SK-" prefix. It uses the raw `token_no`, `chit_no`, or `qr_code` from the database.
- If you see "SK-" in the UI, it is likely:
  1. **Present in the Source Data:** The `token_no` in `PPC.db` might actually be "SK-123..." (we need to verify this by peeking at the DB).
  2. **UI Formatting:** The frontend might be adding "SK-" for display purposes. (Investigating this now).

## 3. "Take the Entire DB" Strategy

To ensure **100% Authenticity** and that _nothing_ is left behind, we will modify the Sync Service to ingest the **entire raw row** from SQLite into the blockchain ledger, alongside our standardized fields.

**Proposed Change:**

```javascript
// Old Way
const payload = {
  id: row.token_no,
  status: row.status,
};

// New Way (Full Fidelity)
const payload = {
  ...row, // <--- INJECTS EVERY SINGLE COLUMN FROM SOURCE DB
  id: row.token_no, // Standardized ID for looking up
  phase: "FARMER",
};
```

## 4. Table Mapping Schema

Here is the exact list of tables we are copying and how they map to our Ledger.

### Phase 1: Registry (PPC.db)

| Source Table | Source ID | Ledger Event        | Mapped ID |
| :----------- | :-------- | :------------------ | :-------- |
| `farmers`    | `id`      | `FARMER_REGISTERED` | `row.id`  |

### Phase 2: Farmer (PPC.db)

| Source Table | Source ID  | Ledger Event   | Mapped ID      |
| :----------- | :--------- | :------------- | :------------- |
| `tokens`     | `token_no` | `SACK_CREATED` | `row.token_no` |

### Phase 3: Quality Check (PPC.db)

| Source Table | Source ID | Ledger Event           | Mapped ID |
| :----------- | :-------- | :--------------------- | :-------- |
| `faq_checks` | `id`      | `QUALITY_CHECK_PASSED` | `row.id`  |

### Phase 4: Lotting (PPC.db)

| Source Table | Source ID | Ledger Event | Mapped ID    |
| :----------- | :-------- | :----------- | :----------- |
| `lots`       | `lot_no`  | `LOT_FORMED` | `row.lot_no` |

### Phase 5: PPC Dispatch (PPC.db)

| Source Table  | Source ID       | Ledger Event  | Mapped ID           |
| :------------ | :-------------- | :------------ | :------------------ |
| `truck_chits` | `truck_chit_no` | `SACK_LOADED` | `row.truck_chit_no` |

### Phase 6: CMR Milling (CMR.db)

| Source Table | Source ID | Ledger Event          | Mapped ID     |
| :----------- | :-------- | :-------------------- | :------------ |
| `deport`     | `chit_no` | `SACK_PROCESSED_MILL` | `row.chit_no` |

### Phase 7: Warehouse (MLS.db)

| Source Table | Source ID | Ledger Event       | Mapped ID     |
| :----------- | :-------- | :----------------- | :------------ |
| `imports`    | `chit_no` | `STOCK_IN`         | `row.chit_no` |
| `deport`     | `chit_no` | `STOCK_DISPATCHED` | `row.chit_no` |

### Phase 8: FPS (FPS.db)

| Source Table | Source ID | Ledger Event         | Mapped ID     |
| :----------- | :-------- | :------------------- | :------------ |
| `imports`    | `chit_no` | `SACK_RECEIVED_FPS`  | `row.chit_no` |
| `inventory`  | `id`      | `STOCK_AVAILABLE`    | `row.id`      |
| `fps_qrs`    | `qr_code` | `RATION_DISTRIBUTED` | `row.qr_code` |

## 5. Next Steps

1. **Approve this Plan**: Confirm if this mapping covers the "entire db" requirement.
2. **Execute Change**: I will update `sync_service.js` to include `...row` in all payloads.
