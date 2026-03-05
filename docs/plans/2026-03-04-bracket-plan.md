# Bracket Component Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a custom NCAA tournament bracket component displaying all 63 games with team info, player avatars, and scores — used on both the league season page and the share page.

**Architecture:** Server-rendered component (`<Bracket>`) fetches all 63 games with joined team/player data via a single Supabase query, transforms into a slot-indexed map, and renders two layouts: a traditional 2-sided desktop bracket (CSS Grid + connector lines) and a mobile horizontal-scroll with snap-to-round columns. A shared `<GameCard>` component renders each matchup.

**Tech Stack:** Next.js 15 (App Router), React 19 Server Components, Supabase, TailwindCSS, shadcn/ui patterns

**Design Doc:** `docs/plans/2026-03-04-bracket-design.md`

---

### Task 1: Define TypeScript types and data-fetching utility

**Files:**
- Create: `frontend/components/bracket/types.ts`
- Create: `frontend/components/bracket/data.ts`

**Step 1: Create the types file**

```typescript
// frontend/components/bracket/types.ts

export type TeamInGame = {
  tournamentTeamId: string;
  teamName: string;
  seed: number;
  logoUrl: string | null;
  score: number | null;
  playerName: string | null;
  playerProfilePic: string | null;
};

export type GameData = {
  id: string;
  slot: number;
  round: number;
  region: string | null;
  status: number; // 1=scheduled, 2=in_progress, 3=final
  detail: string | null;
  homeTeam: TeamInGame | null;
  awayTeam: TeamInGame | null;
};

export type BracketData = Record<number, GameData>; // keyed by slot (1-63)

export const ROUND_NAMES: Record<number, string> = {
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet Sixteen",
  4: "Elite Eight",
  5: "Final Four",
  6: "Championship",
};
```

**Step 2: Create the data-fetching function**

```typescript
// frontend/components/bracket/data.ts
import { createClient } from "@/lib/supabase/server";
import type { BracketData, GameData, TeamInGame } from "./types";

export async function fetchBracketData(
  leagueSeasonId: string,
  tournamentId: string,
): Promise<BracketData> {
  const supabase = await createClient();

  // Fetch all 63 games for this tournament
  const { data: games } = await supabase
    .from("game")
    .select(
      `
      id, slot, round, region, status, detail,
      home_team_id, away_team_id, home_score, away_score
    `,
    )
    .eq("tournament_id", tournamentId)
    .order("slot");

  // Fetch tournament teams with team names
  const { data: tournamentTeams } = await supabase
    .from("tournament_team")
    .select("id, seed, team(name, logo_url)")
    .eq("tournament_id", tournamentId);

  // Fetch player assignments for this league season
  const { data: playerAssignments } = await supabase
    .from("league_season_player")
    .select("tournament_team_id, league_player(name, profile_pic)")
    .eq("league_season_id", leagueSeasonId);

  // Build lookup maps
  const teamMap = new Map<
    string,
    { name: string; logoUrl: string | null; seed: number }
  >();
  for (const tt of tournamentTeams ?? []) {
    const team = tt.team as unknown as { name: string; logo_url: string | null };
    teamMap.set(tt.id, {
      name: team?.name ?? "Unknown",
      logoUrl: team?.logo_url ?? null,
      seed: tt.seed,
    });
  }

  const playerMap = new Map<
    string,
    { name: string; profilePic: string | null }
  >();
  for (const pa of playerAssignments ?? []) {
    const player = pa.league_player as unknown as {
      name: string;
      profile_pic: string | null;
    };
    playerMap.set(pa.tournament_team_id, {
      name: player?.name ?? "",
      profilePic: player?.profile_pic ?? null,
    });
  }

  function buildTeam(teamId: string | null, score: number | null): TeamInGame | null {
    if (!teamId) return null;
    const team = teamMap.get(teamId);
    if (!team) return null;
    const player = playerMap.get(teamId);
    return {
      tournamentTeamId: teamId,
      teamName: team.name,
      seed: team.seed,
      logoUrl: team.logoUrl,
      score,
      playerName: player?.name ?? null,
      playerProfilePic: player?.profilePic ?? null,
    };
  }

  const bracket: BracketData = {};
  for (const g of games ?? []) {
    bracket[g.slot] = {
      id: g.id,
      slot: g.slot,
      round: g.round,
      region: g.region,
      status: g.status,
      detail: g.detail,
      homeTeam: buildTeam(g.home_team_id, g.home_score),
      awayTeam: buildTeam(g.away_team_id, g.away_score),
    };
  }

  return bracket;
}
```

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors (unused files are fine)

**Step 4: Commit**

```bash
git add frontend/components/bracket/types.ts frontend/components/bracket/data.ts
git commit -m "feat(bracket): add types and data-fetching utility"
```

---

### Task 2: Build the GameCard component

**Files:**
- Create: `frontend/components/bracket/game-card.tsx`

**Step 1: Create the GameCard component**

This is a presentational component (not async, no data fetching). It receives a `GameData` and renders a compact matchup card.

```tsx
// frontend/components/bracket/game-card.tsx
import { cn } from "@/lib/utils";
import type { GameData, TeamInGame } from "./types";

function TeamRow({
  team,
  isWinner,
  showScore,
}: {
  team: TeamInGame | null;
  isWinner: boolean;
  showScore: boolean;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
        <div className="size-5" /> {/* spacer for avatar */}
        <span className="flex-1">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 text-xs",
        isWinner && "font-semibold bg-accent/50",
        !isWinner && showScore && "text-muted-foreground",
      )}
    >
      {team.playerProfilePic ? (
        <img
          src={team.playerProfilePic}
          alt=""
          className="size-5 rounded-full object-cover shrink-0"
        />
      ) : team.playerName ? (
        <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">
          {team.playerName.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="size-5 shrink-0" /> /* no player assigned */
      )}
      <span className="truncate flex-1">
        ({team.seed}) {team.teamName}
      </span>
      {showScore && (
        <span className="tabular-nums ml-auto shrink-0">{team.score ?? ""}</span>
      )}
    </div>
  );
}

function isTeamWinner(game: GameData, team: "home" | "away"): boolean {
  if (game.status !== 3) return false;
  if (game.homeTeam?.score == null || game.awayTeam?.score == null) return false;
  if (team === "home") return game.homeTeam.score > game.awayTeam.score;
  return game.awayTeam.score > game.homeTeam.score;
}

export function GameCard({ game }: { game: GameData }) {
  const showScore = game.status >= 2;

  return (
    <div className="w-44 rounded border border-border bg-card text-card-foreground shadow-sm">
      <TeamRow
        team={game.homeTeam}
        isWinner={isTeamWinner(game, "home")}
        showScore={showScore}
      />
      <div className="border-t border-border" />
      <TeamRow
        team={game.awayTeam}
        isWinner={isTeamWinner(game, "away")}
        showScore={showScore}
      />
      {game.detail && (
        <div className="border-t border-border px-2 py-0.5 text-center text-[10px] text-muted-foreground">
          {game.detail}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors

**Step 3: Commit**

```bash
git add frontend/components/bracket/game-card.tsx
git commit -m "feat(bracket): add GameCard component"
```

---

### Task 3: Build the desktop bracket layout

**Files:**
- Create: `frontend/components/bracket/bracket-desktop.tsx`

**Context:** The desktop bracket is a traditional 2-sided NCAA bracket. Left side has two regions (subtrees rooted at slots 4 & 5) flowing left-to-right. Right side has two regions (subtrees rooted at slots 6 & 7) flowing right-to-left. Final Four (slots 2, 3) and Championship (slot 1) are in the center.

**Slot mapping from `docs/bracket_advancement.md`:**
- Left top region (slot 4 root): R64 slots 32-39, R32 slots 16-19, S16 slots 8-9, E8 slot 4
- Left bottom region (slot 5 root): R64 slots 40-47, R32 slots 20-23, S16 slots 10-11, E8 slot 5
- Right top region (slot 6 root): R64 slots 48-55, R32 slots 24-27, S16 slots 12-13, E8 slot 6
- Right bottom region (slot 7 root): R64 slots 56-63, R32 slots 28-31, S16 slots 14-15, E8 slot 7

**Step 1: Create the desktop bracket component**

Build a component that renders a single region as a vertical column of rounds, then composes four regions into the 2-sided layout with Final Four/Championship in the center.

Key implementation details:
- Each region is rendered as 4 columns (R64, R32, S16, E8) using CSS grid
- The slot ordering within each round follows the binary tree: for a given parent slot `s`, its children are `2s` and `2s+1`
- Connector lines use CSS `::before`/`::after` pseudo-elements — or simpler: use border-based connectors with wrapper divs
- Left-side regions flow left→right, right-side regions flow right→left (use `flex-row-reverse`)
- Wrap the whole thing in `overflow-x-auto` for horizontal scrolling on smaller desktop screens
- Region labels come from `game.region` on any R64 game in that subtree

The component receives `BracketData` and renders all games from the slot map.

```tsx
// frontend/components/bracket/bracket-desktop.tsx
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
  // roundIndex: 0=R64(8 games), 1=R32(4), 2=S16(2), 3=E8(1)
  // Vertical spacing increases with each round to align with parent matchups
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

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
        {regionName}
      </div>
      <div className="flex items-center gap-2">
        {rounds.map((slots, i) => {
          // For right-side regions, the round index is reversed for spacing
          const roundIndex =
            region.side === "left" ? i : rounds.length - 1 - i;
          return (
            <RegionColumn
              key={i}
              slots={slots}
              bracket={bracket}
              roundIndex={roundIndex}
            />
          );
        })}
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
          <FinalFourCard bracket={bracket} slot={2} />
          <FinalFourCard bracket={bracket} slot={1} />
          <FinalFourCard bracket={bracket} slot={3} />
        </div>

        {/* Right side: regions C and D */}
        <div className="flex flex-col gap-8">
          <Region region={REGIONS[2]} bracket={bracket} />
          <Region region={REGIONS[3]} bracket={bracket} />
        </div>
      </div>
    </div>
  );
}
```

**Important notes for the implementer:**
- The vertical spacing with `justify-around` and dynamic gaps is the core trick for aligning matchups across rounds. You may need to tweak the gap multiplier after visual testing.
- Connector lines between rounds are intentionally omitted from the initial implementation. Get the layout working first. Connector lines can be added as a follow-up enhancement with CSS pseudo-elements or thin border divs between columns.
- The `min-w-max` on the outer container prevents the bracket from collapsing.

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors

**Step 3: Commit**

```bash
git add frontend/components/bracket/bracket-desktop.tsx
git commit -m "feat(bracket): add desktop bracket layout"
```

---

### Task 4: Build the mobile bracket layout

**Files:**
- Create: `frontend/components/bracket/bracket-mobile.tsx`

**Context:** Mobile layout uses horizontal scroll with CSS snap. Each round is a full-viewport-width column. Games are listed vertically within each column, grouped by region with subheaders.

**Step 1: Create the mobile bracket component**

```tsx
// frontend/components/bracket/bracket-mobile.tsx
import type { BracketData, GameData } from "./types";
import { GameCard } from "./game-card";
import { ROUND_NAMES } from "./types";

// Group games by region within a round
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
  const showRegionHeaders = round <= 4; // R64 through E8 have regions

  return (
    <div className="w-screen flex-shrink-0 snap-start px-4 py-2 overflow-y-auto">
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
              <div key={game.slot} className="w-full max-w-sm">
                <GameCard game={game} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BracketMobile({ bracket }: { bracket: BracketData }) {
  // Group all games by round
  const gamesByRound: Record<number, GameData[]> = {};
  for (const game of Object.values(bracket)) {
    if (!gamesByRound[game.round]) gamesByRound[game.round] = [];
    gamesByRound[game.round].push(game);
  }

  // Sort games within each round by slot
  for (const games of Object.values(gamesByRound)) {
    games.sort((a, b) => a.slot - b.slot);
  }

  const rounds = [1, 2, 3, 4, 5, 6]; // R64 → Championship

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
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors

**Step 3: Commit**

```bash
git add frontend/components/bracket/bracket-mobile.tsx
git commit -m "feat(bracket): add mobile bracket layout with snap scroll"
```

---

### Task 5: Build the main Bracket server component and integrate into pages

**Files:**
- Create: `frontend/components/bracket/index.tsx`
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`
- Modify: `frontend/app/share/[token]/page.tsx`

**Step 1: Create the main Bracket component**

```tsx
// frontend/components/bracket/index.tsx
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
    <>
      <div className="hidden md:block">
        <BracketDesktop bracket={bracket} />
      </div>
      <div className="block md:hidden">
        <BracketMobile bracket={bracket} />
      </div>
    </>
  );
}
```

**Step 2: Add Bracket to the league season page**

Modify `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`:

The season page currently fetches `league_season` with `tournament(year)`. We also need the `tournament_id` to pass to the Bracket component.

Update the query to include `tournament_id` and add the Bracket component below ScoreTable:

```tsx
// Add import at top:
import { Bracket } from "@/components/bracket";

// In SeasonContent, update the query to also select tournament_id:
const { data: season } = await supabase
  .from("league_season")
  .select("id, tournament_id, tournament(year), league(commissioner_id)")
  .eq("id", seasonId)
  .single();

// Add after <ScoreTable>:
{season?.tournament_id && (
  <Bracket leagueSeasonId={seasonId} tournamentId={season.tournament_id} />
)}
```

**Step 3: Add Bracket to the share page**

Modify `frontend/app/share/[token]/page.tsx`:

Same pattern — add `tournament_id` to the query, render `<Bracket>` below `<ScoreTable>`.

```tsx
// Add import at top:
import { Bracket } from "@/components/bracket";

// Update the query:
const { data: leagueSeason, error } = await supabase
  .from("league_season")
  .select("id, tournament_id, league(name), tournament(year)")
  .eq("share_token", token)
  .single();

// Add after <ScoreTable>:
{leagueSeason?.tournament_id && (
  <Bracket
    leagueSeasonId={leagueSeason.id}
    tournamentId={leagueSeason.tournament_id}
  />
)}
```

**Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors, pages render correctly

**Step 5: Commit**

```bash
git add frontend/components/bracket/index.tsx frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/page.tsx frontend/app/share/\[token\]/page.tsx
git commit -m "feat(bracket): integrate bracket into season and share pages"
```

---

### Task 6: Visual testing and layout refinement

**Files:**
- Potentially modify: `frontend/components/bracket/bracket-desktop.tsx`
- Potentially modify: `frontend/components/bracket/bracket-mobile.tsx`
- Potentially modify: `frontend/components/bracket/game-card.tsx`

**Step 1: Start the dev server**

Run: `cd frontend && npm run dev`

**Step 2: Visually test on desktop**

Navigate to a league season page with game data. Check:
- All 63 games render in the correct bracket positions
- Regions are labeled correctly
- Game cards show team names, seeds, scores, player avatars
- Winner/loser highlighting works for completed games
- TBD placeholders show for future games
- Horizontal scrolling works if viewport is narrow
- Final Four and Championship are centered between the two sides

**Step 3: Visually test on mobile**

Use browser DevTools to simulate mobile viewport (375px width). Check:
- Horizontal snap scrolling works between rounds
- Round headers are sticky at the top
- Games are grouped by region within each round
- Cards are readable at mobile width
- Vertical scrolling works within a round (especially R64 with 32 games)

**Step 4: Test the share page**

Navigate to `/share/[token]` and verify the bracket renders the same as the season page.

**Step 5: Adjust spacing/sizing**

Based on visual testing, tweak:
- GameCard width (`w-44` may need adjustment)
- Gap between rounds in desktop view
- Vertical spacing multiplier in `RegionColumn`
- Mobile card max-width

**Step 6: Commit any refinements**

```bash
git add -u frontend/components/bracket/
git commit -m "fix(bracket): refine layout spacing and card sizing"
```

---

### Task 7: Add connector lines to desktop bracket (enhancement)

**Files:**
- Modify: `frontend/components/bracket/bracket-desktop.tsx`

**Context:** Connector lines visually connect each pair of games to the winner's next-round game. This is cosmetic polish applied after the core layout works.

**Step 1: Add connector divs between round columns**

Between each pair of round columns, insert a thin connector column that draws horizontal lines from each game and vertical lines connecting pairs:

```
[Game A] ──┐
           ├── [Winner game]
[Game B] ──┘
```

Implementation approach:
- Add a "connector" column between each round column in the Region component
- Each connector renders `n/2` connector units (where `n` = games in the left round)
- Each connector unit is a div with:
  - Top horizontal line (right border on top half)
  - Bottom horizontal line (right border on bottom half)
  - Vertical line connecting them (right border full height)
  - Output horizontal line (right border at center)

Use Tailwind borders: `border-r border-t border-b border-border` on positioned divs.

**Step 2: Verify visually**

Run dev server, check connector lines align with game cards on desktop.

**Step 3: Commit**

```bash
git add frontend/components/bracket/bracket-desktop.tsx
git commit -m "feat(bracket): add connector lines between rounds"
```
