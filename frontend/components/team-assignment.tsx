"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

type Team = {
  tournament_team_id: string;
  team_name: string;
  seed: number;
};

type Player = {
  id: string;
  name: string;
};

type Assignment = {
  league_season_player_id: string;
  league_player_id: string;
  tournament_team_id: string;
};

export function TeamAssignment({
  leagueSeasonId,
  teams,
  players,
  initialAssignments,
}: {
  leagueSeasonId: string;
  teams: Team[];
  players: Player[];
  initialAssignments: Assignment[];
}) {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const assignedTeamIds = new Set(assignments.map((a) => a.tournament_team_id));
  const unassignedTeams = teams.filter((t) => !assignedTeamIds.has(t.tournament_team_id));

  function getPlayerTeams(playerId: string) {
    return assignments
      .filter((a) => a.league_player_id === playerId)
      .map((a) => ({
        ...a,
        team: teams.find((t) => t.tournament_team_id === a.tournament_team_id)!,
      }));
  }

  function getFilteredTeams(playerId: string) {
    const term = (searchTerms[playerId] ?? "").toLowerCase();
    if (!term) return [];
    return unassignedTeams.filter((t) =>
      t.team_name.toLowerCase().includes(term),
    );
  }

  async function handleAssign(playerId: string, team: Team) {
    const tempId = `temp-${Date.now()}`;
    const newAssignment: Assignment = {
      league_season_player_id: tempId,
      league_player_id: playerId,
      tournament_team_id: team.tournament_team_id,
    };

    setAssignments((prev) => [...prev, newAssignment]);
    setSearchTerms((prev) => ({ ...prev, [playerId]: "" }));
    setOpenDropdown(null);

    const { data, error } = await supabase
      .from("league_season_player")
      .insert({
        league_season_id: leagueSeasonId,
        league_player_id: playerId,
        tournament_team_id: team.tournament_team_id,
      })
      .select("id")
      .single();

    if (error) {
      setAssignments((prev) => prev.filter((a) => a.league_season_player_id !== tempId));
      toast.error("Failed to assign team");
      return;
    }

    setAssignments((prev) =>
      prev.map((a) =>
        a.league_season_player_id === tempId
          ? { ...a, league_season_player_id: data.id }
          : a,
      ),
    );
  }

  async function handleRemove(assignment: Assignment) {
    setAssignments((prev) =>
      prev.filter((a) => a.league_season_player_id !== assignment.league_season_player_id),
    );

    const { error } = await supabase
      .from("league_season_player")
      .delete()
      .eq("id", assignment.league_season_player_id);

    if (error) {
      setAssignments((prev) => [...prev, assignment]);
      toast.error("Failed to remove team");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Team Assignment</h2>

      
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2 self-center">
            Unassigned:
          </span>
          {unassignedTeams.length > 0 ? (
            unassignedTeams.map((team) => (
              <Badge key={team.tournament_team_id} variant="outline">
                ({team.seed}) {team.team_name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">None</span>
          )}
        </div>
      

      <div className="flex flex-col gap-4">
        {players.map((player) => {
          const playerTeams = getPlayerTeams(player.id);
          const filtered = getFilteredTeams(player.id);
          const isOpen = openDropdown === player.id && filtered.length > 0;

          return (
            <div key={player.id} className="flex flex-col gap-2">
              <div className="font-medium">{player.name}</div>
              <div className="flex flex-wrap gap-2">
                {playerTeams.map(({ team, ...assignment }) => (
                  <Badge key={assignment.league_season_player_id}>
                    ({team.seed}) {team.team_name}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => handleRemove(assignment)}
                    >
                      &times;
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="relative max-w-xs">
                <Input
                  placeholder="Search teams..."
                  value={searchTerms[player.id] ?? ""}
                  onChange={(e) => {
                    setSearchTerms((prev) => ({
                      ...prev,
                      [player.id]: e.target.value,
                    }));
                    setOpenDropdown(player.id);
                  }}
                  onFocus={() => setOpenDropdown(player.id)}
                  onBlur={() => {
                    // Delay to allow click on dropdown item
                    setTimeout(() => setOpenDropdown(null), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const filtered = getFilteredTeams(player.id);
                      if (filtered.length > 0) {
                        handleAssign(player.id, filtered[0]);
                      }
                    }
                  }}
                />
                {isOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {filtered.map((team) => (
                      <button
                        key={team.tournament_team_id}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAssign(player.id, team)}
                      >
                        ({team.seed}) {team.team_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
