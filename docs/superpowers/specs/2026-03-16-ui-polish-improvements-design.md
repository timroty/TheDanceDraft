# UI Polish Improvements Design

**Date:** 2026-03-16
**Status:** Approved

## Overview

Five targeted UI polish improvements building on the previous frontend UX implementation. Focused on visual consistency (card treatment for standings), data completeness (wins in team list), parity between pages (share page gets TeamList), navigation clarity (bracket heading), and landing page simplification (direct sign in/sign up buttons).

---

## 1. Standings Card Wrapper

**File:** `frontend/components/score-table.tsx`

Wrap the `ScoreTable` return in `<Card>` + `<CardHeader><CardTitle>Standings</CardTitle></CardHeader>` + `<CardContent>`. Move the existing `<h2>` heading into `<CardTitle>`. The `max-w-xl` constraint stays on the table inside `CardContent`. This gives Standings the same visual treatment as the TeamList card on the season page.

---

## 2. Wins Column in TeamList

**Files:** `frontend/components/team-list.tsx`, `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx`, `frontend/app/share/[token]/page.tsx`

Add `wins: number` to the `TeamData` type. Add a **Wins** column to the table (between Seed and Points). Update `teamListData` construction on the season page to include `wins` from `winsMap`. The share page will receive the same update when TeamList is added there (change #3).

---

## 3. TeamList on Share Page

**File:** `frontend/app/share/[token]/page.tsx`

Add the same data-fetching block used on the season page (tournament teams by seed, wins via `tournament_team_wins`, assignments via `league_season_player`, scoring via `league_season_scoring`). Build `teamListData` and `playersForFilter` the same way. Layout: two-column grid (`grid-cols-1 md:grid-cols-[1fr_1fr]`) with ScoreTable left and TeamList right, Bracket below — matching the season page layout.

---

## 4. Bracket Heading

**File:** `frontend/components/bracket/index.tsx`

Add `<h2 className="text-lg font-semibold">Bracket</h2>` at the top of the non-empty return, before the desktop/mobile conditional divs. Applies to both the season page and share page since it's in the shared component.

---

## 5. Root Page Sign In / Sign Up Buttons

**File:** `frontend/app/page.tsx`

Remove `AuthButton` and `ThemeSwitcher`. Add two `<Button>` components from shadcn/ui as `<Link>` asChild wrappers:
- **Sign Up** — `variant="default"`, links to `/auth/sign-up`
- **Sign In** — `variant="outline"`, links to `/auth/login`

Always displayed, no auth state check. Layout: buttons side by side in a flex row, centered on the page alongside the existing title.

---

## Files Touched

| File | Change |
|------|--------|
| `frontend/components/score-table.tsx` | Wrap in Card |
| `frontend/components/team-list.tsx` | Add `wins` field and column |
| `frontend/app/(app)/leagues/[leagueId]/seasons/[seasonId]/page.tsx` | Include `wins` in teamListData |
| `frontend/app/share/[token]/page.tsx` | Add TeamList with full data fetch + two-column layout |
| `frontend/components/bracket/index.tsx` | Add "Bracket" heading |
| `frontend/app/page.tsx` | Replace AuthButton/ThemeSwitcher with Sign In/Sign Up buttons |
