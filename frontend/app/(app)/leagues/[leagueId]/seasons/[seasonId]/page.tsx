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
        {isCommissioner && (
          <Button asChild variant="ghost" size="icon">
            <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
              <Settings className="size-4" />
            </Link>
          </Button>
        )}
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
