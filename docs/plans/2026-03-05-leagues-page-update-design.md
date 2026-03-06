# Leagues Page Update — Design

**Date:** 2026-03-05
**Branch:** feature/bracket-redesign
**File:** `frontend/app/(app)/leagues/[leagueId]/page.tsx`

## Goal

Improve the leagues page by cleaning up the season list layout, surfacing the logged-in user's place in each season, and making the navigation button less jarring.

## Requirements

1. Seasons ordered descending by tournament year (most recent first)
2. No card box outline — separator lines between seasons
3. Show the logged-in user's place in each season with emoji + ordinal text
4. Ties: players with equal `total_score` and `total_wins` share the same rank (standard competition ranking: 1, 1, 3…)
5. "View Season" button replaced with a ghost button + ChevronRight icon

## Layout

Remove `Card`, `CardHeader`, `CardFooter` imports entirely. Replace with plain `div` rows using `border-b border-border py-4 flex items-center justify-between`. Apply `last:border-b-0` to avoid a trailing line.

Each row:
- Left: year (existing font/size) + place text below it (smaller, muted)
- Right: ghost button with ChevronRight icon

## Ordering

Change Supabase query order from `created_at` to `tournament(year)` descending. This ensures correctness even if seasons were created out of order.

```
.order("tournament(year)", { ascending: false })
```

## Place Display

**Emoji mapping:**
- 1st: 🥇
- 2nd: 🥈
- 3rd: 🥉
- 4th+: 🏀

**Ordinal suffixes:** st/nd/rd/th computed in JS (1st, 2nd, 3rd, 4th, 5th, …)

**Display text:** `{emoji} {ordinal} place` — rendered as smaller muted text under the year.

If the user has no entry in standings for a season, show nothing for that season's place.

## Data Fetch

Two additional queries on the server component:

1. **Get user's `league_player_id`:**
   ```
   supabase.from("league_player")
     .select("id")
     .eq("user_id", user.id)
     .eq("league_id", leagueId)
     .single()
   ```

2. **Get all standings for all seasons in one query:**
   ```
   supabase.from("league_season_standings")
     .select("league_season_id, league_player_id, total_score, total_wins")
     .in("league_season_id", seasonIds)
     .order("league_season_id")
     .order("total_score", { ascending: false })
     .order("total_wins", { ascending: false })
   ```

In JS: group standings by `league_season_id`, compute standard competition rank for each group, find the user's rank per season.

## Rank Computation (JS)

```ts
function computeRank(standings, userLeaguePlayerId) {
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
```

## Button

```tsx
<Button asChild variant="ghost" size="sm">
  <Link href={`/leagues/${leagueId}/seasons/${season.id}`}>
    <ChevronRight className="size-4" />
  </Link>
</Button>
```
