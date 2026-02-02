# AgriFlow Master Implementation Plan: Production Hardening

This plan consolidates all recent discussions into a single roadmap to bring AgriFlow from 68% to 100% Production Readiness.

---

## Roadmap Progress

- [x] Phase 0: The Production Purge (Remove hackerMode, simulated data)
- [x] Phase 1: IPFS Kubo Integration (Decentralized storage layer)
- [ ] Phase 2: Desktop UI Refinements (3-pane layout, neon glows)
- [ ] Phase 3: Total Security Hardening (HTTPS, TPM, JWT Auth)
- [ ] Phase 4: Final Verification & Performance Audit

---

## 🧹 Phase 0: The Production Purge

**Goal**: Remove all "Fake" or "Browser-Only" logic used for earlier demonstrations.

1.  **Remove `hackerMode`**: Delete the "Simulate Attack" logic in the UI. Live systems do not need a button to break their own chain.
2.  **Deprecate `ipfsStorage` (Browser Memory)**: Replace the local state cache in `SupplyChainDashboard.jsx` with a real `fetch()` call to the IPFS Gateway.
3.  **Remove simulated CIDs**: Stop generating `Qm...` strings via random hashing in `server.js`.
4.  **Auth Hardening**: Replace `isValidator` / `isCommissioner` local toggles with real JWT session verification.
5.  **Clean `localTables`**: Ensure counts and dashboard stats are pulled from the Backend API, not just transient Socket.io events.

---

## 🏗️ Phase 1: Infrastructure & Data Anchoring (IPFS Kubo)

**Goal**: Transition from simulated hashes to real decentralized data availability.

1.  **Docker Expansion**:
    - Add `ipfs/kubo` service to `docker-compose.yml`.
    - Configure persistent volumes for IPFS storage.
2.  **Backend Integration**:
    - Install `kubo-rpc-client`.
    - Update `server.js` to upload block batches to IPFS during mining.
    - Replace simulated CID strings with real cryptographic CIDs from the Kubo node.
3.  **Auditability**:
    - Update Frontend links to open the real local IPFS gateway (`:8080/ipfs/`) for block verification.

---

## 🎨 Phase 2: Power-User Desktop UI

**Goal**: Provide a high-fidelity "Command Center" experience for officials.

1.  **3-Pane Layout**:
    - **Left**: Vertical block timeline (The Immutable Ledger).
    - **Center**: Active Data Inspector (Detailed V8 attributes).
    - **Right**: Inbound Draft Flow (Real-time mempool / Priority Queue).
2.  **Visual Polish**:
    - Implement "Anchoring Glows": High-vibrancy animations when a block is successfully mined.
    - Standardize dark-mode scrollbars across all panes.
3.  **Real-Time Lifecycle**:
    - Professionalize transitions between "DRAFT", "SIGNED", and "MINED" states.

---

## 🔐 Phase 3: Networking & Hardware Security

**Goal**: Protect the chain with industry-standard protocols and hardware-bound keys.

1.  **HTTPS / TLS Integration**:
    - Configure **Nginx** for SSL termination.
    - Setup local self-signed certificates and force all traffic to Port 443.
2.  **TPM (Trusted Platform Module) Simulation**:
    - **Logic**: Mock the interaction with the CPU's security chip.
    - **UX**: During the "Sign Batch" step, require a "Hardware Approval" simulation (Official's private key check).
3.  **Access Control**:
    - Implement JWT tokens for sensitive API endpoints (`/api/reset`, `/api/sign_batch`).

---

## 📋 Legend: Logs vs. Ledger

- **Operational Logs**: Editable Staging Buffer (DRAFT -> SIGNED).
- **Ledger**: Immutable Permanent Vault (MINED).
