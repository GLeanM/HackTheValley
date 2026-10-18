export type Category = 'food' | 'sorter' | 'lifecycle';
/** What the user picked; `auto` lets the AI decide from the photo/text. */
export type CategoryChoice = Category | 'auto';

export interface AiRequest {
  text: string;
  imageUri: string | null;
  category: CategoryChoice;
  /** What the image classifier saw (e.g. "plastic"), so the text model's answer agrees with it. */
  hint?: string;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type BinType = 'recycling' | 'garbage' | 'compost' | 'hazardous' | 'ewaste' | 'unsure';

export interface Recipe {
  title: string;
  time: string;
  ingredients: string[];
  steps: string[];
}

export interface AiResponse {
  /** Category the AI resolved (may differ from what the user selected). */
  category: Category;
  itemName: string;
  /** Interpreted question, shown under the item name. */
  question: string;
  answer: string;
  /** Short explanation of why the recommended action helps. */
  why: string;
  recommendations: string[];
  alternatives: string[];
  confidence: { level: ConfidenceLevel; note: string };
  bin?: BinType;
  /** Can the item be reused as-is or repurposed? `ideas` explains how. */
  reuse?: { possible: boolean; ideas: string[] };
  lifecycle?: { estimate: string; repairs: string[]; donation: string[] };
  recipes?: Recipe[];
  /** Set when the trash-classifier model picked `bin` (see classifier.ts). */
  classifier?: ClassifierResult;
  /** Which provider produced this — never claim Gemini for mock output. */
  source: 'mock' | 'gemini';
}

export interface ClassifierResult {
  model: string;
  label: string;
  /** Top-1 probability, 0–1. */
  score: number;
  bin: BinType;
}

export interface AiProvider {
  readonly name: 'mock' | 'gemini';
  ask(request: AiRequest): Promise<AiResponse>;
}

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiError';
  }
}

export interface HistoryEntry {
  id: string;
  createdAt: string; // ISO date-time
  category: CategoryChoice;
  text: string;
  imageUri: string | null;
  response: AiResponse;
}

export const CATEGORY_META: Record<
  Category,
  { label: string; blurb: string; icon: 'restaurant-outline' | 'trash-outline' | 'repeat-outline' }
> = {
  food: { label: 'Food', blurb: 'Leftovers, ingredients & recipes', icon: 'restaurant-outline' },
  sorter: { label: 'Sorter', blurb: 'Which bin does it go in?', icon: 'trash-outline' },
  lifecycle: { label: 'Lifecycle', blurb: 'Repair, reuse, donate', icon: 'repeat-outline' },
};

export const CATEGORIES: Category[] = ['food', 'sorter', 'lifecycle'];
