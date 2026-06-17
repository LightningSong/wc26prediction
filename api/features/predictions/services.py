import math
import random

def poisson_probability(k: int, lambd: float) -> float:
    return (math.pow(lambd, k) * math.exp(-lambd)) / math.factorial(k)

def random_poisson(lambd: float) -> int:
    L = math.exp(-lambd)
    k = 0
    p = 1.0
    while p > L:
        k += 1
        p *= random.random()
    return k - 1

def calculate_temporal_strength(matches: list) -> dict:
    if not matches:
        return {"atk": 1.0, "def": 1.0}
    
    decay_factor = 0.85
    attack = 0
    defense = 0
    weight_sum = 0
    
    for i, match in enumerate(matches):
        w = math.pow(decay_factor, i)
        attack += match.get("goals_scored", 1) * w
        defense += match.get("goals_conceded", 1) * w
        weight_sum += w
        
    return {"atk": attack / weight_sum, "def": defense / weight_sum}

def calculate_xg(rank_a, rank_b, stats_a, stats_b, h2h):
    rank_diff = (rank_a["points"] - rank_b["points"]) / 500.0
    
    form_a = calculate_temporal_strength(stats_a)
    form_b = calculate_temporal_strength(stats_b)
    
    base_xg = 1.2
    total_h2h = max(1, h2h["team_a_wins"] + h2h["team_b_wins"] + h2h["draws"])
    h2h_a = ((h2h["team_a_wins"] - h2h["team_b_wins"]) / total_h2h) * 0.3
    
    xg_a = max(0.1, base_xg + rank_diff + ((form_a["atk"] - form_b["def"]) * 0.2) + h2h_a)
    xg_b = max(0.1, base_xg - rank_diff + ((form_b["atk"] - form_a["def"]) * 0.2) - h2h_a)
    
    return xg_a, xg_b

def generate_probability_matrix(xg_a, xg_b, max_goals=6):
    matrix = []
    bump_factors = {"0-0": 1.15, "1-0": 1.10, "0-1": 1.10, "1-1": 1.12}
    
    total_prob = 0
    for a in range(max_goals + 1):
        for b in range(max_goals + 1):
            prob = poisson_probability(a, xg_a) * poisson_probability(b, xg_b)
            score_key = f"{a}-{b}"
            if score_key in bump_factors:
                prob *= bump_factors[score_key]
            
            matrix.append({"score_a": a, "score_b": b, "score": score_key, "prob": prob})
            total_prob += prob
            
    # Normalize
    for m in matrix:
        m["prob"] = (m["prob"] / total_prob) * 100.0
        
    matrix.sort(key=lambda x: x["prob"], reverse=True)
    return matrix

def run_monte_carlo(xg_a, xg_b, simulations=100000):
    wins_a = 0
    draws = 0
    wins_b = 0
    for _ in range(simulations):
        score_a = random_poisson(xg_a)
        score_b = random_poisson(xg_b)
        if score_a > score_b:
            wins_a += 1
        elif score_a == score_b:
            draws += 1
        else:
            wins_b += 1
            
    return {
        "win_a": (wins_a / simulations) * 100.0,
        "draw": (draws / simulations) * 100.0,
        "win_b": (wins_b / simulations) * 100.0
    }
