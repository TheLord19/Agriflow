const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const crypto = require('crypto');

// --- CONFIGURATION ---
const POLL_INTERVAL_MS = 3000;
// const V8_DB_PATH = '/root/telangana/V8/Database/'; // OLD LIVE PATH
const V8_DB_PATH = path.join(__dirname, '../simulation_db'); // NEW SIMULATION PATH (Temp Basis)

// POSTGRES CONNECTION
const pgPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriflow',
    password: process.env.DB_PASS || 'password',
    port: process.env.DB_PORT || 5432,
});

// SQLITE CONNECTIONS
const DB_FILES = {
    PPC: path.join(V8_DB_PATH, 'PPC.db'),
    CMR: path.join(V8_DB_PATH, 'CMR.db'),
    MLS: path.join(V8_DB_PATH, 'MLS.db'),
    FPS: path.join(V8_DB_PATH, 'FPS.db')
};

// GLOBAL STATE: { "UniqueRowID": "HashOfContent" }
const knownState = new Map();

// --- HELPER FUNCTIONS ---

const generateHash = (obj) => {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
};

const readSqlite = (dbPath, query) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) { console.error(`Failed to open ${dbPath}:`, err); reject(err); }
        });
        db.all(query, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
            db.close();
        });
    });
};

const insertPostgres = async (phase, data) => {
    const query = 'INSERT INTO operational_logs (phase, data_payload) VALUES ($1, $2)';
    try {
        if (!data || !data.id && !data.sack_id) return; // Prevent empty inserts
        await pgPool.query(query, [phase, JSON.stringify(data)]);
        console.log(`[SYNC] Inserted ${phase}: ${data.sack_id || data.id}`);
    } catch (err) {
        console.error(`[PG ERROR] Insert failed: ${err.message}`);
    }
};

// --- SYNC LOGIC ---

// --- CONTROL FLAGS ---
let IS_SIMULATION_ACTIVE = true; // Default: Active for Demo
let IS_BATCH_MODE = true;         // Default: Bulk Load (95%)
let BATCH_COUNTER = 0;

// Exported Controls
const setSimulationActive = (val) => {
    IS_SIMULATION_ACTIVE = val;
    console.log(`[SYNC] Simulation Active: ${val}`);
};
const setBatchMode = (val) => {
    IS_BATCH_MODE = val;
    console.log(`[SYNC] Batch Mode: ${val}`);
};

const processRow = async (phase, row, idField, mapperFn) => {
    // 1. SIMULATION CONTROL: Pause if not active
    if (!IS_SIMULATION_ACTIVE) return;

    const uniqueId = row[idField];
    if (!uniqueId) return; // Skip if ID is missing

    const payload = mapperFn(row);
    const dataHash = generateHash({ ...payload, timestamp: null });
    const stateKey = `${phase}:${uniqueId}`;

    // 2. DELAY LOGIC
    if (IS_BATCH_MODE) {
        // FAST MODE: 10ms delay (Speed Ingest)
        // Check if we hit batch limit
        if (BATCH_COUNTER >= 11) { // <-- UPDATED TO 11 ROWS (User request)
            console.log("[SYNC] Batch Limit (11) Hit. Pausing for Miner...");
            await new Promise(resolve => setTimeout(resolve, 16000)); // Wait 16s for Block Mined
            BATCH_COUNTER = 0;
        } else {
            // Speed insert
            await new Promise(resolve => setTimeout(resolve, 100)); // Slower drip (100ms)
            BATCH_COUNTER++;
        }
    } else {
        // SLOW MODE (Manual 5%): Wait 30s as requested
        console.log("[SYNC] Manual Mode: Waiting 30s...");
        await new Promise(resolve => setTimeout(resolve, 30000));
    }

    if (!knownState.has(stateKey)) {
        console.log(`[NEW] Detected ${stateKey}`);
        knownState.set(stateKey, dataHash);
        await insertPostgres(phase, payload);
    } else {
        const lastHash = knownState.get(stateKey);
        if (lastHash !== dataHash) {
            console.log(`[MODIFIED] Detected change in ${stateKey}`);
            knownState.set(stateKey, dataHash);
            const correctedPayload = { ...payload, isCorrection: true, priority: true, event: "DATA_UPDATED_EXTERNAL" };
            await insertPostgres(phase, correctedPayload);
        }
    }
};

const syncCycle = async () => {
    if (!IS_SIMULATION_ACTIVE) {
        setTimeout(syncCycle, 1000); // Check again in 1s
        return;
    }

    try {
        // --- PPC PHASE ---
        // 1. REGISTRY (farmers)
        const farmerRegRows = await readSqlite(DB_FILES.PPC, "SELECT * FROM farmers");
        for (const row of farmerRegRows) {
            await processRow('REGISTRY', row, 'id', (r) => ({ ...r, id: r.id, phase: "REGISTRY", event: "FARMER_REGISTERED", entity: r.farmer_name, land_area_id: r.land_survey_nos, status: "ACTIVE", timestamp: new Date().toISOString() }));
        }

        // 2. FARMER (tokens)
        const tokenRows = await readSqlite(DB_FILES.PPC, "SELECT * FROM tokens");
        for (const row of tokenRows) {
            await processRow('FARMER', row, 'token_no', (r) => ({ ...r, id: r.token_no, sack_id: r.token_no, phase: "FARMER", event: "SACK_CREATED", entity: "Farmer Token", weight_kg: r.Quantity || 0, product_type: r.paddy_type || "Paddy", timestamp: r.created_at || new Date().toISOString() }));
        }

        // 3. QUALITY (faq_checks)
        const faqRows = await readSqlite(DB_FILES.PPC, "SELECT * FROM faq_checks");
        for (const row of faqRows) {
            await processRow('QUALITY', row, 'id', (r) => ({ ...r, id: r.id, sack_id: r.token_no, phase: "QUALITY", event: "QUALITY_CHECK_PASSED", entity: "PPC Quality Officer", moisture_level: r.moisture_content, status: "VERIFIED", timestamp: r.created_at || new Date().toISOString() }));
        }

        // 4. LOTTING (lots)
        const lotRows = await readSqlite(DB_FILES.PPC, "SELECT * FROM lots");
        for (const row of lotRows) {
            await processRow('PPC_LOT', row, 'id', (r) => ({ ...r, id: r.id, sack_id: r.truck_no, phase: "PPC_LOT", event: "LOT_FORMED", entity: r.mill_name || "PPC Lot Manager", weight_kg: r.total_bags, status: "READY_FOR_DISPATCH", timestamp: r.created_at || new Date().toISOString() }));
        }

        // 5. PPC (truck_chits)
        const ppcRows = await readSqlite(DB_FILES.PPC, "SELECT * FROM truck_chits");
        for (const row of ppcRows) {
            await processRow('PPC', row, 'chit_no', (r) => ({ ...r, id: r.chit_no, sack_id: r.lot_id, phase: "PPC", event: "SACK_LOADED", entity: "PPC Dispatch", truck_id: r.truck_no, weight_kg: r.total_weight, timestamp: r.created_at || new Date().toISOString() }));
        }

        // --- CMR PHASE ---
        const cmrRows = await readSqlite(DB_FILES.CMR, "SELECT * FROM deport");
        for (const row of cmrRows) {
            await processRow('CMR', row, 'chit_no', (r) => ({ ...r, id: r.chit_no, sack_id: r.tokens_linking, phase: "CMR", event: "SACK_PROCESSED_MILL", entity: "Rice Mill", timestamp: r.created_at || new Date().toISOString() }));
        }

        // --- MLS PHASE ---
        const mlsRows = await readSqlite(DB_FILES.MLS, "SELECT * FROM imports");
        for (const row of mlsRows) {
            await processRow('WH', row, 'chit_no', (r) => ({ ...r, id: r.chit_no, phase: "WH", event: "STOCK_IN", entity: "Warehouse", timestamp: r.received_at || new Date().toISOString() }));
        }

    } catch (err) {
        console.error("Sync Error:", err.message);
    } finally {
        setTimeout(syncCycle, POLL_INTERVAL_MS);
    }
};

// Start Loop
const startSync = (io) => {
    ioInstance = io;
    console.log("[SYNC] Monitoring V8 Databases for changes...");
    syncCycle(); // Start the first cycle
};

const resetState = () => {
    knownState.clear();
    BATCH_COUNTER = 0;
    console.log("[SYNC] Memory Cleared. Ready for Replay.");
};

module.exports = { setSimulationActive, setBatchMode, resetState, startSync };
