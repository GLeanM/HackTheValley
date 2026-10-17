import { createGeminiProvider } from './gemini-provider';
import { mockProvider } from './mock-provider';
import type { AiProvider } from './types';

const apiUrl = process.env.EXPO_PUBLIC_RELAST_API_URL;

/** Mock responses are used until a backend URL is configured. */
export const aiProvider: AiProvider = apiUrl ? createGeminiProvider(apiUrl) : mockProvider;
export const isMockAi = aiProvider.name === 'mock';

export * from './types';
