# MCP Client Chatbot

[![MCP Supported](https://img.shields.io/badge/MCP-Supported-00c853)](https://modelcontextprotocol.io/introduction)
[![Discord](https://img.shields.io/discord/1374047276074537103?label=Discord&logo=discord&color=5865F2)](https://discord.gg/gCRu69Upnp)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/mcp-client-chatbot&env=BETTER_AUTH_SECRET&env=OPENAI_API_KEY&env=GOOGLE_GENERATIVE_AI_API_KEY&env=ANTHROPIC_API_KEY&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https://github.com/cgoinglove/mcp-client-chatbot/blob/main/.env.example&demo-title=MCP+Client+Chatbot&demo-description=An+Open-Source+MCP+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"}])

This is a fork of a great MCP client - https://github.com/cgoinglove/mcp-client-chatbot

This fork adds a custom MCP server that uses OrbitDB to store data. Also, this will be used with another project (ANP) for MCP support to agents.

## Table of Contents

- [MCP Client Chatbot](#mcp-client-chatbot)
  - [Table of Contents](#table-of-contents)
  - [Preview](#preview)
    - [🧩 Browser Automation with Playwright MCP](#-browser-automation-with-playwright-mcp)
    - [🎙️ Realtime Voice Assistant + MCP Tools](#️-realtime-voice-assistant--mcp-tools)
    - [⚡️ Quick Tool Mentions (`@`) \& Presets](#️-quick-tool-mentions---presets)
    - [🧭 Tool Choice Mode](#-tool-choice-mode)
  - [Getting Started](#getting-started)
    - [Quick Start (Docker Compose Version) 🐳](#quick-start-docker-compose-version-)
    - [Quick Start (Local Version) 🚀](#quick-start-local-version-)
    - [Environment Variables](#environment-variables)
  - [📘 Guides](#-guides)
    - [🔌 MCP Server Setup \& Tool Testing](#-mcp-server-setup--tool-testing)
    - [🐳 Docker Hosting Guide](#-docker-hosting-guide)
    - [▲ Vercel Hosting Guide](#-vercel-hosting-guide)
    - [🎯 System Prompts \& Chat Customization](#-system-prompts--chat-customization)
    - [🔐 OAuth Sign-In Setup](#-oauth-sign-in-setup)
  - [💡 Tips](#-tips)
    - [🧠 Agentic Chatbot with Project Instructions](#-agentic-chatbot-with-project-instructions)
    - [💬 Temporary Chat Windows](#-temporary-chat-windows)
  - [🗺️ Roadmap](#️-roadmap)
  - [🙌 Contributing](#-contributing)
  - [💬 Join Our Discord](#-join-our-discord)
  - [🛠️ MCP Tools](#️-mcp-tools)

---

## Preview

Get a feel for the UX — here's a quick look at what's possible.

### 🧩 Browser Automation with Playwright MCP

![playwright-preview](https://github.com/user-attachments/assets/53ec0069-aab4-47ff-b7c4-a8080a6a98ff)

**Example:** Control a web browser using Microsoft's [playwright-mcp](https://github.com/microsoft/playwright-mcp) tool.

- The LLM autonomously decides how to use tools from the MCP server, calling them multiple times to complete a multi-step task and return a final message.

Sample prompt:

```prompt
Please go to GitHub and visit the cgoinglove/mcp-client-chatbot project.
Then, click on the README.md file.
After that, close the browser.
Finally, tell me how to install the package.
```

<br/>

### 🎙️ Realtime Voice Assistant + MCP Tools

<p align="center">
  <video src="https://github.com/user-attachments/assets/e2657b8c-ce0b-40dd-80b6-755324024973" width="100%" />
</p>

This demo showcases a **realtime voice-based chatbot assistant** built with OpenAI's new Realtime API — now extended with full **MCP tool integration**.
Talk to the assistant naturally, and watch it execute tools in real time.

### ⚡️ Quick Tool Mentions (`@`) & Presets

![tool-mention](https://github.com/user-attachments/assets/bd47b175-320f-4c38-bc2f-be887c46178e)

Quickly call any registered MCP tool during chat by typing `@toolname`.
No need to memorize — just type `@` and select from the list!

You can also create **tool presets** by selecting only the MCP servers or tools you want.
Switch between presets instantly with a click — perfect for organizing tools by task or workflow.

### 🧭 Tool Choice Mode

<img width="1161" alt="tool-mode" src="https://github.com/user-attachments/assets/0988f8dd-8a37-4adf-84da-79c083917af9" />

Control how tools are used in each chat with **Tool Choice Mode** — switch anytime with `⌘P`.

- **Auto:** The model automatically calls tools when needed.
- **Manual:** The model will ask for your permission before calling a tool.
- **None:** Tool usage is disabled completely.

This lets you flexibly choose between autonomous, guided, or tool-free interaction depending on the situation.

<br/>

…and there's even more waiting for you.
Try it out and see what else it can do!

<br/>

## Getting Started

> This project uses [pnpm](https://pnpm.io/) as the recommended package manager.

```bash
# If you don't have pnpm:
npm install -g pnpm
```

### Quick Start (Docker Compose Version) 🐳

```bash
# 1. Install dependencies
pnpm i

# 2. Enter only the LLM PROVIDER API key(s) you want to use in the .env file at the project root.
# Example: The app works with just OPENAI_API_KEY filled in.
# (The .env file is automatically created when you run pnpm i.)

# 3. Build and start all services (including PostgreSQL) with Docker Compose
pnpm docker-compose:up

```

### Quick Start (Local Version) 🚀

```bash
# 1. Install dependencies
pnpm i

# 2. Create the environment variable file and fill in your .env values
pnpm initial:env # This runs automatically in postinstall, so you can usually skip it.

# 3. (Optional) If you already have PostgreSQL running and .env is configured, skip this step
pnpm docker:pg

# 4. Run database migrations
pnpm db:migrate

# 5. Start the development server
pnpm dev

# 6. (Optional) Build & start for local production-like testing
pnpm build:local && pnpm start
# Use build:local for local start to ensure correct cookie settings
```

Open [http://localhost:3000](http://localhost:3000) in your browser to get started.

<br/>

### Environment Variables

The `pnpm i` command generates a `.env` file. Add your API keys there.

```dotenv
# === LLM Provider API Keys ===
# You only need to enter the keys for the providers you plan to use
GOOGLE_GENERATIVE_AI_API_KEY=****
OPENAI_API_KEY=****
XAI_API_KEY=****
ANTHROPIC_API_KEY=****
OPENROUTER_API_KEY=****
OLLAMA_BASE_URL=http://localhost:11434/api


# Secret for Better Auth (generate with: npx @better-auth/cli@latest secret)
BETTER_AUTH_SECRET=****

# (Optional)
# URL for Better Auth (the URL you access the app from)
BETTER_AUTH_URL=

# === Database ===
# If you don't have PostgreSQL running locally, start it with: pnpm docker:pg
POSTGRES_URL=postgres://your_username:your_password@localhost:5432/your_database_name

# Whether to use file-based MCP config (default: false)
FILE_BASED_MCP_CONFIG=false

# (Optional)
# === OAuth Settings ===
# Fill in these values only if you want to enable Google/GitHub login
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## 🛠️ MCP Tools

Below is a list of available MCP tools, their descriptions, and usage examples.

### Entity Management

- **create_entities**

  - **Description:** Create one or more entities in the knowledge graph.
  - **Example:**
    ```json
    {
      "entities": [
        {
          "name": "Alan Turing",
          "entityType": "Person",
          "observations": ["Mathematician"]
        }
      ]
    }
    ```

- **get_entity**

  - **Description:** Get an entity from the knowledge graph by ID.
  - **Example:**
    ```json
    { "entity": { "id": "123" } }
    ```

- **delete_entity**

  - **Description:** Delete an entity from the knowledge graph by ID.
  - **Example:**
    ```json
    { "entityId": "123" }
    ```

- **add_observation**

  - **Description:** Add an observation to an entity.
  - **Example:**
    ```json
    { "entityId": "123", "observation": "New observation" }
    ```

- **delete_observation**
  - **Description:** Delete an observation from an entity.
  - **Example:**
    ```json
    { "entityId": "123", "observation": "Old observation" }
    ```

### Relation Management

- **create_relation**

  - **Description:** Create a relation between two entities.
  - **Example:**
    ```json
    { "relation": { "from": "123", "to": "456", "relationType": "colleague" } }
    ```

- **delete_relation**
  - **Description:** Delete a relation by its ID.
  - **Example:**
    ```json
    { "relationId": "789" }
    ```

### Graph Operations

- **search_nodes**

  - **Description:** Search for entities in the knowledge graph by name or type.
  - **Example:**
    ```json
    { "query": "Turing" }
    ```

- **read_graph**
  - **Description:** Traverse the graph starting from a given entity.
  - **Example:**
    ```json
    { "startEntityId": "123", "maxDepth": 2 }
    ```

### External Knowledge Graph Integration

- **search_external_kg**

  - **Description:** Search for entities in external knowledge graphs (Wikidata, DBpedia, OpenAlex).
  - **Example:**
    ```json
    {
      "source": "wikidata",
      "query": "Alan Turing",
      "options": { "limit": 5, "language": "en" }
    }
    ```
    ```json
    {
      "source": "dbpedia",
      "query": "Alan Turing",
      "options": { "limit": 5, "language": "en" }
    }
    ```
    ```json
    {
      "source": "openalex",
      "query": "Alan Turing",
      "options": { "limit": 5 }
    }
    ```

- **import_external_entity**
  - **Description:** Import an entity and its relations from an external knowledge graph.
  - **Example:**
    ```json
    {
      "source": "wikidata",
      "entityId": "Q7259",
      "options": {
        "importRelations": true,
        "maxRelations": 5,
        "language": "en"
      }
    }
    ```
    ```json
    {
      "source": "dbpedia",
      "entityId": "Alan_Turing",
      "options": {
        "importRelations": true,
        "maxRelations": 5,
        "language": "en"
      }
    }
    ```
    ```json
    {
      "source": "openalex",
      "entityId": "A2941294272",
      "options": { "importRelations": true, "maxRelations": 5 }
    }
    ```
