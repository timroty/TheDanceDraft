# UI Polish Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply five targeted UI polish improvements: wrap Standings in a Card, add wins column to TeamList, add TeamList to the share page, add a Bracket heading, and replace the root page nav with direct sign in/sign up buttons.

**Architecture:** Each change is isolated to one or two files. No new components are created — existing components are extended or wrapped. The TeamList data-fetch pattern from the season page is duplicated into the share page (it's a server component; extraction would require a new shared utility, which is unnecessary complexity for two call sites).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui (Card, Button), Supabase

---

## File Structure

### Files to Modify
- `frontend/components/score-table.tsx` — Wrap in Card (Task 1)
- `frontend/components/team-list.tsx` — Add `wins` field + column (Task 2)
- `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx` — Include `wins` in teamListData (Task 2)
- `frontend/app/share/[token]/page.tsx` — Add TeamList with full data fetch + two-column layout (Task 3)
- `frontend/components/bracket/index.tsx` — Add "Bracket" heading (Task 4)
- `frontend/app/page.tsx` — Replace AuthButton/ThemeSwitcher with Sign In/Sign Up buttons (Task 5)

---

## Chunk 1: Visual Consistency

### Task 1: Wrap Standings in Card

**Files:**
- Modify: `frontend/components/score-table.tsx`

- [ ] **Step 1: Add Card imports**

In `frontend/components/score-table.tsx`, add Card imports at the top:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

- [ ] **Step 2: Wrap return in Card**

Replace the entire return block:

```tsx
  if (!standings || standings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No standings available.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Standings</h2>
      <table className="w-full max-w-xl">
```

With:

```tsx
  if (!standings || standings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No standings available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Standings</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full max-w-xl">
```

And close with `</CardContent></Card>` instead of `</div>`:

```tsx
        </table>
      </CardContent>
    </Card>
  );
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx next build`

Expected: clean build, no type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/score-table.tsx
git commit -m "feat: wrap standings in card for visual consistency"
```

---

### Task 2: Add Wins Column to TeamList

**Files:**
- Modify: `frontend/components/team-list.tsx`
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`

- [ ] **Step 1: Add `wins` to TeamData type**

In `frontend/components/team-list.tsx`, update the `TeamData` type:

```tsx
type TeamData = {
  tournament_team_id: string;
  team_name: string;
  seed: number;
  wins: number;
  total_points: number;
  player_name: string | null;
  player_id: string | null;
};
```

- [ ] **Step 2: Add Wins column to the table**

In the same file, update the table header to add a Wins column between Seed and Points:

```tsx
            <tr className="text-left text-sm text-muted-foreground">
              <th className="pb-2">Team</th>
              <th className="pb-2 w-16 text-center">Seed</th>
              <th className="pb-2 w-16 text-center">Wins</th>
              <th className="pb-2 w-20 text-right">Points</th>
              <th className="pb-2 text-right">Player</th>
            </tr>
```

Update the table rows to include wins:

```tsx
              <tr
                key={team.tournament_team_id}
                className="border-t border-border"
              >
                <td className="py-2 font-medium">{team.team_name}</td>
                <td className="py-2 text-center tabular-nums">{team.seed}</td>
                <td className="py-2 text-center tabular-nums">{team.wins}</td>
                <td className="py-2 text-right tabular-nums">
                  {team.total_points}
                </td>
                <td className="py-2 text-right">
                  {team.player_name ?? (
                    <span className="text-muted-foreground">Undrafted</span>
                  )}
                </td>
              </tr>
```

- [ ] **Step 3: Include `wins` in teamListData on the season page**

In `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`, update the `teamListData` map to include `wins`:

Replace:
```tsx
  const teamListData = (tournamentTeams ?? []).map((tt) => {
    const wins = winsMap.get(tt.id) ?? 0;
    const pointsPerWin = scoringMap.get(tt.seed) ?? 0;
    const player = assignmentMap.get(tt.id);
    return {
      tournament_team_id: tt.id,
      team_name: (tt.team as unknown as { name: string })?.name ?? "Unknown",
      seed: tt.seed,
      total_points: wins * pointsPerWin,
      player_name: player?.name ?? null,
      player_id: player?.id ?? null,
    };
  });
```

With:
```tsx
  const teamListData = (tournamentTeams ?? []).map((tt) => {
    const wins = winsMap.get(tt.id) ?? 0;
    const pointsPerWin = scoringMap.get(tt.seed) ?? 0;
    const player = assignmentMap.get(tt.id);
    return {
      tournament_team_id: tt.id,
      team_name: (tt.team as unknown as { name: string })?.name ?? "Unknown",
      seed: tt.seed,
      wins,
      total_points: wins * pointsPerWin,
      player_name: player?.name ?? null,
      player_id: player?.id ?? null,
    };
  });
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx next build`

Expected: clean build. TypeScript will catch any missing `wins` field at all call sites.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/team-list.tsx frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/page.tsx
git commit -m "feat: add wins column to team list"
```

---

## Chunk 2: Share Page Parity

### Task 3: Add TeamList to Share Page

**Files:**
- Modify: `frontend/app/share/[token]/page.tsx`

- [ ] **Step 1: Add TeamList import**

In `frontend/app/share/[token]/page.tsx`, add the TeamList import alongside existing imports:

```tsx
import { TeamList } from "@/components/team-list";
```

- [ ] **Step 2: Add data fetching for TeamList**

After the `leagueSeason` fetch (after the `if (!leagueSeason)` guard), add the full data-fetching block. Insert this before the return statement in `ShareContent`:

```tsx
  // Fetch team list data
  const { data: tournamentTeams } = await supabase
    .from("tournament_team")
    .select("id, seed, team(name)")
    .eq("tournament_id", leagueSeason.tournament_id)
    .order("seed");

  const tournamentTeamIds = (tournamentTeams ?? []).map((tt) => tt.id);
  const { data: teamWins } = await supabase
    .from("tournament_team_wins")
    .select("tournament_team_id, wins")
    .in("tournament_team_id", tournamentTeamIds);

  const { data: assignments } = await supabase
    .from("league_season_player")
    .select("tournament_team_id, league_player:league_player_id(id, name, profile_pic)")
    .eq("league_season_id", leagueSeason.id);

  const { data: scoring } = await supabase
    .from("league_season_scoring")
    .select("seed, points")
    .eq("league_season_id", leagueSeason.id);

  const winsMap = new Map(
    (teamWins ?? []).map((w) => [w.tournament_team_id, Number(w.wins)])
  );
  const scoringMap = new Map(
    (scoring ?? []).map((s) => [s.seed, s.points])
  );
  const assignmentMap = new Map(
    (assignments ?? []).map((a) => [
      a.tournament_team_id,
      a.league_player as unknown as { id: string; name: string; profile_pic: string | null },
    ])
  );

  const teamListData = (tournamentTeams ?? []).map((tt) => {
    const wins = winsMap.get(tt.id) ?? 0;
    const pointsPerWin = scoringMap.get(tt.seed) ?? 0;
    const player = assignmentMap.get(tt.id);
    return {
      tournament_team_id: tt.id,
      team_name: (tt.team as unknown as { name: string })?.name ?? "Unknown",
      seed: tt.seed,
      wins,
      total_points: wins * pointsPerWin,
      player_name: player?.name ?? null,
      player_id: player?.id ?? null,
    };
  });

  const playersForFilter = Array.from(
    new Map(
      (assignments ?? [])
        .map((a) => a.league_player as unknown as { id: string; name: string })
        .filter(Boolean)
        .map((p) => [p.id, p])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
```

- [ ] **Step 3: Update the return to two-column layout**

Replace the current return block in `ShareContent`:

```tsx
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold">
        {(leagueSeason.league as unknown as { name: string })?.name}
      </h1>
      <p className="text-sm text-muted-foreground">
        {(leagueSeason.tournament as unknown as { year: number })?.year}
      </p>
      <div className="mt-6">
        <ScoreTable leagueSeasonId={leagueSeason.id} />
      </div>
      {leagueSeason?.tournament_id && (
        <Bracket
          leagueSeasonId={leagueSeason.id}
          tournamentId={leagueSeason.tournament_id}
        />
      )}
    </div>
  );
```

With:

```tsx
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">
          {(leagueSeason.league as unknown as { name: string })?.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {(leagueSeason.tournament as unknown as { year: number })?.year}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
        <ScoreTable leagueSeasonId={leagueSeason.id} />
        <TeamList teams={teamListData} players={playersForFilter} />
      </div>
      {leagueSeason?.tournament_id && (
        <Bracket
          leagueSeasonId={leagueSeason.id}
          tournamentId={leagueSeason.tournament_id}
        />
      )}
    </div>
  );
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx next build`

Expected: clean build, no type errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/share/\[token\]/page.tsx
git commit -m "feat: add team list to share page"
```

---

## Chunk 3: Navigation & Landing

### Task 4: Add Bracket Heading

**Files:**
- Modify: `frontend/components/bracket/index.tsx`

- [ ] **Step 1: Add heading to Bracket component**

In `frontend/components/bracket/index.tsx`, wrap the desktop/mobile divs in a container and add a heading:

Replace:
```tsx
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
```

With:
```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx next build`

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/bracket/index.tsx
git commit -m "feat: add bracket heading"
```

---

### Task 5: Root Page Sign In / Sign Up Buttons

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Replace root page content**

Replace the entire contents of `frontend/app/page.tsx` with:

```tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">TheDanceDraft</h1>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx next build`

Expected: clean build. The `AuthButton` and `ThemeSwitcher` imports are removed — confirm no lingering import errors.

- [ ] **Step 3: Verify manually**

Navigate to `/` in the browser. Confirm:
- "TheDanceDraft" heading is visible
- "Sign Up" (filled) and "Sign In" (outline) buttons appear side by side
- "Sign Up" navigates to `/auth/sign-up`
- "Sign In" navigates to `/auth/login`
- No hamburger menu or theme switcher on this page

- [ ] **Step 4: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: add sign in and sign up buttons to root page"
```

---

## Final Verification

- [ ] **Build check**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx next build`

Expected: clean build, zero errors.

- [ ] **Smoke test**

1. `/` — Sign Up and Sign In buttons present, no hamburger
2. Season page — Standings is now a card, TeamList shows Wins column, Bracket has "Bracket" heading
3. Share page — same two-column layout as season page, TeamList present with Wins column, Bracket has heading
