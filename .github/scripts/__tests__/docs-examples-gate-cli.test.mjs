import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decide } from '../docs-examples-gate.mjs';

const ZERO_SHA = '0'.repeat(40);

/**
 * A throwaway git repo the CLI's `decide()` can diff against, mirroring the
 * fixture pattern in docs-sync-git-apply.test.mjs. Every helper returns the
 * repo root so tests read as a straight-line script.
 */
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'docs-examples-gate-'));
  const env = {
    ...process.env,
    GIT_DIR: undefined,
    GIT_AUTHOR_NAME: 'Author', GIT_AUTHOR_EMAIL: 'author@example.com',
    GIT_COMMITTER_NAME: 'Author', GIT_COMMITTER_EMAIL: 'author@example.com',
  };
  const run = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', env }).trim();
  const write = (rel, text) => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), text);
  };
  const commit = (message) => {
    run(['add', '-A']);
    run(['commit', '-q', '-m', message]);

    return run(['rev-parse', 'HEAD']);
  };

  run(['init', '-q', '-b', 'develop']);

  return { root, run, write, commit };
}

function cleanup(root) {
  rmSync(root, { recursive: true, force: true });
}

test('decide: workflow_dispatch (no BEFORE_SHA) always proceeds without touching git', () => {
  const { root } = fixture();

  try {
    const result = decide(root, '', '');

    assert.equal(result.needsSync, true);
    assert.match(result.reason, /manual dispatch/);
  } finally {
    cleanup(root);
  }
});

test('decide: a new-branch push (before SHA all zeros) always proceeds', () => {
  const { root, write, commit } = fixture();

  write('docs/content/guides/x/y.md', '# Title\n');
  const after = commit('init');

  try {
    const result = decide(root, ZERO_SHA, after);

    assert.equal(result.needsSync, true);
    assert.match(result.reason, /new branch/);
  } finally {
    cleanup(root);
  }
});

test('decide: a prose-only edit inside the path filter skips the sync', () => {
  const { root, write, commit } = fixture();

  write('docs/content/guides/x/y.md', ['# Title', '', 'Old prose.', '', '::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n'));
  const before = commit('base');

  write('docs/content/guides/x/y.md', ['# Title', '', 'New prose, fixed a typo.', '', '::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n'));
  const after = commit('typo fix');

  try {
    const result = decide(root, before, after);

    assert.equal(result.needsSync, false);
    assert.match(result.reason, /prose-only/);
  } finally {
    cleanup(root);
  }
});

test('decide: an edit to a sibling example source file (non-.md) always proceeds', () => {
  const { root, write, commit } = fixture();

  write('docs/content/guides/x/y.md', '# Title\n');
  write('docs/content/guides/x/y/javascript/example1.js', 'console.log(1);\n');
  const before = commit('base');

  write('docs/content/guides/x/y/javascript/example1.js', 'console.log(2);\n');
  const after = commit('edit example source');

  try {
    const result = decide(root, before, after);

    assert.equal(result.needsSync, true);
    assert.match(result.reason, /example1\.js/);
  } finally {
    cleanup(root);
  }
});

test('decide: deleting an entire example block proceeds, even with the after side having no lines to intersect', () => {
  const { root, write, commit } = fixture();

  write(
    'docs/content/guides/x/y.md',
    ['# Title', '', '::: example #ex', '@[code](@/content/x.js)', ':::', '', 'Trailing prose.'].join('\n'),
  );
  const before = commit('base');

  write('docs/content/guides/x/y.md', ['# Title', '', 'Trailing prose.'].join('\n'));
  const after = commit('remove the example block');

  try {
    const result = decide(root, before, after);

    assert.equal(result.needsSync, true);
  } finally {
    cleanup(root);
  }
});

test('decide: a renamed guide always proceeds, even with byte-identical content', () => {
  const { root, write, run, commit } = fixture();

  write('docs/content/guides/x/y.md', '# Title\n\nSame content throughout.\n');
  const before = commit('base');

  run(['mv', 'docs/content/guides/x/y.md', 'docs/content/guides/x/z.md']);
  const after = commit('rename the guide');

  try {
    const result = decide(root, before, after);

    assert.equal(result.needsSync, true);
    assert.match(result.reason, /renamed/);
  } finally {
    cleanup(root);
  }
});

test('decide: a new guide with no example block does not proceed; one with a block does', () => {
  const { root, write, commit } = fixture();

  write('README.md', 'placeholder so the base commit has something to commit\n');
  const before = commit('base'); // nothing under docs/content/guides yet

  write('docs/content/guides/x/plain.md', '# Plain guide\n\nJust prose.\n');
  const afterPlain = commit('add a plain guide');

  assert.equal(decide(root, before, afterPlain).needsSync, false);

  write('docs/content/guides/x/with-example.md', ['# With example', '', '::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n'));
  const afterExample = commit('add a guide with an example');

  try {
    const result = decide(root, afterPlain, afterExample);

    assert.equal(result.needsSync, true);
  } finally {
    cleanup(root);
  }
});

test('decide: a guide renamed OUT of the scoped directories is judged on whether the departing content had an example block', () => {
  // git reports this as a plain delete of the old (in-scope) path, not a
  // rename -- a pathspec-restricted diff cannot pair a rename whose new side
  // falls outside the pathspec (verified empirically against real git). The
  // 'removed' branch in isExampleRelevant already handles that correctly.
  const { root, write, run, commit } = fixture();

  write('docs/content/guides/x/plain.md', '# Plain guide\n\nJust prose, nothing else.\n');
  write('other/.keep', ''); // pre-create the destination directory
  const beforePlain = commit('base: a plain guide');

  run(['mv', 'docs/content/guides/x/plain.md', 'other/plain.md']);
  const afterPlainMoved = commit('move the plain guide out of scope');

  assert.equal(decide(root, beforePlain, afterPlainMoved).needsSync, false);

  write('docs/content/guides/x/with-example.md', ['# With example', '', '::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n'));
  const beforeExample = commit('base: a guide with an example');

  run(['mv', 'docs/content/guides/x/with-example.md', 'other/with-example.md']);
  const afterExampleMoved = commit('move the guide-with-an-example out of scope');

  try {
    const result = decide(root, beforeExample, afterExampleMoved);

    assert.equal(result.needsSync, true);
  } finally {
    cleanup(root);
  }
});

test('decide: copying a guide while also editing its source in the same push is detected as a copy and always proceeds', () => {
  // Plain -C (not the expensive --find-copies-harder) only detects a copy
  // when its source was ALSO modified in the same diff -- verified
  // empirically against real git. A copy of an untouched file is reported as
  // a plain add instead, which the 'added' branch already handles by content.
  const { root, write, commit } = fixture();
  const original = [
    '# Title', '', 'Line one of the guide.', 'Line two of the guide.', 'Line three of the guide.',
    'Line four of the guide.', 'Line five of the guide.', 'Line six of the guide.', 'Line seven of the guide.',
  ].join('\n');

  write('docs/content/guides/x/y.md', original);
  const before = commit('base');

  write('docs/content/guides/x/y-copy.md', original); // unmodified copy
  write('docs/content/guides/x/y.md', original.replace('Line one of the guide.', 'Line one of the guide, edited.'));
  const after = commit('copy the guide as a template, and edit the original');

  try {
    const result = decide(root, before, after);

    assert.equal(result.needsSync, true);
  } finally {
    cleanup(root);
  }
});

test('decide: a change entirely outside docs/content/guides and docs/content/recipes never proceeds', () => {
  const { root, write, commit } = fixture();

  write('handsontable/src/core.ts', 'export const x = 1;\n');
  const before = commit('base');

  write('handsontable/src/core.ts', 'export const x = 2;\n');
  const after = commit('unrelated core change');

  try {
    const result = decide(root, before, after);

    assert.equal(result.needsSync, false);
  } finally {
    cleanup(root);
  }
});
