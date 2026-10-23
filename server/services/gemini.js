import dotenv from 'dotenv';
dotenv.config();

// Google Gemini API: embeddings + text generation (API key from the GEMINI_API_KEY environment variable)
export const EMBEDDING_DIMENSIONS = 1024;

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
export const LLM_MODEL = process.env.GEMINI_LLM_MODEL || 'gemini-2.5-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const apiKey = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set.');
  return process.env.GEMINI_API_KEY;
};

/** Text -> 1024-dimensional embedding (unit length, so cosine distance behaves). */
export const embedText = async (text) => {
  const res = await fetch(`${BASE}/${EMBED_MODEL}:embedContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey() },
    body: JSON.stringify({
      content: { parts: [{ text: String(text).slice(0, 20000) }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });
  if (!res.ok) throw new Error(`Embedding API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const values = (await res.json()).embedding?.values;
  if (!values) throw new Error('Embedding API returned no vector.');
  const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0)) || 1;
  return values.map((v) => v / norm);
};

/** Run a prompt through Gemini and return the raw text (JSON mode). */
export const generateText = async (prompt, system = 'You are a professional assistant. Return responses ONLY in valid JSON format.') => {
  const res = await fetch(`${BASE}/${LLM_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey() },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
};

/** Extract the first {...} JSON object from a model response. */
export const extractJSON = (text) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI failed to return a valid JSON structure.');
  return JSON.parse(text.substring(start, end + 1));
};
