import { AiError, type AiResponse, type BinType, type Category, type Recipe } from './types';

const CATEGORIES = ['food', 'sorter', 'lifecycle'];
const LEVELS = ['low', 'medium', 'high'];
const BINS = ['recycling', 'garbage', 'compost', 'hazardous', 'ewaste', 'unsure'];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown, field: string): string => {
  if (typeof v !== 'string' || !v.trim()) throw new AiError(`Malformed response: "${field}" missing.`);
  return v;
};
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Validates untrusted model/backend JSON into an AiResponse (throws AiError if malformed). */
export function parseAiResponse(raw: unknown): AiResponse {
  if (!isObj(raw)) throw new AiError('Malformed response from the server.');
  const category = raw.category;
  if (typeof category !== 'string' || !CATEGORIES.includes(category)) {
    throw new AiError('Malformed response: unknown category.');
  }
  const conf = isObj(raw.confidence) ? raw.confidence : {};
  const level =
    typeof conf.level === 'string' && LEVELS.includes(conf.level)
      ? (conf.level as 'low' | 'medium' | 'high')
      : 'low';

  const lifecycle = isObj(raw.lifecycle)
    ? {
        estimate: typeof raw.lifecycle.estimate === 'string' ? raw.lifecycle.estimate : 'Unknown',
        repairs: strList(raw.lifecycle.repairs),
        donation: strList(raw.lifecycle.donation),
      }
    : undefined;

  const reuse = isObj(raw.reuse)
    ? { possible: raw.reuse.possible === true, ideas: strList(raw.reuse.ideas) }
    : undefined;

  const recipes: Recipe[] | undefined = Array.isArray(raw.recipes)
    ? raw.recipes.filter(isObj).map((r) => ({
        title: typeof r.title === 'string' ? r.title : 'Recipe',
        time: typeof r.time === 'string' ? r.time : '',
        ingredients: strList(r.ingredients),
        steps: strList(r.steps),
      }))
    : undefined;

  return {
    category: category as Category,
    itemName: str(raw.itemName, 'itemName'),
    question: typeof raw.question === 'string' ? raw.question : '',
    answer: str(raw.answer, 'answer'),
    why: typeof raw.why === 'string' ? raw.why : '',
    recommendations: strList(raw.recommendations),
    alternatives: strList(raw.alternatives),
    confidence: {
      level,
      note: typeof conf.note === 'string' ? conf.note : 'Confidence was not provided.',
    },
    bin:
      typeof raw.bin === 'string' && BINS.includes(raw.bin) ? (raw.bin as BinType) : undefined,
    reuse,
    lifecycle,
    recipes,
    source: 'gemini',
  };
}
