import { LeaguePlayerSettingsForm } from "./league-player-settings-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

async function LeaguePlayerSettingsContent({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/leagues/${leagueId}`);
  }

  const { data: leaguePlayer } = await supabase
    .from("league_player")
    .select("id, name, profile_pic")
    .eq("user_id", user.id)
    .eq("league_id", leagueId)
    .single();

  if (!leaguePlayer) {
    redirect(`/leagues/${leagueId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/leagues/${leagueId}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Player Settings</h1>
      </div>
      <LeaguePlayerSettingsForm leaguePlayer={leaguePlayer} />
    </div>
  );
}

export default function LeaguePlayerSettingsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  return (
    <Suspense>
      <LeaguePlayerSettingsContent params={params} />
    </Suspense>
  );
}
