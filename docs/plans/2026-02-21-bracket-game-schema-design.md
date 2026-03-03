# Bracket & Game Schema Design

**Date:** 2026-02-21
**Scope:** `game` table and `bracket_advancement` table — bracket representation and sync service advancement

## Context

TheDanceDraft needs to represent the NCAA tournament bracket so the frontend can render the full 4-region visual bracket, and so a sync service (polling the ESPN API) can advance winners through the bracket as games conclude.

The existing schema has `team`, `tournament`, and `tournament_team`. This design adds the game tracking layer on top of that.

## Decisions

- **No First Four:** The 64-team main bracket only. 63 games, perfect binary tree.
- **Slot-based positioning:** Each game has a `slot` integer (1–63). Slot 1 is the Championship, slots 32–63 are Round of 64. Next game is always `floor(slot / 2)`.
- **Explicit round and region columns:** Redundant with `slot` but stored explicitly so the frontend and sync service never need derivation formulas. Region is null for slots 1–3 (Final Four + Championship).
- **team_one / team_two instead of home / away:** No meaningful home/away concept in tournament play. Neutral labels avoid semantic confusion. Sync service fills `team_one_id` first, then `team_two_id` as teams advance.
- **bracket_advancement is tournament-agnostic:** The NCAA bracket structure is identical every year. The table is seeded once with 62 rows and never modified.
- **processed flag:** Sync service sets `processed = true` after advancing a winner, preventing double-processing on repeat polls.

## Schema

### `game`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `tournament_id` | `uuid` | NOT NULL, FK → `tournament(id)` |
| `slot` | `integer` | NOT NULL |
| `round` | `integer` | NOT NULL — 1 = Round of 64, 6 = Championship |
| `region` | `text` | nullable — `'South'` / `'East'` / `'West'` / `'Midwest'`, null for slots 1–3 |
| `team_one_id` | `uuid` | nullable, FK → `tournament_team(id)` |
| `team_two_id` | `uuid` | nullable, FK → `tournament_team(id)` |
| `team_one_score` | `integer` | nullable |
| `team_two_score` | `integer` | nullable |
| `status` | `text` | NOT NULL, default `'scheduled'` — `'scheduled'` / `'in_progress'` / `'final'` |
| `time_remaining` | `text` | nullable, raw string from ESPN (e.g. `"12:34"`, `"HALF"`) |
| `espn_game_id` | `text` | nullable, for sync service to match ESPN API responses |
| `processed` | `boolean` | NOT NULL, default `false` |

Constraints:
- `UNIQUE(tournament_id, slot)`

### `bracket_advancement`

| Column | Type | Constraints |
|--------|------|-------------|
| `from_slot` | `integer` | PK |
| `to_slot` | `integer` | NOT NULL |

62 rows. No `tournament_id` — structure is universal across all years.

## Sync Service Flow

When a game concludes:

1. Find games where `status = 'final'` and `processed = false`
2. Determine winner (higher score)
3. `SELECT to_slot FROM bracket_advancement WHERE from_slot = $1`
4. `SELECT id FROM game WHERE tournament_id = $1 AND slot = $to_slot`
5. Set `team_one_id` if null, otherwise set `team_two_id`
6. Set `processed = true` on the completed game

## Frontend Data Flow

Single query fetches all 63 games for a tournament:

```sql
SELECT g.*, t1.seed as team_one_seed, t2.seed as team_two_seed,
       tm1.name as team_one_name, tm2.name as team_two_name
FROM game g
LEFT JOIN tournament_team t1 ON g.team_one_id = t1.id
LEFT JOIN team tm1 ON t1.team_id = tm1.id
LEFT JOIN tournament_team t2 ON g.team_two_id = t2.id
LEFT JOIN team tm2 ON t2.team_id = tm2.id
WHERE g.tournament_id = $1
ORDER BY g.slot
```

Frontend groups by `region` and `round` to build the four-quadrant bracket. No formulas needed.

## File Structure

```
supabase/
  migrations/
    20260218000000_initial_team_schema.sql
    20260218000001_enable_rls.sql
    <next>_bracket_game_schema.sql   ← new migration
```

Seeding the 62 `bracket_advancement` rows can be done in the same migration or a separate seed file.
