"use client";

import { Button } from "ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { PlusIcon } from "ui/plus-icon";
import { useState } from "react";
import { CreateAgentPopup } from "@/components/create-agent-popup";
import { AgentCard } from "@/components/agent-card";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { selectAgentListByUserIdAction } from "@/app/api/chat/actions";
import { RobotIcon } from "ui/robot-icon";

export default function AgentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const t = useTranslations();
  const { data: agents = [], isLoading } = useSWR(
    "agents",
    selectAgentListByUserIdAction,
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("Layout.agents")}</h1>
        <Button className="font-semibold bg-input/20" variant="outline">
          <RobotIcon className="fill-foreground size-3.5" />
          {t("Agent.createAgent")}
        </Button>
      </div>

      {agents.length === 0 && !isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("Agent.noAgentsYet")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t("Agent.createYourFirstAgent")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      <CreateAgentPopup
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
