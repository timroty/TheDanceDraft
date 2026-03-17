import { SupabaseClient } from "@supabase/supabase-js";

export type TeamListItem = {
  tournament_team_id: string;
  team_name: string;
  seed: number;
  wins: number;
  total_points: number;
  player_name: string | null;
  player_id: string | null;
};

export type PlayerFilter = {
  id: string;
  name: string;
};

export async function fetchTeamListData(
  supabase: SupabaseClient,
  tournamentId: string,
  leagueSeasonId: string,
): Promise<{ teamListData: TeamListItem[]; playersForFilter: PlayerFilter[] }> {
  const { data: tournamentTeams } = await supabase
    .from("tournament_team")
    .select("id, seed, team(name)")
    .eq("tournament_id", tournamentId)
    .order("seed");

  const tournamentTeamIds = (tournamentTeams ?? []).map((tt) => tt.id);

  const [{ data: teamWins }, { data: assignments }, { data: scoring }] =
    await Promise.all([
      supabase
        .from("tournament_team_wins")
        .select("tournament_team_id, wins")
        .in("tournament_team_id", tournamentTeamIds),
      supabase
        .from("league_season_player")
        .select(
          "tournament_team_id, league_player:league_player_id(id, name, profile_pic)",
        )
        .eq("league_season_id", leagueSeasonId),
      supabase
        .from("league_season_scoring")
        .select("seed, points")
        .eq("league_season_id", leagueSeasonId),
    ]);

  const winsMap = new Map(
    (teamWins ?? []).map((w) => [w.tournament_team_id, Number(w.wins)]),
  );
  const scoringMap = new Map(
    (scoring ?? []).map((s) => [s.seed, s.points]),
  );
  const assignmentMap = new Map(
    (assignments ?? []).map((a) => [
      a.tournament_team_id,
      a.league_player as unknown as {
        id: string;
        name: string;
        profile_pic: string | null;
      },
    ]),
  );

  const teamListData: TeamListItem[] = (tournamentTeams ?? []).map((tt) => {
    const wins = winsMap.get(tt.id) ?? 0;
    const pointsPerWin = scoringMap.get(tt.seed) ?? 0;
    const player = assignmentMap.get(tt.id);
    return {
      tournament_team_id: tt.id,
      team_name: (tt.team as unknown as { name: string })?.name ?? "Unknown",
      seed: tt.seed,
      wins,
      total_points: wins * pointsPerWin,
      player_name: player?.name ?? null,
      player_id: player?.id ?? null,
    };
  });

  const playersForFilter: PlayerFilter[] = Array.from(
    new Map(
      (assignments ?? [])
        .map(
          (a) =>
            a.league_player as unknown as { id: string; name: string } | null,
        )
        .filter(Boolean)
        .map((p) => [p!.id, p!]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  return { teamListData, playersForFilter };
}
