import { createClient } from "@/lib/supabase/server";

type Standing = {
  league_player_id: string;
  player_name: string;
  profile_pic: string | null;
  total_wins: number;
  total_score: number;
};

export async function ScoreTable({
  leagueSeasonId,
}: {
  leagueSeasonId: string;
}) {
  const supabase = await createClient();

  const { data: standings } = await supabase
    .from("league_season_standings")
    .select(
      "league_player_id, player_name, profile_pic, total_wins, total_score",
    )
    .eq("league_season_id", leagueSeasonId)
    .order("total_score", { ascending: false })
    .order("total_wins", { ascending: false });

  if (!standings || standings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No standings available.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Standings</h2>
      <table className="w-full max-w-xl">
        <thead>
          <tr className="text-left text-sm text-muted-foreground">
            <th className="pb-2 w-16">#</th>
            <th className="pb-2">Player</th>
            <th className="pb-2 text-right w-24">Wins</th>
            <th className="pb-2 text-right w-24">Score</th>
          </tr>
        </thead>
        <tbody>
          {(standings as Standing[]).map((row, i) => (
            <tr key={row.league_player_id} className="border-t border-border">
              <td className="py-2 font-medium text-muted-foreground">
                {i + 1}
              </td>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  {row.profile_pic ? (
                    <img
                      src={row.profile_pic}
                      alt=""
                      className="size-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                      {row.player_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium">{row.player_name}</span>
                </div>
              </td>
              <td className="py-2 text-right tabular-nums">
                {row.total_wins}
              </td>
              <td className="py-2 text-right font-semibold tabular-nums">
                {row.total_score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
