# Adobe Commerce Dev MCP Server

This project implements a Model Context Protocol (MCP) server that interacts with Adobe Commerce. This protocol supports various tools to interact with Adobe Commerce GraphQL APIs.

## Setup

To run the Adobe Commerce MCP server using npx, use the following command:

```bash
npx -y @rafaelcg/adobe-commerce-dev-mcp@latest
```

## Usage with Cursor or Claude Desktop

Add the following configuration. For more information, read the [Cursor MCP documentation](https://docs.cursor.com/context/model-context-protocol) or the [Claude Desktop MCP guide](https://modelcontextprotocol.io/quickstart/user).

```json
{
  "mcpServers": {
    "adobe-commerce-dev-mcp": {
      "command": "npx",
      "args": ["-y", "@rafaelcg/adobe-commerce-dev-mcp@latest"]
    }
  }
}
```

On Windows, you might need to use this alternative configuration:

```json
{
  "mcpServers": {
    "adobe-commerce-dev-mcp": {
      "command": "cmd",
      "args": ["/k", "npx", "-y", "@rafaelcg/adobe-commerce-dev-mcp@latest"]
    }
  }
}
```

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
