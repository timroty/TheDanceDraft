# Leagues Page Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up the leagues page by removing Card wrappers, ordering seasons correctly, surfacing the user's standings rank, and using a ghost nav button.

**Architecture:** All changes live in a single server component file. Two additional Supabase queries fetch the user's `league_player_id` and all season standings in bulk; rank is computed in JS before render.

**Tech Stack:** Next.js App Router (RSC), Supabase server client, Tailwind CSS, shadcn/ui Button, lucide-react ChevronRight

---

### Task 1: Fix season ordering

**Files:**
- Modify: `frontend/app/(app)/leagues/[leagueId]/page.tsx:30`

**Step 1: Change the `.order()` call**

Replace:
```ts
.order("created_at", { ascending: false });
```
With:
```ts
.order("tournament(year)", { ascending: false });
```

**Step 2: Verify locally**

Start the dev server (`cd frontend && pnpm dev`) and open a league page. Confirm seasons render most-recent-year first.

**Step 3: Commit**

```bash
git add frontend/app/(app)/leagues/[leagueId]/page.tsx
git commit -m "fix: order league seasons by tournament year descending"
```

---

### Task 2: Fetch user identity and standings

**Files:**
- Modify: `frontend/app/(app)/leagues/[leagueId]/page.tsx`

**Step 1: Get the authenticated user**

After the existing `createClient()` call, add:

```ts
const { data: { user } } = await supabase.auth.getUser();
```

**Step 2: Get the user's league_player_id**

After the `seasons` query (but only if seasons exist and user is present), add:

```ts
const seasonIds = (seasons ?? []).map((s) => s.id);

const { data: leaguePlayer } = user
  ? await supabase
      .from("league_player")
      .select("id")
      .eq("user_id", user.id)
      .eq("league_id", leagueId)
      .single()
  : { data: null };

const userLeaguePlayerId = leaguePlayer?.id ?? null;
```

**Step 3: Fetch standings for all seasons**

```ts
const { data: allStandings } = seasonIds.length > 0
  ? await supabase
      .from("league_season_standings")
      .select("league_season_id, league_player_id, total_score, total_wins")
      .in("league_season_id", seasonIds)
      .order("league_season_id")
      .order("total_score", { ascending: false })
      .order("total_wins", { ascending: false })
  : { data: [] };
```

**Step 4: Compute user rank per season**

Add these helpers above the `return` statement (still inside `LeagueContent`):

```ts
function computeRank(
  standings: { league_player_id: string; total_score: number; total_wins: number }[],
  userLeaguePlayerId: string | null
): number | null {
  if (!userLeaguePlayerId) return null;
  let rank = 1;
  for (let i = 0; i < standings.length; i++) {
    if (i > 0) {
      const prev = standings[i - 1];
      const curr = standings[i];
      if (curr.total_score !== prev.total_score || curr.total_wins !== prev.total_wins) {
        rank = i + 1;
      }
    }
    if (standings[i].league_player_id === userLeaguePlayerId) return rank;
  }
  return null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function placeEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🏀";
}

// Group standings by season
const standingsBySeason = new Map<string, typeof allStandings>();
for (const row of allStandings ?? []) {
  const group = standingsBySeason.get(row.league_season_id) ?? [];
  group.push(row);
  standingsBySeason.set(row.league_season_id, group);
}
```

**Step 5: Commit**

```bash
git add frontend/app/(app)/leagues/[leagueId]/page.tsx
git commit -m "feat: fetch user standings data for leagues page"
```

---

### Task 3: Redesign season list UI

**Files:**
- Modify: `frontend/app/(app)/leagues/[leagueId]/page.tsx`

**Step 1: Update imports**

Remove `Card`, `CardFooter`, `CardHeader`, `CardTitle` from the imports block. Add `ChevronRight` from `lucide-react`:

```ts
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
```

**Step 2: Replace Card JSX with plain div rows**

Replace the `seasons.map(...)` block:

```tsx
<div className="flex flex-col">
  {seasons.map((season) => {
    const year =
      (season.tournament as unknown as { year: number })?.year ?? "Season";
    const seasonStandings = standingsBySeason.get(season.id) ?? [];
    const rank = computeRank(seasonStandings, userLeaguePlayerId);

    return (
      <div
        key={season.id}
        className="flex items-center justify-between border-b border-border py-4 last:border-b-0"
      >
        <div className="flex flex-col">
          <span className="font-semibold">{year}</span>
          {rank !== null && (
            <span className="text-sm text-muted-foreground">
              {placeEmoji(rank)} {ordinal(rank)} place
            </span>
          )}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/leagues/${leagueId}/seasons/${season.id}`}>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  })}
</div>
```

Also update the outer wrapper — remove `gap-4` since rows handle their own spacing:

```tsx
<div className="flex flex-col">
```

**Step 3: Verify locally**

Check the leagues page renders:
- Seasons in descending year order
- No card outlines, separator lines between rows
- User's rank shown under the year (emoji + ordinal)
- Ghost button with chevron on the right

**Step 4: Commit**

```bash
git add frontend/app/(app)/leagues/[leagueId]/page.tsx
git commit -m "feat: redesign leagues page season list with rank display"
```

---

### Task 4: Final check and cleanup

**Step 1: Search for leftover Card imports**

```bash
grep -n "Card" frontend/app/(app)/leagues/\[leagueId\]/page.tsx
```

Expected: no matches.

**Step 2: TypeScript check**

```bash
cd frontend && pnpm tsc --noEmit
```

Expected: no errors in the leagues page file.

**Step 3: Manual smoke test**

- Open a league where the logged-in user has standings — confirm rank shows.
- Open a league where the user has no standings entry — confirm no rank text appears.
- Confirm the ChevronRight button navigates to the season page.
