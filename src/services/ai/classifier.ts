import { AiError, type BinType, type ClassifierResult } from './types';

export const CLASSIFIER_MODEL = 'dima806/garbage_types_image_detection';

// Keep in sync with LABEL_TO_BIN / MIN_SCORE / MIN_MARGIN in server/app.py.
const LABEL_TO_BIN: Record<string, BinType> = {
  battery: 'hazardous',
  biological: 'compost',
  'brown-glass': 'recycling',
  cardboard: 'recycling',
  clothes: 'garbage',
  'green-glass': 'recycling',
  metal: 'recycling',
  paper: 'recycling',
  plastic: 'recycling',
  shoes: 'garbage',
  trash: 'garbage',
  'white-glass': 'recycling',
};
const MIN_SCORE = 0.2;
const MIN_MARGIN = 1.5;

export interface LabelScore {
  label: string;
  score: number;
}

/**
 * Turns the model's top-2 into a bin. Its probabilities are flat, so trust the top label only
 * when it clears a floor AND clearly beats the runner-up; otherwise `unsure`.
 */
export function toClassifierResult(model: string, [top, runnerUp]: LabelScore[]): ClassifierResult {
  const confident = top.score >= MIN_SCORE && top.score >= MIN_MARGIN * (runnerUp?.score ?? 0);
  return { model, label: top.label, score: top.score, bin: (confident && LABEL_TO_BIN[top.label]) || 'unsure' };
}

const BINS = ['recycling', 'garbage', 'compost', 'hazardous', 'ewaste', 'unsure'];

const isClassifierResult = (v: unknown): v is ClassifierResult => {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.model === 'string' &&
    typeof r.label === 'string' &&
    typeof r.score === 'number' &&
    typeof r.bin === 'string' &&
    BINS.includes(r.bin)
  );
};

/**
 * Asks the Relast classifier service (server/app.py) which bin a photo belongs in.
 * Contract: POST {url}/classify (multipart/form-data, `image` file) -> ClassifierResult.
 */
export async function classifyImage(baseUrl: string, imageUri: string): Promise<ClassifierResult> {
  const form = new FormData();
  // React Native's FormData accepts { uri, name, type } file descriptors.
  form.append('image', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);

  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/$/, '')}/classify`, { method: 'POST', body: form });
  } catch {
    throw new AiError('Could not reach the trash classifier.');
  }
  if (!res.ok) throw new AiError(`The trash classifier is unavailable (error ${res.status}).`);

  const json: unknown = await res.json().catch(() => null);
  if (!isClassifierResult(json)) throw new AiError('The trash classifier sent a response we could not read.');
  return json;
}
