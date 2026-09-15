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
      // The `(?!\n\s*-\s)` guard stops the lazy span from crossing into a later
      // step, so this cannot pass on a `clean: true` that belongs to a nearby step.
      assert.match(read(site), /uses: actions\/checkout@[^\n]+\n\s+with:(?:(?!\n\s*-\s)[\s\S]){0,250}?clean: true/);
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
      assert.ok(fetches.every(command => command.includes(
        'git fetch --force origin "+refs/heads/gh-pages:refs/remotes/origin/gh-pages"'
      )));
      // The old local-branch form `gh-pages:gh-pages` is what must stay gone; the
      // explicit refspec's only colon precedes `refs/remotes/...`, not `gh-pages`.
      assert.ok(fetches.every(command => !command.includes('gh-pages:gh-pages')));
    });

    // Regex checks over the raw text miss indentation, the exact defect that once
    // shipped a `run: |` block GitHub could not parse while all ten assertions above
    // stayed green. This parses every block scalar's structure without a YAML
    // dependency: inside a `run:` block, no non-blank line may sit at or below the
    // `run:` key's own indent (that ends the block early and orphans the line), and
    // none may be indented less than the block's first body line.
    test(`${site} has no dedented lines inside a run: block`, () => {
      const lines = read(site).split('\n');

      for (let i = 0; i < lines.length; i += 1) {
        const start = lines[i].match(/^(\s*)run: [|>]/);

        if (!start) {
          continue;
        }

        const keyIndent = start[1].length;
        let bodyIndent = null;

        for (let j = i + 1; j < lines.length; j += 1) {
          const line = lines[j];

          if (line.trim() === '') {
            continue;
          }

          const indent = line.match(/^\s*/)[0].length;

          // A line at or below the key indent ends the block. If it is not itself a
          // YAML key, list item, or comment, the block was broken by a bad dedent.
          if (indent <= keyIndent) {
            assert.match(
              line,
              /^\s*(#|- |[\w".\-/]+:(\s|$))/,
              `${site}: line ${j + 1} dedents out of a run: block without starting a new key:\n${line}`
            );
            break;
          }

          if (bodyIndent === null) {
            bodyIndent = indent;
          }

          assert.ok(
            indent >= bodyIndent,
            `${site}: line ${j + 1} is indented less than its run: block body (${indent} < ${bodyIndent}):\n${line}`
          );
        }
      }
    });
  }
});
