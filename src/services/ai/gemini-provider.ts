import { parseAiResponse } from './parse';
import { AiError, type AiProvider, type AiRequest, type AiResponse } from './types';

/**
 * Talks to OUR backend (which holds the Gemini key) — never to Gemini directly.
 * Set EXPO_PUBLIC_RELAST_API_URL to enable. Not active while the URL is unset.
 *
 * Contract: POST {url}/ask  (multipart/form-data)
 *   text: string, category: 'auto'|'food'|'sorter'|'lifecycle', image?: file
 * Response: JSON matching AiResponse (see parse.ts) minus `source`.
 */
export function createGeminiProvider(baseUrl: string): AiProvider {
  return {
    name: 'gemini',
    async ask(request: AiRequest): Promise<AiResponse> {
      const form = new FormData();
      form.append('text', request.text);
      form.append('category', request.category);
      if (request.imageUri) {
        // React Native's FormData accepts { uri, name, type } file descriptors.
        form.append('image', {
          uri: request.imageUri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);
      }

      let res: Response;
      try {
        res = await fetch(`${baseUrl.replace(/\/$/, '')}/ask`, { method: 'POST', body: form });
      } catch {
        throw new AiError('Could not reach Relast. Check your connection and try again.');
      }
      if (!res.ok) throw new AiError(`The assistant is unavailable right now (error ${res.status}).`);

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        throw new AiError('The assistant sent a response we could not read.');
      }
      return parseAiResponse(json);
    },
  };
}
