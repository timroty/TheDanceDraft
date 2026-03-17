"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

export function SettingsTabs({
  teamsContent,
  scoringContent,
}: {
  teamsContent: ReactNode;
  scoringContent: ReactNode;
}) {
  return (
    <Tabs defaultValue="teams">
      <TabsList variant="line">
        <TabsTrigger value="teams">Teams</TabsTrigger>
        <TabsTrigger value="scoring">Scoring</TabsTrigger>
      </TabsList>
      <TabsContent value="teams" className="mt-6">
        {teamsContent}
      </TabsContent>
      <TabsContent value="scoring" className="mt-6">
        {scoringContent}
      </TabsContent>
    </Tabs>
  );
}
