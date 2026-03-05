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

async function HomeContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: playerLeagues } = await supabase
    .from("league_player")
    .select("user_id, league (id, name)")
    .or(`user_id.eq.${user!.id}`);

  const leagues = playerLeagues?.flatMap((pl) => pl.league) || [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">My Leagues</h1>
      {leagues.length === 0 ? (
        <p className="text-muted-foreground">
          You are not part of any leagues yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {leagues.map((league) => (
            <Card key={league.id}>
              <CardHeader>
                <CardTitle>{league.name}</CardTitle>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href={`/leagues/${league.id}`}>View League</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
