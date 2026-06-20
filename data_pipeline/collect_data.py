import requests
import pandas as pd
from datetime import datetime

def collect_steam_telemetry():
    # Target dataset of games
    target_games = {
        "Counter-Strike 2": "730",
        "Dota 2": "570",
        "Apex Legends": "1172470",
        "PUBG: BATTLEGROUNDS": "578080",
        "Cyberpunk 2077": "1091500"
    }
    
    telemetry_data = []
    print("📡 Initiating global telemetry extraction...")
    
    for game_name, app_id in target_games.items():
        url = f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={app_id}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            player_count = data['response'].get('player_count', 0)
            
            telemetry_data.append({
                "Game": game_name,
                "App_ID": app_id,
                "Current_Players": player_count,
                "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            print(f"  -> Extracted: {game_name}")
        except Exception as e:
            print(f"  -> ❌ Error fetching {game_name}: {e}")
            
    # Convert to Pandas DataFrame
    df = pd.DataFrame(telemetry_data)
    
    print("\n✅ Telemetry extraction complete. DataFrame generated:\n")
    print(df.to_string(index=False))
    
    return df

if __name__ == "__main__":
    print("--- SteamSight: Batch Telemetry Collection ---")
    collect_steam_telemetry()
