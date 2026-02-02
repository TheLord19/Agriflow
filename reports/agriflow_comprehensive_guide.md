# Agriflow: The Comprehensive "Grassroots" Guide

## Introduction

This document is the definitive explanation of the AgriFlow Supply Chain Project. It explains **everything** from the ground up: the physical reality, the digital translation, the cryptographic security, and the software architecture. It is written to be understood by everyone, from farmers to engineers.

---

## Part 1: The Lifecycle (The "Grassroots" Reality)

The system tracks a bag of rice from the soil to the spoon. Here is the step-by-step physical journey and how we capture it.

### **Phase 1: The Farmer (PPC)**

- **Physical Event**: A farmer (Soham) brings 50kg of Paddy to the Paddy Purchase Centre (PPC).
- **Digital Action**: The PPC Operator weighs the bag and generates a **Token**.
- **Data Captured**: `Farmer Name`, `Aadhaar (Masked)`, `Weight`, `Moisture Level`.
- **The Blockchain Event**: "Asset Creation" (Genesis).

### **Phase 2: The Miller (CMR)**

- **Physical Event**: A truck picks up the paddy and takes it to the Mill. The paddy is processed into Rice.
- **Digital Action**: The Miller acknowledges the "Truck Chit" and records the Milling Output.
- **Data Captured**: `Milling Yield`, `Rice Quality`, `Batch ID`.
- **The Blockchain Event**: "Transformation" (Paddy -> Rice).

### **Phase 3: The Warehouse (MLS)**

- **Physical Event**: The Rice is stored in the Central Warehouse (Mandal Level Stockist).
- **Digital Action**: The Warehouse Manager scans the bag into Inventory.
- **Data Captured**: `Zone ID`, `Storage Time`, `Slot Number`.
- **The Blockchain Event**: "Custody Transfer".

### **Phase 4: The Shop (FPS)**

- **Physical Event**: The Rice is sent to the Fair Price Shop (Ration Shop) and sold to a beneficiary.
- **Digital Action**: The Shop Owner scans the QR code and distributes the rice.
- **Data Captured**: `Sale Time`, `Shop ID`.
- **The Blockchain Event**: "Asset Retirement" (End of Life).

---

## Part 2: The Security (How We Trust It)

How do we know the data wasn't changed by a corrupt official? We use **Cryptography**.

### **1. The Digital Fingerprint (SHA-256 Hashing)**

Every time data is entered, we create a mathematical fingerprint of it.

- **Formula**: `Hash = SHA256("Soham" + "50kg" + "Paddy")`
- **Result**: `a591a6d40...` (A unique string of characters).
- **The Rule**: If you change "50kg" to "49kg", the Hash changes strictly to `b782c9...`.
- **Why**: This proves **Integrity**. We know the _Data content_ has not been altered.

### **2. The Digital Signature (ECDSA P-256)**

Just because data is valid doesn't mean it's authorized.

- **The Key**: The System (Node) has a secret "Private Key" that only it knows.
- **The Action**: The Node "Signs" the Hash using this key.
- **Result**: A "Digital Signature" attached to the data.
- **Why**: This proves **Authenticity**. It proves the record came from an authorized device, not a hacker.

### **3. The Chain (Merkle Linking)**

We don't just store records; we chain them.

- **Logic**: Block 10 contains the Hash of Block 9. Block 11 contains the Hash of Block 10.
- **Effect**: If you try to delete Block 9, Block 10's reference breaks. Then Block 11 breaks. The whole chain turns RED.
- **Why**: This proves **Immutability**. You cannot rewrite history.

### **4. The Proof (IPFS)**

For documents (PDF Certificates), we use IPFS (InterPlanetary File System).

- **Logic**: We upload the file to a decentralized network. The network gives us an address based on the file's content (CID).
- **Verification**: If the document changes by one pixel, the address changes. The Ledger always points to the original address.

---

## Part 3: The Technology (How We Built It)

We use a modern, robust "Stack" to run this system.

### **1. The Brain: Backend (Node.js & Express)**

- **What it is**: The server running the logic.
- **What it does**: It listens for data from the SQLite databases (Simulation), calculates the Hashes, Signs them, and writes to the Ledger.

### **2. The Truth: Database (PostgreSQL)**

- **What it is**: An enterprise-grade database engine.
- **What it does**: Stores the `operational_logs` (Raw Events) and the `ledger` (The Blockchain).
- **Security**: We configure it to accept "Append Only" (Add New Rows), but block "Update/Delete".

### **3. The Face: Frontend (React & Tailwind)**

- **What it is**: The Website/Dashboard you see.
- **What it does**: It visualizes the data. It polls the backend every 3 seconds to update the screen live.
- **Features**: Dark Mode, Animations (Framer Motion), and Real-Time Graphs.

### **4. The Container: Infrastructure (Docker)**

- **What it is**: A shipping container for software.
- **What it does**: It wraps the Backend, Frontend, and Database into isolated boxes. This ensures the app works exactly the same on your laptop as it does on the Minister's server.

---

## Part 4: The Simulation Strategy (The Demo)

To show this to the world, we need a demonstration that is both **Real** and **Perfect**.

### **1. The "Golden Path" (95%)**

We pre-load the system with 1,000 "Perfect" tokens.

- **Why**: So the Dashboard looks alive, busy, and full of history.
- **How**: We only import data that has a completed start-to-finish lifecycle. No dead ends.

### **2. The "Live Action" (5%)**

We leave 50 tokens "Incomplete" (stuck at the Warehouse).

- **The Demo Moment**: You open a terminal. You type one SQL command to move a token from Warehouse -> FPS.
- **The Effect**: The audience sees the Block appear **Live** on the screen. The "Lifecycle" bar jumps to 100%.
- **Why**: This proves the system is running in real-time and isn't just a video recording.

---

## Part 5: Final Verification Checklist

1.  **Check Integrity**: Do all blocks show green "SYNCED"? (Means Hashes match).
2.  **Check Lifecycle**: Does Token `TKN-20260117-596D` show all 4 stages (PPC->CMR->MLS->FPS)?
3.  **Check IPFS**: Does the QR code scan to a real URL with a matching Hash?
4.  **Check Security**: Can you verify that an `UPDATE` command fails or triggers a "TAMPERED" alert?
