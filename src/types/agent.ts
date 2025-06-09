import { z } from "zod";

export const AgentInstructionsZodSchema = z.object({
  systemPrompt: z.string().max(3000).optional(),
});

export type AgentInstructions = z.infer<typeof AgentInstructionsZodSchema>;

export interface Agent {
  id: string;
  name: string;
  userId: string;
  instructions?: {
    systemPrompt: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentWithServers extends Agent {
  mcpServers: string[];
}

export type AgentInsert = Omit<Agent, "id" | "createdAt" | "updatedAt"> & {
  mcpServers: string[];
};

export type AgentMcpServer = {
  agentId: string;
  mcpServerId: string;
  createdAt: Date;
};
