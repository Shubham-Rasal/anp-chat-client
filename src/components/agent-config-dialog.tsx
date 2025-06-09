import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { AgentWithServers } from "app-types/agent";
import {
  updateAgentAction,
  updateAgentMcpServersAction,
} from "@/app/api/chat/actions";
import { mutate } from "swr";
import useSWR from "swr";
import { MultiSelect } from "ui/multi-select";
import { selectAllMcpServersAction } from "@/app/api/mcp/actions";

interface AgentConfigDialogProps {
  agent: AgentWithServers;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentConfigDialog({
  agent,
  open,
  onOpenChange,
}: AgentConfigDialogProps) {
  const t = useTranslations();
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(agent.name);
  const [systemPrompt, setSystemPrompt] = useState(
    agent.instructions?.systemPrompt || "",
  );
  const [selectedServers, setSelectedServers] = useState<string[]>(
    agent.mcpServers,
  );

  const { data: mcpServers = [] } = useSWR(
    "mcp-servers",
    selectAllMcpServersAction,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await updateAgentAction({
        id: agent.id,
        name,
        instructions: {
          systemPrompt,
        },
      });
      await updateAgentMcpServersAction(agent.id, selectedServers);
      toast.success(t("Agent.configurationUpdated"));
      mutate("agents");
      onOpenChange(false);
    } catch (_error) {
      toast.error(t("Agent.failedToUpdateConfiguration"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Agent.updateConfiguration")}</DialogTitle>
          <DialogDescription>
            {t("Agent.updateConfigurationDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("Agent.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("Agent.namePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="systemPrompt">{t("Agent.systemPrompt")}</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={t("Agent.systemPromptPlaceholder")}
                className="h-32"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("Agent.mcpServers")}</Label>
              <MultiSelect
                options={mcpServers.map((server) => ({
                  label: server.name,
                  value: server.id,
                }))}
                value={selectedServers}
                onChange={setSelectedServers}
                placeholder={t("Agent.selectMcpServers")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              {t("Common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || selectedServers.length === 0}
            >
              {isUpdating ? t("Common.saving") : t("Common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
