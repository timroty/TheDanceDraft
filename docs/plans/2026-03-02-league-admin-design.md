# League Admin — Design Document
_2026-03-02_

## Overview

Add navigation pages (home, league, league season) and a commissioner-only league season settings page to TheDanceDraft. The settings page lets the commissioner assign tournament teams to players and configure seed-based scoring.

---

## Routing

Replace the existing `/protected` route group with a new `(app)` route group that shares the same nav layout and auth guard. The `/protected` directory is deleted.

```
/                                              Home — leagues list
/leagues/[leagueId]/                           League — seasons list
/leagues/[leagueId]/seasons/[seasonId]/        Season — year display
/leagues/[leagueId]/seasons/[seasonId]/settings/   Settings (commissioner only)
```

**Auth guard:** The `(app)` layout checks for a valid Supabase session; unauthenticated users are redirected to `/auth/login`.

**Settings guard:** The settings page server component verifies `auth.uid() === league.commissioner_id`. Non-commissioners are redirected to the season page. Non-members who are authenticated land on the season page with no settings button — acceptable given public-read RLS policies.

---

## Pages

### Home (`/`)
- **Type:** Server Component
- **Data:** All `league` rows where `auth.uid()` is the `commissioner_id` OR has a `league_player` row with `user_id = auth.uid()`
- **UI:** Card per league — league name + "View League" button

### League (`/leagues/[leagueId]`)
- **Type:** Server Component
- **Data:** All `league_season` rows for this league (joined to `tournament` for year), filtered to seasons where the user is a player or commissioner
- **UI:** Card per season — tournament year + "View Season" button

### Season (`/leagues/[leagueId]/seasons/[seasonId]`)
- **Type:** Server Component
- **Data:** `league_season` + `tournament.year`, `league.commissioner_id`
- **UI:** Displays tournament year. If `auth.uid() === commissioner_id`, renders a "Settings" button (top-right) linking to the settings page.

### Settings (`/leagues/[leagueId]/seasons/[seasonId]/settings`)
- **Type:** Server Component shell + two Client Component sections
- **Guard:** Redirect to season page if not commissioner
- **Server fetches:**
  - All `tournament_team` rows for the season (joined to `team` for name/seed)
  - All active `league_player` rows for the league
  - All existing `league_season_player` rows for the season
  - All existing `league_season_scoring` rows for the season
- **Passes data as props to:**
  - `<TeamAssignment />` — team assignment section
  - `<ScoringTable />` — scoring configuration section

---

## Components

### `<TeamAssignment />`  _(Client Component)_

**State:** Local React state initialized from server props — a map of `playerId → tournament_team[]` and a list of unassigned teams.

**Unassigned Teams Box (top):**
- Displays badge chips for every `tournament_team` not yet assigned to any player
- Badges show `team.name`

**Player Rows (below):**
- One row per active `league_player`, showing player name
- Badge list of assigned teams, each with an `×` button
  - On `×` click: remove badge from local state immediately (optimistic), call Supabase `delete` on the `league_season_player` row in the background; revert + show error toast on failure
- Autocomplete text input filtered to unassigned teams
  - Typing filters unassigned teams by name
  - Selecting a match: add badge to local state immediately (optimistic), call Supabase `insert` on `league_season_player` in the background; revert + show error toast on failure

No save button — changes persist immediately with optimistic local state.

### `<ScoringTable />`  _(Client Component)_

**State:** Local React state — array of 16 `{ seed, points }` objects, initialized from server props (defaults to 0 if no existing row).

**UI:** Table with 16 rows (Seed 1 → Seed 16), each row has a number input.

**Save button:** On click, upserts all 16 rows to `league_season_scoring` using `on conflict (league_season_id, seed) do update set points = excluded.points`. Shows a success/error toast.

---

## Data Flow

| Page | Fetch | Mutations |
|------|-------|-----------|
| Home | Server: leagues via league_player + commissioner | None |
| League | Server: league_seasons for this league | None |
| Season | Server: season + tournament year | None |
| Settings | Server: players, teams, assignments, scoring | Client: Supabase browser client (insert/delete for teams, upsert for scoring) |

No API routes needed. Client Components use the Supabase browser client directly; RLS policies enforce commissioner-only writes.

---

## Error Handling

- Optimistic team assignment failures: revert local state, show error toast
- Scoring save failure: show error toast, inputs retain their values
- Settings page accessed by non-commissioner: server-side redirect to season page
- Unauthenticated access to any `(app)` route: redirect to `/auth/login`

---

## Out of Scope

- Creating leagues or seasons (admin seeding only for now)
- Inviting / managing league players
- Viewing scores or bracket progress on the season page
- Mobile-specific layout optimizations
