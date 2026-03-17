import { fetchBracketData } from "./data";
import { BracketDesktop } from "./bracket-desktop";
import { BracketMobile } from "./bracket-mobile";

export async function Bracket({
  leagueSeasonId,
  tournamentId,
}: {
  leagueSeasonId: string;
  tournamentId: string;
}) {
  const bracket = await fetchBracketData(leagueSeasonId, tournamentId);

  if (Object.keys(bracket).length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Bracket not yet available.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Bracket</h2>
      <div className="hidden md:block">
        <BracketDesktop bracket={bracket} />
      </div>
      <div className="block md:hidden">
        <BracketMobile bracket={bracket} />
      </div>
    </div>
  );
}
