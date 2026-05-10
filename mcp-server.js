#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function collectPagesFromNav(docsJson) {
  const pages = [];
  for (const tab of docsJson.navigation.tabs ?? []) {
    for (const group of tab.groups ?? []) {
      for (const p of group.pages ?? []) {
        pages.push({ slug: p, tab: tab.tab, group: group.group });
      }
    }
  }
  return pages;
}

function slugToPath(slug) {
  return `${slug}.mdx`;
}

function pageTitle(content) {
  const m = content.match(/title:\s*"([^"]+)"/);
  return m?.[1] ?? null;
}

function summarize(content, max = 320) {
  const noFrontmatter = content.replace(/^---[\s\S]*?---\s*/m, '');
  const plain = noFrontmatter.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return plain.slice(0, max);
}

function loadIndex() {
  const docsJson = readJson('docs.json');
  const navPages = collectPagesFromNav(docsJson);
  return navPages.map((item) => {
    const rel = slugToPath(item.slug);
    const abs = path.join(ROOT, rel);
    const exists = fs.existsSync(abs);
    const content = exists ? readText(rel) : '';
    return {
      ...item,
      file: rel,
      title: exists ? pageTitle(content) || item.slug : item.slug,
      summary: exists ? summarize(content) : '',
      content,
    };
  });
}

function searchDocs(index, query) {
  const q = query.toLowerCase();
  return index
    .map((p) => {
      const hay = `${p.slug} ${p.title} ${p.summary} ${p.content}`.toLowerCase();
      const score = (hay.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      return { ...p, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ slug, title, tab, group, summary, score }) => ({ slug, title, tab, group, summary, score }));
}

function findEndpoint(index, task) {
  const q = task.toLowerCase();
  const apiPages = index.filter((p) => p.slug.startsWith('api-reference/'));
  const scored = apiPages.map((p) => {
    const key = `${p.slug} ${p.title} ${p.summary}`.toLowerCase();
    let score = 0;
    q.split(/\s+/).forEach((w) => {
      if (w && key.includes(w)) score += 1;
    });
    return { p, score };
  }).sort((a,b)=>b.score-a.score);
  return scored.slice(0,5).map(({p,score}) => ({ slug: p.slug, title: p.title, score, summary: p.summary }));
}

const server = new Server({ name: 'convosphere-docs-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'list_navigation', description: 'List docs navigation groups and pages.', inputSchema: { type: 'object', properties: {} } },
    { name: 'get_page', description: 'Get a page by slug (e.g. guides/agents).', inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] } },
    { name: 'search_docs', description: 'Search across documentation.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'find_endpoint', description: 'Find best API endpoint pages for a task.', inputSchema: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] } },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const index = loadIndex();
  const { name, arguments: args = {} } = req.params;

  if (name === 'list_navigation') {
    const byGroup = index.map(({ tab, group, slug, title }) => ({ tab, group, slug, title }));
    return { content: [{ type: 'text', text: JSON.stringify(byGroup, null, 2) }] };
  }

  if (name === 'get_page') {
    const page = index.find((p) => p.slug === args.slug);
    if (!page) return { isError: true, content: [{ type: 'text', text: `Unknown slug: ${args.slug}` }] };
    return { content: [{ type: 'text', text: JSON.stringify({ slug: page.slug, title: page.title, tab: page.tab, group: page.group, summary: page.summary, content: page.content.slice(0, 6000) }, null, 2) }] };
  }

  if (name === 'search_docs') {
    const results = searchDocs(index, args.query || '');
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }

  if (name === 'find_endpoint') {
    const results = findEndpoint(index, args.task || '');
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }

  return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
