import os
import json

# --- CONFIGURATION ---
BACKEND_DIR = "backend"
DB_FILE = "supply_chain.db"

# --- 1. PACKAGE.JSON CONTENT (With Fixes) ---
package_json = {
  "name": "agriflow-backend",
  "version": "2.0.0",
  "description": "Fresh Start Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "socket.io": "^4.7.5",
    "sqlite3": "^5.1.7"
  },
  "overrides": {
    "tar": "6.2.1"
  }
}

# --- 2. SERVER.JS CONTENT (Correct Schema) ---
server_js = """
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- DATABASE SETUP ---
const db = new sqlite3.Database('./supply_chain.db', (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("[SQLITE] Connected. Tables syncing...");
});

db.serialize(() => {
  // 1. FARMER TABLE (GRAINS ONLY - NO SACKS)
  db.run(`CREATE TABLE IF NOT EXISTS farmer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT,
    farmer_name TEXT,
    grain_type TEXT CHECK(grain_type IN ('Sana', 'Dodu')), 
    payload_weight REAL,
    status TEXT DEFAULT 'HARVESTED',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 2. PPC TABLE (SACKS GENERATED HERE)
  db.run(`CREATE TABLE IF NOT EXISTS ppc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sack_id TEXT UNIQUE,
    token_no TEXT,
    farmer_ref_id TEXT,
    weight_kg REAL,
    status TEXT DEFAULT 'WEIGHED',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 3. RICE MILLS
  db.run(`CREATE TABLE IF NOT EXISTS rice_mills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT,
    mill_name TEXT,
    input_sacks TEXT, 
    status TEXT DEFAULT 'MILLING',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 4. CMR
  db.run(`CREATE TABLE IF NOT EXISTS cmr (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_no TEXT,
    truck_no TEXT,
    mill_ref TEXT,
    total_weight REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 5. MLS
  db.run(`CREATE TABLE IF NOT EXISTS mls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    storage_id TEXT,
    zone TEXT,
    stock_in_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 6. FPS
  db.run(`CREATE TABLE IF NOT EXISTS fps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id TEXT,
    allocation_id TEXT,
    distributed_amount REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 7. LEDGER
  db.run(`CREATE TABLE IF NOT EXISTS ledger (
    block_index INTEGER PRIMARY KEY,
    timestamp TEXT,
    prev_hash TEXT,
    merkle_root TEXT,
    ipfs_cid TEXT,
    block_hash TEXT,
    data_payload TEXT
  )`);
  
  console.log("[SQLITE] Schema Ready: Farmer(Grains), PPC(Sacks), Ledger.");
});

// --- HELPER ---
const generateHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

let PENDING_BUFFER = [];
let BLOCK_TIMER = 15;
let IS_CHAIN_BROKEN = false;

// --- API ---
app.post('/api/ingest', (req, res) => {
  if (IS_CHAIN_BROKEN) return res.status(500).json({ error: "HALTED" });

  const { phase, data } = req.body;
  const timestamp = new Date().toISOString();

  if (phase === 'FARMER') {
    const stmt = db.prepare("INSERT INTO farmer (transaction_id, farmer_name, grain_type, payload_weight) VALUES (?, ?, ?, ?)");
    stmt.run(data.id, data.entity, data.quality, data.weight); 
    stmt.finalize();
  } 
  else if (phase === 'PPC') {
    const stmt = db.prepare("INSERT INTO ppc (sack_id, token_no, weight_kg) VALUES (?, ?, ?)");
    stmt.run(data.sack_id, data.token_no, data.weight);
    stmt.finalize();
  }
  // (Other phases map similarly)

  const txRecord = { ...data, phase, timestamp };
  PENDING_BUFFER.push(txRecord);
  io.emit('new_data', txRecord);
  
  res.json({ success: true, hash: generateHash(txRecord) });
});

// --- TIMER LOOP ---
setInterval(() => {
  if (IS_CHAIN_BROKEN) return;
  BLOCK_TIMER--;
  io.emit('timer_tick', BLOCK_TIMER);

  if (BLOCK_TIMER <= 0) {
    if (PENDING_BUFFER.length > 0) anchorBlock();
    BLOCK_TIMER = 15;
  }
}, 1000);

// --- ANCHORING ---
function anchorBlock() {
  const batchData = [...PENDING_BUFFER];
  PENDING_BUFFER = [];

  db.get("SELECT * FROM ledger ORDER BY block_index DESC LIMIT 1", (err, lastBlock) => {
    const prevHash = lastBlock ? lastBlock.block_hash : "0".repeat(64);
    const index = lastBlock ? lastBlock.block_index + 1 : 1;
    
    const ipfsCid = "Qm" + generateHash(batchData).substring(0, 44); 
    const merkleRoot = generateHash(batchData.map(d => generateHash(d)));
    const blockHeader = { index, prevHash, merkleRoot, timestamp: new Date().toISOString() };
    const blockHash = generateHash(blockHeader);

    const stmt = db.prepare("INSERT INTO ledger (block_index, timestamp, prev_hash, merkle_root, ipfs_cid, block_hash, data_payload) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(index, blockHeader.timestamp, prevHash, merkleRoot, ipfsCid, blockHash, JSON.stringify(batchData));
    stmt.finalize();

    io.emit('block_mined', { index, timestamp: blockHeader.timestamp, hash: blockHash, prevHash, ipfsCid, data: batchData });
  });
}

const PORT = 4001;
server.listen(PORT, () => console.log(`[SERVER] Running on Port ${PORT}`));
"""

# --- EXECUTION ---
def create_backend():
    # 1. Create Directory
    if not os.path.exists(BACKEND_DIR):
        os.makedirs(BACKEND_DIR)
        print(f"Created {BACKEND_DIR}/")
    
    # 2. Write package.json
    with open(os.path.join(BACKEND_DIR, "package.json"), "w") as f:
        json.dump(package_json, f, indent=2)
        print("Created package.json")

    # 3. Write server.js
    with open(os.path.join(BACKEND_DIR, "server.js"), "w") as f:
        f.write(server_js)
        print("Created server.js")

    print("\\n--- READY TO START ---")
    print("Run these commands:")
    print(f"1. cd {BACKEND_DIR}")
    print("2. npm install")
    print("3. node server.js")

if __name__ == "__main__":
    create_backend()