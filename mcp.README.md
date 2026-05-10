# Convosphere Docs MCP Server

Dependency-free MCP server for this docs repository.

It resolves docs relative to the server file location, so it works even when launched from a different working directory.

## Why previous setup failed

The previous version depended on `@modelcontextprotocol/sdk`; in restricted environments that package may fail to install.
This new version uses only Node.js built-ins and implements MCP JSON-RPC framing directly.

## Tools

- `list_navigation`
- `get_page`
- `search_docs`
- `find_endpoint`

## Run

```bash
node /workspace/Docs-Convosphere-AI/mcp-server.js
```

## Client config

```json
{
  "mcpServers": {
    "convosphere-docs": {
      "command": "node",
      "args": ["/workspace/Docs-Convosphere-AI/mcp-server.js"]
    }
  }
}
```

## Note on your multi-server config

Your pasted config has other entries that can fail independently:
- `Magic MCP` arg `API_KEY="` is malformed/incomplete.
- `Railway` uses a single command string (`"npx -y ..."`) where many clients expect `command: "npx"` and args split.

If one client aborts on first bad server entry, fix those too.
