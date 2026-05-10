#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.dirname(__filename);

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function collectPagesFromNav(docsJson) {
  const pages = [];
  for (const tab of docsJson?.navigation?.tabs ?? []) {
    for (const group of tab?.groups ?? []) {
      for (const p of group?.pages ?? []) {
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
  return collectPagesFromNav(docsJson).map((item) => {
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
  const q = String(query || '').toLowerCase().trim();
  if (!q) return [];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return index
    .map((p) => {
      const hay = `${p.slug} ${p.title} ${p.summary} ${p.content}`.toLowerCase();
      const score = (hay.match(new RegExp(escaped, 'g')) || []).length;
      return { ...p, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ slug, title, tab, group, summary, score }) => ({ slug, title, tab, group, summary, score }));
}

function findEndpoint(index, task) {
  const q = String(task || '').toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);
  const apiPages = index.filter((p) => p.slug.startsWith('api-reference/'));
  const scored = apiPages
    .map((p) => {
      const key = `${p.slug} ${p.title} ${p.summary}`.toLowerCase();
      let score = 0;
      for (const w of terms) if (key.includes(w)) score += 1;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(({ p, score }) => ({ slug: p.slug, title: p.title, score, summary: p.summary }));
}

function handleToolCall(name, args) {
  const index = loadIndex();
  if (name === 'list_navigation') {
    return index.map(({ tab, group, slug, title }) => ({ tab, group, slug, title }));
  }
  if (name === 'get_page') {
    const page = index.find((p) => p.slug === args?.slug);
    if (!page) throw new Error(`Unknown slug: ${args?.slug}`);
    return {
      slug: page.slug,
      title: page.title,
      tab: page.tab,
      group: page.group,
      summary: page.summary,
      content: page.content.slice(0, 6000),
    };
  }
  if (name === 'search_docs') return searchDocs(index, args?.query);
  if (name === 'find_endpoint') return findEndpoint(index, args?.task);
  throw new Error(`Unknown tool: ${name}`);
}

const tools = [
  { name: 'list_navigation', description: 'List docs navigation groups and pages.', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_page', description: 'Get a page by slug (e.g. guides/agents).', inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] } },
  { name: 'search_docs', description: 'Search across documentation.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'find_endpoint', description: 'Find best API endpoint pages for a task.', inputSchema: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] } },
];

function writeMessage(msg) {
  const json = JSON.stringify(msg);
  const out = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`;
  process.stdout.write(out);
}

let buffer = Buffer.alloc(0);
process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;

    const header = buffer.subarray(0, headerEnd).toString('utf8');
    const m = header.match(/Content-Length:\s*(\d+)/i);
    if (!m) {
      buffer = Buffer.alloc(0);
      return;
    }

    const len = Number(m[1]);
    const total = headerEnd + 4 + len;
    if (buffer.length < total) break;

    const body = buffer.subarray(headerEnd + 4, total).toString('utf8');
    buffer = buffer.subarray(total);

    let req;
    try {
      req = JSON.parse(body);
    } catch {
      continue;
    }

    const { id, method, params } = req;
    try {
      if (method === 'initialize') {
        writeMessage({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', serverInfo: { name: 'convosphere-docs', version: '0.2.0' }, capabilities: { tools: {} } } });
      } else if (method === 'tools/list') {
        writeMessage({ jsonrpc: '2.0', id, result: { tools } });
      } else if (method === 'tools/call') {
        const result = handleToolCall(params?.name, params?.arguments || {});
        writeMessage({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } });
      } else if (id !== undefined) {
        writeMessage({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
      }
    } catch (err) {
      writeMessage({ jsonrpc: '2.0', id, error: { code: -32000, message: err.message } });
    }
  }
});
