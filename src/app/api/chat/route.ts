import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
  type UIMessage,
  formatDataStreamPart,
  appendClientMessage,
  Message,
  Tool,
} from "ai";

import { customModelProvider, isToolCallUnsupportedModel } from "lib/ai/models";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import { chatRepository } from "lib/db/repository";
import logger from "logger";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildProjectInstructionsSystemPrompt,
  buildUserSystemPrompt,
  buildAgentSystemPrompt,
} from "lib/ai/prompts";
import {
  chatApiSchemaRequestBodySchema,
  ChatMention,
  ChatMessageAnnotation,
  AgentMention,
} from "app-types/chat";
import { AgentWithServers } from "app-types/agent";

import { errorIf, safe } from "ts-safe";

import {
  appendAnnotations,
  excludeToolExecution,
  filterToolsByMentions,
  handleError,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
  convertToMessage,
  extractInProgressToolPart,
  assignToolResult,
  isUserMessage,
  getAllowedDefaultToolkit,
  filterToolsByAllowedMCPServers,
  filterMcpServerCustomizations,
  getAgentFromMentions,
  filterToolsByAgent,
} from "./helper";
import {
  generateTitleFromUserMessageAction,
  rememberMcpServerCustomizationsAction,
  selectProjectByIdAction,
} from "./actions";
import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";
import { VercelAIMcpTool } from "app-types/mcp";

type ChatAnnotation =
  | ChatMessageAnnotation
  | {
      type: "usage";
      usageTokens: number;
      toolChoice?: string;
    };

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const {
      id,
      projectId,
      message,
      model: modelName,
      toolChoice,
      allowedMcpServers,
      allowedAppDefaultToolkit,
    } = chatApiSchemaRequestBodySchema.parse(body);

    // Get the mentioned agent if any
    const agent = (await getAgentFromMentions(
      message.annotations as ChatMessageAnnotation[],
    )) as AgentWithServers | null;

    // Get user preferences
    const userPreferences =
      (await userRepository.getPreferences(session.user.id)) || undefined;

    // Build system prompts
    const userSystemPrompt = buildUserSystemPrompt(
      session?.user,
      userPreferences,
    );
    const projectSystemPrompt = projectId
      ? buildProjectInstructionsSystemPrompt(
          (await selectProjectByIdAction(projectId))?.instructions,
        )
      : undefined;
    const agentSystemPrompt = agent ? buildAgentSystemPrompt(agent) : undefined;

    // Merge system prompts with agent prompt taking precedence
    const systemPrompt = mergeSystemPrompt(
      agentSystemPrompt,
      projectSystemPrompt,
      userSystemPrompt,
    );

    // Get available tools
    let availableTools = mcpClientsManager.tools();

    // Filter tools based on agent if one is mentioned
    if (agent) {
      const filteredTools = Object.entries(availableTools).filter(([_, tool]) =>
        agent.mcpServers?.includes(tool._mcpServerId),
      );
      availableTools = Object.fromEntries(filteredTools);
    } else {
      // Apply normal tool filtering if no agent is mentioned
      if (allowedMcpServers) {
        availableTools = filterToolsByAllowedMCPServers(
          availableTools,
          allowedMcpServers,
        );
      }
      if (allowedAppDefaultToolkit) {
        const defaultTools = getAllowedDefaultToolkit(allowedAppDefaultToolkit);
        availableTools = { ...availableTools, ...defaultTools } as Record<
          string,
          VercelAIMcpTool
        >;
      }
    }

    let thread = await chatRepository.selectThreadDetails(id);

    if (!thread) {
      const title = await generateTitleFromUserMessageAction({
        message,
        model: customModelProvider.getModel(modelName),
      });
      const newThread = await chatRepository.insertThread({
        id,
        projectId: projectId ?? null,
        title,
        userId: session.user.id,
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);
    }

    if (thread!.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // if is false, it means the last message is manual tool execution
    const isLastMessageUserMessage = isUserMessage(message);

    const previousMessages = (thread?.messages ?? []).map(convertToMessage);

    if (!thread) {
      return new Response("Thread not found", { status: 404 });
    }

    const annotations = (message?.annotations as ChatMessageAnnotation[]) ?? [];

    const mcpTools = mcpClientsManager.tools();

    const mentions = annotations
      .flatMap((annotation) => annotation.mentions ?? [])
      .filter((mention): mention is AgentMention => mention?.type === "agent");

    const isToolCallAllowed =
      (!isToolCallUnsupportedModel(customModelProvider.getModel(modelName)) &&
        toolChoice != "none") ||
      mentions.length > 0;

    const tools = safe(mcpTools)
      .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
      .map((tools) => {
        // filter tools by agent if one is mentioned
        if (mentions.length && agent) {
          return filterToolsByAgent(tools, agent);
        }
        // filter tools by allowed mcp servers
        return filterToolsByAllowedMCPServers(tools, allowedMcpServers);
      })
      .orElse(undefined);

    const messages: Message[] = isLastMessageUserMessage
      ? appendClientMessage({
          messages: previousMessages,
          message,
        })
      : previousMessages;

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const inProgressToolStep = extractInProgressToolPart(
          messages.slice(-2),
        );

        if (inProgressToolStep) {
          const toolResult = await manualToolExecuteByLastMessage(
            inProgressToolStep,
            message,
            mcpTools,
          );
          assignToolResult(inProgressToolStep, toolResult);
          dataStream.write(
            formatDataStreamPart("tool_result", {
              toolCallId: inProgressToolStep.toolInvocation.toolCallId,
              result: toolResult,
            }),
          );
        }

        const _userPreferences = thread?.userPreferences || undefined;

        const mcpServerCustomizations = await safe()
          .map(() => {
            if (Object.keys(tools ?? {}).length === 0)
              throw new Error("No tools found");
            return rememberMcpServerCustomizationsAction(session.user.id);
          })
          .map((v) => filterMcpServerCustomizations(tools!, v))
          .orElse({});

        const mcpCustomizationsPrompt =
          buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations);

        // Merge all system prompts
        const finalSystemPrompt = mcpCustomizationsPrompt
          ? `${systemPrompt}\n\n${mcpCustomizationsPrompt}`
          : systemPrompt;

        // Precompute toolChoice to avoid repeated tool calls
        const computedToolChoice =
          isToolCallAllowed && mentions.length > 0 && inProgressToolStep
            ? "required"
            : "auto";

        const vercelAITooles = safe(tools)
          .map((t) => {
            if (!t) return undefined;
            const bindingTools = {
              ...getAllowedDefaultToolkit(allowedAppDefaultToolkit),
              ...t,
            };
            if (toolChoice === "manual") {
              return excludeToolExecution(bindingTools);
            }
            return bindingTools;
          })
          .unwrap();

        const result = streamText({
          model: customModelProvider.getModel(modelName),
          system: finalSystemPrompt,
          messages,
          maxSteps: 10,
          experimental_continueSteps: true,
          experimental_transform: smoothStream({ chunking: "word" }),
          maxRetries: 0,
          tools: vercelAITooles,
          toolChoice: computedToolChoice,
          onFinish: async ({ response, usage }) => {
            const appendMessages = appendResponseMessages({
              messages: messages.slice(-1),
              responseMessages: response.messages,
            });
            if (isLastMessageUserMessage) {
              await chatRepository.insertMessage({
                threadId: thread!.id,
                model: modelName,
                role: "user",
                parts: message.parts,
                attachments: message.experimental_attachments,
                id: message.id,
                annotations: appendAnnotations(
                  message.annotations as ChatMessageAnnotation[],
                  {
                    type: "usage",
                    usageTokens: usage.promptTokens,
                  } as ChatAnnotation,
                ),
              });
            }
            const assistantMessage = appendMessages.at(-1);
            if (assistantMessage) {
              const annotations = appendAnnotations(
                assistantMessage.annotations as ChatMessageAnnotation[],
                {
                  type: "usage",
                  usageTokens: usage.completionTokens,
                  toolChoice,
                } as ChatAnnotation,
              );
              dataStream.writeMessageAnnotation(annotations.at(-1)!);
              await chatRepository.upsertMessage({
                model: modelName,
                threadId: thread!.id,
                role: assistantMessage.role,
                id: assistantMessage.id,
                parts: assistantMessage.parts as UIMessage["parts"],
                attachments: assistantMessage.experimental_attachments,
                annotations,
              });
            }
          },
        });
        result.consumeStream();
        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: handleError,
    });
  } catch (error: any) {
    logger.error(error);
    return new Response(error.message, { status: 500 });
  }
}
