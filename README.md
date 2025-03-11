# Shopify Dev MCP Server

This project implements a Model Context Protocol (MCP) server that interacts with Shopify Dev's GraphQL API.

## Features

- Communicate with Shopify Dev's GraphQL operations API
- Proper handling of Server-Sent Events (SSE) response format

## Installation

```bash
npm install
npm run build
```

## Usage

The MCP server exposes a single tool:

### shopify-gql

Interact with the Shopify Dev GraphQL API by sending prompts.

**Parameters:**

- `prompt` (required): The prompt to send to Shopify Dev

**Example usage with Claude:**

```
I need help with Shopify's GraphQL API. Can you show me how to query products?
```

## Development

The server is built using the MCP SDK and communicates with Shopify Dev's GraphQL API. To extend or modify:

1. Modify `src/shopify.ts` to change tool behavior
2. Run `npm run build` to compile

## License

ISC
