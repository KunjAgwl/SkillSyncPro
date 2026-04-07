import fs from 'node:fs/promises';
import path from 'node:path';
import { client } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

import { AI_CONFIG, getAIHeaders } from '../config/aiConfig.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
const ensureLogDir = async () => {
    try { await fs.mkdir(LOGS_DIR, { recursive: true }); } catch (e) {}
};

export const executeAgentRequest = async (userPrompt, resumeText = '') => {
  try {
    // 1. Enhanced Agent Reasoning Prompt
    const agentPrompt = `
      You are 'SkillSync Intel', a professional career agent. 
      You have access to:
      1. User Resume: "${resumeText || 'Not provided'}"
      2. DB SCHEMA: Tables 'jobs' and 'scan_history'.
      3. Vector Search: vector_top_k('jobs_idx', vector(?), top_k)

      TASK: Decide if the user needs common advice or a DB query.
      
      RULES:
      1. RETURN ONLY A SINGLE JSON OBJECT.
      2. DO NOT INCLUDE ANY CONVERSATION, PREFACE, OR NOTES.
      3. CRITICAL: You are querying SQLite (Turso). DO NOT use PostgreSQL syntax like 'ILIKE'. Use standard 'LIKE' for case-insensitive matching.
      
      EXAMPLE FOR ADVICE:
      {
        "type": "chat",
        "thought": "User asked for resume tips",
        "content": "Add 3 bullet points to your Python section!"
      }

      EXAMPLE FOR DATA:
      {
        "type": "query",
        "thought": "User wants job counts",
        "content": "Checking database for job counts...",
        "sql": "SELECT COUNT(*) FROM jobs"
      }

      TARGET JSON SCHEMA:
      {
        "type": "chat" | "query",
        "thought": "Internal logic thought",
        "content": "Message to user",
        "sql": "OPTIONAL: query string"
      }

      CONTEXT:
      User Resume: "${resumeText || 'Not provided'}"
      User Request: "${userPrompt}"
      DB SCHEMA: jobs (id, title, company, description, skills), scan_history.

      [FINAL REMINDER: ZERO TEXT OUTSIDE JSON. BEGIN NOW.]
    `;

    let response;
    
    // 🔗 1. Handle UNIVERSAL OPENAI-COMPATIBLE PROVIDERS
    if (AI_CONFIG.TYPE === 'openai') {
      response = await fetch(AI_CONFIG.BASE_URL, {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({ 
          model: AI_CONFIG.MODEL,
          messages: [
            { role: "system", content: "You are a professional career agent. Return responses ONLY in valid JSON format." },
            { role: "user", content: agentPrompt }
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
          contents: [{ parts: [{ text: agentPrompt }] }] ,
          generationConfig: { response_mime_type: "application/json" }
        })
      });
    }

    if (!response.ok) {
       const errBody = await response.text();
       console.error('🧪 DEBUG: AI AGENT REJECTED REQUEST:', errBody);
       throw new Error(`AI Agent API Error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    
    // 📁 1. LOG THE FULL RESPONSE (FOR DEBUGGING)
    await ensureLogDir();
    await fs.writeFile(path.join(LOGS_DIR, 'agent_full_response.json'), JSON.stringify(data, null, 2), 'utf8');
    console.log('📝 FULL AGENT RESPONSE LOGGED TO: logs/agent_full_response.json');

    // 🛡️ 2. DEFENSIVE PARSING (PREVENT "UNDEFINED [0]" CRASH)
    let aiText = '';
    if (AI_CONFIG.TYPE === 'openai') {
      if (!data.choices || data.choices.length === 0) {
        console.error('❌ OPENROUTER AGENT RETURNED NO CHOICES:', JSON.stringify(data));
        throw new Error("Agent Brain Error: No completion choices returned. Check logs/agent_full_response.json");
      }
      aiText = data.choices[0].message.content;
    } else {
      if (!data.candidates || data.candidates.length === 0) {
        console.error('❌ GEMINI AGENT RETURNED NO CANDIDATES:', JSON.stringify(data));
        throw new Error("Agent Brain Error: No completion candidates returned. Check logs/agent_full_response.json");
      }
      aiText = data.candidates[0].content.parts[0].text;
    }
    
    // 📁 Save Raw Agent Text to separate file
    await fs.writeFile(path.join(LOGS_DIR, 'agent_raw.txt'), aiText, 'utf8');
    console.log(`📝 Raw output (${AI_CONFIG.MODEL}) saved to: logs/agent_raw.txt`);

    // 🛡️ BULLETPROOF JSON EXTRACTION
    const startIdx = aiText.indexOf('{');
    const endIdx = aiText.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) {
       console.error('❌ AI returned non-JSON text:', aiText);
       throw new Error("AI failed to return a valid JSON structure");
    }
    
    const cleanedJson = aiText.substring(startIdx, endIdx + 1).trim();
    const reasonedData = JSON.parse(cleanedJson);
    
    console.log(`🤖 Agent Thought: ${reasonedData.thought}`);

    // 2. Execution Phase: If it's a query, run it. Otherwise, return the chat message.
    if (reasonedData.type === 'query' && reasonedData.sql) {
      const queryResult = await client.execute(reasonedData.sql);
      return {
        type: 'query',
        thought: reasonedData.thought,
        message: reasonedData.content,
        results: queryResult.rows,
        sql: reasonedData.sql
      };
    }

    return {
      type: 'chat',
      thought: reasonedData.thought,
      message: reasonedData.content,
      results: []
    };

  } catch (err) {
    console.error('❌ Smart Agent Error:', err.message);
    throw new Error(`Agent Brain Error: ${err.message}`);
  }
};
