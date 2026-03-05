export type TeamInGame = {
  tournamentTeamId: string;
  teamName: string;
  seed: number;
  logoUrl: string | null;
  score: number | null;
  playerName: string | null;
  playerProfilePic: string | null;
};

export type GameData = {
  id: string;
  slot: number;
  round: number;
  region: string | null;
  status: number; // 1=scheduled, 2=in_progress, 3=final
  detail: string | null;
  homeTeam: TeamInGame | null;
  awayTeam: TeamInGame | null;
};

export type BracketData = Record<number, GameData>; // keyed by slot (1-63)

export const ROUND_NAMES: Record<number, string> = {
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet Sixteen",
  4: "Elite Eight",
  5: "Final Four",
  6: "Championship",
};
