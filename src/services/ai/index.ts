import { createDirectGeminiProvider } from './direct-gemini-provider';
import { createGeminiProvider } from './gemini-provider';
import { mockProvider } from './mock-provider';
import type { AiProvider } from './types';

const apiUrl = process.env.EXPO_PUBLIC_RELAST_API_URL;
const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

/**
 * Backend URL (key stays server-side) wins; otherwise a direct Gemini call using a key
 * bundled in the app (hackathon/demo only); otherwise mock responses.
 */
export const aiProvider: AiProvider = apiUrl
  ? createGeminiProvider(apiUrl)
  : geminiKey
    ? createDirectGeminiProvider(geminiKey, process.env.EXPO_PUBLIC_GEMINI_MODEL)
    : mockProvider;
export const isMockAi = aiProvider.name === 'mock';

export * from './types';
