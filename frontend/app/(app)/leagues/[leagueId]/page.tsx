import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

async function LeagueContent({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();

  const { data: league } = await supabase
    .from("league")
    .select("id, name")
    .eq("id", leagueId)
    .single();

  const { data: seasons } = await supabase
    .from("league_season")
    .select("id, tournament(year)")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{league?.name ?? "League"}</h1>
      {!seasons || seasons.length === 0 ? (
        <p className="text-muted-foreground">No seasons yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {seasons.map((season) => (
            <Card key={season.id}>
              <CardHeader>
                <CardTitle>
                  {(season.tournament as unknown as { year: number })?.year ??
                    "Season"}
                </CardTitle>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href={`/leagues/${leagueId}/seasons/${season.id}`}>
                    View Season
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
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
