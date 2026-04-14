from matcher import find_best_match

test_input = "We must protect nature and environment"

article, score = find_best_match(test_input)

print("Best Match:", article["article"])
print("Title:", article["title"])
print("Score:", score)