import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config/index.js";
import {
  createEntities,
  deleteEntities,
  getEntities,
  addObservations,
} from "./tools/entities.js";
import { createRelations, deleteRelations } from "./tools/relations.js";
import { readGraph } from "./tools/graph.js";

// Initialize MCP Server
const server = new McpServer({
  name: "custom-mcp-server",
  version: config.version,
});

// Register tools
server.tool(
  createEntities.name,
  createEntities.description,
  createEntities.parameters,
  createEntities.handler,
);

server.tool(
  deleteEntities.name,
  deleteEntities.description,
  deleteEntities.parameters,
  deleteEntities.handler,
);

server.tool(
  getEntities.name,
  getEntities.description,
  getEntities.parameters,
  getEntities.handler,
);

server.tool(
  addObservations.name,
  addObservations.description,
  addObservations.parameters,
  addObservations.handler,
);

server.tool(
  createRelations.name,
  createRelations.description,
  createRelations.parameters,
  createRelations.handler,
);

server.tool(
  deleteRelations.name,
  deleteRelations.description,
  deleteRelations.parameters,
  deleteRelations.handler,
);

server.tool(
  readGraph.name,
  readGraph.description,
  readGraph.parameters,
  readGraph.handler,
);

// Initialize transport
const transport = new StdioServerTransport();

// Start server
// logger.info(`MCP server initialized with version ${config.version}`);
await server.connect(transport);
