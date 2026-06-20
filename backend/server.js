const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/telemetry', (req, res) => {
    res.json({ message: "SteamMetrics API is running" });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
