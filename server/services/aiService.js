import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

import { AI_CONFIG, getAIHeaders } from '../config/aiConfig.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
const ensureLogDir = async () => {
    try { await fs.mkdir(LOGS_DIR, { recursive: true }); } catch (e) {}
};

export const generateEmbedding = async (text) => {
  try {
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2-preview:embedContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(embedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Embedding API Failed: ${errText}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (err) {
    console.error('❌ AI Embedding Service Error:', err.message);
    throw err;
  }
};

export const generateRefinement = async (resumeText, topJobs) => {
  try {
    const refinementPrompt = `
      [SYSTEM: JSON BRAIN ONLY. NO DISCOURSE. RESPONSE MUST BE A VALID JSON OBJECT.]
      
      ROLE: You are a Senior Technical Recruiter & Data Parser.
      TASK: 
      1. Extract all technical skills (languages, frameworks, DBs, tools) from the Resume.
      2. Analyze each job in the 'Jobs List' with these CRITERIA:
         - Technical Alignment (70% weight): Are core stack requirements met?
         - Experience Maturity (30% weight): Does the user meet/exceed required years?
      3. For each match, provide:
         - 'matched_skills': Skills found in BOTH resume and job.
         - 'missing_skills': Critical skills in job but NOT in resume.
         - 'match_score': Integer (0-100) based on weighted criteria.

      TARGET JSON SCHEMA:
      {
        "user_skills": ["List found skills"],
        "matches": [
          { "id": "integer", "matched_skills": [], "missing_skills": [], "match_score": 0-100 }
        ]
      }

      DATA TO MAP:
      Resume: ${resumeText}
      Jobs List:
      ${topJobs.map((j) => `[ID: ${j.id}] ${j.title} at ${j.company}: ${j.description}`).join('\n')}
      
      [FINAL REMINDER: ZERO TEXT OUTSIDE JSON. BEGIN NOW.]
    `;

    let response;
    
    // 🔗 1. Handle UNIVERSAL OPENAI-COMPATIBLE PROVIDERS (OpenRouter, Cerebras, DeepSeek)
    if (AI_CONFIG.TYPE === 'openai') {
      response = await fetch(AI_CONFIG.BASE_URL, {
        method: "POST",
        headers: getAIHeaders(),
        body: JSON.stringify({
          model: AI_CONFIG.MODEL,
          messages: [
            { role: "system", content: "You are a professional technical recruiter. Return responses ONLY in valid JSON format." },
            { role: "user", content: refinementPrompt }
          ]
        })
      });
    } 
    // 🔗 2. Handle NATIVE GOOGLE GEMINI API
    else {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.MODEL}:generateContent?key=${AI_CONFIG.API_KEY || GEMINI_API_KEY}`;
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: refinementPrompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });
    }

    if (!response.ok) {
       const errBody = await response.text();
       console.error('🧪 DEBUG: AI API REJECTED REQUEST:', errBody);
       throw new Error(`AI API Error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    
    // 📁 1. LOG THE FULL RESPONSE (FOR DEBUGGING)
    await ensureLogDir();
    await fs.writeFile(path.join(LOGS_DIR, 'debug_full_response.json'), JSON.stringify(data, null, 2), 'utf8');
    console.log('📝 FULL AI RESPONSE LOGGED TO: logs/debug_full_response.json');

    // 🛡️ 2. DEFENSIVE PARSING (PREVENT "UNDEFINED [0]" CRASH)
    let aiText = '';
    if (AI_CONFIG.TYPE === 'openai') {
      if (!data.choices || data.choices.length === 0) {
        console.error('❌ OPENROUTER RETURNED NO CHOICES:', JSON.stringify(data));
        throw new Error("AI API Error: No completion choices returned. Check logs/debug_full_response.json");
      }
      aiText = data.choices[0].message.content;
    } else {
      if (!data.candidates || data.candidates.length === 0) {
        console.error('❌ GEMINI RETURNED NO CANDIDATES:', JSON.stringify(data));
        throw new Error("AI API Error: No completion candidates returned. Check logs/debug_full_response.json");
      }
      aiText = data.candidates[0].content.parts[0].text;
    }
    // 🛡️ BULLETPROOF JSON EXTRACTION
    const startIdx = aiText.indexOf('{');
    const endIdx = aiText.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) {
       console.error('❌ AI returned non-JSON text:', aiText);
       throw new Error("AI failed to return valid JSON structure.");
    }
    
    const cleanedJson = aiText.substring(startIdx, endIdx + 1).trim();
    const parsedData = JSON.parse(cleanedJson);

    // 📁 Save Raw AI JSON to separate file
    await fs.writeFile(path.join(LOGS_DIR, 'refinement_raw.json'), JSON.stringify(parsedData, null, 2), 'utf8');
    console.log(`📝 Parsed JSON output (${AI_CONFIG.MODEL}) saved to: logs/refinement_raw.json`);

    return parsedData;
  } catch (err) {
    console.error('❌ AI Refinement Error:', err.message);
    throw err;
  }
};
