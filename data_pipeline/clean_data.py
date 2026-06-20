import pandas as pd
from sqlalchemy import create_engine
from collect_data import collect_steam_telemetry

DB_USER = "postgres"
DB_PASS = "Wenny050325"
DB_HOST = "localhost"
DB_NAME = "steamsight_db"

def load_data_to_db():
    df = collect_steam_telemetry()
    if df.empty: return
    
    engine = create_engine(f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:5432/{DB_NAME}")
    
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

if __name__ == "__main__":
    load_data_to_db()
