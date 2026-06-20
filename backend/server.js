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
            SELECT game_name, current_players, recorded_at, app_id
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
            SELECT game_name, price_usd, discount_percent, app_id
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
            SELECT game_name, positive_reviews, negative_reviews, app_id
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

// API Endpoint to register a new game (supports auto-resolving by name or ID)
app.post('/api/games', async (req, res) => {
    let { app_id, game_name } = req.body;
    
    // If only one field is provided, let's parse it
    if (!app_id && !game_name) {
        return res.status(400).json({ error: 'Please provide a Game Name or App ID' });
    }

    try {
        // If app_id is not provided but game_name is, search Steam to resolve the app_id
        if (!app_id && game_name) {
            // Check if game_name is actually a number (the user entered the ID in the name field)
            if (/^\d+$/.test(game_name.trim())) {
                app_id = parseInt(game_name.trim());
                game_name = null;
            } else {
                console.log(`🔎 Resolving App ID for game name: "${game_name}"...`);
                const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(game_name)}&l=english&cc=US`;
                const searchResponse = await fetch(searchUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (searchData.items && searchData.items.length > 0) {
                        // Find the first item of type 'app'
                        const bestMatch = searchData.items.find(item => item.type === 'app') || searchData.items[0];
                        app_id = bestMatch.id;
                        game_name = bestMatch.name;
                        console.log(`✅ Resolved: "${game_name}" -> App ID: ${app_id}`);
                    } else {
                        return res.status(404).json({ error: `Could not find any Steam game matching "${game_name}"` });
                    }
                } else {
                    return res.status(500).json({ error: 'Failed to query Steam Search API' });
                }
            }
        }

        // If app_id is provided but game_name is not, resolve the name from Steam using appdetails
        if (app_id && !game_name) {
            app_id = parseInt(app_id);
            console.log(`🔎 Resolving game name for App ID: ${app_id}...`);
            const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${app_id}&l=english`;
            const response = await fetch(detailsUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data[app_id] && data[app_id].success && data[app_id].data) {
                    game_name = data[app_id].data.name;
                    console.log(`✅ Resolved: App ID ${app_id} -> "${game_name}"`);
                } else {
                    return res.status(404).json({ error: `Could not find a valid Steam game for App ID ${app_id}` });
                }
            } else {
                game_name = `Steam App ${app_id}`;
            }
        }

        // Clean values
        app_id = parseInt(app_id);
        game_name = game_name.trim();

        // Insert into database
        const insertResult = await pool.query(
            'INSERT INTO games (app_id, game_name) VALUES ($1, $2) ON CONFLICT (app_id) DO NOTHING RETURNING *;',
            [app_id, game_name]
        );
        
        if (insertResult.rows.length === 0) {
            // Already exists, fetch name to reply
            const existing = await pool.query('SELECT game_name FROM games WHERE app_id = $1;', [app_id]);
            const resolvedName = existing.rows[0] ? existing.rows[0].game_name : game_name;
            return res.status(200).json({ success: true, app_id, game_name: resolvedName, message: 'Game already registered' });
        }

        res.status(201).json({ success: true, app_id, game_name });
    } catch (err) {
        console.error("❌ Database/API Resolution Error:", err.message);
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
