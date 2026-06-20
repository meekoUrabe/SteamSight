import requests
import pandas as pd
from datetime import datetime
import time

TARGET_GAMES = {
    "Counter-Strike 2": "730",
    "Dota 2": "570",
    "Apex Legends": "1172470",
    "PUBG: BATTLEGROUNDS": "578080",
    "Cyberpunk 2077": "1091500"
}

def requests_get_with_retry(url, max_retries=3, delay=2):
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                # Exponential backoff on rate limit
                wait_time = delay * (2 ** attempt)
                print(f"    ⚠️ Rate limit (429). Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"    ⚠️ HTTP {resp.status_code}. Retrying in {delay}s...")
                time.sleep(delay)
        except Exception as e:
            print(f"    ⚠️ Connection error: {e}. Retrying in {delay}s...")
            time.sleep(delay)
    return None

def collect_steam_telemetry(target_games=None):
    if target_games is None:
        target_games = TARGET_GAMES
        
    telemetry_data = []
    
    print("📡 Initiating comprehensive telemetry, pricing, and sentiment extraction...")
    for game_name, app_id in target_games.items():
        print(f"  -> Extracting: {game_name} (AppID: {app_id})...")
        
        # 1. Player Count (skip game on consecutive failures to maintain data integrity)
        p_resp = requests_get_with_retry(f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={app_id}")
        if p_resp is None:
            print(f"    ❌ Skipping {game_name} due to repeated API failures.")
            continue
            
        players = p_resp.get('response', {}).get('player_count', 0)
        
        # 2. Price and Discount
        price_usd, discount = 0.0, 0
        s_resp = requests_get_with_retry(f"https://store.steampowered.com/api/appdetails?appids={app_id}")
        if s_resp and s_resp.get(str(app_id), {}).get('success'):
            app_data = s_resp[str(app_id)]['data']
            if not app_data.get('is_free', False) and 'price_overview' in app_data:
                price_usd = app_data['price_overview']['final'] / 100.0
                discount = app_data['price_overview']['discount_percent']
                
        # 3. Reviews (Sentiment)
        pos_rev, neg_rev = 0, 0
        r_resp = requests_get_with_retry(f"https://store.steampowered.com/appreviews/{app_id}?json=1&language=all&purchase_type=all")
        if r_resp and r_resp.get('success') == 1:
            pos_rev = r_resp.get('query_summary', {}).get('total_positive', 0)
            neg_rev = r_resp.get('query_summary', {}).get('total_negative', 0)
            
        telemetry_data.append({
            "App_ID": int(app_id), "Current_Players": players,
            "Price_USD": price_usd, "Discount_Percent": discount,
            "Positive_Reviews": pos_rev, "Negative_Reviews": neg_rev,
            "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        time.sleep(1) # Prevent Valve rate-limiting
        
    return pd.DataFrame(telemetry_data)
