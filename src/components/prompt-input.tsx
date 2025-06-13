"use client";

import {
  AudioWaveformIcon,
  ChevronDown,
  CornerRightUp,
  Paperclip,
  Pause,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "ui/button";
// import { notImplementedToast } from "ui/shared-toast";
import { MessagePastesContentCard } from "./message-pasts-content";
import { UseChatHelpers } from "@ai-sdk/react";
import { SelectModel } from "./select-model";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { customModelProvider } from "lib/ai/models";
import {
  ChatMention,
  ChatMessageAnnotation,
  AgentMention,
} from "app-types/chat";
import dynamic from "next/dynamic";
import { ToolModeDropdown } from "./tool-mode-dropdown";
import { PROMPT_PASTE_MAX_LENGTH } from "lib/const";
import { ToolSelectDropdown } from "./tool-select-dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { useTranslations } from "next-intl";
import { useAgents } from "@/hooks/use-agents";

interface PromptInputProps {
  placeholder?: string;
  setInput: (value: string) => void;
  input: string;
  onStop: () => void;
  append: UseChatHelpers["append"];
  toolDisabled?: boolean;
  isLoading?: boolean;
  model?: string;
  setModel?: (model: string) => void;
  voiceDisabled?: boolean;
}

const MentionInput = dynamic(() => import("./mention-input"), {
  ssr: false,
  loading() {
    return <div className="h-[2rem] w-full animate-pulse"></div>;
  },
});

export default function PromptInput({
  placeholder,
  append,
  model,
  setModel,
  input,
  setInput,
  // onStop,
  isLoading,
  toolDisabled,
  voiceDisabled,
}: PromptInputProps) {
  const t = useTranslations("Chat");
  const { agents } = useAgents();

  const [mcpList, globalModel, appStoreMutate] = appStore(
    useShallow((state) => [state.mcpList, state.model, state.mutate]),
  );

  const chatModel = useMemo(() => {
    return model ?? globalModel;
  }, [model, globalModel]);

  const setChatModel = useCallback(
    (model: string) => {
      if (setModel) {
        setModel(model);
      } else {
        appStoreMutate({ model });
      }
    },
    [setModel, appStoreMutate],
  );

  const [toolMentionItems, setToolMentionItems] = useState<
    (ChatMention | AgentMention)[]
  >([]);

  const modelList = useMemo(() => {
    return customModelProvider.modelsInfo;
  }, []);

  const [pastedContents, setPastedContents] = useState<string[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const mentionItems = useMemo(() => {
    const toolMentions =
      (mcpList?.flatMap((mcp) => [
        {
          type: "mcpServer" as const,
          name: mcp.name,
          serverId: mcp.id,
        },
        ...mcp.toolInfo.map((tool) => {
          return {
            type: "tool" as const,
            name: tool.name,
            serverId: mcp.id,
            serverName: mcp.name,
          };
        }),
      ]) as ChatMention[]) ?? [];

    return toolMentions;
  }, [mcpList]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (text.length > PROMPT_PASTE_MAX_LENGTH) {
      setPastedContents([...pastedContents, text]);
      e.preventDefault();
    }
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === "application/pdf") {
        setSelectedFile(file);
      } else if (file) {
        alert("Please select a PDF file");
        e.target.value = "";
      }
    },
    [],
  );

  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmitWithFile = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) {
        e.preventDefault();
      }

      const userMessage = input?.trim() || "";
      const pastedContentsParsed = pastedContents.map((content) => ({
        type: "text" as const,
        text: content,
      }));

      if (
        userMessage.length === 0 &&
        pastedContentsParsed.length === 0 &&
        !selectedFile
      ) {
        return;
      }

      const annotations: ChatMessageAnnotation[] = [];
      if (toolMentionItems.length > 0) {
        const agentMentions = toolMentionItems.filter(
          (m): m is AgentMention => "agentId" in m && m.type === "agent",
        );
        if (agentMentions.length > 0) {
          annotations.push({
            type: "mentions",
            mentions: agentMentions,
          });
        }
      }

      const parts = [
        ...pastedContentsParsed,
        {
          type: "text" as const,
          text: userMessage,
        },
      ];

      if (selectedFile) {
        // Convert file to base64
        const fileArrayBuffer = await selectedFile.arrayBuffer();
        const fileBase64 = Buffer.from(fileArrayBuffer).toString("base64");

        parts.push({
          type: "text" as const,
          text: `[PDF File: ${selectedFile.name}]`,
        });

        // Add file data as a separate property
        await append({
          role: "user",
          content: userMessage,
          annotations,
          parts,
          data: {
            file: {
              name: selectedFile.name,
              type: "application/pdf",
              content: fileBase64,
            },
          },
        });
      } else {
        await append({
          role: "user",
          content: userMessage,
          annotations,
          parts,
        });
      }

      setPastedContents([]);
      setToolMentionItems([]);
      setInput("");
      removeSelectedFile();
    },
    [append, input, selectedFile, pastedContents, toolMentionItems, setInput],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmitWithFile();
      }
    },
    [handleSubmitWithFile],
  );

  const submit = useCallback(() => {
    handleSubmitWithFile();
  }, [handleSubmitWithFile]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmitWithFile}
      onKeyPress={handleKeyPress}
      className="relative flex flex-col items-center space-y-4"
    >
      <div className="max-w-3xl mx-auto fade-in animate-in">
        <div className="z-10 mx-auto w-full max-w-3xl relative">
          <fieldset className="flex w-full min-w-0 max-w-full flex-col px-2">
            <div className="rounded-4xl backdrop-blur-sm transition-all duration-200 bg-muted/80 relative flex w-full flex-col cursor-text z-10 border items-stretch focus-within:border-muted-foreground hover:border-muted-foreground p-3">
              <div className="flex flex-col gap-3.5 px-1">
                <div className="relative min-h-[2rem]">
                  <MentionInput
                    input={input}
                    onChange={setInput}
                    onChangeMention={setToolMentionItems}
                    onEnter={submit}
                    placeholder={placeholder ?? t("placeholder")}
                    onPaste={handlePaste}
                    items={mentionItems}
                    agents={agents}
                  />
                </div>
                <div className="flex w-full items-center gap-2">
                  {pastedContents.map((content, index) => (
                    <MessagePastesContentCard
                      key={index}
                      initialContent={content}
                      deleteContent={() => {
                        setPastedContents((prev) => {
                          const newContents = [...prev];
                          newContents.splice(index, 1);
                          return newContents;
                        });
                      }}
                      updateContent={(content) => {
                        setPastedContents((prev) => {
                          const newContents = [...prev];
                          newContents[index] = content;
                          return newContents;
                        });
                      }}
                    />
                  ))}
                  {selectedFile && (
                    <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex w-full items-center z-30 gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    className="cursor-pointer text-muted-foreground border rounded-full p-2 bg-transparent hover:bg-muted transition-all duration-200"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" />
                  </div>

                  {!toolDisabled && (
                    <>
                      <ToolModeDropdown />
                      <ToolSelectDropdown align="start" side="top" />
                    </>
                  )}
                  <div className="flex-1" />

                  <SelectModel
                    onSelect={setChatModel}
                    providers={modelList}
                    model={chatModel}
                  >
                    <Button
                      variant={"ghost"}
                      className="rounded-full data-[state=open]:bg-input! hover:bg-input!"
                    >
                      {chatModel}
                      <ChevronDown className="size-3" />
                    </Button>
                  </SelectModel>
                  {!isLoading && !input.length && !voiceDisabled ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => {
                            appStoreMutate((state) => ({
                              voiceChat: {
                                ...state.voiceChat,
                                isOpen: true,
                                autoSaveConversation: true,
                              },
                            }));
                          }}
                          className="border fade-in animate-in cursor-pointer text-background rounded-full p-2 bg-primary hover:bg-primary/90 transition-all duration-200"
                        >
                          <AudioWaveformIcon size={16} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{t("VoiceChat.title")}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      type="submit"
                      variant="default"
                      size="icon"
                      className="rounded-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Pause className="size-4" />
                      ) : (
                        <CornerRightUp className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </form>
  );
}
