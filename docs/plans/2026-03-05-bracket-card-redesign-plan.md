# Bracket Card Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign bracket game cards to be user-focused — showing drafter name, seed/team name, score, and points per win in a two-line layout on both desktop and mobile.

**Architecture:** Add `pointsPerWin: number | null` to the `TeamInGame` type, fetch `league_season_scoring` in the data layer alongside existing queries, then restructure `TeamRow` in `game-card.tsx` to display a two-line layout. No changes needed to the desktop or mobile bracket container components.

**Tech Stack:** Next.js 14, React Server Components, Tailwind CSS, Supabase (postgres). No test framework is configured — verify visually by running the dev server.

---

### Task 1: Extend the `TeamInGame` type

**Files:**
- Modify: `frontend/components/bracket/types.ts`

**Context:** `TeamInGame` is the data shape for each team slot in a game card. We need to add `pointsPerWin` so the card knows how many points a win by this team is worth.

**Step 1: Add the field**

In `frontend/components/bracket/types.ts`, add `pointsPerWin: number | null;` to the `TeamInGame` type:

```ts
export type TeamInGame = {
  tournamentTeamId: string;
  teamName: string;
  seed: number;
  logoUrl: string | null;
  score: number | null;
  playerName: string | null;
  playerProfilePic: string | null;
  pointsPerWin: number | null;  // ← add this
};
```

**Step 2: Commit**

```bash
git add frontend/components/bracket/types.ts
git commit -m "feat(bracket): add pointsPerWin field to TeamInGame type"
```

---

### Task 2: Fetch scoring data and attach `pointsPerWin` in data layer

**Files:**
- Modify: `frontend/components/bracket/data.ts`

**Context:** `fetchBracketData` already fetches games, tournament teams, and player assignments. Add a fourth query for `league_season_scoring` (columns: `seed`, `points`), build a `Map<number, number>` from seed to points, and use it in `buildTeam`.

**Step 1: Add the scoring query**

After the existing three `supabase` queries (around line 35 in `data.ts`), add:

```ts
// Fetch points-per-win scoring config for this league season
const { data: scoringRows, error: scoringError } = await supabase
  .from("league_season_scoring")
  .select("seed, points")
  .eq("league_season_id", leagueSeasonId);
if (scoringError) console.error("Error fetching scoring:", scoringError);
```

**Step 2: Build the scoring lookup map**

After building `playerMap` (around line 67), add:

```ts
const scoringMap = new Map<number, number>();
for (const row of scoringRows ?? []) {
  scoringMap.set(row.seed, row.points);
}
```

**Step 3: Attach `pointsPerWin` in `buildTeam`**

The `buildTeam` function currently returns a `TeamInGame`. Add the lookup:

```ts
function buildTeam(
  teamId: string | null,
  score: number | null,
): TeamInGame | null {
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
    pointsPerWin: scoringMap.get(team.seed) ?? null,  // ← add this
  };
}
```

**Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

**Step 5: Commit**

```bash
git add frontend/components/bracket/data.ts
git commit -m "feat(bracket): fetch league_season_scoring and attach pointsPerWin to teams"
```

---

### Task 3: Restructure `TeamRow` in `game-card.tsx`

**Files:**
- Modify: `frontend/components/bracket/game-card.tsx`

**Context:** The current `TeamRow` renders a single flex row with `[avatar] (seed) teamName ... score`. The new layout is two lines:

```
[avatar]  playerName                    [score]
          (seed) teamName    [+N pts]
```

Points pill shows:
- On unfinished games (`status < 3`): for all assigned teams
- On finished games (`status === 3`): only on the winning team's row

**Step 1: Update `TeamRow` props**

`TeamRow` needs to know `isWinner`, `showScore`, `showPoints`, and the `pointsPerWin` value. Update the props interface:

```tsx
function TeamRow({
  team,
  isWinner,
  showScore,
  showPoints,
}: {
  team: TeamInGame | null;
  isWinner: boolean;
  showScore: boolean;
  showPoints: boolean;
}) {
```

**Step 2: Update the TBD placeholder**

```tsx
if (!team) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
      <div className="size-6" />
      <span className="flex-1">TBD</span>
    </div>
  );
}
```

**Step 3: Write the new two-line layout**

Replace the existing return with:

```tsx
return (
  <div
    className={cn(
      "flex items-start gap-2 px-2 py-1.5 text-xs",
      isWinner && "font-semibold bg-accent/50",
      !isWinner && showScore && "text-muted-foreground",
    )}
  >
    {/* Avatar */}
    {team.playerProfilePic ? (
      <img
        src={team.playerProfilePic}
        alt=""
        className="size-6 rounded-full object-cover shrink-0 mt-0.5"
      />
    ) : team.playerName ? (
      <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
        {team.playerName.charAt(0).toUpperCase()}
      </div>
    ) : (
      <div className="size-6 shrink-0" />
    )}

    {/* Text block */}
    <div className="flex flex-col flex-1 min-w-0">
      {/* Line 1: player name + score */}
      <div className="flex items-center justify-between gap-1">
        <span className="truncate">
          {team.playerName ?? "—"}
        </span>
        {showScore && (
          <span className="tabular-nums shrink-0">
            {team.score ?? ""}
          </span>
        )}
      </div>
      {/* Line 2: seed + team name + points */}
      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
        <span className="truncate">
          ({team.seed}) {team.teamName}
        </span>
        {showPoints && team.pointsPerWin != null && (
          <span className="shrink-0 tabular-nums">
            +{team.pointsPerWin} pts
          </span>
        )}
      </div>
    </div>
  </div>
);
```

**Step 4: Update `GameCard` to pass `showPoints` correctly**

`showPoints` logic:
- Unfinished game (`status < 3`): `true` for both teams
- Finished game (`status === 3`): `true` only for the winner

```tsx
export function GameCard({ game, className }: { game: GameData; className?: string }) {
  const showScore = game.status >= 2;
  const gameFinished = game.status === 3;

  return (
    <div className={cn("rounded border border-border bg-card text-card-foreground shadow-sm", className ?? "w-52")}>
      <TeamRow
        team={game.homeTeam}
        isWinner={isTeamWinner(game, "home")}
        showScore={showScore}
        showPoints={gameFinished ? isTeamWinner(game, "home") : true}
      />
      <div className="border-t border-border" />
      <TeamRow
        team={game.awayTeam}
        isWinner={isTeamWinner(game, "away")}
        showScore={showScore}
        showPoints={gameFinished ? isTeamWinner(game, "away") : true}
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

Note: default card width changed from `w-44` to `w-52`.

**Step 5: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

**Step 6: Start the dev server and visually verify**

```bash
cd frontend && npm run dev
```

Check:
- [ ] Desktop bracket: cards are wider (`w-52`), two-line layout shows player name + score on line 1, seed/team/points on line 2
- [ ] Unfinished games: both team rows show `+N pts`
- [ ] Finished games: only winning team row shows `+N pts`, loser row has no points pill
- [ ] Score still appears on the right of line 1 for in-progress/finished games
- [ ] Mobile bracket: same two-line layout, cards fill full width as before
- [ ] TBD slots still render correctly

**Step 7: Commit**

```bash
git add frontend/components/bracket/game-card.tsx
git commit -m "feat(bracket): redesign game card with two-line layout, player name prominent, points per win"
```
