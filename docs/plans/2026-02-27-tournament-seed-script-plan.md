# Implementation Plan: Tournament Seed Script

**Design doc:** `docs/plans/2026-02-27-tournament-seed-script-design.md`

## Task 1: Create `sync/seed-tournament.js`

Create a single file `sync/seed-tournament.js` with the following structure:

### Config block

```js
import { db } from './lib/db.js';
import { readFileSync } from 'fs';

const JSON_PATH = './ingest-data/2025Bracket.json';
const TOURNAMENT_ID = '<paste-uuid-here>';
```

### Helper: `getAllRound1Competitors(matchups)`

- Filter matchups to `roundId === 1`.
- Flatten competitorOne and competitorTwo into a single array of competitor objects.
- Return the array.

### Phase 1: `seedTeams(competitors)`

- Deduplicate competitors by `id` (ESPN ID) to avoid processing the same team twice (shouldn't happen in round 1, but defensive).
- For each competitor:
  - `db.from('team').select('id').eq('espn_id', competitor.id).maybeSingle()`
  - If no data: `db.from('team').insert({ name: competitor.name, espn_id: competitor.id })`
  - Log created or skipped.

### Phase 2: `seedTournamentTeams(competitors)`

- Deduplicate by `id`.
- For each competitor:
  - Look up team: `db.from('team').select('id').eq('espn_id', competitor.id).single()`
  - Check existence: `db.from('tournament_team').select('id').eq('tournament_id', TOURNAMENT_ID).eq('team_id', teamRow.id).maybeSingle()`
  - If not found: `db.from('tournament_team').insert({ tournament_id: TOURNAMENT_ID, team_id: teamRow.id, seed: parseInt(competitor.seed, 10) })`
  - Log added or skipped.

### Phase 3: `seedGames(matchups)`

- Filter to `roundId === 1`.
- For each matchup:
  - Compute `slot = matchup.bracketLocation + 31`.
  - For each competitor (competitorOne, competitorTwo):
    - Look up `team` by `espn_id` → then `tournament_team` by `tournament_id` + `team_id`.
    - Determine column: if `competitor.homeAway === 'home'` → `home_team_id`, else → `away_team_id`.
  - Query `game` row: `db.from('game').select('*').eq('tournament_id', TOURNAMENT_ID).eq('slot', slot).single()`
  - Build update object:
    - For each competitor: if the target column (home/away) is null on the game row, add it to the update.
    - Always set `espn_game_id: matchup.id`.
  - If update object has fields: `db.from('game').update(updateObj).eq('id', gameRow.id)`
  - Log what was updated or skipped.

### Main function

```js
async function main() {
  const raw = readFileSync(JSON_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const matchups = data.matchups;
  const competitors = getAllRound1Competitors(matchups);

  console.log('[seed] Starting tournament seed...');
  console.log(`[seed] Tournament ID: ${TOURNAMENT_ID}`);
  console.log(`[seed] JSON: ${JSON_PATH}`);
  console.log(`[seed] Round 1 matchups: ${matchups.filter(m => m.roundId === 1).length}`);
  console.log(`[seed] Competitors: ${competitors.length}`);

  await seedTeams(competitors);
  await seedTournamentTeams(competitors);
  await seedGames(matchups);

  console.log('[seed] Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
```

## Files to create

| File | Action |
|------|--------|
| `sync/seed-tournament.js` | Create |

## Files to reference (read-only)

| File | Why |
|------|-----|
| `sync/lib/db.js` | Supabase client |
| `sync/ingest-data/2025Bracket.json` | Input data |
| `supabase/migrations/20260218000000_initial_team_schema.sql` | team, tournament, tournament_team schemas |
| `supabase/migrations/20260221000000_bracket_game_schema.sql` | game schema |
| `supabase/migrations/20260226000000_game_schema_v2.sql` | game column renames |
| `docs/plans/2026-02-27-tournament-seed-script-design.md` | Design doc |

## Notes

- The `TOURNAMENT_ID` must be manually set to the correct UUID before running.
- Run from the `sync/` directory so relative paths resolve correctly.
- The `.env` file must have `SUPABASE_URL` and `SUPABASE_SECRET_KEY` set.
- This is a single-task plan — one agent can implement the entire file.
