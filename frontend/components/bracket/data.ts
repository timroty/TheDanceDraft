import { createClient } from "@/lib/supabase/server";
import type { BracketData, TeamInGame } from "./types";

export async function fetchBracketData(
  leagueSeasonId: string,
  tournamentId: string,
): Promise<BracketData> {
  const supabase = await createClient();

  // Fetch all 63 games for this tournament
  const { data: games, error: gamesError } = await supabase
    .from("game")
    .select(
      `
      id, slot, round, region, status, detail,
      home_team_id, away_team_id, home_score, away_score
    `,
    )
    .eq("tournament_id", tournamentId)
    .order("slot");
  if (gamesError) console.error("Error fetching games:", gamesError);

  // Fetch tournament teams with team names
  const { data: tournamentTeams, error: teamsError } = await supabase
    .from("tournament_team")
    .select("id, seed, team(name, logo_url)")
    .eq("tournament_id", tournamentId);
  if (teamsError) console.error("Error fetching tournament teams:", teamsError);

  // Fetch player assignments for this league season
  const { data: playerAssignments, error: assignmentsError } = await supabase
    .from("league_season_player")
    .select("tournament_team_id, league_player(name, profile_pic)")
    .eq("league_season_id", leagueSeasonId);
  if (assignmentsError) console.error("Error fetching player assignments:", assignmentsError);

  // Build lookup maps
  const teamMap = new Map<
    string,
    { name: string; logoUrl: string | null; seed: number }
  >();
  for (const tt of tournamentTeams ?? []) {
    const team = tt.team as unknown as {
      name: string;
      logo_url: string | null;
    };
    teamMap.set(tt.id, {
      name: team?.name ?? "Unknown",
      logoUrl: team?.logo_url ?? null,
      seed: tt.seed,
    });
  }

  const playerMap = new Map<
    string,
    { name: string; profilePic: string | null }
  >();
  for (const pa of playerAssignments ?? []) {
    const player = pa.league_player as unknown as {
      name: string;
      profile_pic: string | null;
    };
    playerMap.set(pa.tournament_team_id, {
      name: player?.name ?? "",
      profilePic: player?.profile_pic ?? null,
    });
  }

  function buildTeam(
    teamId: string | null,
    score: number | null,
  ): TeamInGame | null {
    if (!teamId) return null;
    const team = teamMap.get(teamId);
    if (!team) return null;
    const player = playerMap.get(teamId);
    return {
      tournamentTeamId: teamId,
      teamName: team.name,
      seed: team.seed,
      logoUrl: team.logoUrl,
      score,
      playerName: player?.name ?? null,
      playerProfilePic: player?.profilePic ?? null,
    };
  }

  const bracket: BracketData = {};
  for (const g of games ?? []) {
    bracket[g.slot] = {
      id: g.id,
      slot: g.slot,
      round: g.round,
      region: g.region,
      status: g.status,
      detail: g.detail,
      homeTeam: buildTeam(g.home_team_id, g.home_score),
      awayTeam: buildTeam(g.away_team_id, g.away_score),
    };
  }

  return bracket;
}
