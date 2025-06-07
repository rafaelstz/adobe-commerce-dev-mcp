<div align="center">
  <img src="https://i.imgur.com/NAcOzwF.jpeg" alt="Adobe Commerce Dev MCP" />
</div>

<div align="center">

# Adobe Commerce Dev MCP Server
This project implements a Model Context Protocol (MCP) server that interacts with Adobe Commerce. This protocol supports various tools to interact with Adobe Commerce GraphQL APIs.
</div>

<div align="center">
  <a href="https://youtu.be/BP5Qx6hIIKc" target="_blank">
    <img src="https://img.youtube.com/vi/BP5Qx6hIIKc/0.jpg" alt="How to use Adobe Commerce Dev MCP Server" style="max-width: 100%; height: auto;" />
  </a>
</div>

## Usage with MCP Server via NPM Package

You can use this MCP server directly without downloading or hosting anything yourself. Simply configure your MCP client (such as Cursor or Claude Desktop) to use the NPM package:

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
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=adobe-commerce-dev-mcp&config=eyJjb21tYW5kIjoibnB4IC15IEByYWZhZWxjZy9hZG9iZS1jb21tZXJjZS1kZXYtbWNwQGxhdGVzdCJ9)

- Replace the server name (`adobe-commerce-dev-mcp`) as you wish.
- The `npx` command will always use the latest version of the MCP server from NPM.
- No need to install or host anything locally or remotely.

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
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=adobe-commerce-dev-mcp&config=eyJjb21tYW5kIjoiY21kIC9rIG5weCAteSBAcmFmYWVsY2cvYWRvYmUtY29tbWVyY2UtZGV2LW1jcEBsYXRlc3QifQ%3D%3D)

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

Set it up locally for test as below changing the file location in the *args* parameter:

```
{
  "mcpServers": {
    "adobe-commerce-dev-mcp": {
      "command": "node",
      "args": [
        "/Users/rafael/Herd/shopify-dev-mcp/dist/index.js"
      ]
    },
  }
}
```

## License

ISC
