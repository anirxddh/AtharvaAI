import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load dataset once
with open("data/constitution.json", "r", encoding="utf-8") as f:
    articles = json.load(f)


# 🔹 Smart preprocessing
def preprocess(text):
    text = text.lower()

    synonyms = {
        "treated equally": "equality",
        "equal treatment": "equality",
        "fairly": "fair",
        "without discrimination": "non discrimination",
        "bias": "discrimination",
        "justice": "fairness",
        "rights": "law",
        "people": "citizens"
    }

    for k, v in synonyms.items():
        text = text.replace(k, v)

    return text


def find_best_match(user_input):

    # STEP 0: preprocess input
    user_input = preprocess(user_input)

    # STEP 1: Combine article text + boosted keywords
    texts = [
        item["text"] + " " + (item.get("keywords", "") * 3)
        for item in articles
    ]

    # STEP 2: Add user input
    all_texts = texts + [user_input]

    # STEP 3: TF-IDF
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(all_texts)

    # STEP 4: Similarity
    similarity_scores = cosine_similarity(vectors[-1], vectors[:-1])[0]

    # 🔥 STEP 5: Smart boosting
    for i, article in enumerate(articles):
        boost = 0

        # Equality / fairness → Article 14
        if any(word in user_input for word in ["equal", "equality", "fair", "fairness", "justice"]):
            if article["article"] == "Article 14":
                boost += 0.5

        # Discrimination → Article 14 & 15
        if any(word in user_input for word in ["discrimination", "bias"]):
            if article["article"] in ["Article 14", "Article 15"]:
                boost += 0.4

        # Environment → 48A / 51A
        if any(word in user_input for word in ["environment", "nature", "ecology"]):
            if article["article"] in ["Article 48A", "Article 51A"]:
                boost += 0.4

        similarity_scores[i] += boost

    # STEP 6: Get best match
    best_index = similarity_scores.argmax()
    best_score = similarity_scores[best_index]

    best_score = min(best_score, 1.0)
    return articles[best_index], float(best_score)