"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

type ScoringRow = {
  seed: number;
  points: number;
};

export function ScoringTable({
  leagueSeasonId,
  initialScoring,
  isCommissioner,
}: {
  leagueSeasonId: string;
  initialScoring: ScoringRow[];
  isCommissioner: boolean;
}) {
  const supabase = createClient();
  const [rows, setRows] = useState<ScoringRow[]>(() => {
    const map = new Map(initialScoring.map((r) => [r.seed, r.points]));
    return Array.from({ length: 16 }, (_, i) => ({
      seed: i + 1,
      points: map.get(i + 1) ?? 0,
    }));
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("league_season_scoring").upsert(
      rows.map((r) => ({
        league_season_id: leagueSeasonId,
        seed: r.seed,
        points: r.points,
      })),
      { onConflict: "league_season_id,seed" },
    );
    setSaving(false);

    if (error) {
      toast.error("Failed to save scoring");
    } else {
      toast.success("Scoring saved");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full max-w-xs">
        <thead>
          <tr className="text-left text-sm text-muted-foreground">
            <th className="pb-2">Seed</th>
            <th className="pb-2">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.seed}>
              <td className="py-1 pr-4 font-medium">{row.seed}</td>
              <td className="py-1">
                <Input
                  min={0}
                  disabled={!isCommissioner}
                  value={row.points}
                  onChange={(e) => {
                    const points = parseInt(e.target.value) || 0;
                    setRows((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, points } : r)),
                    );
                  }}
                  className="w-24"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isCommissioner && (
        <Button onClick={handleSave} disabled={saving} className="w-fit">
          {saving ? "Saving..." : "Save Scoring"}
        </Button>
      )}
    </div>
  );
}
