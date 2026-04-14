import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load dataset once when file is imported
with open("data/constitution.json", "r", encoding="utf-8") as f:
    articles = json.load(f)


def find_best_match(user_input):
    # Step 1: Extract all article texts
    texts = [article["text"] for article in articles]

    # Step 2: Add user input to the list
    all_texts = texts + [user_input]

    # Step 3: Convert text into vectors
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(all_texts)

    # Step 4: Compare user input with all articles
    similarity_scores = cosine_similarity(vectors[-1], vectors[:-1])

    # Step 5: Find best match
    best_index = similarity_scores.argmax()
    best_score = similarity_scores[0][best_index]

    # Step 6: Return result
    return articles[best_index], float(best_score)