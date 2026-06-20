import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from collect_data import collect_steam_telemetry, TARGET_GAMES

# Load environment variables from the shared backend/.env
env_path = os.path.join(os.path.dirname(__file__), '../backend/.env')
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")

def load_data_to_db():
    if DATABASE_URL:
        # SQLAlchemy deprecated 'postgres://', replacing with 'postgresql://' for driver compliance
        db_url = DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        engine = create_engine(db_url)
    else:
        engine = create_engine(f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    
    # 0. Dynamic Self-Healing Seed
    try:
        with engine.begin() as conn:
            for game_name, app_id in TARGET_GAMES.items():
                conn.execute(
                    text("INSERT INTO games (app_id, game_name) VALUES (:app_id, :game_name) ON CONFLICT (app_id) DO NOTHING"),
                    {"app_id": int(app_id), "game_name": game_name}
                )
    except Exception as e:
        print(f"⚠️ Seeding Warning: {e}")

    # Fetch tracked games list from DB
    db_games = None
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT app_id, game_name FROM games"))
            db_games = {row[1]: str(row[0]) for row in result.fetchall()}
            print(f"📡 Dynamically fetched {len(db_games)} games from database registry.")
    except Exception as e:
        print(f"⚠️ Failed to fetch games from DB, using defaults: {e}")
        
    df = collect_steam_telemetry(db_games)
    if df.empty: return
    
    try:
        # 1. Load Telemetry
        telemetry_df = df[['App_ID', 'Current_Players', 'Timestamp']].rename(columns={'App_ID': 'app_id', 'Current_Players': 'current_players', 'Timestamp': 'recorded_at'})
        telemetry_df.to_sql('telemetry', engine, if_exists='append', index=False)
        
        # 2. Load Pricing History
        pricing_df = df[['App_ID', 'Price_USD', 'Discount_Percent', 'Timestamp']].rename(columns={'App_ID': 'app_id', 'Price_USD': 'price_usd', 'Discount_Percent': 'discount_percent', 'Timestamp': 'recorded_at'})
        pricing_df.to_sql('pricing_history', engine, if_exists='append', index=False)
        
        # 3. Load Daily Reviews
        reviews_df = df[['App_ID', 'Positive_Reviews', 'Negative_Reviews', 'Timestamp']].rename(columns={'App_ID': 'app_id', 'Positive_Reviews': 'positive_reviews', 'Negative_Reviews': 'negative_reviews', 'Timestamp': 'recorded_at'})
        reviews_df.to_sql('daily_reviews', engine, if_exists='append', index=False)
        
        print("✅ SUCCESS: Advanced pipeline complete! All tables updated.")
    except Exception as e:
        print(f"❌ Database Error: {e}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    load_data_to_db()
