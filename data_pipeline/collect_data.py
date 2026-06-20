import requests
import pandas as pd
from datetime import datetime
import time

def collect_steam_telemetry():
    target_games = {"Counter-Strike 2": "730", "Dota 2": "570", "Apex Legends": "1172470", "PUBG: BATTLEGROUNDS": "578080", "Cyberpunk 2077": "1091500"}
    telemetry_data = []
    
    print("📡 Initiating comprehensive telemetry, pricing, and sentiment extraction...")
    for game_name, app_id in target_games.items():
        print(f"  -> Extracting: {game_name}...")
        
        # 1. Player Count
        try:
            p_resp = requests.get(f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={app_id}").json()
            players = p_resp.get('response', {}).get('player_count', 0)
        except: players = 0
        
        # 2. Price and Discount
        price_usd, discount = 0.0, 0
        try:
            s_resp = requests.get(f"https://store.steampowered.com/api/appdetails?appids={app_id}").json()
            if s_resp and s_resp.get(app_id, {}).get('success'):
                app_data = s_resp[app_id]['data']
                if not app_data.get('is_free', False) and 'price_overview' in app_data:
                    price_usd = app_data['price_overview']['final'] / 100.0
                    discount = app_data['price_overview']['discount_percent']
        except: pass
                
        # 3. Reviews (Sentiment)
        pos_rev, neg_rev = 0, 0
        try:
            r_resp = requests.get(f"https://store.steampowered.com/appreviews/{app_id}?json=1&language=all&purchase_type=all").json()
            if r_resp.get('success') == 1:
                pos_rev = r_resp.get('query_summary', {}).get('total_positive', 0)
                neg_rev = r_resp.get('query_summary', {}).get('total_negative', 0)
        except: pass
            
        telemetry_data.append({
            "App_ID": int(app_id), "Current_Players": players,
            "Price_USD": price_usd, "Discount_Percent": discount,
            "Positive_Reviews": pos_rev, "Negative_Reviews": neg_rev,
            "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        time.sleep(1) # Prevent Valve rate-limiting
        
    return pd.DataFrame(telemetry_data)
