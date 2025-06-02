import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { adobeCommerceTools } from "../src/tools/index.js";
import { adobeCommercePrompts } from "../src/prompts/index.js";
import { readFileSync } from "fs";
import { resolve } from "path";

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8")
);
const VERSION = packageJson.version;

let server: McpServer | null = null;
let transport: StreamableHTTPServerTransport | null = null;

async function getServerAndTransport() {
  if (!server) {
    server = new McpServer(
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
    adobeCommerceTools(server);
    adobeCommercePrompts(server);
    // Create stateless HTTP transport
    transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
  }
  return { server, transport };
}

export default async function handler(req: any, res: any) {
  const result = await getServerAndTransport();
  if (!result.transport) {
    res.status(500).json({ error: "MCP HTTP transport not initialized" });
    return;
  }
  await result.transport.handleRequest(req, res, req.body);
} 