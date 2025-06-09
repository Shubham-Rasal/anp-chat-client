import { AgentWithServers } from "app-types/agent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "ui/dropdown-menu";
import { MoreVerticalIcon } from "ui/more-vertical-icon";
import { RobotIcon } from "ui/robot-icon";
import { useState } from "react";
import { deleteAgentAction } from "@/app/api/chat/actions";
import { toast } from "sonner";
import { mutate } from "swr";
import { useTranslations } from "next-intl";
import { AgentConfigDialog } from "./agent-config-dialog";

interface AgentCardProps {
  agent: AgentWithServers;
}

export function AgentCard({ agent }: AgentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const t = useTranslations();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteAgentAction(agent.id);
      toast.success(t("Agent.agentDeleted"));
      mutate("agents");
    } catch (_error) {
      toast.error(t("Agent.failedToDeleteAgent"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <RobotIcon className="size-4" />
            <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsConfigOpen(true)}>
                {t("Agent.configure")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {t("Agent.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs">
            {agent.instructions?.systemPrompt || t("Agent.noInstructionsSet")}
          </CardDescription>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              {t("Agent.mcpServersConnected", {
                count: agent.mcpServers.length,
                plural: agent.mcpServers.length !== 1 ? "s" : "",
              })}
            </p>
          </div>
        </CardContent>
      </Card>
      <AgentConfigDialog
        agent={agent}
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
      />
    </>
  );
}
