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
const SETUP_NODE = /^ *(?:- )?uses: actions\/setup-node@/gm;
const SETUP_PNPM = /^ *(?:- )?uses: pnpm\/action-setup@/gm;

describe('the self-hosted performance jobs install pnpm with the npm setup-node provides', () => {
  for (const file of SITES) {
    const source = read(file);
    const node = [...source.matchAll(SETUP_NODE)];
    const pnpm = [...source.matchAll(SETUP_PNPM)];

    test(`${file} has one setup-node step and one pnpm/action-setup step`, () => {
      assert.equal(node.length, 1);
      assert.equal(pnpm.length, 1);
    });

    test(`${file} runs setup-node before pnpm/action-setup, so pnpm's installer never falls back to the runner's bundled npm`, () => {
      assert.ok(
        node[0].index < pnpm[0].index,
        'pnpm/action-setup installs pnpm with the first npm on PATH and falls back to the runner\'s ' +
        'bundled Node folder; runner 2.338.0 shipped that npm without its lib/, which failed every job',
      );
    });

    test(`${file} caches the pnpm store on pnpm/action-setup, because setup-node's pnpm cache needs pnpm installed first`, () => {
      const nodeStep = source.slice(node[0].index, pnpm[0].index);
      const afterPnpm = source.slice(pnpm[0].index);
      const pnpmStep = afterPnpm.slice(0, afterPnpm.search(/^ *- name: /m));

      assert.doesNotMatch(nodeStep, /^ *cache: /m);
      assert.match(pnpmStep, /^ *cache: true$/m);
    });
  }
});
