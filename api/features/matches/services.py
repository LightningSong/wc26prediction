import random
import json
from datetime import datetime, timedelta, timezone
from core.data import RANKINGS
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from scraper import scraper

HISTORICAL_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "core", "historical_data.json")
_historical_cache = None

def load_historical_data():
    global _historical_cache
    if _historical_cache is None:
        try:
            with open(HISTORICAL_DATA_PATH, "r", encoding="utf-8") as f:
                _historical_cache = json.load(f)
        except FileNotFoundError:
            _historical_cache = {}
    return _historical_cache


def get_matches_for_today():
    raw_matches = scraper.fetch_live_matches()
    
    formatted_matches = []
    now = datetime.now(timezone.utc)
    local_tz = datetime.now().astimezone().tzinfo
    
    for m in raw_matches:
        match_date = m["date"]
        # Ensure match_date is datetime and timezone-aware
        if isinstance(match_date, str):
            match_date = datetime.fromisoformat(match_date)
        
        # Convert both to local server timezone to calculate diff_days relative to current day
        local_now = now.astimezone(local_tz)
        local_match = match_date.astimezone(local_tz)
        
        diff_days = (local_match.date() - local_now.date()).days
        
        if diff_days == 0:
            date_str = "Hoy"
        elif diff_days == 1:
            date_str = "Mañana"
        elif diff_days == -1:
            date_str = "Ayer"
        else:
            date_str = local_match.strftime("%d %b")
            
        time_str = local_match.strftime("%I:%M %p").lstrip("0")
        
        # Calculate dynamic status in UTC
        match_date_utc = match_date.astimezone(timezone.utc)
        end_time = match_date_utc + timedelta(minutes=110)
        
        if now > end_time:
            status = f"Finalizado | {date_str}"
        elif match_date_utc <= now <= end_time:
            status = f"En vivo | {date_str}"
            
            # Only simulate real-time score increments if Wikipedia doesn't have a score yet
            if m.get("score_a") is None or m.get("score_b") is None:
                elapsed = (now - match_date_utc).total_seconds() / 60
                expected_goals = (elapsed / 90) * 3
                
                import hashlib
                seed = int(hashlib.md5(f"{m['id']}_{int(elapsed/10)}".encode()).hexdigest(), 16)
                random.seed(seed)
                
                m["score_a"] = 0
                m["score_b"] = 0
                
                if random.random() < 0.5:
                    m["score_a"] += random.randint(0, int(expected_goals/2) + 1)
                else:
                    m["score_b"] += random.randint(0, int(expected_goals/2) + 1)
        else:
            status = f"{date_str}, {time_str}"
            
        category = local_match.strftime("%d %b")
        
        formatted_matches.append({
            "id": m["id"],
            "group": m["group"],
            "category": category,
            "team_a": m["team_a"],
            "team_b": m["team_b"],
            "flag_a": RANKINGS.get(m["team_a"], {"flag": "un"})["flag"],
            "flag_b": RANKINGS.get(m["team_b"], {"flag": "un"})["flag"],
            "score_a": m.get("score_a"),
            "score_b": m.get("score_b"),
            "status": status,
            "date": match_date.isoformat(),
            "stadium": m.get("stadium", "A definir"),
            "round": "Fase de Grupos"
        })
        
    # Sort matches by closest to "now" first (in UTC)
    formatted_matches.sort(key=lambda x: abs((datetime.fromisoformat(x["date"]) - now).total_seconds()))
        
    return formatted_matches

def get_group_standings():
    groups_data = []
    matches = get_matches_for_today()
    groups_config = scraper.get_groups()
    
    for group_name, teams in groups_config.items():
        teams_stats = {}
        for t in teams:
            teams_stats[t] = {
                "name": t, "flag": RANKINGS.get(t, {"flag": "un"})["flag"],
                "pj": 0, "g": 0, "e": 0, "p": 0, "gf": 0, "gc": 0, "dg": 0, "pts": 0, "form": []
            }
            
        group_matches = [m for m in matches if m["group"] == group_name]
        for m in group_matches:
            # Safely check if 'Finalizado' or 'En vivo' is in the status
            status_str = m.get("status", "")
            is_valid_status = "Finalizado" in status_str or "En vivo" in status_str
            
            if m["score_a"] is not None and m["score_b"] is not None and is_valid_status:
                sa = m["score_a"]
                sb = m["score_b"]
                ta = m["team_a"]
                tb = m["team_b"]
                
                # In live matches or finished, we calculate points
                teams_stats[ta]["pj"] += 1
                teams_stats[tb]["pj"] += 1
                teams_stats[ta]["gf"] += sa
                teams_stats[ta]["gc"] += sb
                teams_stats[tb]["gf"] += sb
                teams_stats[tb]["gc"] += sa
                teams_stats[ta]["dg"] = teams_stats[ta]["gf"] - teams_stats[ta]["gc"]
                teams_stats[tb]["dg"] = teams_stats[tb]["gf"] - teams_stats[tb]["gc"]
                
                if sa > sb:
                    teams_stats[ta]["g"] += 1
                    teams_stats[ta]["pts"] += 3
                    teams_stats[ta]["form"].append("win")
                    teams_stats[tb]["p"] += 1
                    teams_stats[tb]["form"].append("loss")
                elif sa < sb:
                    teams_stats[tb]["g"] += 1
                    teams_stats[tb]["pts"] += 3
                    teams_stats[tb]["form"].append("win")
                    teams_stats[ta]["p"] += 1
                    teams_stats[ta]["form"].append("loss")
                else:
                    teams_stats[ta]["e"] += 1
                    teams_stats[ta]["pts"] += 1
                    teams_stats[ta]["form"].append("draw")
                    teams_stats[tb]["e"] += 1
                    teams_stats[tb]["pts"] += 1
                    teams_stats[tb]["form"].append("draw")
                    
        sorted_teams = sorted(
            teams_stats.values(), 
            key=lambda x: (x["pts"], x["dg"], x["gf"]), 
            reverse=True
        )
        
        groups_data.append({
            "name": group_name,
            "teams": sorted_teams
        })
        
    return groups_data

def get_bracket():
    # Retain the exact same logic for bracket for now
    r32 = [
        {"id": "r32_1", "date": "29 Jun, 2:00 PM", "team_a": "1° Grupo E", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #1", "flag_b": "un", "next_match": "r16_1", "slot": "team_a"},
        {"id": "r32_2", "date": "30 Jun, 2:00 PM", "team_a": "1° Grupo I", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #2", "flag_b": "un", "next_match": "r16_1", "slot": "team_b"},
        {"id": "r32_3", "date": "28 Jun, 2:00 PM", "team_a": "2° Grupo A", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo B", "flag_b": "un", "next_match": "r16_2", "slot": "team_a"},
        {"id": "r32_4", "date": "30 Jun, 6:00 PM", "team_a": "1° Grupo F", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo C", "flag_b": "un", "next_match": "r16_2", "slot": "team_b"},
        {"id": "r32_5", "date": "29 Jun, 6:00 PM", "team_a": "1° Grupo C", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo F", "flag_b": "un", "next_match": "r16_3", "slot": "team_a"},
        {"id": "r32_6", "date": "30 Jun, 6:00 PM", "team_a": "2° Grupo E", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo I", "flag_b": "un", "next_match": "r16_3", "slot": "team_b"},
        {"id": "r32_7", "date": "01 Jul, 2:00 PM", "team_a": "1° Grupo A", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #3", "flag_b": "un", "next_match": "r16_4", "slot": "team_a"},
        {"id": "r32_8", "date": "01 Jul, 6:00 PM", "team_a": "1° Grupo L", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #4", "flag_b": "un", "next_match": "r16_4", "slot": "team_b"},
        {"id": "r32_9", "date": "02 Jul, 2:00 PM", "team_a": "2° Grupo K", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo L", "flag_b": "un", "next_match": "r16_5", "slot": "team_a"},
        {"id": "r32_10", "date": "02 Jul, 6:00 PM", "team_a": "1° Grupo H", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo J", "flag_b": "un", "next_match": "r16_5", "slot": "team_b"},
        {"id": "r32_11", "date": "02 Jul, 2:00 PM", "team_a": "1° Grupo D", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #5", "flag_b": "un", "next_match": "r16_6", "slot": "team_a"},
        {"id": "r32_12", "date": "01 Jul, 2:00 PM", "team_a": "1° Grupo G", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #6", "flag_b": "un", "next_match": "r16_6", "slot": "team_b"},
        {"id": "r32_13", "date": "03 Jul, 6:00 PM", "team_a": "1° Grupo J", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo H", "flag_b": "un", "next_match": "r16_7", "slot": "team_a"},
        {"id": "r32_14", "date": "03 Jul, 6:00 PM", "team_a": "2° Grupo D", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo G", "flag_b": "un", "next_match": "r16_7", "slot": "team_b"},
        {"id": "r32_15", "date": "03 Jul, 2:00 PM", "team_a": "1° Grupo B", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #7", "flag_b": "un", "next_match": "r16_8", "slot": "team_a"},
        {"id": "r32_16", "date": "04 Jul, 2:00 PM", "team_a": "1° Grupo K", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #8", "flag_b": "un", "next_match": "r16_8", "slot": "team_b"}
    ]
    r16 = [
        {"id": "r16_1", "date": "04 Jul, 2:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_1", "slot": "team_a"},
        {"id": "r16_2", "date": "04 Jul, 6:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_1", "slot": "team_b"},
        {"id": "r16_3", "date": "05 Jul, 2:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_2", "slot": "team_a"},
        {"id": "r16_4", "date": "05 Jul, 6:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_2", "slot": "team_b"},
        {"id": "r16_5", "date": "06 Jul, 2:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_3", "slot": "team_a"},
        {"id": "r16_6", "date": "06 Jul, 6:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_3", "slot": "team_b"},
        {"id": "r16_7", "date": "07 Jul, 2:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_4", "slot": "team_a"},
        {"id": "r16_8", "date": "07 Jul, 6:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_4", "slot": "team_b"}
    ]
    qf = [
        {"id": "qf_1", "date": "09 Jul, 3:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "sf_1", "slot": "team_a"},
        {"id": "qf_2", "date": "09 Jul, 7:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "sf_1", "slot": "team_b"},
        {"id": "qf_3", "date": "10 Jul, 3:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "sf_2", "slot": "team_a"},
        {"id": "qf_4", "date": "10 Jul, 7:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "sf_2", "slot": "team_b"}
    ]
    sf = [
        {"id": "sf_1", "date": "14 Jul, 8:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "final", "slot": "team_a"},
        {"id": "sf_2", "date": "15 Jul, 8:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "final", "slot": "team_b"}
    ]
    final = [
        {"id": "final", "date": "19 Jul, 4:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": None, "slot": None}
    ]
    third_place = [
        {"id": "third_place", "date": "18 Jul, 4:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": None, "slot": None}
    ]
    return {
        "round_of_32": r32, "round_of_16": r16, "quarter_finals": qf, "semis": sf, "final": final, "third_place": third_place
    }

def get_last_matches(team_name: str, limit: int = 12):
    results = []
    
    # 1. Fetch matches played in the current tournament
    all_matches = get_matches_for_today()
    for m in all_matches:
        status_str = m.get("status", "")
        if "Finalizado" in status_str and m.get("score_a") is not None and m.get("score_b") is not None:
            if m["team_a"] == team_name:
                results.append({"goals_scored": m["score_a"], "goals_conceded": m["score_b"]})
            elif m["team_b"] == team_name:
                results.append({"goals_scored": m["score_b"], "goals_conceded": m["score_a"]})
    
    # 2. Pad the rest with real historical data
    remaining = limit - len(results)
    if remaining > 0:
        hist_data = load_historical_data()
        team_hist = hist_data.get(team_name, [])
        needed_hist = team_hist[-remaining:]
        
        for match in reversed(needed_hist):
            results.append({
                "goals_scored": match["goals_scored"],
                "goals_conceded": match["goals_conceded"]
            })
            
    return results

def get_h2h(team_a: str, team_b: str):
    wins_a = 0
    wins_b = 0
    draws = 0
    
    # Check current tournament matches
    all_matches = get_matches_for_today()
    for m in all_matches:
        status_str = m.get("status", "")
        if "Finalizado" in status_str and m.get("score_a") is not None and m.get("score_b") is not None:
            if m["team_a"] == team_a and m["team_b"] == team_b:
                if m["score_a"] > m["score_b"]: wins_a += 1
                elif m["score_a"] < m["score_b"]: wins_b += 1
                else: draws += 1
            elif m["team_a"] == team_b and m["team_b"] == team_a:
                if m["score_a"] > m["score_b"]: wins_b += 1
                elif m["score_a"] < m["score_b"]: wins_a += 1
                else: draws += 1
                
    # Check historical data (from team_a's perspective)
    hist_data = load_historical_data()
    team_a_hist = hist_data.get(team_a, [])
    for match in team_a_hist:
        if match["rival"] == team_b:
            if match["result"] == "win": wins_a += 1
            elif match["result"] == "loss": wins_b += 1
            else: draws += 1
            
    return {"team_a_wins": wins_a, "draws": draws, "team_b_wins": wins_b}
