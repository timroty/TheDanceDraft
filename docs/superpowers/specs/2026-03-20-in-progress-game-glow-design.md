# In-Progress Game Glow Indicator

**Date:** 2026-03-20

## Summary

Add a soft red glow to `GameCard` when a game is in progress, providing a tasteful visual distinction on both the desktop and mobile bracket views.

## Problem

Games with status values other than `1` (scheduled) or `3` (final) — including `2` (in progress), `23` (halftime), OT statuses, and other ESPN live-game codes — currently look identical to scheduled games. Users have no visual cue that a game is happening right now.

## ESPN Status Codes

The `status` field in `GameData` carries raw ESPN status codes that are not normalized to only 1/2/3 before reaching the frontend. Known live-game values include at minimum `2` (in progress), `23` (halftime), and various OT codes. The comment in `types.ts` (`// 1=scheduled, 2=in_progress, 3=final`) is incomplete and should be updated to reflect this.

## Design

### Scope

Primary change: `frontend/components/bracket/game-card.tsx`
Minor comment update: `frontend/components/bracket/types.ts`

Both `BracketDesktop` and `BracketMobile` render `GameCard`, so the indicator propagates to both views automatically.

### Logic

A game is considered "in progress" when its status is neither scheduled (`1`) nor final (`3`):

```ts
const isInProgress = game.status !== 1 && game.status !== 3;
```

**Note:** This is intentionally different from the existing `showScore` condition (`game.status >= 2`). `showScore` also activates at status `3` (final) to keep scores visible after a game ends. `isInProgress` must exclude `3` so finished games do not glow. These two variables serve different purposes and should not be conflated.

### Visual Treatment

Replace the static `shadow-sm` with a conditional: show the default shadow for non-live games, show the red glow for live games:

```tsx
<div className={cn(
  "rounded border border-border bg-card text-card-foreground",
  isInProgress
    ? "shadow-[0_0_8px_rgba(239,68,68,0.5)]"
    : "shadow-sm",
  className ?? "w-52"
)}>
```

`shadow-sm` and the arbitrary shadow both set `box-shadow` via Tailwind's `--tw-shadow` variable. Applying both simultaneously produces unpredictable results depending on stylesheet ordering, so they are made mutually exclusive here.

- **Effect:** Soft red glow with 8px blur, 50% opacity
- **Static** (not animated) — avoids visual noise when many games are live simultaneously
- **Both light and dark mode** — the glow is visible against both the light background (`hsl(0 0% 100%)`) and dark background (`hsl(0 0% 3.9%)`) defined in `globals.css`

### Acceptance Criteria

- A game card with `status === 2`, `23`, or any other non-1/non-3 value displays a red glow border
- A game card with `status === 1` (scheduled) has no glow
- A game card with `status === 3` (final) has no glow
- The glow is visible in both light mode and dark mode
- No animation; the glow is static

### types.ts Comment Update

Update the `status` field comment from:
```ts
status: number; // 1=scheduled, 2=in_progress, 3=final
```
to:
```ts
status: number; // 1=scheduled, 3=final; all other values indicate a live game (e.g. 2=in_progress, 23=halftime, various OT codes)
```
