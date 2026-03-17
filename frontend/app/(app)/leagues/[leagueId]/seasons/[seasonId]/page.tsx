import { Bracket } from "@/components/bracket";
import { ScoreTable } from "@/components/score-table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

async function SeasonContent({
  params,
}: {
  params: Promise<{ leagueId: string; seasonId: string }>;
}) {
  const { leagueId, seasonId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: season } = await supabase
    .from("league_season")
    .select("id, tournament_id, tournament(year), league(commissioner_id, name)")
    .eq("id", seasonId)
    .single();

  const leagueName =
    (season?.league as unknown as { name: string })?.name ?? "League";
  const year =
    (season?.tournament as unknown as { year: number })?.year ?? "Season";
  const commissionerId = (
    season?.league as unknown as { commissioner_id: string }
  )?.commissioner_id;
  const isCommissioner = user?.id === commissionerId;

  // Fetch team list data
  const { data: tournamentTeams } = await supabase
    .from("tournament_team")
    .select("id, seed, team(name)")
    .eq("tournament_id", season?.tournament_id)
    .order("seed");

  const tournamentTeamIds = (tournamentTeams ?? []).map((tt) => tt.id);
  const { data: teamWins } = await supabase
    .from("tournament_team_wins")
    .select("tournament_team_id, wins")
    .in("tournament_team_id", tournamentTeamIds);

  const { data: assignments } = await supabase
    .from("league_season_player")
    .select("tournament_team_id, league_player:league_player_id(id, name, profile_pic)")
    .eq("league_season_id", seasonId);

  const { data: scoring } = await supabase
    .from("league_season_scoring")
    .select("seed, points")
    .eq("league_season_id", seasonId);

  // Build team list data
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
      total_points: wins * pointsPerWin,
      player_name: player?.name ?? null,
      player_id: player?.id ?? null,
    };
  });

  // Build unique players list for filter badges (sorted alphabetically)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/leagues/${leagueId}`}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{leagueName}</h1>
            <h2 className="text-lg text-muted-foreground">{year}</h2>
          </div>
        </div>
        <Button asChild variant="ghost" size="icon">
          <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
            <Settings className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="ml-1">
        <ScoreTable leagueSeasonId={seasonId} />
      </div>
      {season?.tournament_id && (
        <Bracket leagueSeasonId={seasonId} tournamentId={season.tournament_id} />
      )}
    </div>
  );
}

export default function SeasonPage({
  params,
}: {
  params: Promise<{ leagueId: string; seasonId: string }>;
}) {
  return (
    <Suspense>
      <SeasonContent params={params} />
    </Suspense>
  );
}
