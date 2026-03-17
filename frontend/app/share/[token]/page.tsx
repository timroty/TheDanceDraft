import { Bracket } from "@/components/bracket";
import { ScoreTable } from "@/components/score-table";
import { TeamList } from "@/components/team-list";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function ShareContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: leagueSeason } = await supabase
    .from("league_season")
    .select("id, tournament_id, league(name), tournament(year)")
    .eq("share_token", token)
    .single();

  if (!leagueSeason) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Not Found</h1>
        <p className="text-muted-foreground">
          Invalid or expired share link.
        </p>
      </div>
    );
  }

  // Fetch team list data
  const { data: tournamentTeams } = await supabase
    .from("tournament_team")
    .select("id, seed, team(name)")
    .eq("tournament_id", leagueSeason.tournament_id)
    .order("seed");

  const tournamentTeamIds = (tournamentTeams ?? []).map((tt) => tt.id);
  const { data: teamWins } = await supabase
    .from("tournament_team_wins")
    .select("tournament_team_id, wins")
    .in("tournament_team_id", tournamentTeamIds);

  const { data: assignments } = await supabase
    .from("league_season_player")
    .select("tournament_team_id, league_player:league_player_id(id, name, profile_pic)")
    .eq("league_season_id", leagueSeason.id);

  const { data: scoring } = await supabase
    .from("league_season_scoring")
    .select("seed, points")
    .eq("league_season_id", leagueSeason.id);

  const winsMap = new Map(
    (teamWins ?? []).map((w) => [w.tournament_team_id, Number(w.wins)])
  );
  const scoringMap = new Map(
    (scoring ?? []).map((s) => [s.seed, s.points])
  );
  const assignmentMap = new Map(
    (assignments ?? []).map((a) => [
      a.tournament_team_id,
      a.league_player as unknown as { id: string; name: string; profile_pic: string | null },
    ])
  );

  const teamListData = (tournamentTeams ?? []).map((tt) => {
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

  const playersForFilter = Array.from(
    new Map(
      (assignments ?? [])
        .map((a) => a.league_player as unknown as { id: string; name: string })
        .filter(Boolean)
        .map((p) => [p.id, p])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">
          {(leagueSeason.league as unknown as { name: string })?.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {(leagueSeason.tournament as unknown as { year: number })?.year}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
        <ScoreTable leagueSeasonId={leagueSeason.id} />
        <TeamList teams={teamListData} players={playersForFilter} />
      </div>
      {leagueSeason?.tournament_id && (
        <Bracket
          leagueSeasonId={leagueSeason.id}
          tournamentId={leagueSeason.tournament_id}
        />
      )}
    </div>
  );
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <main className="min-h-screen p-8">
      <Suspense>
        <ShareContent params={params} />
      </Suspense>
    </main>
  );
}
