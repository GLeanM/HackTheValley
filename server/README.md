# Relast trash classifier

A small FastAPI service for the **Sorter** feature. It runs
[`dima806/garbage_types_image_detection`](https://huggingface.co/dima806/garbage_types_image_detection)
(ViT, 12 classes, Apache-2.0) and maps each label to the app's `BinType`.
The app runs the same model **on-device first** (`public/classifier.html`, built by
`npm run build:model`). This server is the **fallback**, for when the on-device model isn't loaded,
e.g. a native production build. The app calls it from `src/services/ai/classifier.ts`.

## Run locally

```bash
cd server
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8787   # first start downloads ~350 MB of weights
```

Then point the app at it. Put this in the repo-root `.env` and use your laptop's LAN IP, since `localhost` on the phone is the phone itself:

```
EXPO_PUBLIC_RELAST_CLASSIFIER_URL=http://192.168.x.x:8787
```

Restart `npx expo start` after changing `.env`.

## API

`POST /classify` (multipart, field `image`) →
`{"model": "...", "label": "plastic", "score": 0.41, "bin": "recycling"}`

`bin` is `unsure` unless the top score is ≥ `RELAST_CLASSIFIER_MIN_SCORE` (default 0.2) **and**
≥ `RELAST_CLASSIFIER_MIN_MARGIN` (default 1.5) × the runner-up. This model's probabilities are flat, so a high
fixed cutoff never fires. When the result is `unsure`, the app ignores the classifier.

## Deploy to Hugging Face Spaces

Create a Space with the **Docker** SDK and push `app.py`, `requirements.txt` and `Dockerfile`
from this folder. Then set `EXPO_PUBLIC_RELAST_CLASSIFIER_URL=https://<user>-<space>.hf.space`.
