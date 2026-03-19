const pool = require('./config/db');

async function testConnection() {
    try {
        const [rows] = await pool.query('SELECT 1');
        console.log('Connection successful:', rows);
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

testConnection();
