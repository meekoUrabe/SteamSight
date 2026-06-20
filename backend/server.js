const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

// API Endpoint to fetch latest telemetry
app.get('/api/telemetry', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT ON (t.app_id) g.game_name, t.current_players, t.recorded_at 
            FROM telemetry t
            JOIN games g ON t.app_id = g.app_id
            ORDER BY t.app_id, t.recorded_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Database Query Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to fetch latest pricing
app.get('/api/pricing', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT ON (p.app_id) g.game_name, p.price_usd, p.discount_percent 
            FROM pricing_history p 
            JOIN games g ON p.app_id = g.app_id 
            ORDER BY p.app_id, p.recorded_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Database Query Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to fetch latest reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT ON (r.app_id) g.game_name, r.positive_reviews, r.negative_reviews 
            FROM daily_reviews r 
            JOIN games g ON r.app_id = g.app_id 
            ORDER BY r.app_id, r.recorded_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Database Query Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SteamSight API running on http://localhost:${PORT}`);
    console.log(`📡 Awaiting frontend telemetry requests...`);
});
