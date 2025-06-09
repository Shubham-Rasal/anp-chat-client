const AGENT_MENTION_REGEX = /@([a-zA-Z0-9_-]+)/g;

export function processMessageText(
  text: string,
  availableAgents: { id: string; name: string }[],
): {
  processedText: string;
  agentMentions: { type: "agent"; name: string; agentId: string }[];
} {
  const mentions: { type: "agent"; name: string; agentId: string }[] = [];
  const matches = text.matchAll(AGENT_MENTION_REGEX);

  for (const match of matches) {
    const mentionedName = match[1];
    const agent = availableAgents.find(
      (a) => a.name.toLowerCase() === mentionedName.toLowerCase(),
    );

    if (agent) {
      mentions.push({
        type: "agent",
        name: agent.name,
        agentId: agent.id,
      });
    }
  }

  return {
    processedText: text,
    agentMentions: mentions,
  };
}

export function createMessageAnnotations(
  text: string,
  availableAgents: { id: string; name: string }[],
) {
  const { agentMentions } = processMessageText(text, availableAgents);

  if (agentMentions.length === 0) return [];

  return [
    {
      type: "agent_mentions",
      mentions: agentMentions,
    },
  ];
}
