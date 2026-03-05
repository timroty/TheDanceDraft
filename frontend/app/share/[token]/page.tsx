import { Bracket } from "@/components/bracket";
import { ScoreTable } from "@/components/score-table";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function ShareContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: leagueSeason, error } = await supabase
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

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold">
        {(leagueSeason.league as unknown as { name: string })?.name}
      </h1>
      <p className="text-sm text-muted-foreground">
        {(leagueSeason.tournament as unknown as { year: number })?.year}
      </p>
      <div className="mt-6">
        <ScoreTable leagueSeasonId={leagueSeason.id} />
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
