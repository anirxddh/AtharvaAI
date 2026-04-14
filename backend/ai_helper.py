from dotenv import load_dotenv
import os

load_dotenv()

import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def get_ai_analysis(vedic_text, article_text):
    prompt = f"""
You are an academic research assistant.

Compare the following:

Vedic Principle:
{vedic_text}

Indian Constitutional Article:
{article_text}

STRICT RULES:
- Return ONLY valid JSON
- Do NOT include markdown
- Do NOT include ```json
- Do NOT include explanations outside JSON

FORMAT:
{{
  "title": "...",
  "tags": ["...", "..."],
  "explanation": "...",
  "analytical_synthesis": "...",
  "detailed_synthesis": "...",
  "applications": ["...", "..."]
}}
"""

    response = model.generate_content(prompt)

    return response.text