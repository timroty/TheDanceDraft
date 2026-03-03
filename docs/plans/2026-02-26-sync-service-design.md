# Sync Service Design

**Date:** 2026-02-26
**Scope:** ESPN scoreboard sync service — DB migration, Node.js sync service, Docker integration

## Context

TheDanceDraft needs a background service that polls the ESPN scoreboard API during the NCAA tournament to keep game scores and statuses current, and automatically advances winners through the bracket when games finish.

## Decisions

- **Architecture:** Standalone Node.js service in `sync/` at repo root. No shared code with frontend. Runs as its own Docker container.
- **Scheduler:** `node-cron` — one combined job (poll + update + advance) at a configurable cadence (default every 30 seconds). Additional jobs can be added to `jobs/` and registered in `index.js`.
- **Matching:** Match ESPN events to DB games by `espn_game_id` first; fall back to cross-referencing `team.espn_id` via `tournament_team` joins.
- **Home/away fix:** If ESPN's labeled home team doesn't match `home_team_id` in the DB, swap `home_team_id`/`away_team_id` and `home_score`/`away_score` in the same update.
- **Bracket advancement:** Handled in the same job run after score updates. Uses existing `bracket_advancement` table.
- **No `depends_on` frontend:** Sync service only connects to Supabase (external); no dependency on the frontend container.

## Phase 1: Database Migration

New migration: `supabase/migrations/<timestamp>_game_schema_v2.sql`

Changes to the `game` table (no data backfill needed — no existing rows):

| Change | Before | After |
|--------|--------|-------|
| Remove column | `time_remaining text` | — |
| Rename column | `team_one_id uuid` | `home_team_id uuid` |
| Rename column | `team_two_id uuid` | `away_team_id uuid` |
| Rename column | `team_one_score integer` | `home_score integer` |
| Rename column | `team_two_score integer` | `away_score integer` |
| Rename column | `status text` | `detail text` |
| Add column | — | `status integer NOT NULL DEFAULT 1` |

Status integer semantics (matching ESPN `status.type.id`):
- `1` = scheduled
- `2` = in progress
- `3` = final

## Phase 2: Sync Service File Structure

```
sync/
  package.json          # deps: @supabase/supabase-js, node-cron, node-fetch
  index.js              # registers all jobs with node-cron, starts scheduler
  jobs/
    scoreboard.js       # combined poll + update + advance bracket job
  lib/
    db.js               # Supabase client singleton (reads env vars)
    espn.js             # fetches ESPN scoreboard API, returns parsed events
  .env.example          # SUPABASE_URL, SUPABASE_SECRET_KEY, SYNC_CRON
  Dockerfile
```

## Phase 3: Scoreboard Sync Job Logic

`jobs/scoreboard.js` — runs on `SYNC_CRON` schedule (default `*/30 * * * * *`):

1. **Fetch** — call ESPN scoreboard API, extract all `events[].competitions[]`
2. **Match** — for each ESPN event:
   - Query DB for game where `espn_game_id = event.id` AND `status != 3`
   - If no match, join through `team.espn_id` → `tournament_team` to find both teams in the same unfinished game
   - If still no match, skip
3. **Fix ordering** — if ESPN's home competitor's `team.id` does not match the `team.espn_id` of our `home_team_id`, swap `home_team_id`/`away_team_id` and `home_score`/`away_score`
4. **Update** — write to DB:
   - `home_score` and `away_score` from ESPN competitor scores
   - `detail` from `status.type.detail` (e.g. `"18:11 - 2nd Half"`)
   - `status` from `status.type.id` as integer
5. **Advance bracket** — for any game that is now `status = 3` and `processed = false`:
   - Determine winner by higher score
   - Look up `bracket_advancement WHERE from_slot = game.slot` to get `to_slot`
   - Find next game: `SELECT * FROM game WHERE tournament_id = $1 AND slot = $to_slot`
   - Set `home_team_id` if null, else set `away_team_id`
   - Set `processed = true` on the finished game

## Phase 4: Docker Integration

**`sync/Dockerfile`:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
```

**`docker-compose.yml` addition:**
```yaml
syncservice:
  build:
    context: ./sync
    dockerfile: Dockerfile
  env_file:
    - ./sync/.env
  restart: unless-stopped
```

Environment file `sync/.env` (not committed). `sync/.env.example` documents:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SYNC_CRON` (default: `*/30 * * * * *`)

## ESPN API Reference

Endpoint: `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard`

Key fields per event:
- `event.id` → `game.espn_game_id`
- `event.competitions[0].competitors[i].homeAway` → `'home'` or `'away'`
- `event.competitions[0].competitors[i].team.id` → `team.espn_id`
- `event.competitions[0].competitors[i].score` → score value
- `event.competitions[0].status.type.id` → status integer
- `event.competitions[0].status.type.detail` → detail string
