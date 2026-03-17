# Frontend UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five UX improvements based on participant feedback: home button in nav, back arrow on season page, settings page tabs redesign, read-only settings for non-commissioners, and team list component on season page.

**Architecture:** Server components fetch data and compute authorization (`isCommissioner`), passing props to client components. New shadcn Tabs component organizes settings. A new `TeamList` client component with player filter badges is added to the season page alongside standings.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Supabase, lucide-react

---

## File Structure

### Files to Modify
- `frontend/components/nav-menu.tsx` — Add Home link (Task 1)
- `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx` — Add back arrow, team list, two-column layout (Tasks 2, 6)
- `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/settings/page.tsx` — Remove redirect, add tabs, pass `isCommissioner` (Tasks 3, 4)
- `frontend/components/team-assignment.tsx` — Accept `isCommissioner` prop, conditional edit controls (Task 4)
- `frontend/components/scoring-table.tsx` — Accept `isCommissioner` prop, conditional disable (Task 4)

### Files to Create
- `frontend/components/ui/tabs.tsx` — shadcn Tabs component (installed via CLI) (Task 3)
- `frontend/components/settings-tabs.tsx` — Client wrapper for Tabs on settings page (Task 3)
- `frontend/components/team-list.tsx` — Client component with player filter badges and team list table (Task 6)

---

## Chunk 1: Navigation Improvements

### Task 1: Home Button in Nav Menu

**Files:**
- Modify: `frontend/components/nav-menu.tsx`

- [ ] **Step 1: Add Home icon import**

In `frontend/components/nav-menu.tsx`, add `Home` to the lucide-react import:

```tsx
import { Menu, Sun, Moon, Laptop, Home } from "lucide-react";
```

- [ ] **Step 2: Add Home menu item above theme toggle**

Insert the Home link as the first item inside `<DropdownMenuContent>`, before the theme toggle `<DropdownMenuItem>`. Only render when `isAuthenticated` is true:

```tsx
<DropdownMenuContent align="end">
  {isAuthenticated && (
    <>
      <DropdownMenuItem asChild>
        <Link href="/home" className="flex w-full items-center gap-2 cursor-pointer">
          <Home size={16} className="text-muted-foreground" />
          <span>Home</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  )}
  <DropdownMenuItem asChild>
    <button
      onClick={cycleTheme}
```

- [ ] **Step 3: Verify manually**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npm run dev`

Open the app, log in, open hamburger menu. Confirm "Home" link appears at top, navigates to `/home`, and does not appear when logged out.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/nav-menu.tsx
git commit -m "feat: add Home button to nav menu"
```

---

### Task 2: Back Arrow on League Season Page

**Files:**
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`

- [ ] **Step 1: Add ArrowLeft import**

Add to imports in the season page:

```tsx
import { ArrowLeft, Settings } from "lucide-react";
```

- [ ] **Step 2: Add back arrow button to header**

Replace the existing header div (lines 38-50) to include a back arrow to the left of the league name. Follow the same pattern as the settings page back arrow:

Replace:
```tsx
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{leagueName}</h1>
          <h2 className="text-lg text-muted-foreground">{year}</h2>
        </div>
        {isCommissioner && (
          <Button asChild variant="ghost" size="icon">
            <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
              <Settings className="size-4" />
            </Link>
          </Button>
        )}
      </div>
```

With:
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/leagues/${leagueId}`}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{leagueName}</h1>
            <h2 className="text-lg text-muted-foreground">{year}</h2>
          </div>
        </div>
        {isCommissioner && (
          <Button asChild variant="ghost" size="icon">
            <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
              <Settings className="size-4" />
            </Link>
          </Button>
        )}
      </div>
```

- [ ] **Step 3: Verify manually**

Navigate to a season page. Confirm the back arrow appears to the left of the league name and navigates to `/leagues/[leagueId]`.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/page.tsx
git commit -m "feat: add back arrow to season page header"
```

---

## Chunk 2: Settings Page Redesign

### Task 3: Install Tabs and Refactor Settings Layout

**Files:**
- Create: `frontend/components/ui/tabs.tsx` (via shadcn CLI)
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/settings/page.tsx`

- [ ] **Step 1: Install shadcn Tabs component**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx shadcn@latest add tabs`

This creates `frontend/components/ui/tabs.tsx` with `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` exports.

- [ ] **Step 2: Create a client wrapper for the tabs**

Since the settings page is a server component but Tabs requires client-side state, create a `SettingsTabs` client component. Add it to the settings page file itself (above the `SettingsContent` function) or as a separate component. For simplicity, we'll make it a named export in the settings page file.

Actually, the simplest approach: create a small client component file `frontend/components/settings-tabs.tsx`:

```tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

export function SettingsTabs({
  teamsContent,
  scoringContent,
}: {
  teamsContent: ReactNode;
  scoringContent: ReactNode;
}) {
  return (
    <Tabs defaultValue="teams">
      <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-4 px-0">
        <TabsTrigger
          value="teams"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2"
        >
          Teams
        </TabsTrigger>
        <TabsTrigger
          value="scoring"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2"
        >
          Scoring
        </TabsTrigger>
      </TabsList>
      <TabsContent value="teams" className="mt-6">
        {teamsContent}
      </TabsContent>
      <TabsContent value="scoring" className="mt-6">
        {scoringContent}
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 3: Update settings page to use SettingsTabs**

In `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/settings/page.tsx`, import `SettingsTabs` and replace the direct rendering of `TeamAssignment` and `ScoringTable` with the tabs wrapper.

Add import:
```tsx
import { SettingsTabs } from "@/components/settings-tabs";
```

Replace the return block (lines 93-114):

```tsx
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/leagues/${leagueId}/seasons/${seasonId}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Season Settings</h1>
      </div>
      <SettingsTabs
        teamsContent={
          <TeamAssignment
            leagueSeasonId={seasonId}
            teams={teams}
            players={players}
            initialAssignments={initialAssignments}
            isCommissioner={true}
          />
        }
        scoringContent={
          <ScoringTable
            leagueSeasonId={seasonId}
            initialScoring={initialScoring}
            isCommissioner={true}
          />
        }
      />
    </div>
  );
```

Note: We pass `isCommissioner={true}` here since this code path currently only runs for commissioners. We'll refactor this in Task 4.

- [ ] **Step 4: Verify tabs render**

Run dev server, navigate to settings as commissioner. Confirm two tabs appear with line-style underline. "Teams" tab shows team assignment, "Scoring" tab shows scoring table.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/ui/tabs.tsx frontend/components/settings-tabs.tsx frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/settings/page.tsx
git commit -m "feat: add tabs layout to settings page"
```

---

### Task 4: Read-Only Settings Access for Non-Commissioners

**Files:**
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/settings/page.tsx`
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`
- Modify: `frontend/components/team-assignment.tsx`
- Modify: `frontend/components/scoring-table.tsx`

- [ ] **Step 1: Remove redirect and compute isCommissioner in settings page**

In `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/settings/page.tsx`:

Replace the commissioner check block (lines 29-31):
```tsx
  if (!league || league.commissioner_id !== user?.id) {
    redirect(`/leagues/${leagueId}/seasons/${seasonId}`);
  }
```

With:
```tsx
  if (!league) {
    redirect(`/leagues/${leagueId}`);
  }

  const isCommissioner = league.commissioner_id === user?.id;
```

This keeps the `redirect` import (still needed for the `!league` and `!season` guards) while allowing non-commissioners through.

- [ ] **Step 2: Pass isCommissioner to SettingsTabs children**

Update the return block to pass the computed `isCommissioner`:

```tsx
      <SettingsTabs
        teamsContent={
          <TeamAssignment
            leagueSeasonId={seasonId}
            teams={teams}
            players={players}
            initialAssignments={initialAssignments}
            isCommissioner={isCommissioner}
          />
        }
        scoringContent={
          <ScoringTable
            leagueSeasonId={seasonId}
            initialScoring={initialScoring}
            isCommissioner={isCommissioner}
          />
        }
      />
```

- [ ] **Step 3: Make settings gear visible to all users on season page**

In `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`, change the settings button from commissioner-only to always visible.

Replace:
```tsx
        {isCommissioner && (
          <Button asChild variant="ghost" size="icon">
            <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
              <Settings className="size-4" />
            </Link>
          </Button>
        )}
```

With:
```tsx
        <Button asChild variant="ghost" size="icon">
          <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
            <Settings className="size-4" />
          </Link>
        </Button>
```

- [ ] **Step 4: Add isCommissioner prop to TeamAssignment**

In `frontend/components/team-assignment.tsx`, add `isCommissioner` to the props type and destructuring:

Update the component signature (lines 26-36):
```tsx
export function TeamAssignment({
  leagueSeasonId,
  teams,
  players,
  initialAssignments,
  isCommissioner,
}: {
  leagueSeasonId: string;
  teams: Team[];
  players: Player[];
  initialAssignments: Assignment[];
  isCommissioner: boolean;
}) {
```

- [ ] **Step 5: Conditionally render edit controls in TeamAssignment**

Hide the remove (x) button on badges when not commissioner. Wrap the button inside the badge:

Replace (lines 149-154):
```tsx
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => handleRemove(assignment)}
                    >
                      &times;
                    </button>
```

With:
```tsx
                    {isCommissioner && (
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => handleRemove(assignment)}
                      >
                        &times;
                      </button>
                    )}
```

Hide the search input and dropdown for non-commissioners. Wrap the search `<div className="relative max-w-xs">` block (lines 158-198):

Replace:
```tsx
              <div className="relative max-w-xs">
                <Input
                  placeholder="Search teams..."
```
...through the closing `</div>` of that relative block...

With:
```tsx
              {isCommissioner && (
                <div className="relative max-w-xs">
                  <Input
                    placeholder="Search teams..."
```
...and close with:
```tsx
                </div>
              )}
```

- [ ] **Step 6: Remove redundant heading and update Teams tab badge layout**

While we're in `team-assignment.tsx`, the `<h2 className="text-lg font-semibold">Team Assignment</h2>` (line 117) is now redundant with the "Teams" tab label. Remove it.

Replace:
```tsx
      <h2 className="text-lg font-semibold">Team Assignment</h2>
```

With nothing (delete the line).

Then update the badge layout per spec. Replace the player teams badge section (the `<div className="flex flex-wrap gap-2">` at line 145) with a responsive grid:

Replace:
```tsx
              <div className="flex flex-wrap gap-2">
                {playerTeams.map(({ team, ...assignment }) => (
```

With:
```tsx
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {playerTeams.map(({ team, ...assignment }) => (
```

Add a separator between player groups. In the player map, add a bottom border to the player container div (line 143):

Replace:
```tsx
            <div key={player.id} className="flex flex-col gap-2">
              <div className="font-medium">{player.name}</div>
```

With:
```tsx
            <div key={player.id} className="flex flex-col gap-2 pb-4 border-b border-muted last:border-b-0">
              <div className="text-sm font-medium text-muted-foreground">{player.name}</div>
```

- [ ] **Step 7: Add isCommissioner prop to ScoringTable**

In `frontend/components/scoring-table.tsx`, add `isCommissioner` to props:

Update the component signature (lines 14-19):
```tsx
export function ScoringTable({
  leagueSeasonId,
  initialScoring,
  isCommissioner,
}: {
  leagueSeasonId: string;
  initialScoring: ScoringRow[];
  isCommissioner: boolean;
}) {
```

- [ ] **Step 8: Remove redundant heading, disable inputs, and hide save button for non-commissioners**

In `frontend/components/scoring-table.tsx`, first remove the redundant heading (line 52) that duplicates the "Scoring" tab label:

Replace:
```tsx
      <h2 className="text-lg font-semibold">Scoring Configuration</h2>
```

With nothing (delete the line).

Then add `disabled` to the Input:

Replace (line 65-75):
```tsx
                <Input
                  type="number"
                  min={0}
                  value={row.points}
                  onChange={(e) => {
                    const points = parseInt(e.target.value) || 0;
                    setRows((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, points } : r)),
                    );
                  }}
                  className="w-24"
                />
```

With:
```tsx
                <Input
                  type="number"
                  min={0}
                  value={row.points}
                  disabled={!isCommissioner}
                  onChange={(e) => {
                    const points = parseInt(e.target.value) || 0;
                    setRows((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, points } : r)),
                    );
                  }}
                  className="w-24"
                />
```

Conditionally render the save button (line 82-84):

Replace:
```tsx
      <Button onClick={handleSave} disabled={saving} className="w-fit">
        {saving ? "Saving..." : "Save Scoring"}
      </Button>
```

With:
```tsx
      {isCommissioner && (
        <Button onClick={handleSave} disabled={saving} className="w-fit">
          {saving ? "Saving..." : "Save Scoring"}
        </Button>
      )}
```

- [ ] **Step 9: Verify**

Test as commissioner: tabs work, can edit teams and scoring, all controls visible.
Test as non-commissioner: settings gear visible on season page, can navigate to settings, see read-only teams tab (no search/remove), see disabled scoring inputs, no save button.

- [ ] **Step 10: Commit**

```bash
git add frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/settings/page.tsx frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/page.tsx frontend/components/team-assignment.tsx frontend/components/scoring-table.tsx
git commit -m "feat: allow non-commissioners read-only access to settings"
```

---

## Chunk 3: Team List on Season Page

### Task 5: Team List Data Fetching

**Files:**
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`

- [ ] **Step 1: Add team list data fetch to season page server component**

In `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`, after the existing season data fetch (after line 25), add queries for team list data:

```tsx
  // Fetch team list data
  const { data: tournamentTeams } = await supabase
    .from("tournament_team")
    .select("id, seed, team(name)")
    .eq("tournament_id", season?.tournament_id)
    .order("seed");

  const tournamentTeamIds = (tournamentTeams ?? []).map((tt) => tt.id);
  const { data: teamWins } = await supabase
    .from("tournament_team_wins")
    .select("tournament_team_id, wins")
    .in("tournament_team_id", tournamentTeamIds);

  const { data: assignments } = await supabase
    .from("league_season_player")
    .select("tournament_team_id, league_player:league_player_id(id, name, profile_pic)")
    .eq("league_season_id", seasonId);

  const { data: scoring } = await supabase
    .from("league_season_scoring")
    .select("seed, points")
    .eq("league_season_id", seasonId);

  // Build team list data
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
      total_points: wins * pointsPerWin,
      player_name: player?.name ?? null,
      player_id: player?.id ?? null,
    };
  });

  // Build unique players list for filter badges (sorted alphabetically)
  const playersForFilter = Array.from(
    new Map(
      (assignments ?? [])
        .map((a) => a.league_player as unknown as { id: string; name: string })
        .filter(Boolean)
        .map((p) => [p.id, p])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx next build`

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/page.tsx
git commit -m "feat: add team list data fetching to season page"
```

---

### Task 6: TeamList Client Component

**Files:**
- Create: `frontend/components/team-list.tsx`
- Modify: `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`

- [ ] **Step 1: Create the TeamList component**

Create `frontend/components/team-list.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

type TeamData = {
  tournament_team_id: string;
  team_name: string;
  seed: number;
  total_points: number;
  player_name: string | null;
  player_id: string | null;
};

type PlayerFilter = {
  id: string;
  name: string;
};

export function TeamList({
  teams,
  players,
}: {
  teams: TeamData[];
  players: PlayerFilter[];
}) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set()
  );

  const isAllSelected = selectedPlayerIds.size === 0;

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedPlayerIds(new Set());
  }

  const filteredTeams = isAllSelected
    ? teams
    : teams.filter(
        (t) => t.player_id && selectedPlayerIds.has(t.player_id)
      );

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return a.seed - b.seed;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Teams</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Player filter badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={isAllSelected ? "default" : "outline"}
            className="cursor-pointer"
            onClick={selectAll}
          >
            All
          </Badge>
          {players.map((player) => (
            <Badge
              key={player.id}
              variant={selectedPlayerIds.has(player.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => togglePlayer(player.id)}
            >
              {player.name}
            </Badge>
          ))}
        </div>

        {/* Team list table */}
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="pb-2">Team</th>
              <th className="pb-2 w-16 text-center">Seed</th>
              <th className="pb-2 w-20 text-right">Points</th>
              <th className="pb-2 text-right">Player</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team) => (
              <tr
                key={team.tournament_team_id}
                className="border-t border-border"
              >
                <td className="py-2 font-medium">{team.team_name}</td>
                <td className="py-2 text-center tabular-nums">{team.seed}</td>
                <td className="py-2 text-right tabular-nums">
                  {team.total_points}
                </td>
                <td className="py-2 text-right">
                  {team.player_name ?? (
                    <span className="text-muted-foreground">Undrafted</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Update season page to render TeamList in two-column layout**

In `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`, import the TeamList:

```tsx
import { TeamList } from "@/components/team-list";
```

Replace the body of the return (the `<div className="flex flex-col gap-6">` block) to add the two-column layout:

```tsx
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/leagues/${leagueId}`}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{leagueName}</h1>
            <h2 className="text-lg text-muted-foreground">{year}</h2>
          </div>
        </div>
        <Button asChild variant="ghost" size="icon">
          <Link href={`/leagues/${leagueId}/seasons/${seasonId}/settings`}>
            <Settings className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
        <div className="ml-1">
          <ScoreTable leagueSeasonId={seasonId} />
        </div>
        <TeamList teams={teamListData} players={playersForFilter} />
      </div>
      {season?.tournament_id && (
        <Bracket leagueSeasonId={seasonId} tournamentId={season.tournament_id} />
      )}
    </div>
  );
```

- [ ] **Step 3: Verify the full page layout**

Run dev server. Navigate to a season page.

Desktop: Standings and Team List render side by side in two columns. Bracket below.
Mobile: Single column — standings, then team list, then bracket.

Test filter badges: "All" is selected by default showing all teams. Click a player name to filter to their teams. Click multiple players. Click "All" to reset. When last individual player is deselected, view reverts to "All".

- [ ] **Step 4: Verify team data**

Confirm teams are sorted by total_points descending, then seed ascending. Confirm undrafted teams show "Undrafted" in muted text. Confirm point calculation matches `wins * points_for_seed`.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/team-list.tsx frontend/app/\(app\)/leagues/\[leagueId\]/seasons/\[seasonId\]/page.tsx
git commit -m "feat: add team list with player filter to season page"
```

---

## Final Verification

- [ ] **Step 1: Full build check**

Run: `cd /Users/timroty/Documents/GitHub/TheDanceDraft/frontend && npx next build`

Expected: Clean build, no errors.

- [ ] **Step 2: End-to-end smoke test**

1. Log in → open hamburger menu → "Home" link present → click it → navigates to `/home`
2. Navigate to a league season → back arrow present → navigates to league page
3. Settings gear visible to all users (not just commissioner)
4. As commissioner: settings page has Tabs, can edit teams and scoring
5. As non-commissioner: settings page shows read-only teams, disabled scoring inputs, no save button
6. Season page: two-column layout on desktop, team list with working player filter badges
7. Log out → hamburger menu → no "Home" link
