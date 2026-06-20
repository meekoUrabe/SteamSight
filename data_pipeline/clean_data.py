import pandas as pd
from sqlalchemy import create_engine
from collect_data import collect_steam_telemetry

# Local PostgreSQL connection string format:
# postgresql://[username]:[password]@localhost:5432/[database_name]
# Update these credentials to match your local setup!
DB_USER = "postgres"
DB_PASS = "Wenny050325" 
DB_HOST = "localhost"
DB_NAME = "steamsight_db"

def load_data_to_db():
    # 1. Run the extraction (The 'E' and 'T' in ETL)
    df = collect_steam_telemetry()
    
    if df.empty:
        print("❌ No data to load.")
        return
        
    print(f"🔌 Connecting to local PostgreSQL database '{DB_NAME}'...")
    engine = create_engine(f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:5432/{DB_NAME}")
    
    try:
        # 2. Load the data (The 'L' in ETL)
        # We only insert into the 'telemetry' table. 
        # (Assuming 'games' table is already populated via schema.sql)
        
        telemetry_df = df[['App_ID', 'Current_Players', 'Timestamp']].copy()
        telemetry_df.rename(columns={
            'App_ID': 'app_id', 
            'Current_Players': 'current_players', 
            'Timestamp': 'recorded_at'
        }, inplace=True)
        
        telemetry_df.to_sql('telemetry', engine, if_exists='append', index=False)
        
        print("✅ SUCCESS: Telemetry data securely loaded into PostgreSQL!")
        
    except Exception as e:
        print(f"❌ Database Error: {e}")

if __name__ == "__main__":
    print("--- SteamSight: ETL Pipeline Execution ---")
    load_data_to_db()
