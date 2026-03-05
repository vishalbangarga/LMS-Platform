require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function initDB() {
    try {
        console.log('Connecting to database to initialize schema...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim() !== '');

        for (let stmt of statements) {
            console.log('Executing:', stmt.substring(0, 50) + '...');
            await pool.query(stmt);
        }
        console.log('Database initialized successfully! All tables created.');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        process.exit();
    }
}

initDB();
