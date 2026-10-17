import { toDataUrl } from './image';
import { parseAiResponse } from './parse';
import { AiError, type AiProvider, type AiRequest, type AiResponse } from './types';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

const SYSTEM_PROMPT = `You are Relast, a sustainability helper. The user shows a photo and/or text about an item.
Identify the item and say how to dispose of it, whether it can be reused, and how to reduce waste.
- category: "sorter" (which bin?), "lifecycle" (repair/donate/lifespan of a durable item), or "food" (edible leftovers/ingredients). If the user's category is not "auto", use it.
- itemName: short, specific title (e.g. "Clear plastic food container").
- bin: recycling | garbage (landfill) | compost | hazardous | ewaste | unsure. Always set it for non-food items. Recycling rules vary by city; use "unsure" if it depends heavily on local rules and say so in confidence.note.
- reuse: possible=true only if the item can realistically be reused or repurposed; ideas = concrete, specific ways to do it (empty if not possible).
- answer: 1-3 plain sentences. why: one sentence on the environmental benefit.
- recommendations / alternatives: short actionable strings.
- lifecycle (only for category "lifecycle"): estimate, repairs, donation. recipes (only for "food"): title, time, ingredients, steps.

When category is "lifecycle" (a durable item: clothes, shoes, electronics, furniture, appliances, tools):
- itemName: the specific object, with brand/type if visible (e.g. "Nike running shoes").
- answer: its typical lifespan, then roughly how much life is left given the condition you can see or the user describes.
- lifecycle.estimate: short typical range (e.g. "5–8 years"). lifecycle.repairs: concrete fixes for visible or likely wear. lifecycle.donation: where it can be donated, resold or taken back (types of places, not invented store names).
- recommendations: care tips that extend its life. alternatives: ways to repurpose it, then how to dispose of it responsibly at end of life.
- Always include the lifecycle object and reuse.

When category is "food" (leftovers, ingredients, produce):
- itemName: the food(s) shown or described.
- answer: whether it is likely still good to eat and roughly how long it keeps; if spoilage is possible, say what signs to check and to throw it out if unsure.
- recipes: 2-3 quick recipes that use it up. recommendations: how to store, freeze or preserve it.
- alternatives: other options besides the trash (e.g. stock/broth from scraps, regrowing, sharing or a community fridge, composting what's left).
- Only set bin if the food is spoiled or inedible scraps. Always include recipes.
- confidence.level is low|medium|high; be honest if the photo is unclear.
- A "Hint" comes from an image classifier: use it to name the item and pick the bin unless the photo clearly shows otherwise.
Never invent certainty. Keep every string short.`;

const strArray = { type: 'array', items: { type: 'string' } };
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['food', 'sorter', 'lifecycle'] },
    itemName: { type: 'string' },
    answer: { type: 'string' },
    why: { type: 'string' },
    bin: { type: 'string', enum: ['recycling', 'garbage', 'compost', 'hazardous', 'ewaste', 'unsure'] },
    reuse: {
      type: 'object',
      properties: { possible: { type: 'boolean' }, ideas: strArray },
      required: ['possible', 'ideas'],
    },
    recommendations: strArray,
    alternatives: strArray,
    confidence: {
      type: 'object',
      properties: { level: { type: 'string', enum: ['low', 'medium', 'high'] }, note: { type: 'string' } },
      required: ['level', 'note'],
    },
    lifecycle: {
      type: 'object',
      properties: { estimate: { type: 'string' }, repairs: strArray, donation: strArray },
      required: ['estimate', 'repairs', 'donation'],
    },
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, time: { type: 'string' }, ingredients: strArray, steps: strArray },
      },
    },
  },
  required: ['category', 'itemName', 'answer', 'why', 'recommendations', 'alternatives', 'confidence'],
};

/**
 * Calls Gemini straight from the app. The key is bundled with the app and extractable,
 * so use this for demos only — prefer the backend provider for anything real.
 */
export function createDirectGeminiProvider(apiKey: string, model = DEFAULT_MODEL): AiProvider {
  return {
    name: 'gemini',
    async ask(request: AiRequest): Promise<AiResponse> {
      const parts: object[] = [
        { text: `Category: ${request.category}\nUser says: ${request.text || '(nothing — identify the item in the photo)'}` },
      ];
      if (request.hint) parts.push({ text: `Hint: ${request.hint}` });
      if (request.imageUri) {
        try {
          parts.push({ inline_data: { mime_type: 'image/jpeg', data: (await toDataUrl(request.imageUri)).split(',')[1] ?? '' } });
        } catch {
          throw new AiError('We could not read that photo. Please try another one.');
        }
      }

      let res: Response;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts }],
            generationConfig: { responseMimeType: 'application/json', responseJsonSchema: RESPONSE_SCHEMA },
          }),
        });
      } catch {
        throw new AiError('Could not reach Relast. Check your connection and try again.');
      }
      if (!res.ok) throw new AiError(`The assistant is unavailable right now (error ${res.status}).`);

      try {
        const data = await res.json();
        const text: string = data.candidates[0].content.parts[0].text;
        const json = JSON.parse(text);
        return parseAiResponse({ ...json, question: request.text });
      } catch (e) {
        if (e instanceof AiError) throw e;
        throw new AiError('The assistant sent a response we could not read. Please try again.');
      }
    },
  };
}
