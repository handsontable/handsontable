import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = resolve(SCRIPT_DIR, '..');
const HOOKS_SOURCE_PATH = resolve(
  DOCS_DIR,
  '..',
  'handsontable',
  'src',
  'core',
  'hooks',
  'constants.js',
);
const OUTPUT_PATH = resolve(DOCS_DIR, 'content', 'api', 'hooks.md');

function escapeTableCell(value) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function normalizeDescription(lines) {
  const withoutTrailingEmptyLines = [...lines];

  while (withoutTrailingEmptyLines.length && withoutTrailingEmptyLines.at(-1) === '') {
    withoutTrailingEmptyLines.pop();
  }

  const sections = [];
  let currentSection = [];

  for (const line of withoutTrailingEmptyLines) {
    if (line === '') {
      if (currentSection.length) {
        sections.push(currentSection.join(' ').trim());
        currentSection = [];
      }
      continue;
    }
    currentSection.push(line);
  }

  if (currentSection.length) {
    sections.push(currentSection.join(' ').trim());
  }

  return sections.join('\n\n').trim();
}

function parseParamTag(tag) {
  const match = /^@param\s+\{([^}]+)\}\s+(\[[^\]]+\]|[^\s]+)\s*(.*)$/.exec(tag);

  if (!match) {
    return null;
  }

  const [, rawType, rawName, rawDescription] = match;

  return {
    name: rawName,
    type: rawType.replace(/\s+/g, '').replace(/number\[\]/g, 'Array<number>').replace(/string\[\]/g, 'Array<string>'),
    description: rawDescription.trim(),
  };
}

function parseJsdocBlock(lines) {
  const descriptionLines = [];
  const paramTags = [];
  let currentParamTag = null;
  let inTagsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('@')) {
      inTagsSection = true;
    }

    if (!inTagsSection) {
      descriptionLines.push(trimmed);
      continue;
    }

    if (trimmed.startsWith('@param')) {
      if (currentParamTag) {
        paramTags.push(currentParamTag);
      }
      currentParamTag = trimmed;
      continue;
    }

    if (trimmed.startsWith('@')) {
      if (currentParamTag) {
        paramTags.push(currentParamTag);
        currentParamTag = null;
      }
      continue;
    }

    if (currentParamTag && trimmed) {
      currentParamTag = `${currentParamTag} ${trimmed}`;
    }
  }

  if (currentParamTag) {
    paramTags.push(currentParamTag);
  }

  const description = normalizeDescription(descriptionLines);
  const params = paramTags.map(parseParamTag).filter(Boolean);

  return { description, params };
}

function extractHooksFromSource(sourceFile) {
  const entries = [];
  const hookBlockRegex = /\/\*\*([\s\S]*?)\*\/\s*'([^']+)',/g;
  let match = hookBlockRegex.exec(sourceFile);

  while (match) {
    const [, rawBlock, hookName] = match;
    const lines = rawBlock
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trimEnd());
    const { description, params } = parseJsdocBlock(lines);

    if (description) {
      entries.push({
        name: hookName,
        description,
        params,
      });
    }

    match = hookBlockRegex.exec(sourceFile);
  }

  return entries;
}

function renderHooksMarkdown(hooks) {
  const sections = hooks.map((hook) => {
    const signature = `${hook.name}(${hook.params.map(param => param.name).join(', ')})`;
    const paramsTable = hook.params.length
      ? [
          '| Param | Type | Description |',
          '| --- | --- | --- |',
          ...hook.params.map(param =>
            `| \`${escapeTableCell(param.name)}\` | \`${escapeTableCell(param.type)}\` | ${escapeTableCell(param.description || '')} |`),
          '',
        ].join('\n')
      : '';

    return [
      `### ${hook.name}`,
      '',
      `\`${signature}\``,
      '',
      hook.description,
      '',
      paramsTable,
    ].join('\n');
  });

  return [
    '---',
    'id: js126u0h',
    'title: Hooks',
    'metaTitle: Hooks API reference - JavaScript Data Grid | Handsontable',
    'description: A complete list of Handsontable\'s API hooks (callbacks) that let you run your code before or after specific data grid actions.',
    'permalink: /api/hooks',
    'canonicalUrl: /api/hooks',
    'searchCategory: API Reference',
    'react:',
    '  id: u5rih2o2',
    '  metaTitle: Hooks API reference - React Data Grid | Handsontable',
    'angular:',
    '  id: b7n4p2qw',
    '  metaTitle: Hooks API reference - Angular Data Grid | Handsontable',
    '---',
    '',
    '<!-- This file is auto-generated from handsontable/src/core/hooks/constants.js -->',
    '',
    '[[toc]]',
    '',
    ...sections,
    '',
  ].join('\n');
}

const source = await readFile(HOOKS_SOURCE_PATH, 'utf8');
const hooks = extractHooksFromSource(source);
const hooksMarkdown = renderHooksMarkdown(hooks);

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, hooksMarkdown, 'utf8');

