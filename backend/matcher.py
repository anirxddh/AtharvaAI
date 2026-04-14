import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load dataset once when file is imported
with open("data/constitution.json", "r", encoding="utf-8") as f:
    articles = json.load(f)

def preprocess(text):
    synonyms = {
        "fairly": "fair",
        "treated equally": "equality",
        "equal treatment": "equality"
    }

    text = text.lower()
    for k, v in synonyms.items():
        text = text.replace(k, v)

    return text


def find_best_match(user_input):

    user_input = preprocess(user_input)

    # STEP 1: Combine article text + keywords
    texts = [
        item["text"] + " " + item.get("keywords", "")
        for item in articles
    ]

    # STEP 2: Add user input
    all_texts = texts + [user_input]

    # STEP 3: TF-IDF vectorization
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(all_texts)

    # STEP 4: Cosine similarity
    similarity_scores = cosine_similarity(vectors[-1], vectors[:-1])[0]

    # STEP 5: Boosting logic
    for i, article in enumerate(articles):
        boost = 0

        if any(word in user_input for word in ["equal", "equality", "fair", "justice"]):
            if article["article"] == "Article 14":
                boost += 0.3

        if "discrimination" in user_input:
            if article["article"] == "Article 15":
                boost += 0.3

        similarity_scores[i] += boost

    # STEP 6: Best match
    best_index = similarity_scores.argmax()
    best_score = similarity_scores[best_index]

    return articles[best_index], float(best_score)