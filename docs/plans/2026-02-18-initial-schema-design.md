# Initial Schema Design

**Date:** 2026-02-18
**Scope:** Team structure tables — `team`, `tournament`, `tournament_team`

## Context

TheDanceDraft is a March Madness draft game where players pick teams to maximize points. Higher seeds earn more points per win. This schema stores teams independently of tournaments so the same team (e.g., Duke) has a stable ID across years, then links teams to specific tournaments via `tournament_team`.

Bracket representation is out of scope for this phase and will be added later.

## Decisions

- **Primary keys:** UUID (`gen_random_uuid()`) on all tables
- **win_count:** Omitted from `tournament_team` — deferred until game/match tracking is modeled
- **region:** Omitted from `tournament_team` — deferred to bracket phase
- **conference:** Omitted from `team` — not needed now (YAGNI)
- **SQL storage:** Supabase CLI migrations (`supabase/migrations/`) at repo root — plain `.sql` files, portable to any Postgres

## Schema

### `team`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `logo_url` | `text` | nullable |
| `espn_id` | `text` | nullable |

Teams are tournament-agnostic. Duke is always the same row regardless of tournament year.

### `tournament`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `year` | `integer` | NOT NULL, UNIQUE |

`UNIQUE(year)` enforces one NCAA tournament per calendar year.

### `tournament_team`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `tournament_id` | `uuid` | NOT NULL, FK → `tournament(id)` |
| `team_id` | `uuid` | NOT NULL, FK → `team(id)` |
| `seed` | `integer` | NOT NULL |

`UNIQUE(tournament_id, team_id)` prevents the same team appearing twice in one tournament.

## File Structure

```
supabase/
  migrations/
    20260218000000_initial_schema.sql
```

All three tables in a single migration file.
