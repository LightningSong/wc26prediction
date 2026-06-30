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
    local_tz = timezone(timedelta(hours=-5)) # Lima, Peru timezone (UTC-5)
    
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
        
    formatted_matches.sort(key=lambda x: x["date"])
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

def is_tbd(team_name):
    if not team_name:
        return True
    return "Grupo" in team_name or "Mejor #" in team_name or "definir" in team_name or "Definir" in team_name

def propagate_bracket_changes(bracket):
    rounds_keys = ["round_of_32", "round_of_16", "quarter_finals", "semis", "final"]
    for r in range(len(rounds_keys) - 1):
        curr_round = rounds_keys[r]
        next_round = rounds_keys[r + 1]
        for m in bracket[curr_round]:
            next_id = m.get("next_match")
            slot = m.get("slot")
            if not next_id or not slot:
                continue
            next_m = next((nm for nm in bracket[next_round] if nm["id"] == next_id), None)
            if not next_m:
                continue
            if next_m.get("score_a") is not None and next_m.get("score_b") is not None:
                continue
            winner_name = "A definir"
            winner_flag = "un"
            sa = m.get("score_a")
            sb = m.get("score_b")
            has_score = sa is not None and sb is not None
            both_defined = not is_tbd(m["team_a"]) and not is_tbd(m["team_b"])
            if both_defined:
                if has_score:
                    if sa > sb:
                        winner_name = m["team_a"]
                        winner_flag = m["flag_a"]
                    elif sb > sa:
                        winner_name = m["team_b"]
                        winner_flag = m["flag_b"]
                    elif m.get("penalty_winner"):
                        winner_name = m["penalty_winner"]
                        winner_flag = m["flag_a"] if m["penalty_winner"] == m["team_a"] else m["flag_b"]
                elif m.get("penalty_winner"):
                    winner_name = m["penalty_winner"]
                    winner_flag = m["flag_a"] if m["penalty_winner"] == m["team_a"] else m["flag_b"]
            current_slot_team = next_m.get(slot)
            if current_slot_team != winner_name:
                next_m[slot] = winner_name
                flag_key = "flag_a" if slot == "team_a" else "flag_b"
                next_m[flag_key] = winner_flag
                next_m["score_a"] = None
                next_m["score_b"] = None
                next_m["penalty_winner"] = None
                next_m["penalties_score"] = None
                
    sf1 = next((m for m in bracket["semis"] if m["id"] == "sf_1"), None)
    sf2 = next((m for m in bracket["semis"] if m["id"] == "sf_2"), None)
    gran_final = bracket["final"][0] if len(bracket["final"]) > 0 else None
    third_place = bracket["third_place"][0] if len(bracket["third_place"]) > 0 else None
    
    def get_winner_loser(m):
        if not m or is_tbd(m["team_a"]) or is_tbd(m["team_b"]):
            return "A definir", "un", "A definir", "un"
        sa = m.get("score_a")
        sb = m.get("score_b")
        has_score = sa is not None and sb is not None
        w_name, w_flag = "A definir", "un"
        l_name, l_flag = "A definir", "un"
        if has_score:
            if sa > sb:
                w_name, w_flag = m["team_a"], m["flag_a"]
                l_name, l_flag = m["team_b"], m["flag_b"]
            elif sb > sa:
                w_name, w_flag = m["team_b"], m["flag_b"]
                l_name, l_flag = m["team_a"], m["flag_a"]
            elif m.get("penalty_winner"):
                pw = m["penalty_winner"]
                w_name = pw
                w_flag = m["flag_a"] if pw == m["team_a"] else m["flag_b"]
                l_name = m["team_b"] if pw == m["team_a"] else m["team_a"]
                l_flag = m["flag_b"] if pw == m["team_a"] else m["flag_a"]
        elif m.get("penalty_winner"):
            pw = m["penalty_winner"]
            w_name = pw
            w_flag = m["flag_a"] if pw == m["team_a"] else m["flag_b"]
            l_name = m["team_b"] if pw == m["team_a"] else m["team_a"]
            l_flag = m["flag_b"] if pw == m["team_a"] else m["flag_a"]
        return w_name, w_flag, l_name, l_flag

    if sf1 and sf2 and gran_final and third_place:
        w1, wf1, l1, lf1 = get_winner_loser(sf1)
        w2, wf2, l2, lf2 = get_winner_loser(sf2)
        if gran_final.get("score_a") is None or gran_final.get("score_b") is None:
            if gran_final.get("team_a") != w1:
                gran_final["team_a"] = w1; gran_final["flag_a"] = wf1; gran_final["score_a"] = None; gran_final["score_b"] = None; gran_final["penalty_winner"] = None; gran_final["penalties_score"] = None
            if gran_final.get("team_b") != w2:
                gran_final["team_b"] = w2; gran_final["flag_b"] = wf2; gran_final["score_a"] = None; gran_final["score_b"] = None; gran_final["penalty_winner"] = None; gran_final["penalties_score"] = None
        if third_place.get("score_a") is None or third_place.get("score_b") is None:
            if third_place.get("team_a") != l1:
                third_place["team_a"] = l1; third_place["flag_a"] = lf1; third_place["score_a"] = None; third_place["score_b"] = None; third_place["penalty_winner"] = None; third_place["penalties_score"] = None
            if third_place.get("team_b") != l2:
                third_place["team_b"] = l2; third_place["flag_b"] = lf2; third_place["score_a"] = None; third_place["score_b"] = None; third_place["penalty_winner"] = None; third_place["penalties_score"] = None
    return bracket

def get_bracket():
    r32 = [
        {"id": "r32_1", "date": "29 Jun, 2:00 PM", "team_a": "1° Grupo E", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #1", "flag_b": "un", "next_match": "r16_1", "slot": "team_a", "stadium": "Gillette Stadium"},
        {"id": "r32_2", "date": "30 Jun, 2:00 PM", "team_a": "1° Grupo I", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #2", "flag_b": "un", "next_match": "r16_1", "slot": "team_b", "stadium": "MetLife Stadium"},
        {"id": "r32_3", "date": "28 Jun, 2:00 PM", "team_a": "2° Grupo A", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo B", "flag_b": "un", "next_match": "r16_2", "slot": "team_a", "stadium": "SoFi Stadium"},
        {"id": "r32_4", "date": "30 Jun, 6:00 PM", "team_a": "1° Grupo F", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo C", "flag_b": "un", "next_match": "r16_2", "slot": "team_b", "stadium": "Estadio BBVA"},
        {"id": "r32_5", "date": "29 Jun, 6:00 PM", "team_a": "1° Grupo C", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo F", "flag_b": "un", "next_match": "r16_3", "slot": "team_a", "stadium": "NRG Stadium"},
        {"id": "r32_6", "date": "30 Jun, 6:00 PM", "team_a": "2° Grupo E", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo I", "flag_b": "un", "next_match": "r16_3", "slot": "team_b", "stadium": "AT&T Stadium"},
        {"id": "r32_7", "date": "01 Jul, 2:00 PM", "team_a": "1° Grupo A", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #3", "flag_b": "un", "next_match": "r16_4", "slot": "team_a", "stadium": "Estadio Azteca"},
        {"id": "r32_8", "date": "01 Jul, 6:00 PM", "team_a": "1° Grupo L", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #4", "flag_b": "un", "next_match": "r16_4", "slot": "team_b", "stadium": "Mercedes-Benz Stadium"},
        {"id": "r32_9", "date": "02 Jul, 2:00 PM", "team_a": "2° Grupo K", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo L", "flag_b": "un", "next_match": "r16_5", "slot": "team_a", "stadium": "BMO Field"},
        {"id": "r32_10", "date": "02 Jul, 6:00 PM", "team_a": "1° Grupo H", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo J", "flag_b": "un", "next_match": "r16_5", "slot": "team_b", "stadium": "SoFi Stadium"},
        {"id": "r32_11", "date": "02 Jul, 2:00 PM", "team_a": "1° Grupo D", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #5", "flag_b": "un", "next_match": "r16_6", "slot": "team_a", "stadium": "Levi's Stadium"},
        {"id": "r32_12", "date": "01 Jul, 2:00 PM", "team_a": "1° Grupo G", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #6", "flag_b": "un", "next_match": "r16_6", "slot": "team_b", "stadium": "Lumen Field"},
        {"id": "r32_13", "date": "03 Jul, 6:00 PM", "team_a": "1° Grupo J", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo H", "flag_b": "un", "next_match": "r16_7", "slot": "team_a", "stadium": "Hard Rock Stadium"},
        {"id": "r32_14", "date": "03 Jul, 6:00 PM", "team_a": "2° Grupo D", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "2° Grupo G", "flag_b": "un", "next_match": "r16_7", "slot": "team_b", "stadium": "AT&T Stadium"},
        {"id": "r32_15", "date": "03 Jul, 2:00 PM", "team_a": "1° Grupo B", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #7", "flag_b": "un", "next_match": "r16_8", "slot": "team_a", "stadium": "BC Place"},
        {"id": "r32_16", "date": "04 Jul, 2:00 PM", "team_a": "1° Grupo K", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "3° Mejor #8", "flag_b": "un", "next_match": "r16_8", "slot": "team_b", "stadium": "Arrowhead Stadium"}
    ]
    r16 = [
        {"id": "r16_1", "date": "04 Jul, 2:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_1", "slot": "team_a", "stadium": "NRG Stadium"},
        {"id": "r16_2", "date": "04 Jul, 6:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_1", "slot": "team_b", "stadium": "Lincoln Financial"},
        {"id": "r16_3", "date": "05 Jul, 2:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_2", "slot": "team_a", "stadium": "MetLife Stadium"},
        {"id": "r16_4", "date": "05 Jul, 6:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_2", "slot": "team_b", "stadium": "Estadio Azteca"},
        {"id": "r16_5", "date": "06 Jul, 2:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_3", "slot": "team_a", "stadium": "AT&T Stadium"},
        {"id": "r16_6", "date": "06 Jul, 6:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_3", "slot": "team_b", "stadium": "Lumen Field"},
        {"id": "r16_7", "date": "07 Jul, 2:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_4", "slot": "team_a", "stadium": "Mercedes-Benz Stadium"},
        {"id": "r16_8", "date": "07 Jul, 6:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "qf_4", "slot": "team_b", "stadium": "BC Place"}
    ]
    qf = [
        {"id": "qf_1", "date": "09 Jul, 3:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "sf_1", "slot": "team_a", "stadium": "Gillette Stadium"},
        {"id": "qf_2", "date": "09 Jul, 7:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "sf_1", "slot": "team_b", "stadium": "SoFi Stadium"},
        {"id": "qf_3", "date": "10 Jul, 3:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "sf_2", "slot": "team_a", "stadium": "Hard Rock Stadium"},
        {"id": "qf_4", "date": "10 Jul, 7:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "sf_2", "slot": "team_b", "stadium": "Arrowhead Stadium"}
    ]
    sf = [
        {"id": "sf_1", "date": "14 Jul, 8:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "final", "slot": "team_a", "stadium": "AT&T Stadium"},
        {"id": "sf_2", "date": "15 Jul, 8:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": "final", "slot": "team_b", "stadium": "Mercedes-Benz Stadium"}
    ]
    final = [
        {"id": "final", "date": "19 Jul, 4:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": None, "slot": None, "stadium": "MetLife Stadium"}
    ]
    third_place = [
        {"id": "third_place", "date": "18 Jul, 4:00 PM", "team_a": "A definir", "flag_a": "un", "score_a": None, "score_b": None, "team_b": "A definir", "flag_b": "un", "next_match": None, "slot": None, "stadium": "Hard Rock Stadium"}
    ]
    bracket_data = {
        "round_of_32": r32, "round_of_16": r16, "quarter_finals": qf, "semis": sf, "final": final, "third_place": third_place
    }

    try:
        # 1. Resolve placeholders using group standings
        standings = get_group_standings()
        thirds = []
        for g in standings:
            if len(g["teams"]) >= 3:
                thirds.append({
                    "team": g["teams"][2],
                    "group_char": g["name"].replace("Grupo ", "")
                })
        thirds.sort(key=lambda x: (x["team"]["pts"], x["team"]["dg"], x["team"]["gf"]), reverse=True)
        
        group_mapping = {
            "0": "D",
            "1": "F",
            "2": "E",
            "3": "K",
            "4": "B",
            "5": "I",
            "6": "J",
            "7": "H"
        }
        
        def get_team_info(type_str, key_str):
            if type_str == '3rd':
                group_char = group_mapping.get(key_str)
                group_name = f"Grupo {group_char}"
                group = next((g for g in standings if g["name"] == group_name), None)
                if group and len(group["teams"]) >= 3:
                    candidate = group["teams"][2]
                    return candidate["name"], candidate["flag"]
                return f"3° Mejor #{int(key_str) + 1}", "un"
            else:
                group_name = f"Grupo {key_str}"
                group = next((g for g in standings if g["name"] == group_name), None)
                if group and len(group["teams"]) > 0:
                    idx = 0 if type_str == '1' else 1
                    if idx < len(group["teams"]):
                        candidate = group["teams"][idx]
                        return candidate["name"], candidate["flag"]
                return f"{type_str}° {group_name}", "un"


        r32_mapping = [
            {"a": {"type": "1", "key": "E"}, "b": {"type": "3rd", "key": "0"}},
            {"a": {"type": "1", "key": "I"}, "b": {"type": "3rd", "key": "1"}},
            {"a": {"type": "2", "key": "A"}, "b": {"type": "2", "key": "B"}},
            {"a": {"type": "1", "key": "F"}, "b": {"type": "2", "key": "C"}},
            {"a": {"type": "1", "key": "C"}, "b": {"type": "2", "key": "F"}},
            {"a": {"type": "2", "key": "E"}, "b": {"type": "2", "key": "I"}},
            {"a": {"type": "1", "key": "A"}, "b": {"type": "3rd", "key": "2"}},
            {"a": {"type": "1", "key": "L"}, "b": {"type": "3rd", "key": "3"}},
            {"a": {"type": "2", "key": "K"}, "b": {"type": "2", "key": "L"}},
            {"a": {"type": "1", "key": "H"}, "b": {"type": "2", "key": "J"}},
            {"a": {"type": "1", "key": "D"}, "b": {"type": "3rd", "key": "4"}},
            {"a": {"type": "1", "key": "G"}, "b": {"type": "3rd", "key": "5"}},
            {"a": {"type": "1", "key": "J"}, "b": {"type": "2", "key": "H"}},
            {"a": {"type": "2", "key": "D"}, "b": {"type": "2", "key": "G"}},
            {"a": {"type": "1", "key": "B"}, "b": {"type": "3rd", "key": "6"}},
            {"a": {"type": "1", "key": "K"}, "b": {"type": "3rd", "key": "7"}},
        ]
        
        for idx, m in enumerate(bracket_data["round_of_32"]):
            map_entry = r32_mapping[idx]
            ta_name, ta_flag = get_team_info(map_entry["a"]["type"], map_entry["a"]["key"])
            tb_name, tb_flag = get_team_info(map_entry["b"]["type"], map_entry["b"]["key"])
            m["team_a"] = ta_name
            m["flag_a"] = ta_flag
            m["team_b"] = tb_name
            m["flag_b"] = tb_flag

        # 2. Fetch and apply real-world knockout results from Wikipedia
        scraped_ko = scraper.fetch_knockout_results()
        for s in scraped_ko:
            found = False
            for round_key in ["round_of_32", "round_of_16", "quarter_finals", "semis", "final", "third_place"]:
                for m in bracket_data[round_key]:
                    match_found = False
                    swapped = False
                    if m["team_a"] == s["team_a"] and m["team_b"] == s["team_b"]:
                        match_found = True
                    elif m["team_a"] == s["team_b"] and m["team_b"] == s["team_a"]:
                        match_found = True
                        swapped = True
                        
                    if match_found:
                        if swapped:
                            m["score_a"] = s["score_b"]
                            m["score_b"] = s["score_a"]
                        else:
                            m["score_a"] = s["score_a"]
                            m["score_b"] = s["score_b"]
                        m["penalty_winner"] = s["penalty_winner"]
                        m["penalties_score"] = s.get("penalties_score")
                        if s.get("stadium") and s["stadium"] != "A definir":
                            m["stadium"] = s["stadium"]
                        found = True
                        break
                if found:
                    break

        # 3. Propagate results to next rounds
        bracket_data = propagate_bracket_changes(bracket_data)
    except Exception as e:
        print("Error dynamically calculating bracket results:", e)

    return bracket_data

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


def get_all_matches():
    group_matches = get_matches_for_today()
    bracket = get_bracket()
    
    round_names = {
        "round_of_32": "Dieciseisavos",
        "round_of_16": "Octavos",
        "quarter_finals": "Cuartos",
        "semis": "Semifinales",
        "final": "Final",
        "third_place": "Tercer Puesto"
    }
    
    now = datetime.now(timezone.utc)
    local_tz = timezone(timedelta(hours=-5)) # Lima, Peru timezone (UTC-5)
    local_now = now.astimezone(local_tz)
    
    knockout_matches = []
    
    for round_key, matches in bracket.items():
        round_name = round_names.get(round_key, "Eliminatorias")
        for m in matches:
            try:
                date_str = m["date"]
                cleaned = date_str.replace(",", "").strip()
                dt = datetime.strptime(f"2026 {cleaned}", "%Y %d %b %I:%M %p")
                match_date = dt.replace(tzinfo=local_tz)
            except Exception:
                match_date = datetime(2026, 7, 1, 12, 0, tzinfo=local_tz)
            
            local_match = match_date.astimezone(local_tz)
            diff_days = (local_match.date() - local_now.date()).days
            
            if diff_days == 0:
                date_label = "Hoy"
            elif diff_days == 1:
                date_label = "Mañana"
            elif diff_days == -1:
                date_label = "Ayer"
            else:
                date_label = local_match.strftime("%d %b")
                
            time_str = local_match.strftime("%I:%M %p").lstrip("0")
            
            match_date_utc = match_date.astimezone(timezone.utc)
            end_time = match_date_utc + timedelta(minutes=110)
            
            if now > end_time:
                status = f"Finalizado | {date_label}"
            elif match_date_utc <= now <= end_time:
                status = f"En vivo | {date_label}"
            else:
                status = f"{date_label}, {time_str}"
                
            category = local_match.strftime("%d %b")
            
            knockout_matches.append({
                "id": m["id"],
                "group": None,
                "category": category,
                "team_a": m["team_a"],
                "team_b": m["team_b"],
                "flag_a": m.get("flag_a", "un"),
                "flag_b": m.get("flag_b", "un"),
                "score_a": m.get("score_a"),
                "score_b": m.get("score_b"),
                "penalty_winner": m.get("penalty_winner"),
                "penalties_score": m.get("penalties_score"),
                "status": status,
                "date": match_date.isoformat(),
                "stadium": m.get("stadium", "A definir"),
                "round": round_name
            })
            
    all_matches = group_matches + knockout_matches
    all_matches.sort(key=lambda x: x["date"])
    return all_matches

