import { Agent, AgentInsert, AgentWithServers } from "app-types/agent";
import { pgDb as db } from "../db.pg";
import { AgentMcpServerSchema, AgentSchema } from "../schema.pg";
import { eq } from "drizzle-orm";

export const pgAgentRepository = {
  save: async (agent: AgentInsert): Promise<AgentWithServers> => {
    const [result] = await db
      .insert(AgentSchema)
      .values({
        name: agent.name,
        userId: agent.userId,
        instructions: agent.instructions,
      })
      .returning();

    if (agent.mcpServers.length > 0) {
      await db.insert(AgentMcpServerSchema).values(
        agent.mcpServers.map((mcpServerId) => ({
          agentId: result.id,
          mcpServerId,
        })),
      );
    }

    return {
      ...result,
      mcpServers: agent.mcpServers,
    } as AgentWithServers;
  },

  selectById: async (id: string): Promise<AgentWithServers | null> => {
    const result = await db
      .select({
        agent: AgentSchema,
        mcpServerId: AgentMcpServerSchema.mcpServerId,
      })
      .from(AgentSchema)
      .leftJoin(
        AgentMcpServerSchema,
        eq(AgentSchema.id, AgentMcpServerSchema.agentId),
      )
      .where(eq(AgentSchema.id, id));

    if (result.length === 0) {
      return null;
    }

    const mcpServers = result
      .map((row) => row.mcpServerId)
      .filter((id): id is string => id !== null);

    return {
      ...result[0].agent,
      mcpServers,
    } as AgentWithServers;
  },

  selectByUserId: async (userId: string): Promise<AgentWithServers[]> => {
    const result = await db
      .select({
        agent: AgentSchema,
        mcpServerId: AgentMcpServerSchema.mcpServerId,
      })
      .from(AgentSchema)
      .leftJoin(
        AgentMcpServerSchema,
        eq(AgentSchema.id, AgentMcpServerSchema.agentId),
      )
      .where(eq(AgentSchema.userId, userId));

    const agentsMap = new Map<string, AgentWithServers>();

    result.forEach((row) => {
      if (!agentsMap.has(row.agent.id)) {
        agentsMap.set(row.agent.id, {
          ...row.agent,
          mcpServers: [],
        } as AgentWithServers);
      }

      if (row.mcpServerId) {
        agentsMap.get(row.agent.id)!.mcpServers.push(row.mcpServerId);
      }
    });

    return Array.from(agentsMap.values());
  },

  update: async (
    agent: Partial<Agent> & { id: string },
  ): Promise<AgentWithServers> => {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (agent.name !== undefined) {
      updateData.name = agent.name;
    }
    if (agent.instructions !== undefined) {
      updateData.instructions = agent.instructions;
    }

    const [result] = await db
      .update(AgentSchema)
      .set(updateData)
      .where(eq(AgentSchema.id, agent.id))
      .returning();

    const mcpServers = await db
      .select()
      .from(AgentMcpServerSchema)
      .where(eq(AgentMcpServerSchema.agentId, agent.id));

    return {
      ...result,
      mcpServers: mcpServers.map((server) => server.mcpServerId),
    } as AgentWithServers;
  },

  updateMcpServers: async (
    agentId: string,
    mcpServers: string[],
  ): Promise<void> => {
    await db
      .delete(AgentMcpServerSchema)
      .where(eq(AgentMcpServerSchema.agentId, agentId));

    if (mcpServers.length > 0) {
      await db.insert(AgentMcpServerSchema).values(
        mcpServers.map((mcpServerId) => ({
          agentId,
          mcpServerId,
        })),
      );
    }
  },

  deleteById: async (id: string): Promise<void> => {
    await db
      .delete(AgentMcpServerSchema)
      .where(eq(AgentMcpServerSchema.agentId, id));
    await db.delete(AgentSchema).where(eq(AgentSchema.id, id));
  },
};
