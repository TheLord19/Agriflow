# 🌾 AgriFlow: Nation-Scale Hybrid Supply Chain

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)](https://www.postgresql.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Hybrid%20(Inline%2BIPFS)-orange)]()

**AgriFlow** is a next-generation supply chain integrity system designed for the Telangana Government. It solves the "Blockchain Scalability Paradox" by utilizing a **Hybrid Architecture** that combines the speed of a traditional database with the immutable trust of a cryptographic ledger.

---

## 📖 Table of Contents
- [The Core Philosophy](#-the-core-philosophy)
- [Architecture: Inline + IPFS](#-architecture-inline--ipfs)
- [Technical Stack](#-technical-stack)
- [Operational Workflow](#-operational-workflow)
- [Key Features & Business Logic](#-key-features--business-logic)
- [Roles & Governance](#-roles--governance)
- [Deployment Guide (A-Z)](#-deployment-guide-a-z)
- [Future Roadmap](#-future-roadmap)

---

## 💡 The Core Philosophy

### The Problem
1.  **Public Blockchains are Slow:** Storing millions of daily sack movements on Ethereum/Hyperledger creates massive bottlenecks and gas costs.
2.  **Databases are Insecure:** Standard SQL databases are fast, but "Trusted." A corrupt administrator with root access can alter weights, delete theft records, or manipulate inventory without detection.

### The Solution
AgriFlow assumes the database is **compromised by default**. We use a dual-layer approach:
> **"Speed Off-Chain, Truth On-Chain."**

---

## 🏗 Architecture: Inline + IPFS

We split the system into two synchronized layers to achieve high throughput and cryptographic integrity.

### 1. Layer 1: The Speed Layer (Inline Postgres)
* **Role:** Acts as the high-speed "Mempool" or Operational Database.
* **Data:** Stores full, rich JSON payloads (Farmer Name, Land ID, Exact Weights, Moisture Levels).
* **Performance:** Millisecond writes, instant search, real-time dashboarding.
* **Location:** `operational_logs` table in PostgreSQL.

### 2. Layer 2: The Truth Layer (Simulated IPFS/Ledger)
* **Role:** Acts as the "Digital Seal" and Immutable History.
* **The Magic:** Every 15 seconds (Batch Window), the system bundles new data, creates a JSON snapshot, and generates a **Content Identifier (CID)**.
* **The Anchor:** We calculate a **Merkle Root Hash** (SHA-256) of the batch. Only this Hash and the CID are stored in the Ledger.
* **Security:** If a single byte is changed in Layer 1, the Hash in Layer 2 breaks. The system UI immediately flags the data as **TAMPERED (Red Tinge)**.

---

## 🛠 Technical Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React + Vite + Tailwind | The "Single Pane of Glass" Dashboard. Features 8 complex modals for deep inspection and real-time visualization. |
| **Backend** | Node.js + Express | The logic engine. Handles data ingestion, Merkle hashing, mining simulation, and API routes. |
| **Database** | PostgreSQL | Hybrid storage. Uses Relational tables for indexing (`id`, `phase`) and `JSONB` for flexible asset data. |
| **Real-Time** | Socket.io | Bi-directional link. Syncs the "15s Timer" and "Pending Batch" across all clients instantly. |
| **Security** | SHA-256 | Industry-standard cryptography for data integrity. |

---

## 🔄 Operational Workflow

1.  **Ingest (The Edge):**
    * Data enters via API from Farmers, Mills, or FPS.
    * **Logic Gating:** System checks variety (Sanna vs Doddu) and applies yield physics.
    * Status: `PENDING` (Visible in Dashboard Buffer).

2.  **Consensus (The Buffer):**
    * Data sits in the "Mempool" for 15 seconds.
    * **Validator Node** can view incoming data and issue corrections *before* anchoring if necessary.

3.  **Anchoring (The Mining Event):**
    * **Bundle:** Pending rows are gathered into a Block.
    * **Hash:** SHA-256 Merkle Root calculated.
    * **Seal:** Block Header `{ PrevHash, CurrentHash, DataCID }` written to `ledger` table.
    * **Flush:** Pending window clears. Block appears in Immutable Grid.

4.  **Verification (The Audit):**
    * Dashboard fetches Block Header.
    * Uses CID to fetch data from storage.
    * Re-hashes data locally. **Match = Green (Synced), Mismatch = Red (Tampered).**

---

## ⚡ Key Features & Business Logic

* **Smart Yield Tracking:**
    * The system enforces physics. **100kg Paddy** at entry must result in **~67kg Rice** at exit. Deviations trigger fraud alerts.
* **Variety Filtering:**
    * **Sanna Rakkam (Fine):** Allowed to proceed to Warehouse/FPS.
    * **Doddu Rakkam (Coarse):** Automatically filtered at the Mill (diverted to buffer stock).
* **The "Broken Eraser":**
    * Data is **Append-Only**. There is no "Edit" or "Delete".
    * Corrections are new, signed transactions that reference the error, creating a transparent audit trail.
* **Visual Trust Indicators:**
    * **Payment Released:** Badge appears only when data is Anchored + Integrity Verified.
    * **Red Tinge:** Rows that have been tampered with in the DB turn red immediately.

---

## 👤 Roles & Governance

| Role | Access Level | Credentials (Demo) |
| :--- | :--- | :--- |
| **Viewer / Auditor** | Read-Only. Can view logs, inspect blocks, and download PDFs. | *No Login Required* |
| **Validator Node** | **Authority.** Can force-anchor blocks (skip timer) and issue Corrections. | Password: `admin` |
| **Commissioner** | **Super Admin.** Has the "Kill Switch" to reset the blockchain in disaster scenarios. | Password: `superadmin` |

---

## 🚀 Deployment Guide (A-Z)

Follow these steps to deploy AgriFlow on a fresh Ubuntu Server (AWS EC2 / DigitalOcean).

### Phase 1: Environment Prep
```bash
# 1. Update System
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v18+)
curl -fsSL [https://deb.nodesource.com/setup_18.x](https://deb.nodesource.com/setup_18.x) | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib   




Phase 2: Database Setup
Bash
# Enter Postgres CLI
sudo -u postgres psql

# Run inside SQL prompt:
CREATE DATABASE agriflow;
CREATE USER admin WITH ENCRYPTED PASSWORD 'password'; -- Change this in production
GRANT ALL PRIVILEGES ON DATABASE agriflow TO admin;
\q
Phase 3: Backend Deployment
Bash
# Navigate to backend and install
cd /var/www/agriflow/backend
npm install

# Install Process Manager (PM2) to keep server alive
sudo npm install -g pm2
pm2 start server.js --name "agriflow-api"
pm2 save
pm2 startup
Backend is now running on Port 4001.

Phase 4: Frontend Deployment
Bash
# Navigate to frontend and build
cd /var/www/agriflow/frontend
npm install
npm run build
# The optimized app is now in the /dist folder
Phase 5: Nginx Reverse Proxy
Install Nginx to serve the React app and proxy API requests.

Bash
sudo apt install nginx
Config (/etc/nginx/sites-available/default):

Nginx
server {
    listen 80;
    server_name your-ip-or-domain;

    # Serve React Frontend
    location / {
        root /var/www/agriflow/frontend/dist;
        try_files $uri /index.html;
    }

    # Proxy API Requests to Node Backend (Port 4001)
    location /api/ {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    # Proxy Socket.io
    location /socket.io/ {
      proxy_pass http://localhost:4001;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
}
Restart Nginx: sudo systemctl restart nginx