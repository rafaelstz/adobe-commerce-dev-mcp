#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { adobeCommerceTools } from "./tools/index.js";
import { adobeCommercePrompts } from "./prompts/index.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8")
);
const VERSION = packageJson.version;

async function main() {
  // Create server instance
  const server = new McpServer(
    {
      name: "adobe-commerce-dev-mcp",
      version: VERSION,
    },
    {
      capabilities: {
        logging: {},
      },
    }
  );

  // Resolve Adobe Commerce version from env var or CLI argument
  // Supports both:
  //   env:  ADOBE_COMMERCE_VERSION=2.4.7 (MCP config "env" block)
  //   args: ADOBE_COMMERCE_VERSION=2.4.7 (MCP Inspector "Arguments" field)
  const argVersion = process.argv
    .find((arg) => arg.startsWith("ADOBE_COMMERCE_VERSION="))
    ?.split("=")[1];
  const version = process.env.ADOBE_COMMERCE_VERSION || argVersion || "2.4.8";
  adobeCommerceTools(server, version);
  adobeCommercePrompts(server, version);

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Adobe Commerce Dev MCP Server v${VERSION} running on stdio`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
