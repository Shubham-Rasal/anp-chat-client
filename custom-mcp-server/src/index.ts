import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { addToOrbitDB, getFromOrbitDB } from "./db/orbitdb.js";

const server = new McpServer({
  name: "custom-mcp-server",
  version: "0.0.1",
});

server.tool(
  "get_weather",
  "Get the current weather at a location.",
  {
    latitude: z.number(),
    longitude: z.number(),
  },
  async ({ latitude, longitude }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
    );
    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: `The current temperature in ${latitude}, ${longitude} is ${data.current.temperature_2m}°C.`,
        },
        {
          type: "text",
          text: `The sunrise in ${latitude}, ${longitude} is ${data.daily.sunrise[0]} and the sunset is ${data.daily.sunset[0]}.`,
        },
      ],
    };
  },
);

server.tool(
  "add_to_orbitdb",
  "Add data to OrbitDB.",
  {
    data: z.string(),
  },
  async ({ data }) => {
    await addToOrbitDB(data);
    return {
      content: [
        {
          type: "text",
          text: `Data added to OrbitDB: ${data}`,
        },
      ],
    };
  },
);

server.tool("get_from_orbitdb", "Get data from OrbitDB.", {}, async () => {
  const response = await getFromOrbitDB();
  return {
    content: [
      {
        type: "text",
        text: `Data retrieved from OrbitDB: ${response}`,
      },
    ],
  };
});

const transport = new StdioServerTransport();

await server.connect(transport);
