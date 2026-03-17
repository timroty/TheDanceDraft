import { Bracket } from "@/components/bracket";
import { ScoreTable } from "@/components/score-table";
import { TeamList } from "@/components/team-list";
import { fetchTeamListData } from "@/lib/team-list-data";
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
  const { teamListData, playersForFilter } = await fetchTeamListData(
    supabase,
    leagueSeason.tournament_id,
    leagueSeason.id,
  );

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
    <main className="min-h-screen p-5">
      <Suspense>
        <ShareContent params={params} />
      </Suspense>
    </main>
  );
}
