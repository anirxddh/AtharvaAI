from flask import Flask, request, jsonify
from matcher import find_best_match
from ai_helper import get_ai_analysis
import json

app = Flask(__name__)

@app.route("/compare", methods=["POST"])
def compare():
    data = request.get_json()
    user_text = data.get("text")

    if not user_text:
        return jsonify({"error": "No input text provided"}), 400

    # Step 1: Matching
    article, score = find_best_match(user_text)

    # Step 2: AI
    ai_raw = get_ai_analysis(user_text, article["text"])

    try:
        ai_data = json.loads(ai_raw)
    except:
        ai_data = {
            "error": "AI parsing failed",
            "raw": ai_raw
        }

    # Step 3: Return response
    return jsonify({
        "article": article,
        "similarity_score": round(score, 2),
        "ai_analysis": ai_data
    })


if __name__ == "__main__":
    app.run(debug=True)