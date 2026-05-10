# Convosphere AI Documentation

This repository contains the public Convosphere AI documentation site. It is built with Mintlify and documents product guides, API usage, integrations, and AI-client workflows.

## Recent updates

- Added Cursor MCP setup documentation.
- Added MCP OAuth and automatic API-key mapping flow.
- Added MCP tool category reference and safe testing checklist.
- Updated navigation to include MCP setup and tools pages.

## Key pages

- `guides/mcp-cursor.mdx` - Cursor MCP one-click setup, OAuth login, auto configuration, and troubleshooting.
- `api-reference/mcp/tools.mdx` - MCP tool categories, safe test checklist, admin-only behavior, and mutation warnings.
- `api-reference/authentication/tokens.mdx` - API token refresh documentation.

## Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mint) to preview your documentation changes locally. To install, use the following command:

```
npm i -g mint
```

Run the following command at the root of your documentation, where your `docs.json` is located:

```
mint dev
```

View your local preview at `http://localhost:3000`.

## Publishing changes

Install our GitHub app from your [dashboard](https://dashboard.mintlify.com/settings/organization/github-app) to propagate changes from your repo to your deployment. Changes are deployed to production automatically after pushing to the default branch.

## Troubleshooting

- If your dev environment is not running, run `mint update` to ensure you have the most recent version of the CLI.
- If a page loads as a 404, make sure you are running in a folder with a valid `docs.json`.
- If a new page does not appear in navigation, add it to the appropriate `docs.json` navigation group.
