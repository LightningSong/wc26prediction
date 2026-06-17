import os
import sys

# Asegurar que el directorio de la API esté en el path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS

from features.matches.routes import matches_bp
from features.predictions.routes import predictions_bp
from features.simulations.routes import simulations_bp

app = Flask(__name__)
CORS(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})

app.register_blueprint(matches_bp, url_prefix='/api')
app.register_blueprint(predictions_bp, url_prefix='/api')
app.register_blueprint(simulations_bp, url_prefix='/api')

if __name__ == "__main__":
    app.run(port=8000, debug=True)
