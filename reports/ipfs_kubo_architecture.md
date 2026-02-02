# Technical Architecture: IPFS Kubo Integration

This document outlines the technical architecture of **Kubo** (the reference implementation of IPFS in Go) and its strategic role in the AgriFlow decentralized ledger.

---

## 🏗️ 1. Core Architectural Paradigm: Content Addressing

Traditional web architectures (HTTP) rely on **Location Addressing**—you ask for data at a specific IP/domain. Kubo shifts this to **Content Addressing**.

- **CID (Content Identifier)**: Every block of data in AgriFlow is passed through a multihash function (SHA-256 by default), generating a unique fingerprint (CID).
- **Immutability**: If a single bit in a 50kg rice bag record is changed, the CID changes entirely. This provides a self-verifying link between the AgriFlow ledger and the physical data.

---

## 🕸️ 2. The Data Structure: Merkle DAG & IPLD

Kubo treats data as a **Directed Acyclic Graph (DAG)**, specifically a **Merkle DAG**.

- **IPLD (InterPlanetary Linked Data)**: This is the data model layer. It allows us to treat AgriFlow batches as linked JSON objects.
- **Deduplication**: If two blocks contain identical data (e.g., repeating farmer profiles), IPFS stores only one instance, drastically reducing the storage footprint for high-volume supply chain logs.

---

## 📡 3. The Networking Stack: libp2p

Kubo is built on **libp2p**, a modular network stack that handles the complexities of peer-to-peer communication.

- **Transport Agnostic**: It works over TCP, QUIC, and WebSockets, ensuring AgriFlow can operate across rural state offices (low bandwidth) and central data centers (high bandwidth).
- **NAT Traversal**: Auto-relay and Hole-punching primitives allow AgriFlow nodes behind government firewalls to communicate without complex port-forwarding.

---

## 🗺️ 4. Routing & Peer Discovery: The DHT

How does Node A find the data uploaded by Node B?

- **Kademlia DHT (Distributed Hash Table)**: Kubo maintains a distributed map of "Who has what".
- **Peer Routing**: The DHT tracks neighboring nodes and their capabilities.
- **Content Routing**: When a block is searched, the DHT finds the closest "Providers" of that specific CID.

---

## 🖥️ 5. Node Infrastructure Types

| Component            | Technical Role                                          | AgriFlow Implementation        |
| :------------------- | :------------------------------------------------------ | :----------------------------- |
| **Full Node (Kubo)** | Hosts full data, validates blocks, participates in DHT. | State HQ / Data Centers.       |
| **Bootstrap Node**   | Known entry points for new nodes to find the network.   | Commissioner's Central Server. |
| **HTTP Gateway**     | Bridges the P2P network to standard browsers (HTTPS).   | Nginx / Front-end integration. |
| **Pinning Service**  | Ensures high-priority data is never garbage-collected.  | Backend `server.js` logic.     |

---

## 🛡️ 6. Strategic Value for Directors

1.  **Tamper-Evidence**: The CID proves "What" the data is, independent of "Where" it came from.
2.  **Zero Single Point of Failure**: Data is replicated across peers. If the central DB goes offline, the IPFS nodes still host the "Ground Truth".
3.  **Audit Integrity**: External auditors can verify CIDs via independent public gateways, decoupling trust from the internal government database.
