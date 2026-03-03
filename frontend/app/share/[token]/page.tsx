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
    .select("id, league(name), tournament(year)")
    .eq("share_token", token)
    .single();

  if (error && error.code !== "PGRST116") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

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
      <h1 className="text-2xl font-bold">{leagueSeason.league.name}</h1>
      <p className="text-sm text-muted-foreground">
        {leagueSeason.tournament.year}
      </p>
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
