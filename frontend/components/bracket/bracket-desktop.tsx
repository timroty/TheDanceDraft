import { cn } from "@/lib/utils";
import type { BracketData } from "./types";
import { GameCard } from "./game-card";

// Define the slots for each region's rounds, ordered for display
const REGIONS = [
  {
    e8: 4,
    s16: [8, 9],
    r32: [16, 17, 18, 19],
    r64: [32, 33, 34, 35, 36, 37, 38, 39],
    side: "left" as const,
  },
  {
    e8: 5,
    s16: [10, 11],
    r32: [20, 21, 22, 23],
    r64: [40, 41, 42, 43, 44, 45, 46, 47],
    side: "left" as const,
  },
  {
    e8: 6,
    s16: [12, 13],
    r32: [24, 25, 26, 27],
    r64: [48, 49, 50, 51, 52, 53, 54, 55],
    side: "right" as const,
  },
  {
    e8: 7,
    s16: [14, 15],
    r32: [28, 29, 30, 31],
    r64: [56, 57, 58, 59, 60, 61, 62, 63],
    side: "right" as const,
  },
];

function RegionColumn({
  slots,
  bracket,
  roundIndex,
}: {
  slots: number[];
  bracket: BracketData;
  roundIndex: number;
}) {
  return (
    <div
      className="flex flex-col justify-around"
      style={{ gap: `${Math.pow(2, roundIndex) * 0.5}rem` }}
    >
      {slots.map((slot) => {
        const game = bracket[slot];
        if (!game) return <div key={slot} className="w-44 h-16" />;
        return <GameCard key={slot} game={game} />;
      })}
    </div>
  );
}

function ConnectorColumn({
  count,
  side,
  targetRoundIndex,
}: {
  count: number;
  side: "left" | "right";
  targetRoundIndex: number;
}) {
  // Match the gap of the target round column so connector units align
  return (
    <div
      className="flex flex-col justify-around"
      style={{ gap: `${Math.pow(2, targetRoundIndex) * 0.5}rem` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center">
          {side === "right" && (
            <div className="w-2 border-t border-border" />
          )}
          <div className="flex flex-col w-4">
            <div
              className={cn(
                "h-6 border-border",
                side === "left" ? "border-r border-b" : "border-l border-b",
              )}
            />
            <div
              className={cn(
                "h-6 border-border",
                side === "left" ? "border-r border-t" : "border-l border-t",
              )}
            />
          </div>
          {side === "left" && (
            <div className="w-2 border-t border-border" />
          )}
        </div>
      ))}
    </div>
  );
}

function Region({
  region,
  bracket,
}: {
  region: (typeof REGIONS)[number];
  bracket: BracketData;
}) {
  const rounds =
    region.side === "left"
      ? [region.r64, region.r32, region.s16, [region.e8]]
      : [[region.e8], region.s16, region.r32, region.r64];

  const regionName = bracket[region.r64[0]]?.region ?? "";

  // Build interleaved array of round columns and connector columns
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < rounds.length; i++) {
    const roundIndex =
      region.side === "left" ? i : rounds.length - 1 - i;
    elements.push(
      <RegionColumn
        key={`r${i}`}
        slots={rounds[i]}
        bracket={bracket}
        roundIndex={roundIndex}
      />,
    );
    if (i < rounds.length - 1) {
      const connectorCount = Math.min(rounds[i].length, rounds[i + 1].length);
      // Target round index = the round with fewer games (the one being merged into)
      const targetRoundIndex =
        region.side === "left" ? i + 1 : rounds.length - 2 - i;
      elements.push(
        <ConnectorColumn
          key={`c${i}`}
          count={connectorCount}
          side={region.side}
          targetRoundIndex={targetRoundIndex}
        />,
      );
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1",
          region.side === "right" && "text-right",
        )}
      >
        {regionName}
      </div>
      <div className="flex items-stretch gap-1">
        {elements}
      </div>
    </div>
  );
}

function FinalFourCard({
  bracket,
  slot,
}: {
  bracket: BracketData;
  slot: number;
}) {
  const game = bracket[slot];
  if (!game) return <div className="w-44 h-16" />;
  return <GameCard game={game} />;
}

export function BracketDesktop({ bracket }: { bracket: BracketData }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-4 min-w-max p-4">
        {/* Left side: regions A and B */}
        <div className="flex flex-col gap-8">
          <Region region={REGIONS[0]} bracket={bracket} />
          <Region region={REGIONS[1]} bracket={bracket} />
        </div>

        {/* Center: Final Four + Championship */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Final Four
          </div>
          <FinalFourCard bracket={bracket} slot={2} />
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">
            Championship
          </div>
          <FinalFourCard bracket={bracket} slot={1} />
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">
            Final Four
          </div>
          <FinalFourCard bracket={bracket} slot={3} />
        </div>

        {/* Right side: regions C and D */}
        <div className="flex flex-col gap-8 items-end">
          <Region region={REGIONS[2]} bracket={bracket} />
          <Region region={REGIONS[3]} bracket={bracket} />
        </div>
      </div>
    </div>
  );
}
