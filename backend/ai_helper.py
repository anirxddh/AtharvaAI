from dotenv import load_dotenv
import os
import time

load_dotenv()

import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def get_ai_analysis(vedic_text, article_text):
    prompt = f"""
You are an expert in Indian philosophy and constitutional law.

Compare the following:

Vedic Principle:
{vedic_text}

Indian Constitutional Article:
{article_text}

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No extra text

FORMAT:
{{
  "title": "...",
  "tags": ["...", "..."],
  "explanation": "...",
  "analytical_synthesis": "...",
  "detailed_synthesis": "...",
  "applications": ["...", "..."]
}}

GUIDELINES:
- Explanation MUST clearly connect BOTH texts
- Avoid vague philosophical statements
- Use precise legal + ethical reasoning
- Applications must be real-world and modern
"""

    # 🔁 Retry mechanism
    for attempt in range(3):
        try:
            response = model.generate_content(prompt)
            return response.text

        except Exception as e:
            print(f"[Retry {attempt+1}] Gemini error:", e)
            time.sleep(4)  # wait before retry

    # Fallback response (If API reaches request limit)
    return """
{
  "title": "Comparison (Fallback Mode)",
  "tags": ["Fallback", "System"],
  "explanation": "AI quota exceeded. Basic comparison generated without full AI analysis.",
  "analytical_synthesis": "The system attempted to compare both inputs, but AI processing was unavailable due to quota limits.",
  "detailed_synthesis": "Fallback mode ensures system stability even when external AI services are temporarily unavailable.",
  "applications": ["Retry after some time for full AI-generated insights."]
}
"""