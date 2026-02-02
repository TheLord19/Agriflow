const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'agriflow',
    password: process.env.DB_PASS || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkLedger() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT block_index, ipfs_cid FROM ledger ORDER BY block_index ASC');
        console.log("--- LEDGER IPFS CIDs ---");
        res.rows.forEach(r => console.log(`Block ${r.block_index}: ${r.ipfs_cid}`));
        client.release();
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await pool.end();
    }
}

checkLedger();
