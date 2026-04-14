from flask import Flask, request, jsonify
from matcher import find_best_match
from ai_helper import get_ai_analysis
from flask_cors import CORS
import json
import re

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend is alive... We ball!"


# CLEANING FUNCTION (VERY IMPORTANT)
def clean_text(text):
    if not text:
        return text

    # Remove markdown bold/italic (**text** or *text*)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)

    # Remove newlines
    text = text.replace("\n", " ")

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    return text.strip()


@app.route("/compare", methods=["POST"])
def compare():
    data = request.get_json()
    user_text = data.get("text")

    if not user_text:
        return jsonify({"error": "No input text provided"}), 400

    # Step 1: Matching
    article, score = find_best_match(user_text)

    # Step 2: Confidence Logic
    if score >= 0.8:
        confidence = "High"
    elif score >= 0.5:
        confidence = "Moderate"
    else:
        confidence = "Low"

    # Step 3: AI
    ai_raw = get_ai_analysis(user_text, article["text"])

    # Step 4: Clean + Parse JSON
    try:
        cleaned = ai_raw.strip()

        # Remove ```json ``` wrapping
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        ai_data = json.loads(cleaned)

        # Step 5: CLEAN ALL TEXT FIELDS
        ai_data["explanation"] = clean_text(ai_data.get("explanation"))
        ai_data["analytical_synthesis"] = clean_text(ai_data.get("analytical_synthesis"))
        ai_data["detailed_synthesis"] = clean_text(ai_data.get("detailed_synthesis"))

        # Clean applications list
        ai_data["applications"] = [
            clean_text(app) for app in ai_data.get("applications", [])
        ]

    except Exception as e:
        ai_data = {
            "error": "AI parsing failed",
            "raw": ai_raw,
            "details": str(e)
        }

    # Step 6: Cap Score to 100%
    score = min(score, 1.0)

    # Step 7: Return Response
    return jsonify({
        "article": article,
        "similarity_score": round(score, 2),
        "confidence": confidence,
        "ai_analysis": ai_data
    })


if __name__ == "__main__":
    app.run(debug=True)