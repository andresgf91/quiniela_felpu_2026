# World Cup 2026 Quiniela — Architecture & Build Spec

**Purpose:** Complete specification to hand to an AI coding agent (Cursor). Build a private prediction-pool web app for a group of friends for the FIFA World Cup 2026 (starts June 11, 2026). The two non-negotiables: **prediction capture must be bulletproof** and the **scoring engine must be thoroughly tested before deployment**.

---

## 1\. Product overview

A Spanish-language web app (UI matches the provided screenshots' style: dark stadium background, glassmorphism cards, gold accents) where each member of a private group:

1. Registers / logs in.  
2. Enters score predictions for all 72 group-stage matches via a fast, low-friction grid UI.  
3. Enters knockout predictions (bracket) for the 32 knockout matches.  
4. Sees a **simulated tournament** generated from their own predictions (group tables, bracket, predicted champion).  
5. Competes on a live **leaderboard** as real results come in.

Hosted on **Railway** (web service \+ Postgres).

---

## 2\. Tournament structure (WC 2026 — hardcode this correctly)

- **48 teams**, **12 groups (A–L)** of 4 teams each.  
- **104 total matches**: 72 group-stage \+ 32 knockout.  
- Group stage: each team plays 3 matches (6 matches per group).  
- Advancement: **top 2 of each group (24) \+ 8 best third-placed teams \= 32 teams**.  
- Knockout: Round of 32 (matches \#73–88), Round of 16 (\#89–96), Quarterfinals (\#97–100), Semifinals (\#101–102), Third-place match (\#103), Final (\#104).  
- Knockout slots use FIFA bracket labels as seen in screenshots: `1A`, `2B`, `3A/B/C/D/F` (third-place slots depend on which thirds qualify), then `W73`, `W74` … `L101`, `L102`.  
- Seed the database from a static JSON fixture file (`/data/worldcup2026.json`) containing all teams (name ES, name EN, ISO code for flag, group) and all 104 matches (match number, datetime UTC, venue, city, group/round, home/away slot labels). **Do not rely on an external API at runtime for fixtures.**  
- All kickoff times stored in **UTC**; rendered in the viewer's local timezone (note in UI which timezone is shown).

### Group tiebreakers (must implement exactly, in order)

1. Points  
2. Goal difference  
3. Goals scored  
4. Head-to-head points among tied teams  
5. Head-to-head goal difference among tied teams  
6. Head-to-head goals scored among tied teams  
7. Fair play points — **not predictable; for the simulator, fall back to:**  
8. Deterministic tiebreak: alphabetical by team code (documented in UI as "desempate administrativo")

### Best third-placed ranking

Rank the 12 third-placed teams by: points → goal difference → goals scored → deterministic fallback. Top 8 advance. The mapping of which thirds go to which R32 slot follows the official FIFA allocation table — implement as a lookup table keyed by the combination of qualifying groups (FIFA publishes this matrix; include it in `worldcup2026.json` and mark it `TODO: verify against official FIFA bracket allocation` so it can be corrected before launch).

---

## 3\. Tech stack

| Layer | Choice | Why |
| :---- | :---- | :---- |
| Framework | **Next.js 14+ (App Router) \+ TypeScript** | Single deployable, SSR for fast loads, API routes co-located |
| DB | **PostgreSQL (Railway plugin)** | Relational fits fixtures/predictions/scoring |
| ORM | **Prisma** | Type-safe, easy migrations, great test ergonomics |
| Styling | **Tailwind CSS** | Fast to match the screenshot aesthetic |
| Auth | **Name \+ PIN** (4–6 digits, bcrypt-hashed) behind a single group invite code | Lowest friction for a friends group |
| Results | **football-data.org free tier** (auto-sync) \+ admin manual override | Free forever for the World Cup, 10 calls/min |
| Validation | **Zod** on every API input | Bulletproof capture |
| State/data | React Server Components \+ **TanStack Query** for mutation-heavy prediction grid | Optimistic UI \+ retry |
| Testing | **Vitest** (unit) \+ **Playwright** (e2e) \+ Prisma test DB | Core requirement |
| Jobs | Railway cron service polling football-data.org during match windows; locks remain computed (see §7) |  |

Keep it a **single Next.js service**. No microservices, no Redis, no websockets for v1 — polling/refresh is fine for a friends group.

---

## 4\. Data model (Prisma sketch)

model User {

  id           String   @id @default(cuid())

  name         String   @unique           // login identifier

  pinHash      String                      // bcrypt of 4–6 digit PIN

  email        String?                     // optional, recovery only

  avatarUrl    String?

  isAdmin      Boolean  @default(false)

  soulTeamId   String?            // "equipo del alma"

  soulTeam     Team?    @relation(fields: \[soulTeamId\], references: \[id\])

  predictions  Prediction\[\]

  bracketPicks BracketPick\[\]

  resets       QuinielaReset\[\]    // "Borrar quiniela" usage (max 2\)

  createdAt    DateTime @default(now())

}

model Team {

  id        String  @id            // ISO-3 code e.g. "MEX"

  nameEs    String

  nameEn    String

  flagEmoji String

  groupCode String?                // "A".."L", null for placeholder

}

model Match {

  id          Int      @id          // official match number 1..104

  externalId  Int?     @unique      // football-data.org match id (mapped at seed/first sync)

  stage       Stage                 // GROUP | R32 | R16 | QF | SF | THIRD | FINAL

  groupCode   String?

  kickoffUtc  DateTime

  venue       String

  city        String

  homeSlot    String                // "MEX" for group games; "1A"/"W73" for knockout

  awaySlot    String

  homeTeamId  String?               // resolved team (group: at seed; knockout: when known)

  awayTeamId  String?

  homeScore   Int?                  // OFFICIAL result (90' \+ ET for knockout)

  awayScore   Int?

  penaltyWinnerTeamId String?       // knockout only, if decided on penalties

  status      MatchStatus           // SCHEDULED | LIVE | FINISHED

  resultSource ResultSource?        // API | ADMIN (ADMIN always wins; sync never overwrites ADMIN)

  predictions Prediction\[\]

}

model Prediction {

  id         String   @id @default(cuid())

  userId     String

  matchId    Int

  homeScore  Int                    // 0..20, validated

  awayScore  Int

  // knockout-only: who advances if user predicts a draw in 90'

  advancingTeamId String?

  updatedAt  DateTime @updatedAt

  createdAt  DateTime @default(now())

  pointsAwarded Int?                // filled by scoring engine after FT

  @@unique(\[userId, matchId\])       // CRITICAL: one prediction per user per match, upsert semantics

}

model BracketPick {                  // optional pre-tournament bracket (see Q3)

  id        String @id @default(cuid())

  userId    String

  slot      String                  // "W73".."W104", "CHAMPION", "THIRD\_PLACE"

  teamId    String

  @@unique(\[userId, slot\])

}

model QuinielaReset {

  id        String   @id @default(cuid())

  userId    String

  createdAt DateTime @default(now())

}

model ActivityLog {

  id        String   @id @default(cuid())

  userId    String

  type      String                  // "PREDICTIONS\_UPDATED", "RESULT\_ENTERED", ...

  createdAt DateTime @default(now())

}

model AuditPrediction {              // append-only history of every prediction write

  id         String   @id @default(cuid())

  userId     String

  matchId    Int

  homeScore  Int

  awayScore  Int

  createdAt  DateTime @default(now())

}

Notes:

- `AuditPrediction` is the safety net: every save also appends here, so nothing is ever silently lost or disputed ("I swear I predicted 2-1\!").  
- Group standings (real and simulated) are **computed, never stored** — pure functions over matches/predictions.

---

## 5\. Pages & features (mirror the screenshots)

Tabs: **Partidos · Mis Predicciones · Fases Finales · Ranking · Posiciones · Posiciones Predicciones · Estadísticas** (+ Admin, visible to admins only).

### 5.1 Partidos

- Stat cards: total matches (104), live now, my predictions count, finished.  
- Matches grouped by date with venue, group, kickoff (local time), flags, and per-match prediction status (`Pendiente` / predicted score / final result with earned points).

### 5.2 Mis Predicciones (THE critical page)

- Banner showing scoring rules and a **"Borrar Quiniela" button (max 2 uses per user**, tracked via `QuinielaReset`; confirm dialog; clears only OPEN predictions).  
- Grid of all 72 group matches as cards (group, date, flags, two number inputs), exactly like screenshot 3\.  
- **Capture requirements (non-negotiable):**  
  - **Autosave on blur/change** per match (debounced 600ms) via upsert — no global "Save" button to forget.  
  - Optimistic UI with visible per-card save state: spinner → ✓ "Guardado" → red retry icon on failure with automatic retry (3x, exponential backoff).  
  - Inputs: numeric only, 0–20, mobile `inputmode="numeric"`, auto-advance focus home→away→next card.  
  - A persistent header chip: "Predicciones guardadas: 41/72" so users always know completeness.  
  - Server validates with Zod: integer 0–20, match exists, **match not locked** (server-side lock check is authoritative — never trust the client clock).  
  - If locked, return 409 with friendly message; UI shows 🔒 `CERRADO` state (open matches show 🔓 `ABIERTO` as in screenshots).  
  - Works fully on mobile (most friends will use phones).

### 5.3 Fases Finales

- Bracket view (columns: Dieciseisavos → Octavos → Cuartos → Semifinales → Gran Final \+ 3er puesto) like screenshot 4\.  
- Three modes toggled at top: **"Mi bracket"** (pre-tournament picks), **"Mi simulación"** (bracket derived from the user's group predictions), and **"Real"** (actual bracket as results come in).  
- **Pre-tournament bracket (CONFIRMED feature):** before the first knockout match kicks off, each user clicks through the full bracket — for every slot from R32 to Final they pick the advancing team (R32 entrants come from their own simulated group standings; if their group predictions are incomplete, allow free team selection for unresolved slots). Stores one `BracketPick` per slot plus `CHAMPION` and `THIRD_PLACE`. **Entire bracket locks at kickoff of match \#73** and scores via the §6 bracket bonuses.  
- Per-match knockout score predictions remain separate: once a knockout fixture's real teams are known, users predict the score (+ "¿Quién avanza?" selector if they predict a 90' draw), locking at that match's kickoff like any other.

### 5.4 Ranking (leaderboard)

- Table: rank, avatar, name, total points, exact hits, efficiency (points / max possible points so far).  
- Right sidebar: **Actividad del Grupo** feed from `ActivityLog` ("X actualizó sus predicciones", timestamps).  
- Tiebreakers for rank: total points → exact-score count → correct-winner count → earliest last-update wins (rewards not changing late).

### 5.5 Posiciones

- Real group tables A–L (PJ, PG, PE, PP, DG, PTS) computed from official results. Highlight qualification zones (top 2 green, 3rd amber).

### 5.6 Posiciones Predicciones (simulator)

- Same tables but computed from **the viewing user's predictions**, plus stat cards (X/72 group matches predicted, goles predichos, 0/32 knockout, "Tu campeón predicho" card once derivable). "Sin predicciones aún" placeholder per group.

### 5.7 Estadísticas

- "Tu multiverso personal" stats from own predictions: matches predicted, total goals & avg, global trend (group-wide aggregate votes per match), official results count.  
- "Equipo del alma" selector (stores `soulTeamId`, shows team card \+ that team's real results).  
- "Termómetro del Nexo": most-picked champion across the group.  
- Leave Bota de Oro / tarjetas sections out of v1 scope unless trivially available (they need player-level data — see Q1 note).

### 5.8 Admin

- Enter/edit official results per match (scores, penalty winner for knockouts), set status. Entering a result triggers: knockout slot resolution (propagate winners into next-round `homeTeamId/awayTeamId`), scoring run for that match, activity log entry.  
- Manage users (reset password, remove), regenerate invite code.  
- "Recalcular todo" button: idempotent full re-score (must always produce identical output given identical inputs).

---

## 6\. Scoring system (proposed)

### Group stage (per match)

| Outcome | Points |
| :---- | :---- |
| **Exact score** (e.g., predicted 2-1, result 2-1) | **5** |
| Correct winner/draw **and** correct goal difference (predicted 2-1, result 3-2) | **3** |
| Correct winner/draw only (predicted 2-0, result 1-0; or any correct draw with wrong score) | **2** |
| Wrong outcome | **0** |

(Variant of the 5/3/1 in the screenshots — the extra point for "winner only" vs "winner \+ diff" rewards precision better. Exact rule: tiers are mutually exclusive, award the highest one that matches.)

### Knockout multipliers (applied to the table above, judged on the 90'+ET score; if the user predicted a draw, their `advancingTeamId` vs the actual advancing team is worth a flat bonus)

| Round | Multiplier | Draw-advance bonus |
| :---- | :---- | :---- |
| Round of 32 | ×1 | \+2 |
| Round of 16 | ×1.5 (round up) | \+3 |
| Quarterfinal | ×2 | \+4 |
| Semifinal | ×2.5 (round up) | \+5 |
| 3rd place & Final | ×3 | \+6 |

### Bracket bonuses (CONFIRMED — pre-tournament bracket, locks at match \#73 kickoff)

- Each team correctly picked to reach the Round of 16: **\+2**  
- Each correct quarterfinalist: **\+4**  
- Each correctly predicted semifinalist: **\+10**  
- Correct finalists: **\+15 each**  
- Correct champion: **\+25** (Bonuses stack: a correct champion pick earns 2+4+10+15+25 \= 56 for that team's run.)

Scoring engine requirements:

- Pure function: `scoreMatch(prediction, result, stage) -> points` with zero side effects — this is the most-tested unit in the codebase.  
- Idempotent batch job `rescoreAll()` — safe to run repeatedly.  
- Knockout predictions score against the team **actually occupying** the slot; if a user's bracket diverged (their predicted teams aren't in the real match), they simply score 0 on outcome but can still earn points if scoring exact goals? **No — keep it simple: knockout score predictions are made per real match once teams are known** (matches lock at kickoff like group games). Bracket picks (Q3) are separate.

---

## 7\. Locking rules

- A match locks at `kickoffUtc` exactly. Lock is **evaluated server-side at write time** (`now() >= kickoffUtc` → reject). No cron needed for correctness.  
- UI shows countdown ("Cierra en 2h 14m") and flips to locked state client-side, but the server check is the source of truth.  
- Predictions for visible-but-future knockout matches open only when both teams are resolved.

---

## 8\. Automated results ingestion (football-data.org)

Free tier confirmed: the FIFA World Cup is included in football-data.org's free tier at 10 calls/minute — more than enough. (Do **not** scrape Google or live-score sites: it violates ToS, breaks without warning, and contradicts the "it must work" requirement. A real API with a manual fallback is strictly more reliable.)

- Register a free token at football-data.org; competition code `WC`. Store as `FOOTBALL_DATA_TOKEN`.  
- **Mapping:** one-time script matches our 104 fixtures to API match IDs by (kickoff datetime, home/away team), persisting `externalId`. Any unmapped match is logged loudly and falls back to admin entry.  
- **Sync worker** (Railway cron, every 2 min during a window from 15 min before the day's first kickoff to 4h after the last; hourly otherwise):  
  1. `GET /v4/competitions/WC/matches?dateFrom=…&dateTo=…` (1 call covers all matches that day).  
  2. For each match: update `status`; when API status is `FINISHED`, write scores (and extra-time/penalty outcome for knockouts), set `resultSource = API`, trigger knockout-slot propagation \+ scoring for that match.  
  3. **Never overwrite** a match where `resultSource = ADMIN`.  
  4. On API failure: log, retry next tick, surface a banner in the admin panel ("Última sincronización: hace 43 min ⚠️"). Nothing user-facing breaks — results just arrive when sync recovers or admin enters them.  
- Admin panel keeps full manual entry/edit as the override and disaster fallback.  
- All parsing isolated in `lib/resultsSync.ts` (pure functions over API JSON) so it's unit-testable with recorded fixtures.

---

## 8b. Auth: name \+ PIN

- Registration: group **invite code** \+ display name (unique) \+ 4–6 digit PIN. PIN bcrypt-hashed; session \= signed httpOnly cookie (30 days).  
- Login: name \+ PIN. Rate-limit: 5 failed attempts per name per 15 min (prevents trivial PIN guessing). Admin can reset any user's PIN.  
- Tradeoff acknowledged: this is low-security by design (friends group, no sensitive data). The invite code keeps strangers out; the rate limit keeps friends from brute-forcing each other's quinielas.

---

## 9\. Testing strategy (gate for deployment)

**Definition of done: all suites green in CI before deploying to friends.**

### Unit (Vitest) — target the brains

1. `scoreMatch`: exhaustive table-driven tests — every tier, boundaries (0-0 exact, draw with wrong score, inverted scores, knockout multipliers, rounding of ×1.5/×2.5, draw-advance bonus paths). ≥40 cases.  
2. Group-standings calculator: points/DG/goals ordering, every tiebreaker step including 3-way head-to-head ties, deterministic fallback.  
3. Best-thirds ranking \+ slot allocation lookup.  
4. Knockout propagation: winner of \#73 lands in the right slot of \#89, etc., including penalty winners.  
5. Lock logic: 1 second before/after kickoff.  
6. Zod schemas: reject negatives, floats, \>20, missing fields, locked matches.

### Integration (Vitest \+ test Postgres)

7. Prediction upsert: create → update → verify single row \+ audit rows appended.  
8. Concurrent saves to same match (race) → last-write-wins, no duplicates (unique constraint).  
9. "Borrar Quiniela": clears only open predictions, decrements allowance, blocks 3rd use.  
10. Result entry → scoring run → leaderboard totals correct; re-running `rescoreAll()` changes nothing.  
11. **Results sync:** recorded football-data.org JSON fixtures (scheduled / live / finished / ET / penalties / postponed) → correct DB writes; `resultSource = ADMIN` never overwritten; unmapped match raises alert not crash.  
12. Bracket picks: full bracket save/load; rejected after match \#73 kickoff; bonus scoring (R16/QF/SF/finalist/champion stacking) verified against hand-computed totals.

### E2E (Playwright)

11. Full happy path: register with invite code → fill 5 predictions on mobile viewport → reload → values persisted → admin enters result → leaderboard reflects points.  
12. Failure path: kill network mid-save (route abort) → retry indicator → recovery on reconnect.  
13. Locked match cannot be edited via UI or direct API call.

### Seed/dev tooling

- `pnpm seed` — loads full 2026 fixture set \+ 4 fake users with varied predictions \+ a few fake results, so every page renders with data instantly.  
- `pnpm simulate-tournament` — script that fast-forwards fake results through the whole tournament to smoke-test bracket propagation and final scoring end-to-end.

---

## 10\. API surface (App Router route handlers)

POST   /api/auth/register              {inviteCode, name, pin}

POST   /api/auth/login                 {name, pin} (rate-limited)

GET    /api/matches                    all matches \+ my prediction \+ status

PUT    /api/predictions/:matchId       upsert {homeScore, awayScore, advancingTeamId?}

DELETE /api/predictions                "borrar quiniela" (open only, allowance-checked)

GET    /api/leaderboard

GET    /api/standings/real

GET    /api/standings/predicted        (per authed user)

GET    /api/bracket/real | /predicted | /picks

PUT    /api/bracket-picks              bulk upsert all slots (locks at match \#73 kickoff)

GET    /api/stats/me | /group

POST   /api/admin/results/:matchId     {homeScore, awayScore, penaltyWinnerTeamId?} → resultSource=ADMIN

POST   /api/admin/sync                 trigger manual sync run

POST   /api/admin/rescore

All mutating routes: auth required, Zod-validated, rate-limited (simple in-memory, 30 req/min/user), return typed errors.

---

## 11\. Railway deployment

- **Services:** 1× Next.js web (Nixpacks or Dockerfile), 1× Postgres plugin.  
- Env vars: `DATABASE_URL`, `AUTH_SECRET`, `INVITE_CODE`, `ADMIN_NAMES`, `FOOTBALL_DATA_TOKEN`.  
- `railway.json` / start command: `prisma migrate deploy && next start`.  
- Health check endpoint `/api/health` (DB ping).  
- Nightly `pg_dump` via Railway backup (or a cron service) — predictions are irreplaceable.  
- CI (GitHub Actions): typecheck → lint → unit → integration (Postgres service container) → Playwright → deploy on main.

---

## 12\. Build order for Cursor (suggested milestones)

1. Scaffold Next.js \+ Prisma \+ Tailwind; commit fixture JSON for all 104 matches/48 teams; seed script.  
2. **Scoring engine \+ standings/tiebreakers \+ bracket-bonus scoring \+ tests first** (pure TS, no UI) — get unit suites green.  
3. Name+PIN auth \+ prediction capture API \+ audit log \+ integration tests.  
4. Mis Predicciones grid UI (autosave UX) \+ Partidos.  
5. Results sync worker (`lib/resultsSync.ts` \+ cron) with recorded-fixture tests \+ Admin override panel.  
6. Posiciones / Posiciones Predicciones / Fases Finales (bracket picks \+ simulated \+ real).  
7. Ranking \+ Estadísticas.  
8. Playwright suite, seed-based `simulate-tournament` smoke run, deploy to Railway, invite 1 test friend, then launch.

---

## 13\. Resolved decisions

- **Results entry: AUTOMATED** via football-data.org free tier (World Cup included free, 10 calls/min), with full manual admin override that always takes precedence (§8). No scraping. Player-level stats (Bota de Oro, tarjetas) deferred to v2 — the free tier's match data doesn't include rich player events; ship the tournament features first.  
- **Auth: name \+ PIN** behind a group invite code (§8b).  
- **Knockouts: BOTH** — a one-shot pre-tournament full bracket (locks at match \#73, scored with stacking bonuses) **and** per-match knockout score predictions as real fixtures become known (§5.3, §6).  
- **Language:** Spanish UI throughout (English allowed in code/comments).  
- **Scale assumption:** \<30 users.

