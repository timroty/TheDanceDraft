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
      <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-4 px-0">
        <TabsTrigger
          value="teams"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2"
        >
          Teams
        </TabsTrigger>
        <TabsTrigger
          value="scoring"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2"
        >
          Scoring
        </TabsTrigger>
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
