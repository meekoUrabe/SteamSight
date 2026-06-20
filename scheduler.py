import sys
import os
import time
import schedule
from datetime import datetime

# Add the project root/data_pipeline to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'data_pipeline'))
from clean_data import load_data_to_db

def run_etl():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ⚙️ Executing ETL inline...")
    try:
        load_data_to_db()
    except Exception as e:
        print(f"❌ Automation Error: {e}")

schedule.every(12).hours.do(run_etl)

if __name__ == "__main__":
    print("🕒 SteamSight Automation Daemon Started (Native).")
    run_etl()
    while True:
        schedule.run_pending()
        time.sleep(60)
