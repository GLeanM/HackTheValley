import { classifyImage } from './classifier';
import { createDirectGeminiProvider } from './direct-gemini-provider';
import { createGeminiProvider } from './gemini-provider';
import { mockProvider } from './mock-provider';
import { classifyOnDevice } from './on-device-classifier';
import type { AiProvider, AiRequest, AiResponse, ClassifierResult } from './types';

const apiUrl = process.env.EXPO_PUBLIC_RELAST_API_URL;
const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const classifierUrl = process.env.EXPO_PUBLIC_RELAST_CLASSIFIER_URL;

/**
 * Backend URL (key stays server-side) wins; otherwise a direct Gemini call using a key
 * bundled in the app (hackathon/demo only); otherwise mock responses.
 */
const textProvider: AiProvider = apiUrl
  ? createGeminiProvider(apiUrl)
  : geminiKey
    ? createDirectGeminiProvider(geminiKey, process.env.EXPO_PUBLIC_GEMINI_MODEL)
    : mockProvider;

/** On-device model first (works offline), then the classifier server if configured. */
async function classify(imageUri: string): Promise<ClassifierResult | null> {
  const attempts: (() => Promise<ClassifierResult>)[] = [() => classifyOnDevice(imageUri)];
  if (classifierUrl) attempts.push(() => classifyImage(classifierUrl, imageUri));

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result.bin !== 'unsure') return result;
    } catch (e) {
      console.warn('[relast] classifier failed, trying next:', e);
    }
  }
  return null;
}

/**
 * For sorter photos, the trash classifier picks the bin and the text provider explains it.
 * If no classifier is available or confident, the text provider's answer is used unchanged.
 */
function withClassifier(provider: AiProvider): AiProvider {
  return {
    name: provider.name,
    async ask(request: AiRequest): Promise<AiResponse> {
      if (!request.imageUri || (request.category !== 'sorter' && request.category !== 'auto')) {
        return provider.ask(request);
      }

      const result = await classify(request.imageUri);
      if (!result) return provider.ask(request);

      const response = await provider.ask({
        ...request,
        hint: `An image classifier identified this as "${result.label}" (${Math.round(result.score * 100)}% confident); bin: ${result.bin}.`,
      });
      return response.category === 'sorter' ? { ...response, bin: result.bin, classifier: result } : response;
    },
  };
}

export const aiProvider: AiProvider = withClassifier(textProvider);
export const isMockAi = aiProvider.name === 'mock';

export { handleClassifierMessage, ON_DEVICE_MODEL, registerClassifierHost } from './on-device-classifier';
export * from './types';
