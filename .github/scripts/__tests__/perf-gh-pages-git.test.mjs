import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { repoRoot } from '../lib/repo-root.mjs';

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const sites = [
  '.github/workflows/performance-tests.yml',
  '.github/actions/performance-run/action.yml',
];

describe('performance gh-pages Git steps', () => {
  for (const site of sites) {
    test(`${site} does not swallow a gh-pages fetch failure`, () => {
      assert.ok(!read(site).includes('gh-pages:gh-pages 2>/dev/null || true'));
    });

    test(`${site} uses detached worktrees and prunes stale registrations`, () => {
      const content = read(site);

      assert.ok(content.includes('git worktree add --detach'));
      assert.ok(content.includes('git worktree prune'));
    });

    test(`${site} force-fetches gh-pages`, () => {
      assert.ok(read(site).includes('git fetch --force origin gh-pages:gh-pages'));
    });
  }
});
