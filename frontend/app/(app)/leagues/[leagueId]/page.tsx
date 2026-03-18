import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight, Settings } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function computeRank(
  standings: { league_player_id: string; total_score: number; total_wins: number }[],
  userLeaguePlayerId: string | null
): number | null {
  if (!userLeaguePlayerId) return null;
  let rank = 1;
  for (let i = 0; i < standings.length; i++) {
    if (i > 0) {
      const prev = standings[i - 1];
      const curr = standings[i];
      if (curr.total_score !== prev.total_score || curr.total_wins !== prev.total_wins) {
        rank = i + 1;
      }
    }
    if (standings[i].league_player_id === userLeaguePlayerId) return rank;
  }
  return null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function placeEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🏀";
}

async function LeagueContent({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: league } = await supabase
    .from("league")
    .select("id, name")
    .eq("id", leagueId)
    .single();

  const { data: seasons } = await supabase
    .from("league_season")
    .select("id, tournament(year)")
    .eq("league_id", leagueId)
    .order("tournament(year)", { ascending: false });

  const seasonIds = (seasons ?? []).map((s) => s.id);

  const { data: leaguePlayer } = user
    ? await supabase
        .from("league_player")
        .select("id")
        .eq("user_id", user.id)
        .eq("league_id", leagueId)
        .single()
    : { data: null };

  const userLeaguePlayerId = leaguePlayer?.id ?? null;

  const { data: allStandings } = seasonIds.length > 0
    ? await supabase
        .from("league_season_standings")
        .select("league_season_id, league_player_id, total_score, total_wins")
        .in("league_season_id", seasonIds)
        .order("league_season_id")
        .order("total_score", { ascending: false })
        .order("total_wins", { ascending: false })
    : { data: [] };

  const standingsBySeason = new Map<string, typeof allStandings>();
  for (const row of allStandings ?? []) {
    const group = standingsBySeason.get(row.league_season_id) ?? [];
    group.push(row);
    standingsBySeason.set(row.league_season_id, group);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{league?.name ?? "League"}</h1>
        {leaguePlayer && (
          <Button asChild variant="ghost" size="icon">
            <Link href={`/leagues/${leagueId}/settings`}>
              <Settings className="size-4" />
            </Link>
          </Button>
        )}
      </div>
      {!seasons || seasons.length === 0 ? (
        <p className="text-muted-foreground">No seasons yet.</p>
      ) : (
        <div className="flex flex-col">
          {seasons.map((season) => {
            const year =
              (season.tournament as unknown as { year: number })?.year ?? "Season";
            const seasonStandings = standingsBySeason.get(season.id) ?? [];
            const rank = computeRank(seasonStandings, userLeaguePlayerId);

            return (
              <div
                key={season.id}
                className="flex items-center justify-between border-b border-border py-4 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{year}</span>
                  {rank !== null && (
                    <span className="text-sm text-muted-foreground">
                      {placeEmoji(rank)} {ordinal(rank)} place
                    </span>
                  )}
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/leagues/${leagueId}/seasons/${season.id}`}>
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  return (
    <Suspense>
      <LeagueContent params={params} />
    </Suspense>
  );
}
