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
const checkoutSites = [
  '.github/workflows/performance.yml',
  '.github/workflows/performance-tests.yml',
];
const preflightSites = [
  '.github/workflows/performance-tests.yml',
  '.github/actions/performance-run/action.yml',
];

describe('performance gh-pages Git steps', () => {
  for (const site of checkoutSites) {
    test(`${site} explicitly cleans the Git checkout`, () => {
      assert.match(read(site), /uses: actions\/checkout@[^\n]+\n\s+with:[\s\S]{0,250}?clean: true/);
    });
  }

  for (const site of preflightSites) {
    test(`${site} verifies the Git checkout before running performance steps`, () => {
      assert.match(read(site), /git rev-parse --is-inside-work-tree/);
    });
  }

  for (const site of sites) {
    test(`${site} does not swallow a gh-pages fetch failure`, () => {
      assert.ok(!read(site).includes('gh-pages:gh-pages 2>/dev/null || true'));
    });

    test(`${site} uses detached worktrees and prunes stale registrations`, () => {
      const content = read(site);
      const worktreeAdds = content.match(/^\s*git worktree add.*$/gm) ?? [];
      const prunes = content.match(/git worktree prune/g) ?? [];

      assert.equal(worktreeAdds.length, 2);
      assert.ok(worktreeAdds.every(command => command.includes('git worktree add --detach')));
      assert.equal(prunes.length, 4);
      assert.equal((content.match(/WORKTREE_PREFIX="\$\{RUNNER_TEMP\}\/handsontable-performance-gh-pages\."/g) ?? []).length, 2);
      assert.equal((content.match(/git worktree remove --force "\$stale_dir" 2>\/dev\/null \|\| rm -rf "\$stale_dir"/g) ?? []).length, 2);
      assert.equal((content.match(/mktemp -d "\$\{WORKTREE_PREFIX\}XXXXXX"/g) ?? []).length, 2);
      assert.equal((content.match(/rm -rf "\$WORK_DIR"; git worktree prune/g) ?? []).length, 2);
    });

    test(`${site} force-fetches the remote-tracking gh-pages ref`, () => {
      const fetches = read(site).match(/git fetch.*gh-pages.*$/gm) ?? [];

      assert.equal(fetches.length, 5);
      assert.ok(fetches.every(command => command.includes('git fetch --force origin gh-pages')));
      assert.ok(fetches.every(command => !command.includes(':gh-pages')));
    });
  }
});
