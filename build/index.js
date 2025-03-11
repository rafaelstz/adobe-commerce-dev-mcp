import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { shopifyTools } from "./shopify.js";
async function main() {
    // Create server instance
    const server = new McpServer({
        name: "shopify-dev",
        version: "1.0.0",
    }, {
        capabilities: {
            logging: {},
        },
    });
    // Register Shopify tools
    shopifyTools(server);
    // Connect to transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Shopify MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
