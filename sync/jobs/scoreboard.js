import { db } from '../lib/db.js';
import { fetchScoreboard } from '../lib/espn.js';

export async function scoreboardJob() {
  console.log('[scoreboard] Running job at', new Date().toISOString());

  let competitions;
  try {
    competitions = await fetchScoreboard();
  } catch (err) {
    console.error('[scoreboard] Failed to fetch ESPN scoreboard:', err.message);
    return;
  }

  for (const comp of competitions) {
    await processCompetition(comp);
  }
}

async function processCompetition(comp) {
  // Step 1: Match by espn_game_id for games not yet finished.
  let game = await findGameByEspnId(comp.espnGameId);

  // Step 2: Fall back to matching by both team ESPN IDs.
  if (!game) {
    game = await findGameByTeamEspnIds(comp.homeTeamEspnId, comp.awayTeamEspnId);
  }

  if (!game) return;

  // Step 3: Fix home/away ordering if ESPN's labeled home team doesn't match our DB.
  let { homeScore, awayScore } = comp;
  let { home_team_id, away_team_id } = game;

  const dbHomeEspnId = await getTeamEspnId(home_team_id);
  if (dbHomeEspnId !== comp.homeTeamEspnId) {
    console.log(`[scoreboard] Detected home/away mismatch for game ${game.id} (ESPN game ${comp.espnGameId}). Swapping teams and scores.`);
    // Swap IDs and scores to align with ESPN ordering.
    [home_team_id, away_team_id] = [away_team_id, home_team_id];
    [homeScore, awayScore] = [awayScore, homeScore];
  }

  // Step 4: Update the game row.
  const { error: updateError } = await db
    .from('game')
    .update({
      home_team_id,
      away_team_id,
      home_score: homeScore,
      away_score: awayScore,
      detail: comp.detail,
      status: comp.statusId,
      espn_game_id: comp.espnGameId,
    })
    .eq('id', game.id);

  if (updateError) {
    console.error('[scoreboard] Failed to update game', game.id, updateError.message);
    return;
  }

  // Step 5: Advance bracket for newly finished, unprocessed games.
  if (!game.processed) {
    await advanceBracket(game, homeScore, awayScore, home_team_id, away_team_id);
  }
}

async function findGameByEspnId(espnGameId) {
  const { data, error } = await db
    .from('game')
    .select('*')
    .eq('espn_game_id', espnGameId)
    .neq('processed', true)
    .maybeSingle();

  if (error) {
    console.error('[scoreboard] Error querying by espn_game_id:', error.message);
    return null;
  }
  return data;
}

async function findGameByTeamEspnIds(homeTeamEspnId, awayTeamEspnId) {
  // Find tournament_team IDs for both ESPN team IDs, then find a game containing both.
  const { data: teams, error: teamError } = await db
    .from('team')
    .select('id, espn_id')
    .in('espn_id', [homeTeamEspnId, awayTeamEspnId]);

  if (teamError || !teams || teams.length < 2) return null;

  const teamIds = teams.map((t) => t.id);

  // Get tournament_team rows for these team IDs.
  const { data: ttRows, error: ttError } = await db
    .from('tournament_team')
    .select('id, team_id')
    .in('team_id', teamIds);

  if (ttError || !ttRows || ttRows.length < 2) return null;

  const ttIds = ttRows.map((tt) => tt.id);

  // Find a game where home_team_id and away_team_id are both in our ttIds and not finished.
  const { data: games, error: gameError } = await db
    .from('game')
    .select('*')
    .in('home_team_id', ttIds)
    .in('away_team_id', ttIds)
    .neq('processed', true);

  if (gameError || !games || games.length === 0) return null;

  return games[0];
}

async function getTeamEspnId(tournamentTeamId) {
  if (!tournamentTeamId) return null;

  const { data, error } = await db
    .from('tournament_team')
    .select('team:team_id(espn_id)')
    .eq('id', tournamentTeamId)
    .maybeSingle();

  if (error || !data) return null;
  return data.team?.espn_id ?? null;
}

async function advanceBracket(game, homeScore, awayScore, homeTeamId, awayTeamId) {
  const winnerId = homeScore >= awayScore ? homeTeamId : awayTeamId;

  // Look up where the winner advances.
  const { data: advancement, error: advError } = await db
    .from('bracket_advancement')
    .select('to_slot')
    .eq('from_slot', game.slot)
    .maybeSingle();

  if (advError || !advancement) {
    // Slot 1 (Championship) has no advancement row — game is the final.
    await db.from('game').update({ processed: true }).eq('id', game.id);
    return;
  }

  const toSlot = advancement.to_slot;

  // Find the next game in this tournament at the target slot.
  const { data: nextGame, error: nextError } = await db
    .from('game')
    .select('*')
    .eq('tournament_id', game.tournament_id)
    .eq('slot', toSlot)
    .maybeSingle();

  if (nextError || !nextGame) {
    console.error('[scoreboard] Could not find next game at slot', toSlot);
    await db.from('game').update({ processed: true }).eq('id', game.id);
    return;
  }

  // Place winner in the first available slot.
  const placement = nextGame.home_team_id == null ? { home_team_id: winnerId } : { away_team_id: winnerId };

  const { error: placeError } = await db
    .from('game')
    .update(placement)
    .eq('id', nextGame.id);

  if (placeError) {
    console.error('[scoreboard] Failed to advance winner to slot', toSlot, placeError.message);
  }

  await db.from('game').update({ processed: true }).eq('id', game.id);
}
