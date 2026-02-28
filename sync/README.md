# TheDanceDraft Sync Service

A lightweight Node.js background service that polls the ESPN scoreboard API during the NCAA tournament to keep game scores current and automatically advance winners through the bracket.

## Purpose

The frontend reads game data directly from the database. This service is the only process that writes to the `game` table during live play. It runs on a cron schedule, fetches the latest scores from ESPN, updates the DB, and — when a game finishes — places the winner into the correct slot for their next game.

## Key Technical Details

### Architecture

- Standalone Node.js process; no shared code with the frontend
- Runs as its own Docker container and connects directly to Supabase
- `node-cron` drives scheduling; `index.js` registers jobs and starts the scheduler
- Additional jobs can be dropped into `jobs/` and registered in `index.js`

### File Structure

```
sync/
  index.js              # Registers all cron jobs
  scripts/
    seed-tournament.js  # One-off script: seeds teams, tournament_team, and game slots from ESPN bracket JSON
  jobs/
    scoreboard.js       # Combined poll + update + bracket-advance job
  lib/
    db.js               # Supabase client singleton
    espn.js             # ESPN API fetch + response parsing
  ingest-data/
    2025Bracket.json    # ESPN bracket JSON used as input for seed-tournament.js
  .env.example          # Environment variable reference
  Dockerfile
```

### Cron Schedule

Default: `0 */2 * * * *` (every 2 minutes, on the second). Override with the `SYNC_CRON` environment variable. The format uses node-cron's 6-field syntax: `seconds minutes hours day-of-month month day-of-week`.

### ESPN API

Endpoint: `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard`

The parameter `?dates=` can be appended to query on a specific date. The date format is YYYYMMDD. For example, February 27, 2026 would be `?dates=20260227`.

Key fields consumed per event:
- `event.id` → matched against `game.espn_game_id`
- `competitions[0].tournamentId` → must equal `22` (NCAA Men's Tournament); events without this field or with a different value are skipped
- `competitors[i].homeAway` → `'home'` or `'away'`
- `competitors[i].team.id` → matched against `team.espn_id`
- `competitors[i].score` → written to `home_score` / `away_score`
- `status.type.id` → written to `game.status` (1 = scheduled, 2 = in progress, 3 = final)
- `status.type.detail` → written to `game.detail` (e.g. `"18:11 - 2nd Half"`)

### Game Matching

For each ESPN event, the service attempts to find the corresponding DB row in order:

1. Direct lookup: `game.espn_game_id = event.id` and `status != 3`
2. Fallback: join `team.espn_id` through `tournament_team` to find a game where both teams are present and the game is not yet finished
3. If no match is found, the event is skipped

### Home/Away Ordering Fix

ESPN's labeling of which team is "home" may not match the `home_team_id` stored in the DB. When the ESPN home team's `espn_id` does not match the `espn_id` of our `home_team_id`, the service swaps `home_team_id`/`away_team_id` and `home_score`/`away_score` in the same update, keeping the DB consistent.

### Bracket Advancement

After updating scores, the service checks for games that just became `status = 3` (final) and have `processed = false`. For each:

1. The winner is the team with the higher score
2. The `bracket_advancement` table is queried for `from_slot = game.slot` to get `to_slot`
3. The next game at `to_slot` is fetched; the winner fills `home_team_id` if null, otherwise `away_team_id`
4. The finished game is marked `processed = true`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | Yes | Service role key (bypasses RLS for writes) |
| `SYNC_CRON` | No | Cron schedule (default: `0 */2 * * * *`) |

## One-Off Scripts

### `seed-tournament.js`

Seeds the database from an ESPN bracket JSON file before the tournament begins. Run this once per season after the bracket is announced. It does not run as part of the cron service.

**Prerequisites:**

- The `tournament` row for the target year must already exist in the DB.
- The 63 `game` rows for that tournament must already exist (slots 1–63).
- `.env` must be populated with `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.

**Setup:**

Open `seed-tournament.js` and set `TOURNAMENT_ID` at the top of the file to the UUID of the target tournament row.

**Run:**

```sh
cd sync
npm run seed
```

**What it does (in order):**

1. **Seed teams** — inserts any competitor from round 1 matchups that doesn't already exist in the `team` table (matched by `espn_id`).
2. **Seed tournament_team** — inserts a `tournament_team` row for each round 1 team, recording their seed number.
3. **Seed games** — for each round 1 matchup, fills the `home_team_id`, `away_team_id`, and `espn_game_id` columns on the pre-existing `game` row. Slot mapping: `slot = bracketLocation + 31`.

All three phases are idempotent — already-existing rows are skipped, not overwritten.

## Building and Running

### With Docker Compose (recommended)

1. Copy the example env file and fill in your credentials:
   ```sh
   cp sync/.env.example sync/.env
   ```

2. Start all services from the repo root:
   ```sh
   docker compose up --build
   ```

   The sync service runs alongside the frontend. Logs are prefixed with `[sync]` and `[scoreboard]`.

3. To run only the sync service:
   ```sh
   docker compose up --build syncservice
   ```

### Standalone with Node.js

Requires Node.js 20+.

```sh
cd sync
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
node index.js
```

### Building the Docker Image Manually

```sh
cd sync
docker build -t thedancedraft-sync .
docker run --env-file .env thedancedraft-sync
```
