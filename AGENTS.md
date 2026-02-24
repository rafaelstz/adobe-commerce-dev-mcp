## Cursor Cloud specific instructions

### Project overview

Adobe Commerce Dev MCP Server — a TypeScript MCP server that introspects and searches a bundled Adobe Commerce 2.4.7 GraphQL schema (`data/schema_2-4-7.json.gz`). No external services, databases, or Docker required.

### Node.js version

Requires Node.js 20. The environment uses nvm with `default` alias set to 20.

### Key commands

See `package.json` scripts. Standard workflow:

- `npm ci` — install deps (lockfile-based)
- `npm run build` — compile TypeScript to `dist/`
- `npm run test` — run Vitest suite
- `npm run inspector` — build + launch MCP Inspector for interactive testing

### Running the MCP server

The server uses stdio transport. To test it, pipe JSON-RPC messages via stdin:

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}\n{"jsonrpc":"2.0","method":"notifications/initialized"}\n{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"introspect_admin_schema","arguments":{"query":"product","filter":["all"]}}}\n' | node dist/index.js
```

Server logs go to stderr; JSON-RPC responses go to stdout.

### Known test issues

8 of 31 tests in `searchAdobeCommerceSchema` fail pre-existing. The `memfs` mock (`vi.mock("node:fs")`) does not correctly intercept the source code's `import from "fs"` (without `node:` prefix) under the current vitest/ESM setup. The 23 passing tests confirm the environment is correctly configured.

### Schema decompression

On first run, the server auto-decompresses `data/schema_2-4-7.json.gz` to `data/schema_2-4-7.json`. The `.json` file is gitignored; do not commit it.
