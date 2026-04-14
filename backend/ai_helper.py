from dotenv import load_dotenv
import os

load_dotenv()

import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")


def get_ai_analysis(vedic_text, article_text):
    prompt = f"""
You are an academic research assistant.

Compare the following:

Vedic Principle:
{vedic_text}

Indian Constitutional Article:
{article_text}

Return STRICTLY in JSON format with the following fields:

- title
- tags (array)
- explanation
- analytical_synthesis
- detailed_synthesis
- applications (array)

Do not add extra text. Do not explain outside JSON.
"""

    response = model.generate_content(prompt)

    return response.text