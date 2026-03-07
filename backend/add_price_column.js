require('dotenv').config();
const pool = require('./config/db');

async function addPriceColumn() {
    try {
        console.log('Adding price column to courses table...');
        await pool.query('ALTER TABLE courses ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00;');
        console.log('Successfully added price column!');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Price column already exists.');
        } else {
            console.error('Error adding column:', err);
        }
    } finally {
        process.exit();
    }
}

addPriceColumn();
