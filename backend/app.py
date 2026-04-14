from flask import Flask, request, jsonify
from matcher import find_best_match

app = Flask(__name__)

@app.route("/")
def home():
    return "Server is running 🚀"

@app.route("/compare", methods=["POST"])
def compare():
    data = request.get_json()
    
    user_text = data.get("text")

    if not user_text:
        return jsonify({"error": "No input text provided"}), 400

    article, score = find_best_match(user_text)

    return jsonify({
        "article": article["article"],
        "title": article["title"],
        "text": article["text"],
        "similarity": round(score, 2)
    })

if __name__ == "__main__":
    app.run(debug=True)