import { cn } from "@/lib/utils";
import type { GameData, TeamInGame } from "./types";

function TeamRow({
  team,
  isWinner,
  showScore,
}: {
  team: TeamInGame | null;
  isWinner: boolean;
  showScore: boolean;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
        <div className="size-5" />
        <span className="flex-1">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 text-xs",
        isWinner && "font-semibold bg-accent/50",
        !isWinner && showScore && "text-muted-foreground",
      )}
    >
      {team.playerProfilePic ? (
        <img
          src={team.playerProfilePic}
          alt=""
          className="size-5 rounded-full object-cover shrink-0"
        />
      ) : team.playerName ? (
        <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">
          {team.playerName.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="size-5 shrink-0" />
      )}
      <span className="truncate flex-1">
        ({team.seed}) {team.teamName}
      </span>
      {showScore && (
        <span className="tabular-nums ml-auto shrink-0">
          {team.score ?? ""}
        </span>
      )}
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

  return (
    <div className={cn("rounded border border-border bg-card text-card-foreground shadow-sm", className ?? "w-44")}>
      <TeamRow
        team={game.homeTeam}
        isWinner={isTeamWinner(game, "home")}
        showScore={showScore}
      />
      <div className="border-t border-border" />
      <TeamRow
        team={game.awayTeam}
        isWinner={isTeamWinner(game, "away")}
        showScore={showScore}
      />
      {game.detail && (
        <div className="border-t border-border px-2 py-0.5 text-center text-[10px] text-muted-foreground">
          {game.detail}
        </div>
      )}
    </div>
  );
}
