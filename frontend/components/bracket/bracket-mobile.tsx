import type { BracketData, GameData } from "./types";
import { GameCard } from "./game-card";
import { ROUND_NAMES } from "./types";

function groupByRegion(games: GameData[]): Record<string, GameData[]> {
  const groups: Record<string, GameData[]> = {};
  for (const game of games) {
    const key = game.region ?? "Final";
    if (!groups[key]) groups[key] = [];
    groups[key].push(game);
  }
  return groups;
}

function RoundColumn({
  round,
  games,
}: {
  round: number;
  games: GameData[];
}) {
  const regionGroups = groupByRegion(games);
  const showRegionHeaders = round <= 4;

  return (
    <div className="w-full min-w-full flex-shrink-0 snap-start px-4 py-2 overflow-y-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm pb-2 mb-2 border-b border-border z-10">
        <h3 className="text-sm font-semibold">{ROUND_NAMES[round]}</h3>
      </div>
      <div className="flex flex-col gap-3">
        {Object.entries(regionGroups).map(([region, regionGames]) => (
          <div key={region} className="flex flex-col gap-2">
            {showRegionHeaders && (
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {region}
              </div>
            )}
            {regionGames.map((game) => (
              <GameCard key={game.slot} game={game} className="w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BracketMobile({ bracket }: { bracket: BracketData }) {
  const gamesByRound: Record<number, GameData[]> = {};
  for (const game of Object.values(bracket)) {
    if (!gamesByRound[game.round]) gamesByRound[game.round] = [];
    gamesByRound[game.round].push(game);
  }

  for (const games of Object.values(gamesByRound)) {
    games.sort((a, b) => a.slot - b.slot);
  }

  const rounds = [1, 2, 3, 4, 5, 6];

  return (
    <div className="overflow-x-auto snap-x snap-mandatory flex w-full">
      {rounds.map((round) => (
        <RoundColumn
          key={round}
          round={round}
          games={gamesByRound[round] ?? []}
        />
      ))}
    </div>
  );
}
