# Tournament Seed Script Design

**Date:** 2026-02-27
**Status:** Approved

## Overview

A one-off script (`sync/seed-tournament.js`) that seeds team, tournament_team, and game data from an ESPN bracket JSON file into Supabase. Run manually once per season on a local machine — not part of the cron job.

## Config

Hardcoded at top of file:

- `JSON_PATH` — path to ESPN bracket JSON (e.g., `'./ingest-data/2025Bracket.json'`)
- `TOURNAMENT_ID` — UUID of the target tournament

Uses existing `sync/lib/db.js` Supabase client.

Run with: `node sync/seed-tournament.js` (from `sync/` directory, requires `.env`).

## Phases

### Phase 1: Seed Teams

- Filter matchups where `roundId === 1` (32 matchups, 64 competitors).
- For each competitor (competitorOne and competitorTwo):
  - Query `team` table by `espn_id` matching the competitor's `id` field.
  - If no row exists: insert `{ name: competitor.name, espn_id: competitor.id }`. No `logo_url`.
  - If row exists: skip.
  - Log: `[seed] Created team: <name> (espn_id=<id>)` or `[seed] Skipped team: <name> (espn_id=<id>) — already exists`.

### Phase 2: Seed Tournament Teams

- Iterate through the same round 1 competitors (all 64).
- For each competitor:
  - Look up the `team` row by `espn_id`.
  - Check if a `tournament_team` row exists for this `tournament_id` + `team_id`.
  - If not: insert with `seed` parsed as integer from competitor's `seed` field.
  - If exists: skip.
  - Log: `[seed] Added tournament_team: <name> (seed <seed>)` or `[seed] Skipped tournament_team: <name> — already exists`.

### Phase 3: Seed Games

- Slot mapping: `slot = bracketLocation + 31` (all 32 round 1 games).
- For each round 1 matchup:
  - Look up both competitors' `tournament_team` IDs via `team.espn_id` → `tournament_team` (filtered by `TOURNAMENT_ID`).
  - Query `game` by `tournament_id` + computed `slot`.
  - Use the `homeAway` field on each competitor to assign:
    - Competitor with `homeAway='home'` → `home_team_id`
    - Competitor with `homeAway='away'` → `away_team_id`
  - Fill any empty team slot on the game row; skip slots already populated.
  - Set `espn_game_id` from the matchup's `id` field.
  - Log each update or skip.

## Assumptions

- The 63 game rows already exist in the `game` table for the tournament before this script runs.
- The `bracket_advancement` table is already seeded (migration handles this).
- The `tournament` row for the target year already exists.
- Region assignment on game rows is handled separately, not by this script.

## Data Source

ESPN bracket JSON structure (round 1 matchup example):

```json
{
  "competitorOne": {
    "id": "2",
    "name": "Auburn",
    "seed": "1",
    "homeAway": "home"
  },
  "competitorTwo": {
    "id": "2011",
    "name": "Alabama St",
    "seed": "16",
    "homeAway": "away"
  },
  "id": "401745957",
  "bracketLocation": 1,
  "roundId": 1
}
```
