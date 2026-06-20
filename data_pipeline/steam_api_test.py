import requests

def test_steam_api():
    app_id = "730" # Counter-Strike 2
    url = f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={app_id}"
    print(f"📡 Sending request to Steam API for App ID: {app_id}...")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        player_count = data['response']['player_count']
        print(f"✅ Success! Connection established.")
        print(f"🎮 Counter-Strike 2 current live players: {player_count:,}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("--- SteamSight: Phase 1 Data Pipeline Test ---")
    test_steam_api()
