import dotenv from 'dotenv';
dotenv.config();

/**
 * Universal AI Configuration System
 * Centralizes provider settings (OpenRouter, Cerebras, OpenAI, DeepSeek, etc.)
 */
export const AI_CONFIG = {
  // 1. Core Provider Details
  BASE_URL: process.env.AI_BASE_URL,
  API_KEY: process.env.API_KEY,
  MODEL: process.env.AI_MODEL,
  
  // 2. Provider Type (openai | gemini)
  TYPE: process.env.AI_PROVIDER_TYPE || 'openai',

  // 3. Attribution Headers (OpenRouter specific)
  HEADERS: {
    'HTTP-Referer': 'https://skillsync.chat',
    'X-Title': 'SkillSync'
  }
};

/**
 * Shared Helper to get AI Headers based on the current configuration
 */
export const getAIHeaders = () => {
  const headers = { 
    'Content-Type': 'application/json' 
  };

  if (AI_CONFIG.TYPE === 'openai') {
    headers['Authorization'] = `Bearer ${AI_CONFIG.API_KEY}`;
    headers['HTTP-Referer'] = AI_CONFIG.HEADERS['HTTP-Referer'];
    headers['X-Title'] = AI_CONFIG.HEADERS['X-Title'];
  }

  return headers;
};
