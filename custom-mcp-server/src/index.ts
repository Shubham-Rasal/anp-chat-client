import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { graphDB } from "./db/orbitdb.js";

const server = new McpServer({
  name: "custom-mcp-server",
  version: "0.0.1",
});

server.tool(
  "get_entity",
  "Get an entity from the knowledge graph. Sample entity: {name: 'John Doe', entityType: 'person', observations: ['John Doe is a person']}",
  {
    entity: z.object({
      id: z.string().min(1, "Entity id cannot be empty"),
    }),
  },
  async ({ entity }) => {
    const result = await graphDB.getEntityById(entity.id);
    return {
      content: [
        {
          type: "text",
          text: `Entity: ${JSON.stringify(result)}`,
        },
      ],
    };
  },
);

server.tool(
  "create_entity",
  "Create one or more entities in the knowledge graph. Sample entity: {name: 'John Doe', entityType: 'person', observations: ['John Doe is a person']}",
  {
    entity: z.object({
      name: z.string().min(1, "Entity name cannot be empty"),
      entityType: z.string().min(1, "Entity type cannot be empty"),
      observations: z.array(z.string()).optional().default([]),
    }),
  },
  async ({ entity }) => {
    const result = await graphDB.addEntity(entity);

    return {
      content: [
        {
          type: "text",
          text: `Created ${result} entities with IDs: ${result}`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();

await server.connect(transport);
