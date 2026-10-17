# Relast

An AI-powered sustainability assistant (Expo / React Native / TypeScript). It shows you how long products last, which bin your trash goes in, and what to cook with leftovers. It runs on iOS, Android (Expo Go) and web.

## Setup

**Requirements:** Node.js and **Python 3**. Python is only used to build the on-device trash classifier. On **Windows**, run the commands from Git Bash or WSL, because `build:model` is a bash script.

```bash
npm install            # JS dependencies
npm run build:model    # one-time: builds the on-device trash classifier (see below)
npx expo start         # dev server; press w for web, or scan the QR code with Expo Go
```

### The trash classifier model (`npm run build:model`)

The Sorter feature uses an image model ([`dima806/garbage_types_image_detection`](https://huggingface.co/dima806/garbage_types_image_detection)) that runs **on the device**: in the browser on web, and in a hidden WebView in the mobile app. The model files are too big for git, so each clone builds them once. The script:

- creates a Python virtualenv in `server/.venv`;
- downloads the model and converts it to ONNX (`public/models/`, about 90 MB);
- copies the browser ML runtime into `public/vendor/` (about 75 MB).

The first run takes a few minutes and downloads around 1 GB, mostly PyTorch. Both output folders are gitignored.

**Run it again** when the model changes or after upgrading `@huggingface/transformers`.

**If you skip it,** the app still works. The Sorter just falls back to the classifier server (if configured) or the normal AI answer, and won't show the "on-device trash classifier" line.

### Running it

- **Web:** nothing extra. The browser downloads the model from your dev server the first time and caches it.
- **Phone (Expo Go):** the phone loads the model from the laptop running `expo start`, so it must be on the same network (same Wi-Fi or Tailscale). After logging in, give it about 10–20 seconds the first time while the model downloads.
- **Standalone production builds** don't include the model. They have no dev server to load it from, so they fall back.

### Optional environment variables (`.env` in the repo root)

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Live AI answers through Gemini (demo only, because the key ships inside the app). Without it, answers are sample data. |
| `EXPO_PUBLIC_RELAST_API_URL` | Backend that answers questions, so the Gemini key stays on a server. |
| `EXPO_PUBLIC_RELAST_CLASSIFIER_URL` | Backup classifier server for when the on-device model isn't available. See [`server/README.md`](server/README.md). |

Restart `npx expo start` after changing `.env`.

## Checks

```bash
npx tsc --noEmit       # typecheck
```

Project conventions and architecture notes for contributors and AI agents are in [`AGENTS.md`](AGENTS.md).
