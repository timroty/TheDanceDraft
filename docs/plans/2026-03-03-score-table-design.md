# Score Table Design

**Date:** 2026-03-03

## Overview

A leaderboard component showing player standings for a league season — player name, total wins, and total score. Displayed on both the league season page and the public share page.

## Database Layer

Two Postgres views in a new migration.

### View 1: `tournament_team_wins`

Counts actual wins per tournament team (games where status=3/final and team had the higher score).

```sql
CREATE VIEW tournament_team_wins AS
SELECT tt.id AS tournament_team_id,
       COUNT(g.id) AS wins
FROM tournament_team tt
LEFT JOIN game g
  ON (g.home_team_id = tt.id OR g.away_team_id = tt.id)
  AND g.status = 3
  AND (
    (g.home_team_id = tt.id AND g.home_score > g.away_score)
    OR (g.away_team_id = tt.id AND g.away_score > g.home_score)
  )
GROUP BY tt.id;
```

### View 2: `league_season_standings`

Aggregates wins and scores per player for a league season.

```sql
CREATE VIEW league_season_standings AS
SELECT lsp.league_season_id,
       lp.id AS league_player_id,
       lp.name AS player_name,
       lp.profile_pic,
       COALESCE(SUM(ttw.wins), 0) AS total_wins,
       COALESCE(SUM(ttw.wins * lss.points), 0) AS total_score
FROM league_season_player lsp
JOIN league_player lp ON lp.id = lsp.league_player_id
JOIN tournament_team tt ON tt.id = lsp.tournament_team_id
LEFT JOIN tournament_team_wins ttw ON ttw.tournament_team_id = tt.id
LEFT JOIN league_season ls ON ls.id = lsp.league_season_id
LEFT JOIN league_season_scoring lss
  ON lss.league_season_id = ls.id AND lss.seed = tt.seed
GROUP BY lsp.league_season_id, lp.id, lp.name, lp.profile_pic;
```

## Frontend Component

### `ScoreTable`

- **Server component** (read-only, no client interactivity needed)
- **Props:** `leagueSeasonId: string`
- **Columns:** Rank, Player (name + profile pic), Total Wins, Total Score
- **Sort:** Total score descending, ties broken by total wins descending
- **Styling:** shadcn `Table` components for consistency

### Usage locations

1. **League season page** — `(app)/league/[leagueId]/season/[seasonId]/page.tsx`
2. **Share page** — `/share/[token]/page.tsx`

## Decisions

- **Actual wins** (not appearances minus one) — correctly counts the tournament champion
- **Static server-rendered** — refresh to see updates, no realtime subscriptions
- **Regular views** (not materialized) — data set is small, no need for refresh scheduling
- **No RLS on views** — views inherit policies from underlying tables
