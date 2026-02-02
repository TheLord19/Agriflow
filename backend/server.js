const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');
const axiosLib = require('axios');

// --- CONFIGURATION ---
const PORT = 4001;
const app = express();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriflow',
    password: process.env.DB_PASS || 'password',
    port: process.env.DB_PORT || 5432,
});

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- DATABASE BOOTSTRAP ---
const bootstrapDB = async () => {
  const checkPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASS || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    const client = await checkPool.connect();
    const targetDB = process.env.DB_NAME || 'agriflow';
    
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDB]);
    if (res.rowCount === 0) {
      console.log(`[SYSTEM] Database '${targetDB}' missing. Creating it...`);
      await client.query(`CREATE DATABASE "${targetDB}"`);
    } else {
      console.log(`[SYSTEM] Database '${targetDB}' exists.`);
    }
    client.release();
    await checkPool.end();
    await initAppSchema();
  } catch (e) {
    console.error(`[FATAL] Database Bootstrap Failed: ${e.message}`);
    throw e;
  }
};

const initAppSchema = async () => {
  const client = await pool.connect();
  try {
    console.log("[POSTGRES] Verifying Schema...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS operational_logs (
        id SERIAL PRIMARY KEY,
        phase VARCHAR(50),
        data_payload JSONB,
        status VARCHAR(20) DEFAULT 'DRAFT',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`DO $$ BEGIN ALTER TABLE operational_logs ADD COLUMN status VARCHAR(20) DEFAULT 'DRAFT'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ledger (
        block_index SERIAL PRIMARY KEY,
        prev_hash VARCHAR(255),
        block_hash VARCHAR(255),
        data_payload JSONB,
        ipfs_cid VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const res = await client.query('SELECT count(*) FROM operational_logs');
    console.log(`[POSTGRES] Ready. ${res.rows[0].count} logs detected.`);
  } finally {
    client.release();
  }
};

const generateHash = (data) => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

// --- API ROUTES ---
app.get('/api/chain', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ledger ORDER BY block_index DESC');
    res.json(result.rows.map(row => ({
      index: row.block_index,
      prevHash: row.prev_hash,
      hash: row.block_hash,
      ipfsCid: row.ipfs_cid,
      data: row.data_payload,
      timestamp: row.timestamp
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ingest', async (req, res) => {
  const { phase, data } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO operational_logs (phase, data_payload, status) VALUES ($1, $2, 'DRAFT') RETURNING *",
      [phase, JSON.stringify(data)]
    );
    const row = { ...result.rows[0].data_payload, phase: result.rows[0].phase, status: result.rows[0].status, timestamp: result.rows[0].timestamp };
    io.emit('new_draft', row);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/drafts', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM operational_logs WHERE status = 'DRAFT' ORDER BY timestamp DESC");
        res.json(result.rows.map(r => ({ ...r.data_payload, db_id: r.id, phase: r.phase, timestamp: r.timestamp })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sign_batch', async (req, res) => {
    const { ids } = req.body;
    try {
        await pool.query("UPDATE operational_logs SET status = 'SIGNED' WHERE id = ANY($1)", [ids]);
        io.emit('signature_event', { count: ids.length });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/mine', async (req, res) => {
  await mineBlock();
  res.json({ success: true });
});

app.post('/api/reset', async (req, res) => {
    try {
        await pool.query('TRUNCATE TABLE operational_logs, ledger RESTART IDENTITY');
        const { resetState } = require('./sync_service');
        resetState();
        io.emit('chain_reset');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- MINER ENGINE ---
let timeLeft = 15;
let BLOCK_INDEX = 0;

const FormData = require('form-data');

const mineBlock = async () => {
  try {
    const result = await pool.query("SELECT * FROM operational_logs WHERE status = 'SIGNED' LIMIT 60");
    if (result.rows.length === 0) { timeLeft = 15; return; }

    const batch = result.rows.map(r => ({ ...r.data_payload, phase: r.phase, timestamp: r.timestamp }));
    const idsToArchive = result.rows.map(r => r.id);

    await pool.query("UPDATE operational_logs SET status = 'MINED' WHERE id = ANY($1)", [idsToArchive]);

    const last = await pool.query('SELECT block_hash FROM ledger ORDER BY block_index DESC LIMIT 1');
    const prevHash = last.rows.length ? last.rows[0].block_hash : "00000000000000000000000000000000";

    const blockData = { index: BLOCK_INDEX + 1, prevHash, data: batch, timestamp: new Date().toISOString() };
    const hash = generateHash(blockData);
    
    // --- IPFS LOGIC UPDATE START ---
    const IPFS_URL = process.env.IPFS_API || 'http://localhost:5001';
    let batchCid = "QmSimulationFallback";

    // Helper to upload single object
    const uploadToIPFS = async (dataObj, name) => {
        try {
            const form = new FormData();
            form.append('file', Buffer.from(JSON.stringify(dataObj)), { filename: name, contentType: 'application/json' });
            const res = await axiosLib.post(`${IPFS_URL}/api/v0/add`, form, { headers: { ...form.getHeaders() } });
            return res.data && res.data.Hash ? res.data.Hash : null;
        } catch (e) { console.error(`[IPFS] Safe Fail for ${name}: ${e.message}`); return null; }
    };

    // 1. Generate CID for EACH ITEM (Entity Level)
    console.log(`[MINER] Generating Item-Level CIDs for ${batch.length} records...`);
    for (let i = 0; i < batch.length; i++) {
        const itemCid = await uploadToIPFS(batch[i], `item_${batch[i].id || i}.json`);
        if (itemCid) {
             batch[i]._cid = itemCid; // <--- This persists the CID in the block data!
             console.log(`   -> Item ${batch[i].id}: ${itemCid}`);
        }
    }
    
    // 2. Upload the Full Batch (Block Level)
    try {
      const form = new FormData();
      form.append('file', Buffer.from(JSON.stringify(batch)), {
        filename: 'batch_data.json',
        contentType: 'application/json',
      });

      console.log(`[IPFS] Uploading Batch to ${IPFS_URL}/api/v0/add...`);
      const response = await axiosLib.post(`${IPFS_URL}/api/v0/add`, form, {
        headers: { ...form.getHeaders() }
      });

      if (response.data && response.data.Hash) {
        batchCid = response.data.Hash;
        console.log(`[IPFS] Batch Success! CID: ${batchCid}`);
      }
    } catch (ipfsErr) {
      console.error("[IPFS ERROR]", ipfsErr.message);
    }
    // --- IPFS LOGIC UPDATE END ---

    await pool.query(
      'INSERT INTO ledger (prev_hash, block_hash, data_payload, ipfs_cid) VALUES ($1, $2, $3, $4)',
      [prevHash, hash, JSON.stringify(batch), batchCid]
    );

    BLOCK_INDEX++;
    timeLeft = 15;
    io.emit('block_mined', {
      index: BLOCK_INDEX,
      prevHash,
      hash: hash, // Match frontend expected key
      ipfsCid: batchCid,
      data: batch,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("[MINER ERROR]", err.message);
  }
};

// Start Server Sequence
const start = async () => {
    await bootstrapDB();
    const res = await pool.query('SELECT count(*) FROM ledger');
    BLOCK_INDEX = parseInt(res.rows[0].count);

    server.listen(PORT, () => {
        console.log(`[SERVER] Ready on Port ${PORT}`);
        const { startSync } = require('./sync_service');
        startSync(io);
        
        setInterval(() => {
            if (timeLeft > 0) {
              timeLeft--;
              io.emit('timer_tick', timeLeft);
            } else {
              mineBlock();
            }
        }, 1000);
    });
};

start();