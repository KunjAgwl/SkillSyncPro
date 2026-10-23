import { queryReadOnly } from '../config/db.js';
import { generateText } from './bedrock.js';

export const executeAgentRequest = async (userPrompt, resumeText = '') => {
  try {
    // 1. Enhanced Agent Reasoning Prompt
    const agentPrompt = `
      You are 'SkillSync Intel', a professional career agent. 
      You have access to:
      1. User Resume: "${resumeText || 'Not provided'}"
      2. DB SCHEMA: Tables 'jobs' and 'scan_history'.

      TASK: Decide if the user needs common advice or a DB query.
      
      RULES:
      1. RETURN ONLY A SINGLE JSON OBJECT.
      2. DO NOT INCLUDE ANY CONVERSATION, PREFACE, OR NOTES.
      3. CRITICAL: You are querying PostgreSQL. Use 'ILIKE' for case-insensitive matching. Return ONE read-only SELECT statement only; never select the 'embedding' column.
      
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

    const aiText = await generateText(agentPrompt, 'You are a professional career agent. Return responses ONLY in valid JSON format.');

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
      const queryRows = await queryReadOnly(reasonedData.sql);
      return {
        type: 'query',
        thought: reasonedData.thought,
        message: reasonedData.content,
        results: queryRows,
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
