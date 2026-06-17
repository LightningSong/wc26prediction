from flask import Blueprint, jsonify
from core.data import get_fifa_ranking
from features.matches.services import get_last_matches, get_h2h
from .services import calculate_xg, generate_probability_matrix, run_monte_carlo

predictions_bp = Blueprint('predictions_bp', __name__)

@predictions_bp.route("/predict/<team_a>/<team_b>", methods=["GET"])
def predict_match(team_a, team_b):
    ranks = get_fifa_ranking()

    rank_a = ranks.get(team_a, {"rank": 50, "points": 1400})
    rank_b = ranks.get(team_b, {"rank": 50, "points": 1400})

    stats_a = get_last_matches(team_a)
    stats_b = get_last_matches(team_b)
    h2h = get_h2h(team_a, team_b)

    xg_a, xg_b = calculate_xg(rank_a, rank_b, stats_a, stats_b, h2h)

    full_matrix = generate_probability_matrix(xg_a, xg_b)
    mc_results = run_monte_carlo(xg_a, xg_b, 100000)

    # Build 7x7 grid (0–6 goals) sorted by score_a then score_b for display
    grid = [[None] * 7 for _ in range(7)]
    for cell in full_matrix:
        if cell["score_a"] <= 6 and cell["score_b"] <= 6:
            grid[cell["score_a"]][cell["score_b"]] = round(cell["prob"], 2)

    return jsonify({
        "match": f"{team_a} vs {team_b}",
        "team_a": team_a,
        "team_b": team_b,
        "flag_a": ranks.get(team_a, {}).get("flag", "un"),
        "flag_b": ranks.get(team_b, {}).get("flag", "un"),
        "rank_a": rank_a.get("rank", 50),
        "rank_b": rank_b.get("rank", 50),
        "xg_a": round(xg_a, 2),
        "xg_b": round(xg_b, 2),
        "global_probabilities": mc_results,
        "top_10": full_matrix[:10],
        "full_matrix": full_matrix,
        "grid": grid
    })
