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

/**
 * NEW: AI SKILL BOOSTER - Generates a 5-step learning roadmap for missing skills
 */
export const generateRoadmap = async (missingSkills, userFeedback = '', resumeText = '') => {
  try {
    if (!missingSkills || missingSkills.length === 0) return null;

    const roadmapPrompt = `
      [SYSTEM: JSON BRAIN ONLY]
      ROLE: You are an expert Technical Mentor.
      TASK: Create a 5-step learning roadmap to master these missing skills: ${missingSkills.join(', ')}.
      
      USER RESUME CONTEXT:
      ${resumeText ? resumeText.substring(0, 1000) + '...' : 'No resume context provided.'}
      
      USER CONSTRAINTS/FEEDBACK: "${userFeedback || 'None provided'}"
      
      RULES:
      1. Each step must have a 'title', 'description', and 'estimated_time'.
      2. Steps must be in logical order (beginner to advanced).
      3. CRITICAL: Tailor the 'estimated_time' and 'description' based on the USER CONSTRAINTS and their existing RESUME CONTEXT.
      4. Return ONLY a JSON object.

      SCHEMA:
      {
        "skill_title": "Mastering ${missingSkills[0]} & More",
        "steps": [
          { "step": 1, "title": "...", "description": "...", "estimated_time": "..." }
        ]
      }
    `;

    let response;
    if (AI_CONFIG.TYPE === 'openai') {
      response = await fetch(AI_CONFIG.BASE_URL, {
        method: "POST",
        headers: getAIHeaders(),
        body: JSON.stringify({
          model: AI_CONFIG.MODEL,
          messages: [{ role: "user", content: roadmapPrompt }]
        })
      });
    } else {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.MODEL}:generateContent?key=${AI_CONFIG.API_KEY || GEMINI_API_KEY}`;
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           contents: [{ parts: [{ text: roadmapPrompt }] }],
           generationConfig: { response_mime_type: "application/json" }
        })
      });
    }

    const data = await response.json();
    let aiText = AI_CONFIG.TYPE === 'openai' ? data.choices[0].message.content : data.candidates[0].content.parts[0].text;
    
    // Clean JSON
    const startIdx = aiText.indexOf('{');
    const endIdx = aiText.lastIndexOf('}');
    return JSON.parse(aiText.substring(startIdx, endIdx + 1));
  } catch (err) {
    console.error('❌ Roadmap Error:', err.message);
    return null;
  }
};

/**
 * NEW: RESUME OPTIMIZER - Tailors a resume for a specific job description
 */
export const generateOptimization = async (resumeText, jobDescription) => {
  try {
    const optimizationPrompt = `
      [SYSTEM: JSON BRAIN ONLY]
      ROLE: You are an expert Resume Writer & Career Coach.
      TASK: Tailor the provided Resume to match the Job Description.
      
      CRITERIA:
      1. Identify keywords from the job description missing in the resume.
      2. Rewrite the professional summary to highlight relevant experience.
      3. For each major experience block, provide 3 "high-impact" bullet points using the STAR method (Situation, Task, Action, Result).
      
      USER RESUME: ${resumeText}
      TARGET JOB: ${jobDescription}

      SCHEMA:
      {
        "role_title": "Optimized Title",
        "new_summary": "Tailored 3-sentence summary",
        "optimized_experience": [
          { "company": "...", "bullets": ["Improved X by Y using Z", "..."] }
        ],
        "keywords_to_add": ["skill1", "skill2"],
        "resume_html": "A professional <html> string. CSS REQUIREMENTS: Use a TWO-COLUMN layout. SIDEBAR (250px, dark surface): Contact Info, Skills badges, Education. MAIN COLUMN: Bold Name, Optimized Title, Pro-Summary (modern italic), Experience blocks with clean dividers. FONTS: Inter, Segoe UI, sans-serif. COLORS: Background #ffffff, Accents #e2b96e (gold). STYLE: High-end minimalist recruiter-ready. Ensure 8.5x11in dimensions."
      }
    `;

    let response;
    if (AI_CONFIG.TYPE === 'openai') {
      response = await fetch(AI_CONFIG.BASE_URL, {
        method: "POST",
        headers: getAIHeaders(),
        body: JSON.stringify({
          model: AI_CONFIG.MODEL,
          messages: [{ role: "user", content: optimizationPrompt }]
        })
      });
    } else {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.MODEL}:generateContent?key=${AI_CONFIG.API_KEY || GEMINI_API_KEY}`;
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           contents: [{ parts: [{ text: optimizationPrompt }] }],
           generationConfig: { response_mime_type: "application/json" }
        })
      });
    }

    const data = await response.json();
    let aiText = AI_CONFIG.TYPE === 'openai' ? data.choices[0].message.content : data.candidates[0].content.parts[0].text;
    
    const startIdx = aiText.indexOf('{');
    const endIdx = aiText.lastIndexOf('}');
    return JSON.parse(aiText.substring(startIdx, endIdx + 1));
  } catch (err) {
    console.error('❌ Optimization Error:', err.message);
    return null;
  }
};
