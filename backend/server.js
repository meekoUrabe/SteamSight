const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory (if hosted in a single package)
app.use(express.static(path.join(__dirname, '../frontend')));

// PostgreSQL Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false // Secure connection for cloud DBs like Render/Supabase
});

// Self-bootstrapping schema migration on start
async function initializeDatabase() {
    try {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(sql);
            console.log('✅ PostgreSQL Schema initialized successfully.');
        } else {
            console.log('⚠️ database/schema.sql not found. Skipping initialization.');
        }
    } catch (err) {
        console.error('❌ Failed to initialize database schema:', err.message);
    }
}

// API Endpoint to fetch latest telemetry
app.get('/api/telemetry', async (req, res) => {
    try {
        const query = `
            SELECT game_name, current_players, recorded_at
            FROM (
                SELECT DISTINCT ON (t.app_id) g.game_name, t.current_players, t.recorded_at, t.app_id
                FROM telemetry t
                JOIN games g ON t.app_id = g.app_id
                ORDER BY t.app_id, t.recorded_at DESC
            ) sub
            ORDER BY current_players DESC;
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
            SELECT game_name, price_usd, discount_percent
            FROM (
                SELECT DISTINCT ON (p.app_id) g.game_name, p.price_usd, p.discount_percent, p.app_id
                FROM pricing_history p 
                JOIN games g ON p.app_id = g.app_id 
                ORDER BY p.app_id, p.recorded_at DESC
            ) sub
            ORDER BY price_usd DESC;
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
            SELECT game_name, positive_reviews, negative_reviews
            FROM (
                SELECT DISTINCT ON (r.app_id) g.game_name, r.positive_reviews, r.negative_reviews, r.app_id
                FROM daily_reviews r 
                JOIN games g ON r.app_id = g.app_id 
                ORDER BY r.app_id, r.recorded_at DESC
            ) sub
            ORDER BY positive_reviews DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Database Query Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to fetch tracked games
app.get('/api/games', async (req, res) => {
    try {
        const result = await pool.query('SELECT app_id, game_name FROM games ORDER BY game_name ASC;');
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Database Query Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to register a new game
app.post('/api/games', async (req, res) => {
    const { app_id, game_name } = req.body;
    if (!app_id || !game_name) {
        return res.status(400).json({ error: 'App ID and Game Name are required' });
    }
    try {
        await pool.query(
            'INSERT INTO games (app_id, game_name) VALUES ($1, $2) ON CONFLICT (app_id) DO NOTHING;',
            [parseInt(app_id), game_name]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        console.error("❌ Database Query Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to fetch historical player counts (parameterized days)
app.get('/api/telemetry/history', async (req, res) => {
    const days = parseInt(req.query.days) || 7;
    try {
        const query = `
            SELECT g.game_name, t.current_players, t.recorded_at 
            FROM telemetry t
            JOIN games g ON t.app_id = g.app_id
            WHERE t.recorded_at >= NOW() - $1 * INTERVAL '1 day'
            ORDER BY t.recorded_at ASC;
        `;
        const result = await pool.query(query, [days]);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Database Query Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Serve frontend page as fallback
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 SteamSight API & UI running on http://localhost:${PORT}`);
    await initializeDatabase();
    console.log(`📡 Awaiting frontend telemetry requests...`);
});
