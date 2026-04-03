import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const DEFAULT_MODEL = "gemini-2.5-flash";

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

const SYSTEM_PROMPT = [
  "You are an educational comparison system.",
  "Compare Atharva Vedic principles with modern Indian constitutional laws at the level of themes, ethics, and philosophy.",
  "Use simple, clear language.",
  "Be concise.",
  "Be honest when the overlap is weak or partial.",
  "Do not claim historical causation or direct legal derivation unless it is explicitly stated in the user input.",
  "Do not provide legal advice.",
  "Focus on meaningful conceptual connections and modern civic relevance.",
  "Return only the JSON object that matches the required schema."
].join(" ");

const COMPARISON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    similarity: {
      type: "string",
      description: "A brief statement of the strongest similarity between the Vedic principle and the constitutional law. Keep it to one short sentence."
    },
    explanation: {
      type: "string",
      description: "A clear explanation in simple language showing how the two ideas relate. Keep it concise, ideally 2 to 4 short sentences."
    },
    application: {
      type: "string",
      description: "A practical real-world application or relevance of the similarity in modern society. Keep it concise, ideally 1 to 3 short sentences."
    }
  },
  required: ["similarity", "explanation", "application"]
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "POST" && url.pathname === "/api/compare") {
      await handleCompare(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    await serveStatic(url.pathname, res, req.method === "HEAD");
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Internal server error." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AtharvaAI running at http://${HOST}:${PORT}`);
});

async function handleCompare(req, res) {
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!googleApiKey) {
    sendJson(res, 500, {
      error: "Missing GOOGLE_API_KEY or GEMINI_API_KEY. Add one to your environment or .env file."
    });
    return;
  }

  const body = await readJsonBody(req);
  const vedicPrinciple = normalizeInput(body?.vedicPrinciple);
  const constitutionalLaw = normalizeInput(body?.constitutionalLaw);

  if (!vedicPrinciple || !constitutionalLaw) {
    sendJson(res, 400, {
      error: "Both the Vedic principle and the constitutional law are required."
    });
    return;
  }

  if (vedicPrinciple.length > 6000 || constitutionalLaw.length > 6000) {
    sendJson(res, 400, {
      error: "Inputs are too long. Please keep each field under 6000 characters."
    });
    return;
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": googleApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: SYSTEM_PROMPT
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: buildUserPrompt(vedicPrinciple, constitutionalLaw)
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseJsonSchema: COMPARISON_SCHEMA
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    sendJson(res, response.status, {
      error: extractGeminiError(data)
    });
    return;
  }

  const parsed = extractGeminiResult(data);
  sendJson(res, 200, {
    result: parsed,
    model: data.modelVersion || geminiModel,
    usage: data.usageMetadata || null
  });
}

async function serveStatic(pathname, res, headOnly) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, normalizedPath);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Forbidden." });
    return;
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=3600"
    });
    if (!headOnly) {
      res.end(file);
      return;
    }
    res.end();
  } catch {
    if (requestedPath !== "/index.html") {
      await serveStatic("/index.html", res, headOnly);
      return;
    }

    sendJson(res, 404, { error: "Not found." });
  }
}

function buildUserPrompt(vedicPrinciple, constitutionalLaw) {
  return [
    "Compare the following two inputs and return a simple educational analysis.",
    "",
    "Vedic Principle or Verse (with meaning):",
    vedicPrinciple,
    "",
    "Constitutional Law or Article:",
    constitutionalLaw,
    "",
    "Required output goals:",
    "- Identify the strongest philosophical or ethical similarity",
    "- Explain the relationship in simple language",
    "- Suggest a modern real-world application",
    "- If the overlap is limited, say that clearly but still provide the closest meaningful connection",
    "- Keep the response concise"
  ].join("\n");
}

function extractGeminiResult(data) {
  if (data?.promptFeedback?.blockReason) {
    throw new Error(`The request was blocked by Gemini: ${data.promptFeedback.blockReason}.`);
  }

  const candidate = Array.isArray(data?.candidates) ? data.candidates[0] : null;
  if (!candidate) {
    throw new Error("Gemini returned no candidates.");
  }

  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    const finishMessage = candidate.finishMessage ? ` ${candidate.finishMessage}` : "";
    console.warn(`Gemini finish reason: ${candidate.finishReason}.${finishMessage}`);
  }

  const rawText = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts
        .map((part) => part?.text || "")
        .join("")
        .trim()
    : "";

  if (!rawText) {
    throw new Error("Gemini returned an empty result.");
  }

  const parsed = JSON.parse(rawText);
  validateComparison(parsed);
  return parsed;
}

function validateComparison(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid structured result.");
  }

  for (const key of ["similarity", "explanation", "application"]) {
    if (typeof value[key] !== "string" || !value[key].trim()) {
      throw new Error(`Missing ${key} in structured result.`);
    }
  }
}

function extractGeminiError(data) {
  return data?.error?.message || "Gemini API request failed.";
}

async function readJsonBody(req) {
  const chunks = [];
  let totalLength = 0;

  for await (const chunk of req) {
    totalLength += chunk.length;
    if (totalLength > 100_000) {
      throw new Error("Request body too large.");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function normalizeInput(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");

  try {
    const content = readFileSync(envPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // No .env file is fine.
  }
}
