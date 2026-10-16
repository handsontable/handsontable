import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content');
const FRAMEWORK_BY_BLOCK = { top: 'JavaScript', react: 'React', angular: 'Angular', vue: 'Vue' };
// Changelog and migration pages keep their old titles on purpose.
const EXCEPTIONS = [/^guides\/upgrade-and-migration\/changelog/, /^guides\/upgrade-and-migration\/migrating-from-/];

function collectMarkdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      return collectMarkdownFiles(path);
    }

    return name.endsWith('.md') ? [path] : [];
  });
}

/**
 * Returns the problems found in the `metaTitle` lines of one page's frontmatter.
 *
 * @param {string} source Page source.
 * @returns {string[]} One message per bad line.
 */
function findMetaTitleProblems(source) {
  const lines = source.split('\n');
  const end = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
  const problems = [];
  let block = 'top';

  for (let i = 1; i < end; i++) {
    const blockMatch = lines[i].match(/^(react|angular|vue):\s*$/);

    if (blockMatch) {
      block = blockMatch[1];
    } else if (/^\S/.test(lines[i])) {
      block = 'top';
    }

    const match = lines[i].match(/^\s*metaTitle:\s*(.*)$/);

    if (match) {
      const value = match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
      const suffix = ` | Handsontable DataGrid for ${FRAMEWORK_BY_BLOCK[block]}`;
      const page = value.slice(0, -suffix.length);

      if (!value.endsWith(suffix) || page.length === 0 || /[|]| - |–|—/.test(page)) {
        problems.push(`line ${i + 1}: "${value}" must read "<Page>${suffix}"`);
      }
    }
  }

  return problems;
}

test('findMetaTitleProblems accepts the page title shape for every framework block', () => {
  const source = [
    '---',
    'title: Row headers',
    'metaTitle: Row headers | Handsontable DataGrid for JavaScript',
    'react:',
    '  metaTitle: Row headers | Handsontable DataGrid for React',
    'angular:',
    "  metaTitle: 'API reference: plugins | Handsontable DataGrid for Angular'",
    'vue:',
    '  metaTitle: Row headers | Handsontable DataGrid for Vue',
    '---',
  ].join('\n');

  assert.deepEqual(findMetaTitleProblems(source), []);
});

test('findMetaTitleProblems rejects the old shape, a wrong framework, and dashes', () => {
  const source = [
    '---',
    'metaTitle: Row headers - JavaScript Data Grid | Handsontable',
    'react:',
    '  metaTitle: Row headers | Handsontable DataGrid for Angular',
    'vue:',
    '  metaTitle: Row headers - sorting | Handsontable DataGrid for Vue',
    '---',
  ].join('\n');

  assert.equal(findMetaTitleProblems(source).length, 3);
});

test('every page metaTitle reads "<Page> | Handsontable DataGrid for <Framework>"', () => {
  const failures = [];

  for (const path of collectMarkdownFiles(CONTENT_DIR)) {
    const file = relative(CONTENT_DIR, path);

    if (!EXCEPTIONS.some(pattern => pattern.test(file))) {
      for (const problem of findMetaTitleProblems(readFileSync(path, 'utf8'))) {
        failures.push(`${file} ${problem}`);
      }
    }
  }

  assert.deepEqual(failures, []);
});
