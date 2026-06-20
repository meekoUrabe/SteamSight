import time
import schedule
import subprocess
from datetime import datetime

def run_etl():
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ⚙️ Initiating automated SteamSight ETL pipeline...")
    # Call the main ETL script
    subprocess.run(["python", "data_pipeline/clean_data.py"])
    print("✅ Automated run complete. Sleeping until next cycle...")

# Schedule the pipeline to run every 12 hours automatically
schedule.every(12).hours.do(run_etl)

if __name__ == "__main__":
    print("🕒 SteamSight Automation Daemon Started.")
    print("The pipeline will now execute automatically every 12 hours.")
    
    # Run it once immediately on boot
    run_etl() 
    
    # Keep the script running in the background
    while True:
        schedule.run_pending()
        time.sleep(60)
