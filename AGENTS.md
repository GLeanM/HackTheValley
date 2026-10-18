# Relast — agent guide

Relast is an **AI-powered sustainability assistant**: an Expo / React Native / TypeScript mobile app built for a hackathon. This file is the single source of project context for AI agents. `CLAUDE.md` is just `@AGENTS.md` — keep it that way so Claude Code, Codex, and Cursor all read one file. Put new project knowledge **here**, not in a parallel doc.

Prioritize mobile-first patterns, performance, and cross-platform compatibility.

---

## 1. What Relast does

Three features, all funnelling through one AI assistant screen. Each maps to a `Category` id used throughout the code:

| Feature | `Category` | What the user gets |
| --- | --- | --- |
| Product lifespan | `lifecycle` | Estimated lifespan for the item's detected condition, repair options, donation spots |
| Waste sorter | `sorter` | Which bin the item belongs in — recycling / garbage / compost |
| Food rescue | `food` | Recipes they can make from leftovers |

The user can submit **text only, a photo only, or a photo plus text**, and may leave the category on `auto` to let the AI infer it. Core journey:

```
Login → Home → Assistant (text / photo / category) → Answer → Ask again or Home
                                  ↑ Profile tab lists saved history
```

### Naming

- The product is **Relast**. Use that in all user-facing strings.
- `Design.png` at the repo root is a **stale mockup branded "LOOP"** — useful for layout and palette reference, wrong for naming.
- `app.json` still carries the scaffold identity (`name`/`slug` `HackTheValley`, scheme `hackthevalley`). Don't rename it casually; the scheme affects deep links and the dev build.

---

## 2. Commands

**This is an npm project** — only `package-lock.json` exists. Use `npx`, never `bunx`.

```bash
npm install && npm run build:model  # first-time setup; build:model needs Python 3 (see README / §6)
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm add — resolves SDK-compatible versions
npx expo start              # dev server (= npm start)
npx expo lint               # lint (= npm run lint)
npx tsc --noEmit            # typecheck — there is NO npm script for this, run it directly
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run **lint and typecheck before declaring any task done.**

⚠️ **`npx expo lint` currently fails.** `eslint.config.js` exists and imports `eslint-config-expo/flat`, but **neither `eslint` nor `eslint-config-expo` is in `package.json` or installed**. Until that is fixed, `npx tsc --noEmit` is the only check that actually runs.

There is no test suite (no Jest config, no test files) — if you need to prove a change works, run the app.

---

## 3. Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (currently **SDK 58**, React Native 0.88, React 19.3).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v58.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

---

## 4. Architecture map

Routes live in `src/app/` (Expo Router, typed routes enabled). Everything else lives outside it.

| Path | Role |
| --- | --- |
| `src/app/_layout.tsx` | Root stack. Splash gating on `ready`; auth routing via `<Stack.Protected guard={...}>`; wraps app in `GestureHandlerRootView` + `AppProvider`. |
| `src/app/(auth)/index.tsx` | Welcome screen — branding, mascot, "Get Started". |
| `src/app/(auth)/login.tsx` / `signup.tsx` | Mock auth forms. **Already approved by the user — don't redesign them.** |
| `src/app/(app)/_layout.tsx` | Registers `(tabs)`, `assistant` (slides from bottom), `answer`. |
| `src/app/(app)/(tabs)/_layout.tsx` | Home / Scan / Profile tab bar. |
| `src/app/(app)/(tabs)/index.tsx` | Home: greeting, three feature cards, impact counter, "games coming soon". |
| `src/app/(app)/(tabs)/scan.tsx` | **Intentionally `return null`.** It exists only so the tab bar has a Scan entry; `tabPress` is `preventDefault()`-ed in the tabs layout and redirects to `/assistant`. Don't "fix" it. |
| `src/app/(app)/assistant.tsx` | **The core screen.** Text input, expandable text-only mode, camera frame, image picker, category wheel, side controls, submit. |
| `src/app/(app)/answer.tsx` | Response screen. Looks an entry up by `id` from in-memory history. |
| `src/components/relast/category-wheel.tsx` | The app's signature rotating category selector. |
| `src/components/relast/{mascot,primary-button,circle-button}.tsx` | Shared UI primitives. |
| `src/constants/palette.ts` | **The** design tokens. |
| `src/services/ai/` | AI layer (see §6). |
| `src/state/app-context.tsx` | Auth + history + persistence (see §7). |

Navigation: import `Link`, `router`, and `useLocalSearchParams` from `expo-router`. Docs: https://docs.expo.dev/router/introduction.md

---

## 5. Visual design

The style is friendly, modern, nature-inspired: soft greens, cream backgrounds, rounded cards, circular controls, generous whitespace.

**Always import `Palette` from `@/constants/palette`. Never hardcode a hex value.**

```ts
cream  #FBF7EC   card   #FFFFFF   white     #FFFFFF
mint   #E8F3E0   mintDeep #D2E8C6
leaf   #6FAE4F   forest #2F6B3A   forestDark #1F4A28
ink    #1E2A20   muted  #5F6F62   border    #E3E8D8
sand   #F3E9D2   clay   #C97B4A
danger #B3402F   dangerBg #FBE9E5
```

- Styling is **`StyleSheet.create`**, defined at the bottom of each file. There is **no NativeWind or Tailwind — do not add one.**
- The app is pinned light-only (`app.json` → `userInterfaceStyle: "light"`). The dark-mode hooks in `src/hooks/` are dead scaffold (see §10).
- `palette.ts` also exports `Radius` (`card: 24, pill: 999, input: 20`), but **nothing imports it** — radii are currently hardcoded at call sites. Prefer `Radius` in new code.
- Icons are `Ionicons` from `@expo/vector-icons`; type icon names as `keyof typeof Ionicons.glyphMap`.
- The category wheel is the visual signature of the app. Home stays minimal; the assistant screen is playful and focused; the answer screen prioritizes clarity.

---

## 6. The AI layer (`src/services/ai/`)

> **Gemini is live when `EXPO_PUBLIC_GEMINI_API_KEY` is set in `.env`** (gitignored). The app then calls Gemini directly (`direct-gemini-provider.ts`, model `gemini-3.5-flash-lite`). Without a key or backend URL every answer comes from the mock provider, and `answer.tsx` labels it *"Sample answer — the live AI isn’t connected yet."*

| File | Role |
| --- | --- |
| `index.ts` | Barrel + provider selection. |
| `types.ts` | All AI types and the shared `CATEGORY_META` / `CATEGORIES` constants. |
| `mock-provider.ts` | Canned responses with a 1.2s delay. |
| `gemini-provider.ts` | Talks to **our** backend (`EXPO_PUBLIC_RELAST_API_URL`), never to Gemini directly. |
| `direct-gemini-provider.ts` | Calls Gemini straight from the app with the `.env` key. Holds the per-category `SYSTEM_PROMPT` and JSON `RESPONSE_SCHEMA`. |
| `parse.ts` | Defensively validates untrusted backend JSON. |
| `classifier.ts` | Label → `BinType` map + confidence rule; calls the fallback classifier server in `server/` (`POST /classify`). |
| `on-device-classifier.ts` | Bridge to the on-device model in `public/classifier.html` (postMessage, 15 s timeout). |
| `image.ts` | `toDataUrl(uri)` shared by Gemini + classifier. |

**Rules:**

- **Always import from the barrel `@/services/ai`** — never from `./mock-provider` or `./types` from outside the directory.
- Provider is chosen at module load in `index.ts`:
`EXPO_PUBLIC_RELAST_API_URL` (backend) wins, then `EXPO_PUBLIC_GEMINI_API_KEY` (direct Gemini), else `mockProvider`. Expo reads `.env` only at startup, so restart `npx expo start` after changing it.
- **Never commit the Gemini key.** It lives only in the gitignored `.env`. Any `EXPO_PUBLIC_` value is bundled into the web site and app, so it's extractable: this is demo-grade, and the key should be restricted or rotated after the event. The long-term plan is a backend; the contract `gemini-provider.ts` expects:
  `POST {EXPO_PUBLIC_RELAST_API_URL}/ask` as `multipart/form-data` with `text`, `category` (`auto|food|sorter|lifecycle`), optional `image` file → JSON matching `AiResponse` minus `source`.
- **Trash classifier (Sorter):** `index.ts` always wraps the text provider. For `sorter`/`auto` requests with a photo it tries, in order: (1) **on-device**: `public/classifier.html` runs `dima806/garbage_types_image_detection` (int8 ONNX) with Transformers.js. `src/components/relast/classifier-host` mounts it in a hidden iframe on web or a hidden WebView on native, from `(app)/_layout.tsx`. (2) The **server** at `EXPO_PUBLIC_RELAST_CLASSIFIER_URL` (`server/`), if set. (3) Nothing. A confident result sets `bin` and `classifier` on the response and is passed to the text provider as `AiRequest.hint`. An `unsure` result or a failure moves on to the next option silently.
  - Model + runtime files in `public/models/` and `public/vendor/` are **gitignored**: run `npm run build:model` after cloning (needs Python 3; produces ~90 MB model + ~75 MB wasm).
  - Native loads the page from the Expo dev server (`Constants.expoConfig.hostUri`), so on-device works in Expo Go/dev only. A native production build has no host, so it falls back to the server or plain answer.
  - The label → bin map and the floor-0.2 / margin-1.5 rule exist in both `classifier.ts` and `server/app.py`. Keep them in sync.
- Every response carries `source: 'mock' | 'gemini'` so the UI can stay honest. Keep that discriminator.
- `AiResponse` is the contract: `category`, `itemName`, `question`, `answer`, `why`, `recommendations[]`, `alternatives[]`, `confidence {level, note}`, plus optional `bin`, `lifecycle`, `recipes`. **Changing its shape means touching `types.ts`, `parse.ts`, `mock-provider.ts`, and `answer.tsx` together.**
- Errors are thrown as `AiError` with a user-facing message; screens catch it and render the message.
- **Dev trigger:** typing text matching `/\/error/i` in the assistant makes the mock provider throw — that's how you exercise the error state.
- **Category answers come from the prompt in `direct-gemini-provider.ts`.** Lifecycle fills `lifecycle {estimate, repairs, donation}`, `reuse`, care-tip `recommendations` and repurpose/disposal `alternatives`. Food fills `recipes`, storage `recommendations` and non-trash `alternatives`. Change what the screens show there, not in `answer.tsx`.
- Don't present uncertain guesses as facts. Recycling advice is location-dependent; the `confidence.note` field exists for exactly that caveat.

---

## 7. State & persistence (`src/state/app-context.tsx`)

One plain React Context is the single source of truth. **No zustand, redux, or react-query — do not add one.**

`useApp()` returns `{ ready, user, history, signUp, signIn, signOut, addHistory, trips, addTrip, tracking, setTracking }`.

- Auth and data are **Supabase** (`src/lib/supabase.ts`, `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`). The session is persisted in AsyncStorage by the Supabase client.
- `history: HistoryEntry[]`, **newest first**, from table `history` (columns `submitted_text`, `image_reference`, `ai_response`). Images go to the private `history-images` bucket and are shown via signed URLs.
- `trips: Trip[]`, newest first, from table `trips` (see §7b). `tracking` is a device preference stored in AsyncStorage under `relast:tracking`.
- `signOut` clears `history` and `trips` from memory; the rows stay in Supabase for the next login.
- ⚠️ `supabase/migrations/20261017000000_history.sql` has **drifted** from the live schema (it still names the columns `text` / `image_uri` / `response`). Trust the code.
- Keep the boundary: persistence lives in this file, not in screens.
- **Schema changes:** add a migration with `npm run db:new <name>` and apply it with `npm run db:push` (after one-time `db:login` + `db:link`; check with `db:status`). Migrations must be idempotent. `20261017000000_history.sql` is recorded as applied via `migration repair` — never replay it.

---

## 7b. Carbon tracking (`src/services/carbon/`)

The Profile tab's **Travel impact** card (`components/relast/carbon-card.tsx`) estimates CO₂ saved by walking vs. emitted travelling. It is an **expected-value model**: speed tier × average emission factor, never presented as a measurement.

- **Capture:** `components/relast/trip-tracker.tsx` (renders nothing, mounted in `(app)/_layout.tsx`) runs `expo-location` `watchPositionAsync` (Balanced accuracy, 15 s / 10 m) **only while the app is open and the user has switched tracking on**. Foreground "when in use" permission only, so it works in Expo Go. Backgrounding the app flushes the current segment.
- **Logic:** `trip-recorder.ts` is a pure state machine: drops fixes with accuracy > 50 m, derives speed from haversine distance ÷ Δt when `coords.speed` is null/≤0 (web, iOS invalid), smooths with a median of 3, switches mode after 2 consecutive fixes, and ends segments on standstill, a > 5 min gap, or flush. Segments under 100 m are discarded.
- **Tiers / factors** (`factors.ts`): stationary < 0.5 m/s; walk < 2.5 (0 g/km); vehicle (car/bus blend) < 33 (120 g/km); rail < 70 (41 g/km); flight above (255 g/km). **Saved = walk km × 120.** Cycling/running land in "vehicle" — the card says so.
- **Storage:** client computes `co2_g` and inserts into Supabase `trips` (`supabase/migrations/20261018000000_trips.sql`, RLS owner-only). There is no Edge Function.

---

## 8. Code conventions

Match what the code already does:

- **Path aliases:** `@/*` → `src/*`, `@/assets/*` → `assets/*`. Use them for all cross-directory imports; relative imports only between siblings (e.g. inside `services/ai/`).
- **Exports:** route files `export default function XxxScreen()`. **Everything else is a named export** (`export function PrimaryButton`, `export const Palette`).
- **Types:** `interface` for object and prop shapes; `type` for unions, aliases, and mapped/record types. `as const` on constant objects. Use `import type` / inline `type` modifiers.
- **Type guards** are the established pattern for validating route params and untrusted JSON:
  ```ts
  const isCategory = (v: unknown): v is Category => ...
  ```
- **Files are kebab-case**; route groups use parentheses. Keep non-route code out of `src/app/`.
- **Import order:** third-party block, blank line, then the `@/` block, each alphabetized (VS Code organize-imports-on-save is configured).
- Reusable components take an `interface Props`; small local helpers may inline their props.
- Keep components reusable and TypeScript types explicit. `strict: true` is on.

---

## 9. Status — built, stubbed, broken

### Working
Full login → home → assistant → answer → profile journey; the rotating `CategoryWheel` (Reanimated + Gesture Handler, really interactive, not decorative); camera with image-library fallback on permission denial; image preview with change/remove before submit; disabled-until-valid submit with a loading state and an `inFlight` ref guarding duplicate submissions; error rendering; history persisted and listed newest-first; tapping a history row reopens its saved answer.

### Deliberately stubbed — do not "fix" without being asked
Mock AI responses (only when no Gemini key is set) · mock auth · placeholder `Mascot` (nested `View`s, not art) · `scan.tsx` returning `null` · "Sustainability games coming soon" card · `supabase/` with only `config.toml` · placeholder assets throughout.

### Actually broken — the app will not bundle as committed
Flag these to the user before claiming a change runs:

1. **`@react-native-async-storage/async-storage` is missing.** Imported at `src/state/app-context.tsx:1`, but absent from `package.json` *and* `node_modules`. The root layout loads this module, so it breaks every screen. Fix: `npx expo install @react-native-async-storage/async-storage`.
2. **`@expo/vector-icons` is missing.** Imported by 8 files (`answer.tsx`, `assistant.tsx`, `(tabs)/index.tsx`, `(tabs)/profile.tsx`, `(tabs)/_layout.tsx`, `(auth)/index.tsx`, `category-wheel.tsx`, `circle-button.tsx`) but likewise absent from `package.json` and `node_modules`.
3. **Linting is not runnable.** `eslint` and `eslint-config-expo` are missing from `package.json` and `node_modules`, so `npx expo lint` errors out even though `eslint.config.js` is present.
4. **Uncommitted dependency downgrades.** Working-tree edits to `package.json` loosened pins and downgraded `react-native-reanimated` 4.7.1 → `^4.2.2` and `react-native-worklets` 0.13.0 → `^0.7.4`. `category-wheel.tsx` depends on both. Run `npx expo-doctor` / `npx expo install --fix` before trusting the animation layer.

`npx tsc --noEmit` reports exactly 9 errors, **all** of them `TS2307 Cannot find module` for the two packages above — nothing else in the codebase is type-broken. Once both are installed the project should typecheck clean.

### Out of scope for now
Games. Background trip tracking (needs a dev build + `expo-task-manager`). Focus on polishing the user journey and the circular selector.

---

## 10. Known dead code — don't mistake scaffold for architecture

These are untouched `create-expo-app` leftovers, **unreferenced by any route**:

- `src/components/{themed-text,themed-view,hint-row,web-badge,external-link,animated-icon*}.tsx`, `src/components/ui/collapsible.tsx`
- `src/constants/theme.ts`, `src/global.css`, `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme*.ts`
- Many assets: `react-logo*`, `expo-logo`, `expo-badge*`, `tutorial-web`, `logo-glow`, `assets/images/tabIcons/*`
- Unused dependencies: `@expo/ui`, `expo-device`, `expo-font`, `expo-glass-effect`, `expo-linking`, `expo-system-ui`, `react-native-url-polyfill`, `@supabase/supabase-js`
- `README.md` is the human-facing setup guide (install, `build:model`, env vars). Keep it in sync with §2 and §6.

**`src/constants/theme.ts` is NOT the app's theme — `src/constants/palette.ts` is.**

Minor known drift: `isMockAi` (`services/ai/index.ts`) and `Radius` (`palette.ts`) are exported but unused; the screen-title map (`'Give it a second life'` / `'Sort it right'` / `'Rescue your leftovers'`) is duplicated between `assistant.tsx` and `answer.tsx`; `profile.tsx` renders `history.length` for two different stats.

---

## 11. Native builds & EAS

- `ios/` and `android/` **do not exist and must never be created by hand** — this is Continuous Native Generation. Configure native behavior in `app.json` and config plugins. `.gitignore` ignores `/ios` and `/android`.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Use EAS to build, sign, and submit in the cloud (`eas build`, `eas submit`) and to ship OTA updates (`eas update`) — no local Xcode or Android Studio required. Run it as `npx eas-cli@latest <command>`. Docs: https://docs.expo.dev/eas/index.md
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
