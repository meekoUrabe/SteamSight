-- Table: games
-- Purpose: Stores static reference data for tracked titles.
CREATE TABLE IF NOT EXISTS games (
    app_id INTEGER PRIMARY KEY,
    game_name VARCHAR(255) NOT NULL
);

-- Table: telemetry
-- Purpose: Time-series table storing the player counts from the Python pipeline.
CREATE TABLE IF NOT EXISTS telemetry (
    log_id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES games(app_id),
    current_players INTEGER NOT NULL,
    recorded_at TIMESTAMP NOT NULL
);

-- Insert initial reference data for our tracked games
INSERT INTO games (app_id, game_name) VALUES 
    (730, 'Counter-Strike 2'),
    (570, 'Dota 2'),
    (1172470, 'Apex Legends'),
    (578080, 'PUBG: BATTLEGROUNDS'),
    (1091500, 'Cyberpunk 2077')
ON CONFLICT (app_id) DO NOTHING;

-- Table: pricing_history
-- Purpose: Tracks daily price fluctuations and discount percentages.
CREATE TABLE IF NOT EXISTS pricing_history (
    log_id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES games(app_id),
    price_usd DECIMAL(10, 2) NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    recorded_at TIMESTAMP NOT NULL
);

-- Table: daily_reviews
-- Purpose: Tracks cumulative positive/negative reviews to analyze sentiment spikes.
CREATE TABLE IF NOT EXISTS daily_reviews (
    log_id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES games(app_id),
    positive_reviews INTEGER NOT NULL,
    negative_reviews INTEGER NOT NULL,
    recorded_at TIMESTAMP NOT NULL
);
