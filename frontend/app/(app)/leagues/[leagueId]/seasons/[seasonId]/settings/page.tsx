import { ScoringTable } from "@/components/scoring-table";
import { TeamAssignment } from "@/components/team-assignment";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

async function SettingsContent({
  params,
}: {
  params: Promise<{ leagueId: string; seasonId: string }>;
}) {
  const { leagueId, seasonId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check commissioner access
  const { data: league } = await supabase
    .from("league")
    .select("commissioner_id")
    .eq("id", leagueId)
    .single();

  if (league?.commissioner_id !== user?.id) {
    redirect(`/leagues/${leagueId}/seasons/${seasonId}`);
  }

  // Fetch season's tournament_id
  const { data: season } = await supabase
    .from("league_season")
    .select("id, tournament_id")
    .eq("id", seasonId)
    .single();

  // Fetch tournament teams with team names
  const { data: tournamentTeams } = await supabase
    .from("tournament_team")
    .select("id, seed, team( name )")
    .eq("tournament_id", season!.tournament_id)
    .order("seed");

  // Fetch active league players
  const { data: leaguePlayers } = await supabase
    .from("league_player")
    .select("id, name")
    .eq("league_id", leagueId)
    .eq("active", true)
    .order("name");

  // Fetch existing assignments
  const { data: assignments } = await supabase
    .from("league_season_player")
    .select("id, league_player_id, tournament_team_id")
    .eq("league_season_id", seasonId);

  // Fetch existing scoring
  const { data: scoring } = await supabase
    .from("league_season_scoring")
    .select("seed, points")
    .eq("league_season_id", seasonId);

  const teams = (tournamentTeams ?? []).map((tt) => ({
    tournament_team_id: tt.id,
    team_name: (tt.team as unknown as { name: string })?.name ?? "Unknown",
    seed: tt.seed,
  }));

  const players = (leaguePlayers ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const initialAssignments = (assignments ?? []).map((a) => ({
    league_season_player_id: a.id,
    league_player_id: a.league_player_id,
    tournament_team_id: a.tournament_team_id,
  }));

  const initialScoring = (scoring ?? []).map((s) => ({
    seed: s.seed,
    points: s.points,
  }));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/leagues/${leagueId}/seasons/${seasonId}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Season Settings</h1>
      </div>
      <TeamAssignment
        leagueSeasonId={seasonId}
        teams={teams}
        players={players}
        initialAssignments={initialAssignments}
      />
      <ScoringTable
        leagueSeasonId={seasonId}
        initialScoring={initialScoring}
      />
    </div>
  );
}

export default function SettingsPage({
  params,
}: {
  params: Promise<{ leagueId: string; seasonId: string }>;
}) {
  return (
    <Suspense>
      <SettingsContent params={params} />
    </Suspense>
  );
}
