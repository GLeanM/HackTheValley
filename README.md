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

### Carbon tracking

The Profile tab's **Travel impact** card estimates CO₂ saved by walking from your speed while the app is open (foreground location only). Its `trips` table comes from `supabase/migrations/20261018000000_trips.sql`; apply it with the database steps below.

## Database (Supabase)

Schema changes live in `supabase/migrations/` and are pushed with the Supabase CLI (a devDependency):

```bash
npm run db:login           # once per machine — opens the browser for an access token
npm run db:link            # once per clone — asks for the database password (Dashboard → Project Settings → Database)
npm run db:status          # which migrations the remote has applied
npm run db:new <name>      # create a new migration file, then write the SQL
npm run db:push            # apply pending migrations to the linked project
```

Write migrations so they can be re-run (`if not exists`, `drop policy if exists` before `create policy`). The `history` table was created by hand before migrations were tracked, so `20261017000000_history.sql` is marked as applied without being run and doesn't exactly match the live columns.

## Checks

```bash
npx tsc --noEmit       # typecheck
```

Project conventions and architecture notes for contributors and AI agents are in [`AGENTS.md`](AGENTS.md).
