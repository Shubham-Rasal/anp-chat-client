"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";
import { useState } from "react";
import { insertAgentAction } from "@/app/api/chat/actions";
import { toast } from "sonner";
import { MultiSelect } from "ui/multi-select";
import useSWR, { mutate } from "swr";
import { useTranslations } from "next-intl";
import { authClient } from "auth/client";
import { selectAllMcpServersAction } from "@/app/api/mcp/actions";

interface CreateAgentPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAgentPopup({ isOpen, onClose }: CreateAgentPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const t = useTranslations();
  const { data: session } = authClient.useSession();

  const { data: mcpServers = [] } = useSWR(
    "mcp-servers",
    selectAllMcpServersAction,
  );

  const handleCreate = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      toast.error(t("Agent.userNotAuthenticated"));
      return;
    }

    try {
      setIsLoading(true);
      await insertAgentAction({
        name,
        instructions: instructions ? { systemPrompt: instructions } : undefined,
        mcpServers: selectedServers,
        userId,
      });
      toast.success(t("Agent.agentCreated"));
      mutate("agents");
      onClose();
      setName("");
      setInstructions("");
      setSelectedServers([]);
    } catch (_error) {
      toast.error(t("Agent.failedToCreateAgent"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Agent.createAgent")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("Agent.name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Agent.enterAgentName")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">{t("Agent.instructions")}</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t("Agent.enterInstructions")}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
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
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            {t("Common.cancel")}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !name ||
              selectedServers.length === 0 ||
              isLoading ||
              !session?.user?.id
            }
          >
            {t("Common.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
