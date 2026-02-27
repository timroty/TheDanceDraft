import fetch from 'node-fetch';

const SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';

/**
 * Fetch the ESPN scoreboard and return an array of parsed competition objects.
 * Each item has: { espnGameId, homeTeamEspnId, awayTeamEspnId, homeScore, awayScore, statusId, detail }
 */
export async function fetchScoreboard() {
  const res = await fetch(SCOREBOARD_URL);
  if (!res.ok) {
    throw new Error(`ESPN API returned ${res.status}`);
  }
  const data = await res.json();

  const competitions = [];
  for (const event of data.events ?? []) {
    const comp = event.competitions?.[0];
    if (!comp) continue;

    // Only sync NCAA Tournament games (tournamentId 22 = NCAA Men's Tournament).
    if (comp.tournamentId !== 22) continue;

    const home = comp.competitors.find((c) => c.homeAway === 'home');
    const away = comp.competitors.find((c) => c.homeAway === 'away');
    if (!home || !away) continue;

    competitions.push({
      espnGameId: event.id,
      homeTeamEspnId: home.team.id,
      awayTeamEspnId: away.team.id,
      homeScore: parseInt(home.score ?? '0', 10),
      awayScore: parseInt(away.score ?? '0', 10),
      statusId: parseInt(comp.status.type.id, 10),
      detail: comp.status.type.detail ?? '',
    });
  }

  return competitions;
}
