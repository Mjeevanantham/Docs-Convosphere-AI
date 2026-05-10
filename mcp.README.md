# Convosphere Docs MCP Server

This repository now includes a lightweight MCP server that exposes the docs as tools for AI agents.

## Tools

- `list_navigation`: returns tab/group/slug/title from `docs.json`
- `get_page`: returns a specific page by slug (frontmatter + content excerpt)
- `search_docs`: keyword search over indexed docs pages
- `find_endpoint`: task-oriented search focused on `api-reference/*` pages

## Run

```bash
npm install
npm run mcp
```

## Example MCP client config

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
