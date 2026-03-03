# League & Player Schema Design

**Date:** 2026-02-28

## Overview

Design for the league management layer of TheDanceDraft. This adds leagues, players, seasons, scoring, and draft picks on top of the existing tournament/game infrastructure.

## Design Decisions

- **Approach A (Flat Tables):** Five new tables with `league_season` as the central join point. Normalized but not over-engineered.
- **league_season FK to tournament:** Direct FK (non-nullable) rather than independent year column. Season can only be created after the tournament row exists.
- **Exclusive draft picks:** UNIQUE constraint ensures each tournament_team belongs to one player per league_season (classic fantasy draft).
- **Snake draft, all 64 teams:** All teams distributed evenly. No draft_size column needed — determined by player count.
- **Just assignments, no pick order:** league_season_player stores final assignments only. Draft order/history is not tracked.
- **Per-seed scoring:** 16 rows per league_season. Points awarded per win based on seed. No per-round multipliers.
- **Active boolean on league_player:** Convenience flag for UI filtering and roster management. Not a hard constraint on season participation.
- **Player names not unique:** No UNIQUE(league_id, name) constraint. UUIDs distinguish players; UI handles disambiguation.
- **Commissioner write policies:** RLS policies check auth.uid() = commissioner_id. Child tables join back to league for authorization.

## Tables

### league

| Column          | Type        | Constraints                              |
|-----------------|-------------|------------------------------------------|
| id              | uuid        | PK, DEFAULT gen_random_uuid()            |
| name            | text        | NOT NULL                                 |
| commissioner_id | uuid        | NOT NULL, FK auth.users(id)              |
| created_at      | timestamptz | NOT NULL, DEFAULT now()                  |

### league_player

| Column      | Type        | Constraints                              |
|-------------|-------------|------------------------------------------|
| id          | uuid        | PK, DEFAULT gen_random_uuid()            |
| league_id   | uuid        | NOT NULL, FK league(id) ON DELETE CASCADE |
| user_id     | uuid        | FK auth.users(id), nullable              |
| name        | text        | NOT NULL                                 |
| profile_pic | text        | nullable                                 |
| active      | boolean     | NOT NULL, DEFAULT true                   |
| created_at  | timestamptz | NOT NULL, DEFAULT now()                  |

### league_season

| Column        | Type        | Constraints                              |
|---------------|-------------|------------------------------------------|
| id            | uuid        | PK, DEFAULT gen_random_uuid()            |
| league_id     | uuid        | NOT NULL, FK league(id) ON DELETE CASCADE |
| tournament_id | uuid        | NOT NULL, FK tournament(id)              |
| created_at    | timestamptz | NOT NULL, DEFAULT now()                  |
|               |             | UNIQUE(league_id, tournament_id)         |

### league_season_scoring

| Column           | Type    | Constraints                              |
|------------------|---------|------------------------------------------|
| id               | uuid    | PK, DEFAULT gen_random_uuid()            |
| league_season_id | uuid    | NOT NULL, FK league_season(id) ON DELETE CASCADE |
| seed             | integer | NOT NULL, CHECK (seed >= 1 AND seed <= 16) |
| points           | integer | NOT NULL, CHECK (points >= 0)            |
|                  |         | UNIQUE(league_season_id, seed)           |

### league_season_player

| Column             | Type | Constraints                              |
|--------------------|------|------------------------------------------|
| id                 | uuid | PK, DEFAULT gen_random_uuid()            |
| league_season_id   | uuid | NOT NULL, FK league_season(id) ON DELETE CASCADE |
| league_player_id   | uuid | NOT NULL, FK league_player(id) ON DELETE CASCADE |
| tournament_team_id | uuid | NOT NULL, FK tournament_team(id)         |
|                    |      | UNIQUE(league_season_id, tournament_team_id) |

## RLS Policies

- **All tables:** Public read access (`FOR SELECT USING (true)`)
- **league:** Commissioner INSERT/UPDATE/DELETE via `auth.uid() = commissioner_id`
- **Child tables (league_player, league_season, league_season_scoring, league_season_player):** Commissioner INSERT/UPDATE/DELETE via subquery checking `auth.uid()` against the parent league's `commissioner_id`

## Leaderboard Query Path

```
league_season_player
  -> league_player (player name)
  -> tournament_team (seed)
  -> game (wins: where team is home/away and score is higher, status = 3)
  -> league_season_scoring (points per win for that seed)
  = SUM(points) per player = leaderboard
```
