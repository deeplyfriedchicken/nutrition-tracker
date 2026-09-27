# Implementation Brief — Nutrition Calendar

You are building a static, read-only React site that shows a personal Amy food journal as a calendar, plus the GitHub Action that copies Amy data into JSON files the site reads. Every design decision below has been agreed with the owner — implement them as written; if something is genuinely impossible, stop and ask rather than redesigning.

## Read first

1. `CONTEXT.md` — the domain vocabulary (Day, Item, Water Item, Weigh-in, Goals Snapshot, Goal Met). Use these names in code, types, and UI copy. "Entry" is Amy's concept and must not appear in our data or UI.
2. `docs/adr/0001-public-repo-with-personal-food-data.md` and `docs/adr/0002-goals-snapshot-per-day.md`.
3. `design/mockup/index.html` and `design/mockup/styles.css` — the visual design. The mockup's `script.js` was never provided; the UI behaviour is specified in this brief instead. Reuse the stylesheet and its class names as-is.
4. `fixtures/amy/*.json` — real Amy API responses captured 2026-09-26 (profile redacted). Use them as test fixtures.
5. Amy API docs: https://connect.amyfoodjournal.com/docs/amy-api.md

## Stack

- Vite + React + TypeScript, deployed to Vercel as a static site (`npm run build` → `dist`).
- Data lives in `public/data/` and is fetched at runtime by the browser. The browser never talks to Amy.
- The fetch pipeline is a Node + TypeScript script run with `tsx`, in the same repo, importing the same types as the app (e.g. `src/domain/types.ts`).
- Validate every Amy response against a schema (zod or equivalent) before writing anything.
- Vitest for tests.

## Data files (the contract between pipeline and app)

```ts
// src/domain/types.ts
export type Nutrients = {
  calories: number; protein: number; carbs: number; fat: number;
  sugar: number; fiber: number; sodium: number; waterMl: number;
};
export type Goals = { [K in keyof Nutrients]: number | null }; // Goals Snapshot

export type Item = {
  id: string;
  description: string;
  detailedDescription: string | null;
  aiComment: string | null;
  confidence: number | null;      // 0–100
  isWater: boolean;
  updatedAt: string;              // ISO timestamp from Amy
  nutrition: Nutrients;
};

export type Day = {
  schemaVersion: 1;
  date: string;                   // YYYY-MM-DD, Amy timezone
  timezone: string;               // e.g. "America/Los_Angeles"
  totals: Nutrients;              // Amy's day totals, never recomputed by us
  goals: Goals;
  items: Item[];                  // flat; ordered by Amy entry created_at asc, then line_index asc
};

export type DayIndex = {
  schemaVersion: 1;
  timezone: string;
  days: Record<string, { totals: Nutrients; goals: Goals }>; // keys sorted asc
};

export type WeighIn = {
  id: string; kg: number; recordedAt: string; source: string; notes: string | null;
};
export type WeighInLog = {
  schemaVersion: 1;
  weighIns: Record<string, WeighIn[]>; // keyed by Amy recorded_date, keys sorted asc, each list sorted by recordedAt asc
};
```

Files:

- `public/data/days/YYYY-MM-DD.json` — one `Day`.
- `public/data/index.json` — one `DayIndex`.
- `public/data/weigh-ins.json` — one `WeighInLog`.

Invariants:

- A Day file exists **iff** Amy has at least one Item on that date. A date whose refresh returns no Items has its Day file deleted and its index row removed. Weigh-ins never create or keep alive a Day.
- Output must be byte-stable: build objects in the field order above, sort all date-keyed maps ascending, `JSON.stringify(x, null, 2)` + trailing newline. Running the pipeline twice against unchanged Amy data must produce zero git diff.
- **No run-level timestamps** (`generatedAt`, `fetchedAt`, etc.) anywhere — they would force a commit and a Vercel deploy every run.

### Mapping from Amy (`GET /api/v1/nutrition/summary?date=`)

| Amy | Ours |
| --- | --- |
| `totals.*`, `totals.water_milliliters` | `totals.*`, `totals.waterMl` |
| `goals.*`, `goals.water_milliliters` | `goals.*`, `goals.waterMl` (keep `null`s) |
| `entries[].items[]` flattened | `items[]` |
| `item.detailed_description` | `detailedDescription` |
| `item.ai_comment` | `aiComment` |
| `item.confidence_score` | `confidence` |
| `item.is_water_entry` | `isWater` |
| `item.water_milliliters` + nutrient fields | `nutrition` |
| `item.updated_at` | `updatedAt` |
| `item.line_index` | used for ordering only, not stored |

Drop: entry ids, `food_text`, entry totals, per-entry `timezone`, `created_at` (used for ordering only).

### Mapping from Amy (`GET /api/v1/weight-history?limit=`)

`weight_kg` → `kg`, `recorded_at` → `recordedAt`, `source`, `notes`, `id`; group by `recorded_date` (already the local date — do not derive it from `recorded_at`, which is UTC). Keep duplicates (the real data has two identical onboarding weigh-ins on 2026-03-01).

## Pipeline

Script entry points (names are suggestions): `scripts/refresh.ts` and `scripts/backfill.ts`. Auth: `Authorization: Bearer $AMY_API_KEY`, base URL `https://connect.amyfoodjournal.com`.

**Refresh (cron, every 4 hours, `0 */4 * * *`):**

1. `GET /nutrition/summary` with no `date` → gives today's date and the timezone in Amy's terms. Never compute "today" from the runner clock (UTC).
2. `GET /nutrition/summary?date=` for today−1 and today−2.
3. `GET /weight-history?limit=30`.
4. Validate everything. If any request or validation fails, exit non-zero **before writing any file**.
5. Write: for each of the 3 dates, write or delete the Day file and upsert/remove its index row. Merge weigh-ins (below).

**Backfill (`workflow_dispatch` with `start_date` and `end_date` inputs; default start `2026-03-01`, the account creation date):**

1. Discover dates that have Items by walking `GET /food-entries?start_date=&end_date=&limit=90` in 30-day chunks.
2. For each discovered date, fetch `/nutrition/summary?date=` and convert with the same code path as refresh. This keeps one Amy→Day conversion and gets Amy's day totals and goals.
3. Stay under the rate limit of 120 requests/hour per key: pace requests (e.g. ≥31s apart) when more than ~100 are needed.
4. `GET /weight-history?limit=365`.
5. Same all-or-nothing write as refresh.

Backfilled Days get today's goals as their Goals Snapshot. That is accepted (ADR 0002).

**Weigh-in merge rule:** let `n` = entries returned, `limit` = requested limit. If `n < limit`, Amy returned the whole history → replace the whole log. Otherwise, let `oldest` = the oldest returned `recorded_date`; replace every date strictly after `oldest` with the fetched data, and leave `oldest` and earlier dates untouched (the oldest date may be only partially returned).

The pipeline never calls `/me`. Summary gives goals and timezone. `/me` also returns sensitive health-profile data that must never be persisted in this public repo.

**Workflow (`.github/workflows/amy-data.yml`):**

- Triggers: `schedule` (refresh) and `workflow_dispatch` (backfill inputs; with no inputs, run a refresh).
- `permissions: contents: write`; `concurrency: { group: amy-data, cancel-in-progress: false }`.
- After the script: if `git status --porcelain public/data` is non-empty, commit only `public/data` as `github-actions[bot]` with the message `data: refresh <first-date>..<last-date>` (or `data: backfill <start>..<end>`) and push. Vercel's Git integration deploys on push.
- A failed run should fail loudly (GitHub emails the owner). Never commit partial data.

## App behaviour

Page shell, header, and card layout are as in the mockup (title "Nutrition Calendar", subtitle unchanged, Lora headings).

**Data loading:** fetch `index.json` and `weigh-ins.json` on start; fetch a Day file when its date is selected and cache it in memory. Show a simple error state if `index.json` fails.

**Goal Met** (pure function, computed in the browser, never stored):

- Met when `total >= goal` for calories, protein, carbs, fat, fiber, and water.
- Met when `total <= goal` for sugar and sodium.
- Goal is `null` → no Goal Met status (render nothing for that nutrient).
- Always compare against the Day's own Goals Snapshot.

**Calendar card:**

- Month grid, Sunday-first weekday row, prev/next buttons (`.cal-nav-btn`). Navigation is bounded from the month of the earliest Day to the current month; disable the buttons at the bounds.
- Each date is a `.cal-day-btn`. `.cal-day-btn--today` marks today **in the index timezone** (use `Intl.DateTimeFormat` with `timeZone`). `.cal-day-btn--selected` marks the selection.
- Under the number on a Day, show four `.goal-dot`s in order fat, protein, carbs, water, coloured with `--goal-fat`, `--goal-protein`, `--goal-carbs`, `--goal-water`. **Filled** = Goal Met; **hollow ring** (1px border in the colour, transparent fill) = not met. Omit a dot when that goal is `null`. Dates that aren't Days have no dots.
- Legend (`.legend`): the four nutrients with their dot colours, plus a `.legend-note` like "Filled = goal met · Ring = logged, goal missed".

**Selection and URL:**

- On load: `?date=YYYY-MM-DD` if valid; else today if it is a Day; else the most recent Day; else today.
- Selecting any date (Day or not) updates `?date=` via `history.replaceState` and moves the calendar to that month.

**Detail card, for a Day:**

1. `.detail-badge`: the weekday (e.g. "SATURDAY"). `.detail-date`: e.g. "September 26, 2026".
2. `.stat-row` of `.stat-tile`s: Calories (value plus "of 3,493 kcal"-style label), Protein g, Carbs g, Fat g, and **Weight** in lb (kg × 2.20462, 1 decimal). The Weight tile appears only when `weigh-ins.json` has an entry for that date; with several, use the latest `recordedAt`.
3. `.micro-row`: Sugar, Fiber, Sodium as "value / goal" (g, g, mg).
4. `.section-label` "Goals" + `.chip-row`: one `.chip` each for fat, protein, carbs, and water. `.chip-icon` is a circle in the goal colour (filled if met, ring if not). `.chip-label` is the nutrient name. `.chip-detail` is e.g. "36.2 / 182 g · Not met". Omit a chip whose goal is `null`.
5. Water section (`.water-header` / `.water-header-text` "Water"): "887 / 3,000 ml". `.water-caption` lists the Water Items' descriptions (e.g. "From: 30oz of water"), or "No water logged". Water is always shown in **ml**.
6. `.section-label` "Food" + `.food-list`: one `.food-item` per non-water Item, in stored order.
   - `.food-name`: description.
   - `.food-confidence`: "75% confidence", omitted when null.
   - `.food-detail`: `detailedDescription`, hidden when null or identical to the description (the real data often duplicates it). If `aiComment` is present, show it as another `.food-detail` line.
   - `.food-macros`: "110 kcal · 6 g protein · 1 g carbs · 9 g fat".
   - `.food-micros`: "Sugar 1 g · Fiber 0 g · Sodium 480 mg".

**Detail card, for a date that isn't a Day:** the badge and date as above, then `.empty-state` "Nothing logged on this day." If that date has a weigh-in, add a line under it with the weight in lb.

**Formatting:** thousands separators, at most 1 decimal, drop trailing ".0".

**Responsive:** at narrow widths the calendar and detail cards stack and the detail card's 380px `min-width` must not cause horizontal scroll (override it below ~440px).

The `.bar-chart` / `.goal-line` / `.bar-*` styles are intentionally unused in v1 (charts are deferred). Leave them in the stylesheet.

## Tests (Vitest)

Required and sufficient for v1:

- **Amy → Day conversion** using `fixtures/amy/nutrition-summary.2026-05-05.json` (3 Items). Cover: an empty summary (`nutrition-summary.2026-09-25.empty.json`) → "no Day"; a Water Item (build a summary from the 2026-09-26 entry in `food-entries.limit-5.json`); Item ordering across multiple entries (synthesise a second entry).
- **Goal Met**: at-least and at-most directions, exact equality counts as met, `null` goal → no status.
- **Refresh write rules**: an existing Day whose refresh returns no Items is deleted from disk and the index. Running twice with the same input produces identical bytes.
- **Weigh-in merge rule**: full-history replacement when `n < limit`; partial replacement preserving the oldest date and earlier when `n == limit`.

## Out of scope for v1

- Any charts (single-Day or multi-Day), including a weight trend.
- Authentication or access control.
- Writing to Amy (MCP write tools) or calling `/me`.
- UI component tests.

## Facts verified against the live API (2026-09-26)

- Real responses include fields the docs omit: `detailed_description`, `ai_comment`, `confidence_score`, `line_index`, `updated_at` on Items, and `created_at`/`updated_at` on entries.
- Summary `goals` are the user's **current** goals regardless of `date`.
- Logging is sparse (gaps of weeks). So far there is one entry per date, but the API allows several.
- `/openapi.json` returned a Cloudflare 502. Don't depend on it.
- Weight history has only a `limit` parameter (REST max 365), no date filters.

## Setup steps only the owner can do

1. Create a **public** GitHub repo for this directory and push.
2. In Amy → Settings → Amy API, create a key with `amy.read`; add it as the repo secret `AMY_API_KEY`.
3. Import the repo into Vercel (framework preset: Vite).
4. Run the workflow manually once in backfill mode (`start_date=2026-03-01`, `end_date=` today).

## Done when

- `npm run build` succeeds and `npm test` passes.
- Running the backfill locally with a real key produces Day files matching the schema, and a second run produces no diff.
- The site renders the mockup's look with working month navigation, Goal Met dots, a Day panel for 2026-09-26 (including 887 ml water and the Water Item excluded from the food list), and an empty state for 2026-09-25.
