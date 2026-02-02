# Scrum Artifact: Supply Chain Project Retrospective
**Methodology**: Scrum (2-Week Sprints Simulated as 6-Hour Blocks)  
**Roles**:  
-   **Product Owner**: User  
-   **Scrum Master/Dev**: Antigravity

---

## 🏃 Sprint 1: Foundation & Connectivity (Hours 0-6)
**Goal**: Establish a stable environment where Frontend and Backend communicate flawlessly.

| ID | Epic | User Story | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SP1-1** | Infrastructure | As a Dev, I want to fix CORS errors so the UI can fetch data. | Status indicator in UI shows "Online" (Green). | ✅ **DONE** |
| **SP1-2** | Infrastructure | As a Dev, I need safe DB connections. | `pg` pool connects to `agriflow` DB without error. | ✅ **DONE** |
| **SP1-3** | UI/UX | As a User, I want to see the system status. | Sidebar displays "Postgres Node" status. | ✅ **DONE** |

---

## 🏃 Sprint 2: Core Verification Logic (Hours 6-12)
**Goal**: Enable the "Dual-Verification" workflow for the ground truth vs blockchain truth.

| ID | Epic | User Story | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SP2-1** | Integrity | As a Validator, I want to compare Physical Input vs Digital Record. | Header Search opens a Split-View Modal. | ✅ **DONE** |
| **SP2-2** | Integrity | As a Validator, I need critical corrections to be prioritized. | Corrected items appear at the TOP of the Batch stack. | ✅ **DONE** |
| **SP2-3** | UX | As a User, I want a clean, professional interface. | Dark scrollbars, 300px QR Codes, detailed IPFS loader. | ✅ **DONE** |

---

## 🏃 Sprint 3: Real-Time Data Integration (Hours 12-18)
**Goal**: Integrate Legacy V8 Systems with the modern Blockchain Ledger.

| ID | Epic | User Story | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SP3-1** | Migration | As a PM, I want data from V8 SQLite apps to appear in my Dashboard. | `sync_service.js` polls DBs every 3s. | ✅ **DONE** |
| **SP3-2** | Data Quality | As an Architect, I need to preserve history when data changes. | Edits in V8 create *new versions* in Postgres (Append-Only). | ✅ **DONE** |
| **SP3-3** | Clarity | As a User, I want to understand the Hash Links. | Labels renamed: "Block Root" & "Previous Block Hash". | ✅ **DONE** |

---

## 🏃 Sprint 4: Resilience & Governance (Hours 18-24)
**Goal**: Provide tools for Disaster Recovery and Admin Management.

| ID | Epic | User Story | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SP4-1** | Resilience | As a User, I want to track data when the blockchain is down. | "Pending Batch" renamed to "OFFLINE BUFFER" when paused. | ✅ **DONE** |
| **SP4-2** | Governance | As a Commissioner, I need a "Kill Switch" to reset the chain. | Red "RESET CHAIN" button visible only to Commissioner. | ✅ **DONE** |
| **SP4-3** | Knowledge | As a Stakeholder, I want to understand IPFS Deep Tech. | Delivery of `ipfs_architecture.md`. | ✅ **DONE** |

---

## 🚀 Sprint 5: Expansion (Planned Next)
**Goal**: Expand data coverage to 100% of V8 Tables.

| ID | Epic | User Story | Status |
| :--- | :--- | :--- | :--- |
| **SP5-1** | Ingestion | Map `faq_checks` (Quality) table from PPC.db. | 📋 **TODO** |
| **SP5-2** | Ingestion | Map `lots` and `farmers` full details. | 📋 **TODO** |
| **SP5-3** | Security | Implement API Keys for Ingest Endpoint. | 📋 **TODO** |
