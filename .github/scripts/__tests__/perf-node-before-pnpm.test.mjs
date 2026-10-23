import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

const SITES = [
  '.github/actions/performance-run/action.yml',
  '.github/workflows/performance-tests.yml',
];

/**
 * The step that uses an action, from its `- ` line to the next step at the same indent, or to the
 * first line indented less than the step.
 *
 * @param {string} source The workflow or composite action file's contents.
 * @param {string} action The action name before the `@`, for example `actions/setup-node`.
 * @returns {{ start: number, lines: string[] }[]} Every step that uses the action, with the line
 * index its `- ` sits on.
 */
function stepsUsing(source, action) {
  const lines = source.split('\n');
  const found = [];

  lines.forEach((line, index) => {
    if (!new RegExp(`^ *(?:- )?uses: ${action}@`).test(line)) {
      return;
    }

    let start = index;

    while (start > 0 && !/^ *- /.test(lines[start])) {
      start -= 1;
    }

    const indent = lines[start].indexOf('- ');
    let end = start + 1;

    while (end < lines.length) {
      const next = lines[end];
      const nextIndent = next.search(/\S/);

      if (nextIndent !== -1 && (nextIndent < indent || (nextIndent === indent && next.startsWith('- ', indent)))) {
        break;
      }

      end += 1;
    }

    found.push({ start, lines: lines.slice(start, end) });
  });

  return found;
}

/**
 * The keys a step passes to its action, read from its `with:` block.
 *
 * @param {string[]} stepLines One step's lines, from `stepsUsing()`.
 * @returns {Map<string, string>} Each input name and its raw value.
 */
function withInputs(stepLines) {
  const inputs = new Map();
  const withLine = stepLines.findIndex(line => /^ *(?:- )?with:$/.test(line));

  if (withLine === -1) {
    return inputs;
  }

  const withIndent = stepLines[withLine].search(/with:/);

  for (const line of stepLines.slice(withLine + 1)) {
    const indent = line.search(/\S/);

    if (indent === -1 || line.trimStart().startsWith('#')) {
      continue;
    }

    if (indent <= withIndent) {
      break;
    }

    const match = line.match(/^ *([\w-]+): *(.*)$/);

    if (match) {
      inputs.set(match[1], match[2]);
    }
  }

  return inputs;
}

describe('the self-hosted performance jobs install pnpm with the npm setup-node provides', () => {
  for (const file of SITES) {
    const source = read(file);
    const node = stepsUsing(source, 'actions/setup-node');
    const pnpm = stepsUsing(source, 'pnpm/action-setup');

    test(`${file} has one setup-node step and one pnpm/action-setup step`, () => {
      assert.equal(node.length, 1);
      assert.equal(pnpm.length, 1);
    });

    test(`${file} runs setup-node before pnpm/action-setup, so pnpm's installer never falls back to the runner's bundled npm`, () => {
      assert.ok(
        node[0].start < pnpm[0].start,
        'pnpm/action-setup installs pnpm with the first npm on PATH and falls back to the runner\'s ' +
        'bundled Node folder, whose npm a runner update broke (2.338.0)',
      );
    });

    test(`${file} gives setup-node a Node version, without which it puts no Node or npm on PATH`, () => {
      const inputs = withInputs(node[0].lines);

      assert.ok(
        inputs.get('node-version-file') === "'.nvmrc'" || inputs.has('node-version'),
        'setup-node v6 installs Node only when node-version or node-version-file is set',
      );
    });

    test(`${file} caches the pnpm store on pnpm/action-setup, because setup-node's pnpm cache needs pnpm installed first`, () => {
      assert.equal(withInputs(node[0].lines).has('cache'), false);
      assert.equal(withInputs(pnpm[0].lines).get('cache'), 'true');
    });
  }
});
