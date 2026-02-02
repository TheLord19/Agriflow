
import os
import time
import subprocess
import platform
import signal

BACKEND_DIR = "backend"
DB_FILE = os.path.join(BACKEND_DIR, "supply_chain.db")

# --- 1. THE ROBUST SERVER CODE (With detailed logs) ---
server_code = """
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

// --- DB CONNECTION ---
const db = new sqlite3.Database('./supply_chain.db', (err) => {
  if (err) {
    console.error("!!! DB CONNECTION ERROR:", err.message);
  } else {
    console.log("[SQLITE] Connection Established.");
    initSchema();
  }
});

function initSchema() {
  console.log("[SQLITE] Starting Schema Creation...");
  
  db.serialize(() => {
    // 1. FARMER
    db.run(`CREATE TABLE IF NOT EXISTS farmer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT,
      farmer_name TEXT,
      grain_type TEXT, 
      payload_weight REAL,
      status TEXT DEFAULT 'HARVESTED',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
       if(err) console.log("Error creating FARMER:", err);
       else console.log("   -> Farmer Table: OK");
    });

    // 2. PPC
    db.run(`CREATE TABLE IF NOT EXISTS ppc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sack_id TEXT UNIQUE,
      token_no TEXT,
      farmer_ref_id TEXT,
      weight_kg REAL,
      status TEXT DEFAULT 'WEIGHED',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
       if(err) console.log("Error creating PPC:", err);
       else console.log("   -> PPC Table: OK");
    });

    // 3. MILLS
    db.run(`CREATE TABLE IF NOT EXISTS rice_mills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT,
      mill_name TEXT,
      status TEXT DEFAULT 'MILLING',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
       if(err) console.log("Error creating MILLS:", err);
       else console.log("   -> Mills Table: OK");
    });

    // 4. CMR
    db.run(`CREATE TABLE IF NOT EXISTS cmr (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT,
      truck_no TEXT,
      mill_ref TEXT,
      total_weight REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
       if(err) console.log("Error creating CMR:", err);
       else console.log("   -> CMR Table: OK");
    });

    // 5. MLS
    db.run(`CREATE TABLE IF NOT EXISTS mls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storage_id TEXT,
      zone TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
       if(err) console.log("Error creating MLS:", err);
       else console.log("   -> MLS Table: OK");
    });

    // 6. FPS
    db.run(`CREATE TABLE IF NOT EXISTS fps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id TEXT,
      allocation_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
       if(err) console.log("Error creating FPS:", err);
       else console.log("   -> FPS Table: OK");
    });

    // 7. LEDGER
    db.run(`CREATE TABLE IF NOT EXISTS ledger (
      block_index INTEGER PRIMARY KEY,
      timestamp TEXT,
      prev_hash TEXT,
      merkle_root TEXT,
      ipfs_cid TEXT,
      block_hash TEXT,
      data_payload TEXT
    )`, (err) => {
       if(err) console.log("Error creating LEDGER:", err);
       else console.log("   -> Ledger Table: OK");
       console.log("[SQLITE] Schema Initialization Complete.");
    });
  });
}

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

  // Simple Router
  if (phase === 'FARMER') {
    const stmt = db.prepare("INSERT INTO farmer (transaction_id, farmer_name, grain_type, payload_weight) VALUES (?, ?, ?, ?)");
    stmt.run(data.id, data.entity, data.quality, data.weight, (err) => { if(err) console.log(err) });
    stmt.finalize();
  } 
  else if (phase === 'PPC') {
    const stmt = db.prepare("INSERT INTO ppc (sack_id, token_no, weight_kg) VALUES (?, ?, ?)");
    stmt.run(data.sack_id, data.token_no, data.weight, (err) => { if(err) console.log(err) });
    stmt.finalize();
  }
  // (Other phases implied for brevity)

  const txRecord = { ...data, phase, timestamp };
  PENDING_BUFFER.push(txRecord);
  io.emit('new_data', txRecord);
  
  console.log(`[INGEST] Received ${phase} Data`);
  res.json({ success: true, hash: generateHash(txRecord) });
});

// --- TIMER ---
setInterval(() => {
  if (IS_CHAIN_BROKEN) return;
  BLOCK_TIMER--;
  io.emit('timer_tick', BLOCK_TIMER);
  if (BLOCK_TIMER <= 0) {
    if (PENDING_BUFFER.length > 0) anchorBlock();
    BLOCK_TIMER = 15;
  }
}, 1000);

// --- ANCHOR ---
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

    console.log(`[MINED] Block #${index} | Hash: ${blockHash.substring(0, 10)}...`);
    io.emit('block_mined', { index, timestamp: blockHeader.timestamp, hash: blockHash, prevHash, ipfsCid, data: batchData });
  });
}

const PORT = 4001;
server.listen(PORT, () => {
    console.log(`[SERVER] Ready on port ${PORT}`);
});
"""

def kill_node_processes():
    print("1. Killing Rogue Node Processes...")
    if platform.system() == "Windows":
        os.system("taskkill /F /IM node.exe >nul 2>&1")
    else:
        os.system("pkill -f node")
    time.sleep(1) # Give it a second to die

def clean_database():
    print("2. Deleting Locked DB File...")
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
            print("   -> supply_chain.db deleted.")
        except Exception as e:
            print(f"   -> Could not delete DB: {e}")

def update_server_code():
    print("3. Writing Robust server.js...")
    with open(os.path.join(BACKEND_DIR, "server.js"), "w") as f:
        f.write(server_code)

def run_server():
    print("4. Starting Server...")
    print("--------------------------------")
    # This runs the node server and lets you see the output immediately
    subprocess.run(["node", "server.js"], cwd=BACKEND_DIR)

if __name__ == "__main__":
    kill_node_processes()
    clean_database()
    update_server_code()
    run_server()