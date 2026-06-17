from flask import Blueprint, jsonify, request
from .services import run_full_simulation, run_simulation_of_simulations

simulations_bp = Blueprint('simulations_bp', __name__)

@simulations_bp.route("/simulate_tournament", methods=["POST"])
def simulate_tournament():
    state = request.json
    if not state:
        return jsonify({"error": "No state provided"}), 400
    
    stats = run_simulation_of_simulations(state, count=250)
    new_state = run_full_simulation(state)
    new_state["stats"] = stats
    return jsonify(new_state)
