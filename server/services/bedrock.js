import { BedrockRuntimeClient, InvokeModelCommand, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import dotenv from 'dotenv';
dotenv.config();

export const EMBEDDING_DIMENSIONS = 1024;

const REGION = process.env.AWS_REGION || 'us-east-1';
const EMBED_MODEL = process.env.BEDROCK_EMBED_MODEL || 'amazon.titan-embed-text-v2:0';
export const LLM_MODEL = process.env.BEDROCK_LLM_MODEL || 'us.amazon.nova-lite-v1:0';

// Credentials come from the App Runner instance role (or the local AWS CLI profile in development)
const bedrock = new BedrockRuntimeClient({ region: REGION });

/** Titan Text Embeddings V2 -> 1024-dimensional normalised vector. */
export const embedText = async (text) => {
  const command = new InvokeModelCommand({
    modelId: EMBED_MODEL,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      inputText: String(text).slice(0, 20000),
      dimensions: EMBEDDING_DIMENSIONS,
      normalize: true,
    }),
  });
  const res = await bedrock.send(command);
  return JSON.parse(new TextDecoder().decode(res.body)).embedding;
};

/** Run a prompt through the Bedrock LLM (Converse API) and return the raw text. */
export const generateText = async (prompt, system = 'You are a professional assistant. Return responses ONLY in valid JSON format.') => {
  const res = await bedrock.send(new ConverseCommand({
    modelId: LLM_MODEL,
    system: [{ text: system }],
    messages: [{ role: 'user', content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 5000, temperature: 0.3 },
  }));
  const text = res.output?.message?.content?.map((c) => c.text || '').join('') || '';
  if (!text) throw new Error('Bedrock returned an empty response.');
  return text;
};

/** Extract the first {...} JSON object from a model response. */
export const extractJSON = (text) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI failed to return a valid JSON structure.');
  return JSON.parse(text.substring(start, end + 1));
};
