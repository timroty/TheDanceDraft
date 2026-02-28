import { db } from '../lib/db.js';
import { readFileSync } from 'fs';

const JSON_PATH = './ingest-data/2025Bracket.json';
const TOURNAMENT_ID = '<!-- TOURNAMENT-UUID -->';

function getAllRound1Competitors(matchups) {
  return matchups
    .filter(m => m.roundId === 1)
    .flatMap(m => [m.competitorOne, m.competitorTwo]);
}

async function seedTeams(competitors) {
  const seen = new Set();
  const unique = competitors.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  for (const competitor of unique) {
    const { data } = await db.from('team').select('id').eq('espn_id', competitor.id).maybeSingle();
    if (!data) {
      await db.from('team').insert({ name: competitor.name, espn_id: competitor.id });
      console.log(`[seed] Created team: ${competitor.name} (espn_id=${competitor.id})`);
    } else {
      console.log(`[seed] Skipped team: ${competitor.name} (espn_id=${competitor.id}) — already exists`);
    }
  }
}

async function seedTournamentTeams(competitors) {
  const seen = new Set();
  const unique = competitors.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  for (const competitor of unique) {
    const { data: teamRow } = await db.from('team').select('id').eq('espn_id', competitor.id).single();
    const { data: existing } = await db
      .from('tournament_team')
      .select('id')
      .eq('tournament_id', TOURNAMENT_ID)
      .eq('team_id', teamRow.id)
      .maybeSingle();

    if (!existing) {
      await db.from('tournament_team').insert({
        tournament_id: TOURNAMENT_ID,
        team_id: teamRow.id,
        seed: parseInt(competitor.seed, 10),
      });
      console.log(`[seed] Added tournament_team: ${competitor.name} (seed ${competitor.seed})`);
    } else {
      console.log(`[seed] Skipped tournament_team: ${competitor.name} — already exists`);
    }
  }
}

async function seedGames(matchups) {
  const round1 = matchups.filter(m => m.roundId === 1);

  for (const matchup of round1) {
    const slot = matchup.bracketLocation + 31;
    const { data: gameRow } = await db
      .from('game')
      .select('*')
      .eq('tournament_id', TOURNAMENT_ID)
      .eq('slot', slot)
      .single();

    const updateObj = { espn_game_id: matchup.id };

    for (const competitor of [matchup.competitorOne, matchup.competitorTwo]) {
      const col = competitor.homeAway === 'home' ? 'home_team_id' : 'away_team_id';
      if (gameRow[col] !== null) continue;

      const { data: teamRow } = await db.from('team').select('id').eq('espn_id', competitor.id).single();
      const { data: ttRow } = await db
        .from('tournament_team')
        .select('id')
        .eq('tournament_id', TOURNAMENT_ID)
        .eq('team_id', teamRow.id)
        .single();

      updateObj[col] = ttRow.id;
    }

    if (Object.keys(updateObj).length > 1 || !gameRow.espn_game_id) {
      await db.from('game').update(updateObj).eq('id', gameRow.id);
      console.log(`[seed] Updated game slot=${slot}: ${JSON.stringify(updateObj)}`);
    } else {
      console.log(`[seed] Skipped game slot=${slot} — already populated`);
    }
  }
}

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
