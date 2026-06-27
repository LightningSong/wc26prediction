from features.predictions.services import calculate_xg, generate_probability_matrix
from core.data import get_fifa_ranking
from features.matches.services import get_last_matches, get_h2h

from features.predictions.services import random_poisson

def get_most_probable_score(team_a, team_b, stochastic=False):
    ranks = get_fifa_ranking()
    rank_a = ranks.get(team_a, {"rank": 50, "points": 1400})
    rank_b = ranks.get(team_b, {"rank": 50, "points": 1400})

    stats_a = get_last_matches(team_a)
    stats_b = get_last_matches(team_b)
    h2h = get_h2h(team_a, team_b)

    xg_a, xg_b = calculate_xg(rank_a, rank_b, stats_a, stats_b, h2h)
    
    if stochastic:
        score_a = random_poisson(xg_a)
        score_b = random_poisson(xg_b)
    else:
        matrix = generate_probability_matrix(xg_a, xg_b)
        score_a = matrix[0]["score_a"]
        score_b = matrix[0]["score_b"]
        
    return score_a, score_b

def recalculate_groups(matches, groups):
    for group in groups:
        for team in group["teams"]:
            team.update({"pj": 0, "g": 0, "e": 0, "p": 0, "gf": 0, "gc": 0, "dg": 0, "pts": 0, "form": []})

        group_matches = [m for m in matches if m["group"] == group["name"]]
        for m in group_matches:
            if m["score_a"] is not None and m["score_b"] is not None:
                sa = m["score_a"]
                sb = m["score_b"]
                ta = m["team_a"]
                tb = m["team_b"]
                
                # Find teams
                team_a_data = next((t for t in group["teams"] if t["name"] == ta), None)
                team_b_data = next((t for t in group["teams"] if t["name"] == tb), None)
                
                if not team_a_data or not team_b_data:
                    continue

                team_a_data["pj"] += 1
                team_b_data["pj"] += 1
                team_a_data["gf"] += sa
                team_a_data["gc"] += sb
                team_b_data["gf"] += sb
                team_b_data["gc"] += sa
                team_a_data["dg"] = team_a_data["gf"] - team_a_data["gc"]
                team_b_data["dg"] = team_b_data["gf"] - team_b_data["gc"]

                if sa > sb:
                    team_a_data["g"] += 1; team_a_data["pts"] += 3; team_a_data["form"].append("win")
                    team_b_data["p"] += 1; team_b_data["form"].append("loss")
                elif sa < sb:
                    team_b_data["g"] += 1; team_b_data["pts"] += 3; team_b_data["form"].append("win")
                    team_a_data["p"] += 1; team_a_data["form"].append("loss")
                else:
                    team_a_data["e"] += 1; team_a_data["pts"] += 1; team_a_data["form"].append("draw")
                    team_b_data["e"] += 1; team_b_data["pts"] += 1; team_b_data["form"].append("draw")

        group["teams"] = sorted(group["teams"], key=lambda x: (x["pts"], x["dg"], x["gf"]), reverse=True)
    return groups

def is_tbd(name):
    return not name or name == 'A definir' or name.startswith('1°') or name.startswith('2°') or name.startswith('3°')

def update_bracket_from_groups(groups, bracket, matches):
    def is_group_complete(group_name):
        group = next((g for g in groups if g["name"] == group_name), None)
        if not group: return False
        return all(t["pj"] == 3 for t in group["teams"])

    CONFIRMED_QUALIFIED_TEAMS = {"Alemania", "Estados Unidos", "México", "Argentina"}

    def is_team_qualified(team_data, group_name):
        if not team_data: return False
        if is_group_complete(group_name): return True
        if team_data.get("pts", 0) >= 6: return True
        if team_data.get("name") in CONFIRMED_QUALIFIED_TEAMS: return True
        return False

    third_place_teams = []
    for group in groups:
        team = group["teams"][2]
        team["groupName"] = group["name"]
        team["isGroupComplete"] = is_group_complete(group["name"])
        third_place_teams.append(team)

    sorted_thirds = sorted(third_place_teams, key=lambda x: (x["pts"], x["dg"], x["gf"]), reverse=True)

    def get_team_info(type_val, key):
        if type_val == '3rd':
            rank_idx = int(key)
            if rank_idx < len(sorted_thirds) and (sorted_thirds[rank_idx]["isGroupComplete"] or is_team_qualified(sorted_thirds[rank_idx], sorted_thirds[rank_idx]["groupName"])):
                return {"name": sorted_thirds[rank_idx]["name"], "flag": sorted_thirds[rank_idx]["flag"]}
            return {"name": f"3° Mejor #{rank_idx + 1}", "flag": "un"}
        else:
            group_name = f"Grupo {key}"
            group = next((g for g in groups if g["name"] == group_name), None)
            if group:
                idx = 0 if type_val == '1' else 1
                candidate_team = group["teams"][idx]
                if is_team_qualified(candidate_team, group_name):
                    return {"name": candidate_team["name"], "flag": candidate_team["flag"]}
            return {"name": f"{type_val}° {group_name}", "flag": "un"}

    r32_mapping = [
        {"a": {"type": '1', "key": 'E'}, "b": {"type": '3rd', "key": '0'}}, # M74
        {"a": {"type": '1', "key": 'I'}, "b": {"type": '3rd', "key": '1'}}, # M77
        {"a": {"type": '2', "key": 'A'}, "b": {"type": '2', "key": 'B'}},   # M73
        {"a": {"type": '1', "key": 'F'}, "b": {"type": '2', "key": 'C'}},   # M75
        {"a": {"type": '1', "key": 'C'}, "b": {"type": '2', "key": 'F'}},   # M76
        {"a": {"type": '2', "key": 'E'}, "b": {"type": '2', "key": 'I'}},   # M78
        {"a": {"type": '1', "key": 'A'}, "b": {"type": '3rd', "key": '2'}}, # M79
        {"a": {"type": '1', "key": 'L'}, "b": {"type": '3rd', "key": '3'}}, # M80
        {"a": {"type": '2', "key": 'K'}, "b": {"type": '2', "key": 'L'}},   # M83
        {"a": {"type": '1', "key": 'H'}, "b": {"type": '2', "key": 'J'}},   # M84
        {"a": {"type": '1', "key": 'D'}, "b": {"type": '3rd', "key": '4'}}, # M81
        {"a": {"type": '1', "key": 'G'}, "b": {"type": '3rd', "key": '5'}}, # M82
        {"a": {"type": '1', "key": 'J'}, "b": {"type": '2', "key": 'H'}},   # M86
        {"a": {"type": '2', "key": 'D'}, "b": {"type": '2', "key": 'G'}},   # M88
        {"a": {"type": '1', "key": 'B'}, "b": {"type": '3rd', "key": '6'}}, # M85
        {"a": {"type": '1', "key": 'K'}, "b": {"type": '3rd', "key": '7'}}, # M87
    ]

    for i, m in enumerate(bracket["round_of_32"]):
        if i >= len(r32_mapping): break
        if m.get("score_a") is not None and m.get("score_b") is not None:
            continue
        map_info = r32_mapping[i]
        team_a = get_team_info(map_info["a"]["type"], map_info["a"]["key"])
        team_b = get_team_info(map_info["b"]["type"], map_info["b"]["key"])

        team_a_changed = m["team_a"] != team_a["name"]
        team_b_changed = m["team_b"] != team_b["name"]

        m["team_a"] = team_a["name"]
        m["flag_a"] = team_a["flag"]
        m["team_b"] = team_b["name"]
        m["flag_b"] = team_b["flag"]
        if team_a_changed: m["score_a"] = None
        if team_b_changed: m["score_b"] = None
        if team_a_changed or team_b_changed: m["penalty_winner"] = None

    return propagate_bracket(bracket)

def propagate_bracket(bracket):
    rounds_keys = ["round_of_32", "round_of_16", "quarter_finals", "semis", "final"]
    for r in range(len(rounds_keys) - 1):
        current_round_key = rounds_keys[r]
        next_round_key = rounds_keys[r + 1]
        
        for m in bracket[current_round_key]:
            next_match_id = m.get("next_match")
            slot = m.get("slot")
            if not next_match_id or not slot: continue
            
            next_match = next((nm for nm in bracket[next_round_key] if nm["id"] == next_match_id), None)
            if not next_match: continue
            
            if next_match.get("score_a") is not None and next_match.get("score_b") is not None:
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
                        winner_name = m["team_a"]; winner_flag = m["flag_a"]
                    elif sb > sa:
                        winner_name = m["team_b"]; winner_flag = m["flag_b"]
                    elif m.get("penalty_winner"):
                        winner_name = m["penalty_winner"]
                        winner_flag = m["flag_a"] if m["penalty_winner"] == m["team_a"] else m["flag_b"]
                elif m.get("penalty_winner"):
                    winner_name = m["penalty_winner"]
                    winner_flag = m["flag_a"] if m["penalty_winner"] == m["team_a"] else m["flag_b"]
            
            if next_match.get(slot) != winner_name:
                next_match[slot] = winner_name
                next_match['flag_a' if slot == 'team_a' else 'flag_b'] = winner_flag
                next_match["score_a"] = None
                next_match["score_b"] = None
                next_match["penalty_winner"] = None

    # Handle Third Place Match
    sf1 = next((m for m in bracket["semis"] if m["id"] == "sf_1"), None)
    sf2 = next((m for m in bracket["semis"] if m["id"] == "sf_2"), None)
    gran_final = bracket["final"][0] if bracket["final"] else None
    third_place = bracket["third_place"][0] if bracket["third_place"] else None

    def get_winner_loser(m):
        if not m or is_tbd(m["team_a"]) or is_tbd(m["team_b"]):
            return "A definir", "un", "A definir", "un"
        sa = m.get("score_a"); sb = m.get("score_b")
        if sa is not None and sb is not None:
            if sa > sb:
                return m["team_a"], m["flag_a"], m["team_b"], m["flag_b"]
            elif sb > sa:
                return m["team_b"], m["flag_b"], m["team_a"], m["flag_a"]
            elif m.get("penalty_winner"):
                w = m["penalty_winner"]
                l = m["team_b"] if w == m["team_a"] else m["team_a"]
                wf = m["flag_a"] if w == m["team_a"] else m["flag_b"]
                lf = m["flag_b"] if w == m["team_a"] else m["flag_a"]
                return w, wf, l, lf
        elif m.get("penalty_winner"):
            w = m["penalty_winner"]
            l = m["team_b"] if w == m["team_a"] else m["team_a"]
            wf = m["flag_a"] if w == m["team_a"] else m["flag_b"]
            lf = m["flag_b"] if w == m["team_a"] else m["flag_a"]
            return w, wf, l, lf
        return "A definir", "un", "A definir", "un"

    if sf1 and sf2 and gran_final and third_place:
        w1, wf1, l1, lf1 = get_winner_loser(sf1)
        w2, wf2, l2, lf2 = get_winner_loser(sf2)
        
        if gran_final.get("score_a") is None or gran_final.get("score_b") is None:
            if gran_final["team_a"] != w1:
                gran_final["team_a"] = w1; gran_final["flag_a"] = wf1; gran_final["score_a"] = None; gran_final["score_b"] = None; gran_final["penalty_winner"] = None
            if gran_final["team_b"] != w2:
                gran_final["team_b"] = w2; gran_final["flag_b"] = wf2; gran_final["score_a"] = None; gran_final["score_b"] = None; gran_final["penalty_winner"] = None
                
        if third_place.get("score_a") is None or third_place.get("score_b") is None:
            if third_place["team_a"] != l1:
                third_place["team_a"] = l1; third_place["flag_a"] = lf1; third_place["score_a"] = None; third_place["score_b"] = None; third_place["penalty_winner"] = None
            if third_place["team_b"] != l2:
                third_place["team_b"] = l2; third_place["flag_b"] = lf2; third_place["score_a"] = None; third_place["score_b"] = None; third_place["penalty_winner"] = None

    return bracket

def run_full_simulation(state, stochastic=False):
    matches = state.get("matches", [])
    groups = state.get("groups", [])
    bracket = state.get("bracket", {})

    # 1. Simulate remaining group matches
    for m in matches:
        if m["score_a"] is None or m["score_b"] is None:
            sa, sb = get_most_probable_score(m["team_a"], m["team_b"], stochastic=stochastic)
            m["score_a"] = sa
            m["score_b"] = sb
            m["status"] = "Simulado"

    # 2. Recalculate groups & propagate to bracket
    groups = recalculate_groups(matches, groups)
    bracket = update_bracket_from_groups(groups, bracket, matches)

    # 3. Simulate knockout stages in order
    rounds_order = ["round_of_32", "round_of_16", "quarter_finals", "semis", "third_place", "final"]
    for round_key in rounds_order:
        for m in bracket.get(round_key, []):
            if is_tbd(m["team_a"]) or is_tbd(m["team_b"]):
                continue
            if m["score_a"] is None or m["score_b"] is None:
                sa, sb = get_most_probable_score(m["team_a"], m["team_b"], stochastic=stochastic)
                m["score_a"] = sa
                m["score_b"] = sb
                
                # If draw in knockouts, we must have a penalty winner. Just pick the slightly better team
                if sa == sb:
                    from core.data import get_fifa_ranking
                    ranks = get_fifa_ranking()
                    pts_a = ranks.get(m["team_a"], {}).get("points", 1400)
                    pts_b = ranks.get(m["team_b"], {}).get("points", 1400)
                    m["penalty_winner"] = m["team_a"] if pts_a > pts_b else m["team_b"]

        bracket = propagate_bracket(bracket)

    return {
        "matches": matches,
        "groups": groups,
        "bracket": bracket
    }

def fast_copy_state(state):
    new_matches = []
    for m in state.get("matches", []):
        new_matches.append({
            "id": m["id"],
            "team_a": m["team_a"],
            "flag_a": m.get("flag_a", "un"),
            "team_b": m["team_b"],
            "flag_b": m.get("flag_b", "un"),
            "score_a": m.get("score_a"),
            "score_b": m.get("score_b"),
            "group": m.get("group"),
            "status": m.get("status", "Fixture"),
            "date": m.get("date"),
            "stadium": m.get("stadium"),
            "time": m.get("time")
        })
        
    new_groups = []
    for g in state.get("groups", []):
        new_teams = []
        for t in g.get("teams", []):
            new_teams.append({
                "name": t["name"],
                "flag": t.get("flag", "un"),
                "pj": t.get("pj", 0),
                "g": t.get("g", 0),
                "e": t.get("e", 0),
                "p": t.get("p", 0),
                "gf": t.get("gf", 0),
                "gc": t.get("gc", 0),
                "dg": t.get("dg", 0),
                "pts": t.get("pts", 0),
                "form": list(t.get("form", []))
            })
        new_groups.append({
            "name": g["name"],
            "teams": new_teams
        })
        
    new_bracket = {}
    for round_key, round_matches in state.get("bracket", {}).items():
        new_round = []
        for m in round_matches:
            new_round.append({
                "id": m["id"],
                "team_a": m["team_a"],
                "flag_a": m.get("flag_a", "un"),
                "team_b": m["team_b"],
                "flag_b": m.get("flag_b", "un"),
                "score_a": m.get("score_a"),
                "score_b": m.get("score_b"),
                "penalty_winner": m.get("penalty_winner"),
                "next_match": m.get("next_match"),
                "slot": m.get("slot"),
                "date": m.get("date")
            })
        new_bracket[round_key] = new_round
        
    return {
        "matches": new_matches,
        "groups": new_groups,
        "bracket": new_bracket
    }

def run_simulation_of_simulations(state, count=250):
    from features.matches import services as matches_services
    import functools
    from collections import Counter
    
    orig_get_matches = matches_services.get_matches_for_today
    orig_get_last = matches_services.get_last_matches
    orig_get_h2h = matches_services.get_h2h
    
    @functools.lru_cache(maxsize=128)
    def cached_get_matches_for_today():
        return orig_get_matches()
        
    @functools.lru_cache(maxsize=128)
    def cached_get_last_matches(team_name, limit=12):
        res = orig_get_last(team_name, limit)
        return tuple(tuple(item.items()) for item in res)
        
    @functools.lru_cache(maxsize=256)
    def cached_get_h2h(team_a, team_b):
        return orig_get_h2h(team_a, team_b)
        
    matches_services.get_matches_for_today = cached_get_matches_for_today
    def get_last_matches_wrapper(team_name, limit=12):
        tup = cached_get_last_matches(team_name, limit)
        return [dict(item) for item in tup]
    matches_services.get_last_matches = get_last_matches_wrapper
    matches_services.get_h2h = cached_get_h2h
    
    champion_counts = Counter()
    finalist_counts = Counter()
    semis_counts = Counter()
    
    try:
        for _ in range(count):
            state_copy = fast_copy_state(state)
            simed = run_full_simulation(state_copy, stochastic=True)
            
            gran_final = simed["bracket"]["final"][0] if simed["bracket"]["final"] else None
            semis = simed["bracket"]["semis"]
            
            champion = None
            runner_up = None
            if gran_final:
                sa = gran_final.get("score_a")
                sb = gran_final.get("score_b")
                if sa is not None and sb is not None:
                    if sa > sb:
                        champion = gran_final["team_a"]
                        runner_up = gran_final["team_b"]
                    elif sb > sa:
                        champion = gran_final["team_b"]
                        runner_up = gran_final["team_a"]
                    elif gran_final.get("penalty_winner"):
                        champion = gran_final["penalty_winner"]
                        runner_up = gran_final["team_b"] if champion == gran_final["team_a"] else gran_final["team_a"]
                        
            if champion:
                champion_counts[champion] += 1
                finalist_counts[champion] += 1
                finalist_counts[runner_up] += 1
                
            for m in semis:
                if m.get("team_a") and m["team_a"] != "A definir":
                    semis_counts[m["team_a"]] += 1
                if m.get("team_b") and m["team_b"] != "A definir":
                    semis_counts[m["team_b"]] += 1
    finally:
        matches_services.get_matches_for_today = orig_get_matches
        matches_services.get_last_matches = orig_get_last
        matches_services.get_h2h = orig_get_h2h
        
    stats = {}
    all_teams = set(list(champion_counts.keys()) + list(finalist_counts.keys()) + list(semis_counts.keys()))
    for team in all_teams:
        stats[team] = {
            "champion": round((champion_counts[team] / count) * 100, 1),
            "finalist": round((finalist_counts[team] / count) * 100, 1),
            "semifinalist": round((semis_counts[team] / count) * 100, 1)
        }
        
    return stats
