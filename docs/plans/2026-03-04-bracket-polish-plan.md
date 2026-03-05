# Bracket & UI Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix broken mobile bracket layout, add scroll indicator, update score table avatar fallback to show initials, and make the settings button more subtle.

**Architecture:** Four independent UI changes across existing components. Mobile bracket fix addresses `w-screen` overflow and fixed-width GameCards. Scroll indicator is a new thin client component. Score table and settings button are minor edits to existing files.

**Tech Stack:** Next.js 15 (App Router), React 19, TailwindCSS, lucide-react icons

**Design Doc:** `docs/plans/2026-03-04-bracket-polish-design.md`

---

### Task 1: Fix mobile bracket — full-width rounds with proper snap

**Files:**
- Modify: `frontend/components/bracket/bracket-mobile.tsx`
- Modify: `frontend/components/bracket/game-card.tsx`

**Context:** The mobile bracket uses `w-screen` on each round column, which doesn't account for page padding/scrollbar and causes overflow. The `GameCard` has a fixed `w-44` width that doesn't adapt on mobile. The parent layout (`frontend/app/(app)/layout.tsx:25`) wraps children in `max-w-7xl p-5`, so `w-screen` extends beyond the visible area.

**Step 1: Make GameCard accept a `className` prop for width override**

In `frontend/components/bracket/game-card.tsx`, update the `GameCard` component to accept an optional `className` prop:

```tsx
// Change the export function signature and outer div:
export function GameCard({ game, className }: { game: GameData; className?: string }) {
  const showScore = game.status >= 2;

  return (
    <div className={cn("rounded border border-border bg-card text-card-foreground shadow-sm", className ?? "w-44")}>
```

This keeps the default `w-44` for desktop but allows mobile to override with full-width.

**Step 2: Update BracketMobile to use full-width cards and fix snap**

Replace `frontend/components/bracket/bracket-mobile.tsx` with:

```tsx
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
```

Key changes: `w-screen` -> `w-full min-w-full`, GameCard gets `className="w-full"`, removed `max-w-sm` wrapper div.

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors

**Step 4: Commit**

```bash
git add frontend/components/bracket/game-card.tsx frontend/components/bracket/bracket-mobile.tsx
git commit -m "fix(bracket): fix mobile layout overflow and full-width cards"
```

---

### Task 2: Add subtle scroll indicator dots to mobile bracket

**Files:**
- Create: `frontend/components/bracket/scroll-indicator.tsx`
- Modify: `frontend/components/bracket/bracket-mobile.tsx`

**Step 1: Create the scroll indicator client component**

```tsx
// frontend/components/bracket/scroll-indicator.tsx
"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function ScrollIndicator({
  containerRef,
  count,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  count: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleScroll() {
      if (!container) return;
      const scrollLeft = container.scrollLeft;
      const width = container.clientWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  return (
    <div className="flex justify-center gap-1.5 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i === activeIndex ? "bg-foreground/60" : "bg-foreground/15",
          )}
        />
      ))}
    </div>
  );
}
```

**Step 2: Convert BracketMobile to a client component and wire up the indicator**

The `BracketMobile` component needs a ref on the scroll container, so it must become a client component. Update `frontend/components/bracket/bracket-mobile.tsx`:

Add at the very top of the file:
```tsx
"use client";
```

Add import:
```tsx
import { useRef } from "react";
import { ScrollIndicator } from "./scroll-indicator";
```

Update the `BracketMobile` function to add a ref and the indicator:

```tsx
export function BracketMobile({ bracket }: { bracket: BracketData }) {
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div>
      <ScrollIndicator containerRef={containerRef} count={rounds.length} />
      <div ref={containerRef} className="overflow-x-auto snap-x snap-mandatory flex w-full">
        {rounds.map((round) => (
          <RoundColumn
            key={round}
            round={round}
            games={gamesByRound[round] ?? []}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors

**Step 4: Commit**

```bash
git add frontend/components/bracket/scroll-indicator.tsx frontend/components/bracket/bracket-mobile.tsx
git commit -m "feat(bracket): add scroll indicator dots to mobile bracket"
```

---

### Task 3: Update ScoreTable avatar fallback to show initials

**Files:**
- Modify: `frontend/components/score-table.tsx:52-61`

**Step 1: Update the avatar fallback**

In `frontend/components/score-table.tsx`, replace the empty gray circle fallback (lines 59-60) with an initial-based avatar matching the bracket's GameCard pattern:

Change this:
```tsx
<div className="size-6 rounded-full bg-muted" />
```

To this:
```tsx
<div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
  {row.player_name.charAt(0).toUpperCase()}
</div>
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors

**Step 3: Commit**

```bash
git add frontend/components/score-table.tsx
git commit -m "fix(score-table): show player initials when no profile pic"
```

---

### Task 4: Make settings button more subtle

**Files:**
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx:37-42`

**Step 1: Change to ghost icon button**

Replace the current settings button (lines 38-41):

```tsx
<Button asChild variant="outline">
  <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
    Settings
  </Link>
</Button>
```

With a ghost icon button using lucide-react's `Settings` icon:

```tsx
<Button asChild variant="ghost" size="icon">
  <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
    <Settings className="size-4" />
  </Link>
</Button>
```

Add the import at the top of the file:
```tsx
import { Settings } from "lucide-react";
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Compiles with no errors

**Step 3: Commit**

```bash
git add frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/page.tsx
git commit -m "fix(season): use subtle ghost icon for settings button"
```
