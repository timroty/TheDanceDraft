import { cn } from "@/lib/utils";
import type { GameData, TeamInGame } from "./types";

function TeamRow({
  team,
  isWinner,
  showScore,
  showPoints,
}: {
  team: TeamInGame | null;
  isWinner: boolean;
  showScore: boolean;
  showPoints: boolean;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
        <div className="size-6" />
        <span className="flex-1">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 px-2 py-1.5 text-xs",
        isWinner && "font-semibold bg-accent/50",
        !isWinner && showScore && "text-muted-foreground",
      )}
    >
      {/* Avatar */}
      {team.playerProfilePic ? (
        <img
          src={team.playerProfilePic}
          alt=""
          className="size-6 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : team.playerName ? (
        <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
          {team.playerName.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="size-6 shrink-0" />
      )}

      {/* Text block */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Line 1: player name + score */}
        <div className="flex items-center justify-between gap-1">
          <span className="truncate">
            {team.playerName ?? "—"}
          </span>
          {showScore && (
            <span className="tabular-nums shrink-0">
              {team.score ?? ""}
            </span>
          )}
        </div>
        {/* Line 2: seed + team name + points */}
        <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
          <span className="truncate">
            ({team.seed}) {team.teamName}
          </span>
          {showPoints && team.pointsPerWin != null && team.playerName != null && (
            <span className="shrink-0 tabular-nums">
              +{team.pointsPerWin} pts
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function isTeamWinner(game: GameData, team: "home" | "away"): boolean {
  if (game.status !== 3) return false;
  if (game.homeTeam?.score == null || game.awayTeam?.score == null) return false;
  if (team === "home") return game.homeTeam.score > game.awayTeam.score;
  return game.awayTeam.score > game.homeTeam.score;
}

export function GameCard({ game, className }: { game: GameData; className?: string }) {
  const showScore = game.status >= 2;
  const gameFinished = game.status === 3;

  return (
    <div className={cn("rounded border border-border bg-card text-card-foreground shadow-sm", className ?? "w-52")}>
      <TeamRow
        team={game.homeTeam}
        isWinner={isTeamWinner(game, "home")}
        showScore={showScore}
        showPoints={gameFinished ? isTeamWinner(game, "home") : true}
      />
      <div className="border-t border-border" />
      <TeamRow
        team={game.awayTeam}
        isWinner={isTeamWinner(game, "away")}
        showScore={showScore}
        showPoints={gameFinished ? isTeamWinner(game, "away") : true}
      />
      {game.detail && (
        <div className="border-t border-border px-2 py-0.5 text-center text-[10px] text-muted-foreground">
          {game.detail}
        </div>
      )}
    </div>
  );
}
