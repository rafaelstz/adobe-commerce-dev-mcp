# Adobe Commerce Dev MCP Server

This project implements a Model Context Protocol (MCP) server that interacts with Adobe Commerce. This protocol supports various tools to interact with Adobe Commerce GraphQL APIs.

## Usage with MCP Server I Hosted on Vercel

You can use this MCP server directly from the cloud, without running anything locally. Just point your MCP client (such as Cursor or Claude Desktop) to the Vercel endpoint:

```json
{
  "mcpServers": {
    "adobe-commerce-dev-mcp-vercel": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://adobe-commerce-dev-mcp.vercel.app/api/mcp"
      ]
    }
  }
}
```

- Replace the server name (`adobe-commerce-dev-mcp-vercel`) as you wish.
- The `mcp-remote` command is used to connect to a remote MCP server.
- The URL should point to your deployed Vercel MCP endpoint.

**Benefits:**
- No need to install or run anything locally.
- Always uses the latest deployed version.

## Available tools

This MCP server provides the following tools:

| Tool Name               | Description                                    |
| ----------------------- | ---------------------------------------------- |
| introspect_admin_schema | Access and search Adobe Commerce GraphQL schema |

## Available prompts

This MCP server provides the following prompts:

| Prompt Name           | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| adobe_commerce_graphql | Help you write GraphQL operations for the Adobe Commerce API |

## Development

The server is built using the MCP SDK and communicates with Adobe Commerce.

1. `npm install`
1. Modify source files
1. Run `npm run build` to compile
1. Run `npm run test` to run tests
1. Add an MCP server that runs this command: `node <absolute_path_of_project>/dist/index.js`

## License

ISC
