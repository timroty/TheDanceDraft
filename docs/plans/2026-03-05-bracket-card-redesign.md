# Bracket Card Redesign

**Date:** 2026-03-05
**Branch:** feature/bracket-redesign
**Scope:** `game-card.tsx`, `types.ts`, `data.ts` — user-focused bracket card layout with points per win

## Context

User feedback: the bracket cards are too team-focused. Users want to see who drafted each team, how many points a win is worth, and have the card be large enough to comfortably hold all this data.

## Requirements

1. Display the drafter's name prominently next to their profile picture
2. Show seed + team name in smaller text beneath the player name
3. Show points per win — on unfinished games for all assigned teams; on finished games next to the winning team only
4. Score continues to display as today
5. Apply to both desktop and mobile bracket
6. Make cards larger to accommodate the new layout

## Design

### Data Layer

**`types.ts`**: Add `pointsPerWin: number | null` to `TeamInGame`.

**`data.ts`**: Add one query to fetch `league_season_scoring` (seed → points) for the given `leagueSeasonId`. Build a `Map<number, number>` (seed → points). In `buildTeam`, look up the team's seed and attach `pointsPerWin`.

### GameCard UI

Each team row becomes two lines:

```
[avatar 6×6]  playerName                         [score]
              (seed) teamName          [+N pts pill] ← conditional
```

- **Avatar**: `size-6` (up from `size-5`)
- **Line 1**: player name (`text-xs font-medium`, truncated) + score (`tabular-nums`) on the right
- **Line 2**: `(seed) teamName` (`text-[10px] text-muted-foreground`, truncated) + points pill on the right
- **Points pill**: muted badge showing `+N pts`
  - Unfinished game (`status < 3`): shown for both assigned teams
  - Finished game (`status === 3`): shown only on the winning team's row

### Card Sizing

- Desktop default width: `w-52` (208px, up from `w-44` 176px)
- Mobile: `w-full` (unchanged — already fills column)
- Connector lines in `bracket-desktop.tsx` are width-independent, no changes needed

### Affected Files

| File | Change |
|------|--------|
| `components/bracket/types.ts` | Add `pointsPerWin: number \| null` to `TeamInGame` |
| `components/bracket/data.ts` | Fetch `league_season_scoring`, attach `pointsPerWin` in `buildTeam` |
| `components/bracket/game-card.tsx` | Restructure `TeamRow` to two-line layout with points pill |

No changes to `bracket-desktop.tsx`, `bracket-mobile.tsx`, or `index.tsx`.
