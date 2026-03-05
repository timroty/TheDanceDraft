-- Counts actual wins per tournament team
-- (games where status=3/final and team had the higher score)
create view public.tournament_team_wins with (security_invoker = on) as
SELECT tt.id AS tournament_team_id,
  count(g.id) AS wins
  FROM tournament_team tt
    LEFT JOIN game g ON (g.home_team_id = tt.id OR g.away_team_id = tt.id) 
    AND g.status = 3 
    AND ((g.home_team_id = tt.id AND g.home_score > g.away_score) OR (g.away_team_id = tt.id AND g.away_score > g.home_score))
GROUP BY tt.id;

-- Aggregates wins and scores per player for a league season
create view public.league_season_standings with (security_invoker = on) as
SELECT lsp.league_season_id,
  lp.id AS league_player_id,
  lp.name AS player_name,
  lp.profile_pic,
  COALESCE(sum(ttw.wins), 0::numeric) AS total_wins,
  COALESCE(sum(ttw.wins * lss.points), 0::numeric) AS total_score
  FROM league_season_player lsp
    JOIN league_player lp ON lp.id = lsp.league_player_id
    JOIN tournament_team tt ON tt.id = lsp.tournament_team_id
    LEFT JOIN tournament_team_wins ttw ON ttw.tournament_team_id = tt.id
    LEFT JOIN league_season_scoring lss ON lss.league_season_id = lsp.league_season_id AND lss.seed = tt.seed
GROUP BY lsp.league_season_id, lp.id, lp.name, lp.profile_pic;
