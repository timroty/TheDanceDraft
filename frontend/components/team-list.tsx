"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

type TeamData = {
  tournament_team_id: string;
  team_name: string;
  seed: number;
  total_points: number;
  player_name: string | null;
  player_id: string | null;
};

type PlayerFilter = {
  id: string;
  name: string;
};

export function TeamList({
  teams,
  players,
}: {
  teams: TeamData[];
  players: PlayerFilter[];
}) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set()
  );

  const isAllSelected = selectedPlayerIds.size === 0;

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedPlayerIds(new Set());
  }

  const filteredTeams = isAllSelected
    ? teams
    : teams.filter(
        (t) => t.player_id && selectedPlayerIds.has(t.player_id)
      );

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return a.seed - b.seed;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Teams</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Player filter badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={isAllSelected ? "default" : "outline"}
            className="cursor-pointer"
            onClick={selectAll}
          >
            All
          </Badge>
          {players.map((player) => (
            <Badge
              key={player.id}
              variant={selectedPlayerIds.has(player.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => togglePlayer(player.id)}
            >
              {player.name}
            </Badge>
          ))}
        </div>

        {/* Team list table */}
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="pb-2">Team</th>
              <th className="pb-2 w-16 text-center">Seed</th>
              <th className="pb-2 w-20 text-right">Points</th>
              <th className="pb-2 text-right">Player</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team) => (
              <tr
                key={team.tournament_team_id}
                className="border-t border-border"
              >
                <td className="py-2 font-medium">{team.team_name}</td>
                <td className="py-2 text-center tabular-nums">{team.seed}</td>
                <td className="py-2 text-right tabular-nums">
                  {team.total_points}
                </td>
                <td className="py-2 text-right">
                  {team.player_name ?? (
                    <span className="text-muted-foreground">Undrafted</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
