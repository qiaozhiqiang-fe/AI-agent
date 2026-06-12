#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const allowedBranchPattern =
  /^(main|master|(?:feature|fix|docs|refactor|test|chore|codex)\/[a-z0-9]+(?:-[a-z0-9]+)*)$/;
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pascalCasePattern = /^[A-Z][A-Za-z0-9]*$/;

const ignoredDirs = new Set([
  '.git',
  '.githooks',
  'node_modules',
  'dist',
  'coverage',
  '.vite',
]);

const errors = [];

function getCurrentBranch() {
  try {
    return execFileSync('git', ['branch', '--show-current'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

function checkBranchName() {
  const branch = getCurrentBranch();

  if (!branch) {
    return;
  }

  if (!allowedBranchPattern.test(branch)) {
    errors.push(
      `Invalid branch name "${branch}". Use feature/, fix/, docs/, refactor/, test/, chore/, or codex/ with lowercase kebab-case topic.`,
    );
  }
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) {
      continue;
    }

    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath, visit);
      continue;
    }

    if (stats.isFile()) {
      visit(fullPath);
    }
  }
}

function hasSegment(filePath, segment) {
  return filePath.split(sep).includes(segment);
}

function checkFileName(filePath) {
  const pathFromRoot = relative(process.cwd(), filePath);
  const extension = extname(filePath);
  const fileName = pathFromRoot.split(sep).pop() ?? '';
  const baseName = fileName.slice(0, -extension.length);

  if (extension === '.vue' && !pascalCasePattern.test(baseName)) {
    errors.push(`Vue component should use PascalCase: ${pathFromRoot}`);
  }

  if (
    extension === '.ts' &&
    hasSegment(pathFromRoot, 'src') &&
    !baseName.endsWith('.types') &&
    !baseName.endsWith('.test') &&
    !kebabCasePattern.test(baseName)
  ) {
    errors.push(`TypeScript source file should use kebab-case: ${pathFromRoot}`);
  }

  if (
    extension === '.md' &&
    hasSegment(pathFromRoot, 'docs') &&
    fileName !== 'README.md' &&
    !kebabCasePattern.test(baseName)
  ) {
    errors.push(`Markdown file should use kebab-case: ${pathFromRoot}`);
  }
}

checkBranchName();
walk(process.cwd(), checkFileName);

if (errors.length > 0) {
  console.error('Project rule check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Project rule check passed.');
