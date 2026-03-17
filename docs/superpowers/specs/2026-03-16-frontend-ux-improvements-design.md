# Frontend UX Improvements Design

Based on participant feedback, five changes to improve navigation, settings organization, accessibility, and team visibility.

## 1. Home Button in Nav Menu

Add a "Home" link to the hamburger dropdown menu (`nav-menu.tsx`) that navigates to `/home`. Positioned at the top of the menu above the theme toggle, using the `Home` icon from lucide-react. Only rendered when `isAuthenticated` is true, consistent with other auth-conditional menu items.

## 2. Back Arrow on League Season Page

Add a back arrow button to the season page header that navigates to `/leagues/[leagueId]` (the league home page). Uses the `ArrowLeft` icon from lucide-react, styled consistently with the existing back arrow on the settings page. Positioned to the left of the league name.

## 3. Settings Page Redesign — Tabs + Team Badge Cleanup

### Tabs

Replace the current stacked layout on the settings page with shadcn's `Tabs` component. If the shadcn Tabs supports a `variant="line"` option, use it; otherwise style the tab triggers with a bottom-border underline to achieve a line-style appearance. Default active tab is "Teams". Two tabs:

- **Teams** — team assignment UI
- **Scoring** — scoring configuration

The `Tabs` component will need to be installed via shadcn CLI since it's not currently in the project.

### Teams Tab — Badge Layout

- Unassigned teams section at top (same as today)
- Below that, each player's assigned teams grouped together
- 4 badges per row on desktop, 2 on mobile (`grid-cols-2 sm:grid-cols-4`)
- Subtle separator (`border-b border-muted` or similar) between each player's group
- Player name as a small label above their badge group
- Search and assignment controls remain at top (commissioner only — see section 4)

### Scoring Tab

The existing `ScoringTable` component moves here 1:1 with no layout changes.

## 4. Read-Only Settings Access for Non-Commissioners

### Routing

Remove the server-side redirect on the settings page that blocks non-commissioners. Instead, compute an `isCommissioner` boolean and pass it as a prop to child components.

### Season Page

The settings gear icon becomes visible to all authenticated users, not just the commissioner.

### Teams Tab (Non-Commissioner View)

- Team badges display as read-only — no search input, no dropdown selector, no remove (×) buttons
- Just the organized badge grid showing who has what teams

### Scoring Tab (Non-Commissioner View)

- Same input layout but all inputs are `disabled` (grayed out)
- No save button rendered

### Data Flow

- Settings page server component computes `isCommissioner` from `user.id === commissioner_id`
- Passes `isCommissioner` as a prop to `TeamAssignment` and `ScoringTable`
- Components conditionally render edit controls based on the prop

## 5. Team List Component on Season Page

### Layout

- **Desktop:** Two-column layout — standings on the left, team list in a column to the right
- **Mobile:** Team list renders below the standings

### Player Filter

- Row of badges at the top showing each player's name
- "All" badge selected by default — shows every team
- Clicking a player badge deselects "All" and filters to that player's teams
- Multiple player badges can be selected simultaneously
- Clicking "All" again clears selection and shows everything

### Team List Body

- Sorted descending by point count
- Each row shows: team name, seed, total points, and who drafted them (player name, or "Undrafted" in muted text)
- Clean list/table layout using the existing `Card` component as a container

### Component Boundary

The data fetch happens in a server component. The fetched data is passed as props to a client component (`TeamList`) that manages the filter badge state.

### Data Requirements

The season page server component fetches the team list data by joining `tournament_team`, `league_season_player` (for draft assignments), `league_season_scoring` (for point values per seed), and game results (for win counts). The expected data shape per team:

```
{ tournament_team_id, team_name, seed, total_points, player_name?, player_profile_pic? }
```

Where `total_points = wins * points_for_seed`. Teams with 0 points (no wins or no scoring config) still appear. Secondary sort by seed ascending when points are tied.

When the last individual player filter badge is deselected, the view auto-reverts to "All".

### Responsive Layout

Desktop (md+): `grid-cols-[1fr_1fr]` — standings and team list side by side. Mobile: single column, team list below standings.
