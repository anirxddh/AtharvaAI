# AtharvaAI

A minimal AI-powered platform for comparing Atharva Vedic principles with modern Indian constitutional laws using the Google Gemini API.

The app takes:

- a Vedic principle or verse with meaning
- a constitutional law or article

It returns a structured response with:

1. `Similarity`
2. `Explanation`
3. `Application`

## What is included

- a small Node.js server with no third-party dependencies
- a browser UI for entering comparisons
- a structured Google Gemini API call
- a prompt designed for simple, readable thematic analysis

## Project structure

- `server.js` - HTTP server, static file serving, and `/api/compare` endpoint
- `public/index.html` - UI layout
- `public/styles.css` - visual design
- `public/app.js` - client-side form handling
- `.env.example` - sample environment configuration

## Setup

1. Create a `.env` file from `.env.example`.
2. Add your Google Gemini API key.
3. Start the server.

Example `.env`:

```env
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
HOST=127.0.0.1
```

## Run

```bash
npm start
```

For auto-reload during development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Prompt behavior

The backend instructs Gemini to:

- identify the strongest conceptual similarity
- explain the relationship in simple language
- suggest a modern application
- avoid overstating historical or legal claims
- return only structured JSON

## API shape

The UI sends:

```json
{
  "vedicPrinciple": "Dharma: justice and moral duty.",
  "constitutionalLaw": "Article 14: Equality before law."
}
```

The server returns:

```json
{
  "result": {
    "similarity": "Both emphasize fairness and equal moral worth.",
    "explanation": "Dharma stresses just conduct, while Article 14 guarantees equal treatment under law.",
    "application": "This supports anti-discrimination practices in courts, schools, and public institutions."
  },
  "model": "gemini-2.5-flash",
  "usage": {
    "totalTokenCount": 123
  }
}
```

## Notes

- This project is for educational comparison, not legal advice.
- The analysis is thematic and philosophical, not proof of direct legal lineage.
- You can switch models by changing `GEMINI_MODEL`.
- The key must have access to the Gemini API. A generic Google API key without Gemini enabled will fail.
