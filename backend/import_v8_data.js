const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = '/root/telangana/V8/Database/';
const TARGET_DIR = '/root/telangana/2_Soham_Block_Chain/supply-chain-demo/simulation_db';

// Ensure Target Exists
if (!fs.existsSync(TARGET_DIR)) fs.mkdirSync(TARGET_DIR, { recursive: true });

const TABLES = {
    PPC: ['farmers', 'tokens', 'truck_chits', 'faq_checks', 'lots'],
    CMR: ['deport'],
    MLS: ['imports', 'deport'],
    FPS: ['imports']
};

const copyTable = (dbName, tableName) => {
    return new Promise((resolve, reject) => {
        const sourcePath = path.join(SOURCE_DIR, `${dbName}.db`);
        const targetPath = path.join(TARGET_DIR, `${dbName}.db`);

        const sourceDB = new sqlite3.Database(sourcePath, sqlite3.OPEN_READONLY);
        const targetDB = new sqlite3.Database(targetPath);

        // Fetch schema from source first to be safe, but simple approach: Get a row and derive columns.
        sourceDB.all(`SELECT * FROM ${tableName} LIMIT 11`, [], (err, rows) => {
            if (err) {
                console.warn(`[WARN] Skipping ${dbName}.${tableName}: ${err.message}`); 
                sourceDB.close(); targetDB.close(); resolve(); return;
            }

            if (rows.length === 0) {
                console.log(`[${dbName}] ${tableName}: No data.`);
                sourceDB.close(); targetDB.close(); resolve(); return;
            }

            // CLEAN TABLE (Since we want EXACT replication of this batch)
            targetDB.run(`DROP TABLE IF EXISTS ${tableName}`, () => {
                
                // INFER SCHEMA FROM ROW 0
                const keys = Object.keys(rows[0]);
                // Sanitize keys (just in case)
                const columnsDef = keys.map(k => `"${k}" TEXT`).join(', ');
                
                const createQuery = `CREATE TABLE ${tableName} (${columnsDef})`;
                
                targetDB.run(createQuery, (err) => {
                    if(err) { console.error(`Create Error: ${err.message}`); resolve(); return; }

                    const placeholders = keys.map(() => '?').join(',');
                    const insertQuery = `INSERT INTO ${tableName} ("${keys.join('","')}") VALUES (${placeholders})`;

                    targetDB.serialize(() => {
                        const stmt = targetDB.prepare(insertQuery);
                        rows.forEach(row => {
                            stmt.run(Object.values(row));
                        });
                        stmt.finalize();
                        console.log(`[${dbName}] Copied ${rows.length} rows to ${tableName}`);
                        sourceDB.close();
                        targetDB.close();
                        resolve();
                    });
                });
            });
        });
    });
};

const runImport = async () => {
    console.log("🚀 Starting Import from V8 Source...");
    
    // Clear Target DBs first? No, overwrite or append. Let's assume clear logic is handled manually or we just overwrite.
    // For now, let's just attempt copy.
    
    for (const [db, tables] of Object.entries(TABLES)) {
        for (const table of tables) {
            await copyTable(db, table);
        }
    }
    console.log("✅ Import Complete.");
};

runImport();
