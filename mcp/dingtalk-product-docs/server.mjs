#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverInfo = {
  name: 'dingtalk-product-docs',
  version: '0.1.0',
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '../..');
const docsRoot = path.join(projectRoot, 'docs/product');
const supportedExtensions = new Set(['.md', '.markdown', '.txt']);

const tools = [
  {
    name: 'list_product_docs',
    description: 'List exported DingTalk product documents stored under docs/product.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'search_product_docs',
    description: 'Search exported DingTalk product documents stored under docs/product.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword to search for.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of matching snippets to return.',
          default: 10,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'read_product_doc',
    description: 'Read one exported DingTalk product document from docs/product.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Document path relative to docs/product.',
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
];

const send = (message) => {
  process.stdout.write(`${JSON.stringify(message)}\n`);
};

const respond = (id, result) => {
  send({
    jsonrpc: '2.0',
    id,
    result,
  });
};

const respondError = (id, code, message) => {
  send({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  });
};

const textContent = (text) => ({
  content: [
    {
      type: 'text',
      text,
    },
  ],
});

const ensureDocsRoot = async () => {
  await fs.mkdir(docsRoot, { recursive: true });
};

const walkDocs = async (dir = docsRoot) => {
  await ensureDocsRoot();

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkDocs(absolutePath)));
      continue;
    }

    if (!entry.isFile() || !supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    files.push(path.relative(docsRoot, absolutePath));
  }

  return files.sort();
};

const resolveDocPath = (relativePath) => {
  const absolutePath = path.resolve(docsRoot, relativePath);
  const relativeToRoot = path.relative(docsRoot, absolutePath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error('Document path must stay inside docs/product.');
  }

  if (!supportedExtensions.has(path.extname(absolutePath).toLowerCase())) {
    throw new Error('Only Markdown and text product documents are supported.');
  }

  return absolutePath;
};

const listProductDocs = async () => {
  const files = await walkDocs();

  if (files.length === 0) {
    return 'No product documents found. Export DingTalk docs into docs/product first.';
  }

  return files.join('\n');
};

const readProductDoc = async ({ path: relativePath }) => {
  const absolutePath = resolveDocPath(relativePath);
  return fs.readFile(absolutePath, 'utf8');
};

const searchProductDocs = async ({ query, limit = 10 }) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    throw new Error('query must not be empty.');
  }

  const files = await walkDocs();
  const matches = [];

  for (const file of files) {
    const content = await fs.readFile(resolveDocPath(file), 'utf8');
    const lines = content.split(/\r?\n/);

    for (const [index, line] of lines.entries()) {
      if (!line.toLowerCase().includes(normalizedQuery)) {
        continue;
      }

      const start = Math.max(0, index - 1);
      const end = Math.min(lines.length, index + 2);
      matches.push({
        file,
        line: index + 1,
        snippet: lines.slice(start, end).join('\n'),
      });

      if (matches.length >= limit) {
        break;
      }
    }

    if (matches.length >= limit) {
      break;
    }
  }

  if (matches.length === 0) {
    return `No matches found for "${query}".`;
  }

  return matches
    .map((match) => `File: ${match.file}\nLine: ${match.line}\n${match.snippet}`)
    .join('\n\n---\n\n');
};

const handleToolCall = async (name, args) => {
  if (name === 'list_product_docs') {
    return textContent(await listProductDocs());
  }

  if (name === 'search_product_docs') {
    return textContent(await searchProductDocs(args));
  }

  if (name === 'read_product_doc') {
    return textContent(await readProductDoc(args));
  }

  throw new Error(`Unknown tool: ${name}`);
};

const handleRequest = async (request) => {
  if (request.method === 'initialize') {
    respond(request.id, {
      protocolVersion: request.params?.protocolVersion ?? '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo,
      instructions:
        'Use this server for read-only product requirement context exported from DingTalk into docs/product. Do not treat it as live DingTalk data unless API tools are added later.',
    });
    return;
  }

  if (request.method === 'tools/list') {
    respond(request.id, { tools });
    return;
  }

  if (request.method === 'tools/call') {
    const result = await handleToolCall(request.params.name, request.params.arguments ?? {});
    respond(request.id, result);
    return;
  }

  if (request.id !== undefined) {
    respondError(request.id, -32601, `Method not found: ${request.method}`);
  }
};

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    try {
      const request = JSON.parse(trimmed);
      void handleRequest(request).catch((error) => {
        if (request.id !== undefined) {
          respondError(request.id, -32000, error.message);
        }
      });
    } catch (error) {
      respondError(null, -32700, error.message);
    }
  }
});

process.stdin.resume();

