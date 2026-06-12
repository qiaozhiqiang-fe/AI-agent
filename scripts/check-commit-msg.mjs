#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const commitMessagePath = process.argv[2];

if (!commitMessagePath) {
  console.error('Missing commit message file path.');
  process.exit(1);
}

const message = readFileSync(commitMessagePath, 'utf8').trim();
const firstLine = message.split('\n')[0] ?? '';
const pattern =
  /^(feat|fix|docs|style|refactor|test|build|ci|chore|revert)(\([a-z0-9-]+\))?: .{1,100}$/;

if (!pattern.test(firstLine)) {
  console.error('Invalid commit message.');
  console.error('Use Conventional Commits format: <type>(<scope>): <description>');
  console.error('Example: docs: add coding standards');
  process.exit(1);
}
