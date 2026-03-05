# Bracket Component Design

## Overview

Custom-built NCAA tournament bracket component displaying all 63 games across 6 rounds. Server-rendered, used on both the league season page and share page.

## Data Fetching

Single Supabase query joining `game`, `tournament_team`, `team`, `league_season_player`, and `league_player` for a given `league_season_id` and `tournament_id`. Returns all 63 games with:

- slot, round, region
- home/away: team name, seed, logo_url, score, player name, player profile_pic
- status, detail

Results transformed into a slot-indexed map (`Record<number, GameData>`) for O(1) lookup when rendering.

## Component Architecture

- **`<Bracket>`** — server component. Fetches data, transforms to slot map, renders both desktop and mobile layouts (CSS controls visibility via `hidden md:block` / `block md:hidden`).
- **`<BracketDesktop>`** — traditional 2-sided bracket layout.
- **`<BracketMobile>`** — horizontal scroll with snap-to-round columns.
- **`<GameCard>`** — single matchup card showing two team rows.

**Props:**
```tsx
<Bracket leagueSeasonId={string} tournamentId={string} />
```

## GameCard Design

Two team rows stacked vertically with game detail below:

```
┌─────────────────────────────────────┐
│ 🟡 (1) Gonzaga              72     │  ← winner bold/highlighted
│ 🔵 (16) Norfolk St.         45     │  ← loser muted
│            Final                    │
└─────────────────────────────────────┘
```

**Each team row (left to right):**
- Player profile pic (small avatar ~20px). Hidden if no player assigned. Fallback to first letter of name if no profile_pic URL.
- Seed in parentheses
- Team name
- Score (right-aligned) — only shown when status >= 2

**Visual states:**
- **Final (status=3):** Winner row bold + highlighted background, loser row muted.
- **In progress (status=2):** Both rows normal weight, detail shows live status text.
- **Scheduled (status=1):** No scores, detail shows tip-off time.
- **Empty slot (no team):** "TBD" placeholder in muted text, no avatar.
- **One team assigned:** That team shown normally, other row shows "TBD".

**Card width:** ~180-200px on desktop, full-width on mobile.

## Desktop Layout

Traditional 2-sided bracket:

```
Region A (R64→E8) ─┐
                    ├─ FF (slot 2) ─┐
Region B (R64→E8) ─┘               │
                                    ├─ Championship (slot 1)
Region C (E8←R64) ─┐               │
                    ├─ FF (slot 3) ─┘
Region D (E8←R64) ─┘
```

- Left side: Regions A & B flow left-to-right (R64 → R32 → S16 → E8).
- Right side: Regions C & D flow right-to-left (E8 ← S16 ← R32 ← R64).
- Center: Final Four + Championship.
- CSS Grid with columns per round. Row spacing doubles each round (16 rows R64, 8 rows R32, etc.).
- Connector lines via CSS `::before`/`::after` pseudo-elements (1px borders).
- Region labels from `game.region` field as headers above each subtree.
- Horizontally scrollable container (`overflow-x: auto`) since full bracket is ~1200-1400px wide.

## Mobile Layout

Horizontal scroll with CSS snap-to-round:

```
← swipe →
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│ Round of ││ Round of ││ Sweet    ││ Elite    ││ Final    ││ Champ-   │
│ 64       ││ 32       ││ Sixteen  ││ Eight    ││ Four     ││ ionship  │
│ [Cards]  ││ [Cards]  ││ [Cards]  ││ [Cards]  ││ [Cards]  ││ [Card]   │
└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
```

- Each round is a full-viewport-width column.
- `scroll-snap-type: x mandatory` on container, `scroll-snap-align: start` on each column.
- Round name as sticky header at top of each column.
- Games listed vertically within each column, grouped by region with small subheaders (R64 through E8).
- Each column scrolls vertically independently if games overflow.

## Empty / Edge States

- **No games seeded:** Centered "Bracket not yet available" message instead of bracket.
- **No player assigned to a team:** Avatar spot hidden; team name and seed still display.
- **Missing profile pic:** Fallback to first-letter avatar.
- **Future games (no teams):** TBD vs TBD card.

## Slot-to-Layout Mapping

Uses the binary tree structure from `bracket_advancement`:

| Round | Slots | Games |
|-------|-------|-------|
| R64   | 32-63 | 32    |
| R32   | 16-31 | 16    |
| S16   | 8-15  | 8     |
| E8    | 4-7   | 4     |
| FF    | 2-3   | 2     |
| Champ | 1     | 1     |

Region subtrees (slots 4-7 are E8 roots):
- Slot 4 & 5 feed FF slot 2 (left side)
- Slot 6 & 7 feed FF slot 3 (right side)
