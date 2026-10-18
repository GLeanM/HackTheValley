import { CLASSIFIER_MODEL, toClassifierResult, type LabelScore } from './classifier';
import { toDataUrl } from './image';
import { AiError, type ClassifierResult } from './types';

/**
 * Bridge to public/classifier.html, which runs the trash classifier on the device
 * (Transformers.js + ONNX). ClassifierHost mounts that page invisibly — an iframe on web,
 * a WebView on native — and registers how to send it messages.
 */
export const ON_DEVICE_MODEL = `${CLASSIFIER_MODEL} (on-device)`;
const TIMEOUT_MS = 15000;

type Status = 'none' | 'loading' | 'ready' | 'failed';
interface Pending {
  resolve: (top: LabelScore[]) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let send: ((message: string) => void) | null = null;
let status: Status = 'none';
let nextId = 0;
const pending = new Map<string, Pending>();

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isTop = (v: unknown): v is LabelScore[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => isObj(x) && typeof x.label === 'string' && typeof x.score === 'number');

function failAll(reason: string) {
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    p.reject(new AiError(reason));
  }
  pending.clear();
}

/** Called by ClassifierHost when its page mounts (`fn`) or unmounts / can't load (`null`). */
export function registerClassifierHost(fn: ((message: string) => void) | null) {
  send = fn;
  status = fn ? 'loading' : 'none';
  if (!fn) failAll('The on-device classifier was unloaded.');
}

/** Feed every message the page posts back into here. */
export function handleClassifierMessage(data: unknown) {
  let msg: unknown;
  try {
    msg = typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return;
  }
  if (!isObj(msg)) return;
  if (msg.type === 'ready') status = 'ready';
  else if (msg.type === 'error') {
    status = 'failed';
    console.warn('[relast] on-device classifier failed to load:', msg.message);
    failAll('The on-device classifier failed to load.');
  } else if (msg.type === 'result' && typeof msg.id === 'string') {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    clearTimeout(p.timer);
    if (isTop(msg.top)) p.resolve(msg.top);
    else p.reject(new AiError(typeof msg.error === 'string' ? msg.error : 'The on-device classifier sent a bad result.'));
  }
}

export async function classifyOnDevice(imageUri: string): Promise<ClassifierResult> {
  if (!send || status !== 'ready') throw new AiError(`The on-device classifier is not ready (${status}).`);
  const post = send;

  let image: string;
  try {
    image = await toDataUrl(imageUri);
  } catch {
    throw new AiError('We could not read that photo.');
  }

  const id = String(++nextId);
  const top = await new Promise<LabelScore[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new AiError('The on-device classifier took too long.'));
    }, TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    post(JSON.stringify({ type: 'classify', id, image }));
  });
  return toClassifierResult(ON_DEVICE_MODEL, top);
}
