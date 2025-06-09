import { ChatMessage, AgentMention } from "@/types/chat";
import { Agent } from "@/types/agent";

export function extractAgentMentions(message: ChatMessage): AgentMention[] {
  if (!message.annotations?.length) return [];

  return message.annotations
    .flatMap((annotation) => {
      return annotation.mentions?.filter((m) => m.type === "agent") ?? [];
    })
    .filter(Boolean);
}

export function shouldAgentRespond(
  message: ChatMessage,
  agent: Agent,
): boolean {
  const mentions = extractAgentMentions(message);

  // If there are no agent mentions, all agents can respond
  if (!mentions.length) return true;

  // If there are agent mentions, only mentioned agents should respond
  return mentions.some((mention) => mention.agentId === agent.id);
}

export function getTargetAgents(
  message: ChatMessage,
  availableAgents: Agent[],
): Agent[] {
  const mentions = extractAgentMentions(message);

  // If there are no agent mentions, return all agents
  if (!mentions.length) return availableAgents;

  // Return only mentioned agents that are available
  return availableAgents.filter((agent) =>
    mentions.some((mention) => mention.agentId === agent.id),
  );
}
