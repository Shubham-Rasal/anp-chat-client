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
  `Get an entity from the knowledge graph. Sample entity: {
"id" : "123"
  }`,
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
  `Create one or more entities in the knowledge graph. Sample entity: {
"name" : "Json",
"entityType" : "Person",
"observations": ["he is a guy"]
  }`,
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

server.tool(
  "create_relation",
  `Create a relation between two entities in the knowledge graph. Sample relation: {
"from" : "123",
"to" : "456",
"relationType" : "knows"
  }`,
  {
    relation: z.object({
      from: z.string().min(1, "Source entity ID cannot be empty"),
      to: z.string().min(1, "Target entity ID cannot be empty"),
      relationType: z.string().min(1, "Relation type cannot be empty"),
    }),
  },
  async ({ relation }) => {
    const result = await graphDB.addRelation(relation);

    return {
      content: [
        {
          type: "text",
          text: `Created relation with ID: ${result}`,
        },
      ],
    };
  },
);

server.tool(
  "delete_relation",
  `Delete a relation from the knowledge graph by its ID. Sample relation: {
"id" : "123"
  }`,
  {
    relationId: z.string().min(1, "Relation ID cannot be empty"),
  },
  async ({ relationId }) => {
    const success = await graphDB.deleteRelation(relationId);

    return {
      content: [
        {
          type: "text",
          text: success
            ? `Successfully deleted relation ${relationId}`
            : `No relation found with ID ${relationId}`,
        },
      ],
    };
  },
);

server.tool(
  "search_nodes",
  `Search for entities in the knowledge graph by name or type. Sample query: {
"query" : "Json"
  }`,
  {
    query: z.string().min(1, "Search query cannot be empty"),
  },
  async ({ query }) => {
    const results = await graphDB.searchEntities(query);

    return {
      content: [
        {
          type: "text",
          text: `Found ${results.length} matching entities:\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  },
);

server.tool(
  "read_graph",
  `Traverse the graph starting from a given entity. Sample start entity: {
"startEntityId" : "123",
"maxDepth" : 2
  }`,
  {
    startEntityId: z.string().min(1, "Start entity ID cannot be empty"),
    maxDepth: z.number().min(1).max(5).optional().default(2),
  },
  async ({ startEntityId, maxDepth }) => {
    const graph = await graphDB.traverseGraph(startEntityId, maxDepth);
    const result = Object.fromEntries(graph);

    return {
      content: [
        {
          type: "text",
          text: `Graph traversal result:\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();

await server.connect(transport);
