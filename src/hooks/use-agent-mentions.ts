import { useState, useCallback, useEffect } from "react";
import { Agent } from "@/types/agent";

interface UseAgentMentionsProps {
  value: string;
  onChange: (value: string) => void;
}

export function useAgentMentions({ value, onChange }: UseAgentMentionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  useEffect(() => {
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex === -1) {
      setIsOpen(false);
      setSearchTerm("");
      setMentionStartIndex(-1);
      return;
    }

    // Check if @ is at the start or has a space before it
    const isValidMentionStart =
      lastAtIndex === 0 || value[lastAtIndex - 1] === " ";
    if (!isValidMentionStart) {
      setIsOpen(false);
      return;
    }

    const textAfterAt = value.slice(lastAtIndex + 1);
    const hasSpace = textAfterAt.includes(" ");

    if (hasSpace) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setSearchTerm(textAfterAt);
    setMentionStartIndex(lastAtIndex);
  }, [value]);

  const insertMention = useCallback(
    (agent: Agent) => {
      if (mentionStartIndex === -1) return;

      const before = value.slice(0, mentionStartIndex);
      const after = value.slice(mentionStartIndex + searchTerm.length + 1);
      const newValue = `${before}@${agent.name}${after}`;

      onChange(newValue);
      setIsOpen(false);
    },
    [value, mentionStartIndex, searchTerm, onChange],
  );

  return {
    isOpen,
    searchTerm,
    insertMention,
  };
}
