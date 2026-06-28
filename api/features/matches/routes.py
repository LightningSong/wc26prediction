from flask import Blueprint, jsonify
from .services import get_matches_for_today, get_group_standings, get_bracket, get_all_matches

matches_bp = Blueprint('matches_bp', __name__)

@matches_bp.route("/matches/today", methods=["GET"])
def get_today_matches():
    matches = get_matches_for_today()
    return jsonify({"matches": matches})

@matches_bp.route("/matches/all", methods=["GET"])
def get_all_matches_route():
    matches = get_all_matches()
    return jsonify({"matches": matches})


@matches_bp.route("/groups", methods=["GET"])
def get_groups():
    return jsonify({"groups": get_group_standings()})

@matches_bp.route("/bracket", methods=["GET"])
def get_bracket_data():
    return jsonify({"bracket": get_bracket()})
