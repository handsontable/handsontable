import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// `sync-release-docs-delta.mjs` ports the `docs/content` changes a release
// introduced (base version -> head version) onto the checked-out prod-docs
// branch, with `git apply --3way` so a prod-docs edit that does not overlap
// survives and one that does conflicts fail-closed (DEV-2925). These tests build
// a throwaway git repo shaped like a prod-docs checkout and drive the script
// against it -- the script operates on `process.cwd()`, so `cwd: fixture` is what
// points it at the fixture rather than the real repo.

const SCRIPT = path.join(repoRoot(), '.github/scripts/sync-release-docs-delta.mjs');

const CHANGELOG_18 = 'docs/content/guides/upgrade-and-migration/changelog-18/changelog-18.md';
const SHADOW_DOM = 'docs/content/guides/tools-and-building/shadow-dom/shadow-dom.md';
const ROLLING_CHANGELOG = 'docs/content/guides/upgrade-and-migration/changelog/changelog.md';
const API_PAGE = 'docs/content/api/pagination.md';
const CORE_PKG = 'handsontable/package.json';

const CHANGELOG_18_BASE = `---
title: Changelog 18.x
---

These are the release notes for Handsontable 18.x.

## 18.1.0

Released on September 1st, 2026

#### Added
- The 18.1.0 line.
`;

const CHANGELOG_18_HEAD = `---
title: Changelog 18.x
---

These are the release notes for Handsontable 18.x.

## 18.1.1

Released on September 15th, 2026

#### Fixed
- The 18.1.1 fix.

## 18.1.0

Released on September 1st, 2026

#### Added
- The 18.1.0 line.
`;

const SHADOW_DOM_BASE = `---
title: Shadow DOM
---

Salesforce LWS filters composedPath.

## Known limitations
`;

const SHADOW_DOM_HEAD = `---
title: Shadow DOM
---

Salesforce LWS filters composedPath.

Handsontable binds copy, cut, and paste on the grid, the document, and the shadow root.

## Known limitations
`;

/**
 * Build a git repo whose committed state is the release history (base tag, head
 * tag) and whose working tree is a prod-docs branch cut from the base tag.
 *
 * @param {object} options
 * @param {string} options.headChangelog18 The head tag's changelog-18 content.
 * @param {string} options.headShadowDom The head tag's shadow-dom content.
 * @param {(files: Record<string, string>) => void} [options.mutateProdDocs] Edits applied to the prod-docs working tree on top of the base.
 * @returns {string} The fixture directory.
 */
function makeFixture({ headChangelog18 = CHANGELOG_18_HEAD, headShadowDom = SHADOW_DOM_HEAD, mutateProdDocs } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'sync-release-docs-delta-'));
  const git = args => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  const write = (rel, contents) => {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), contents);
  };

  git(['init', '--quiet', '--initial-branch', 'release']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'Test']);

  // Base tag: the 18.1.0 state.
  write(CHANGELOG_18, CHANGELOG_18_BASE);
  write(SHADOW_DOM, SHADOW_DOM_BASE);
  write(ROLLING_CHANGELOG, '# rolling\n\n## 18.1.0\n');
  write(API_PAGE, '# Pagination (generated at 18.1.0)\n');
  write(CORE_PKG, '{\n  "version": "18.1.0"\n}\n');
  git(['add', '.']);
  git(['commit', '--quiet', '-m', '18.1.0']);
  git(['tag', '18.1.0']);

  // Head tag: the 18.1.1 state. Also touches the two EXCLUDED trees, to prove
  // they are not carried by the delta.
  write(CHANGELOG_18, headChangelog18);
  write(SHADOW_DOM, headShadowDom);
  write(ROLLING_CHANGELOG, '# rolling\n\n## 18.1.1\n\n## 18.1.0\n');
  write(API_PAGE, '# Pagination (generated at 18.1.1)\n');
  write(CORE_PKG, '{\n  "version": "18.1.1"\n}\n');
  git(['add', '.']);
  git(['commit', '--quiet', '-m', '18.1.1']);
  git(['tag', '18.1.1']);

  // The prod-docs checkout: cut from the base tag, then carrying its own edits.
  git(['checkout', '--quiet', '-b', 'prod-docs', '18.1.0']);

  if (mutateProdDocs) {
    mutateProdDocs({ write, dir });
    git(['add', '.']);
    git(['commit', '--quiet', '-m', 'prod-docs edit']);
  }

  return dir;
}

/**
 * @param {string} dir
 * @param {string[]} args Positional args after the script path.
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function run(dir, args) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' });

    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return { status: error.status ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

const read = (dir, rel) => readFileSync(path.join(dir, rel), 'utf8');

test('applies the release docs delta and preserves an unrelated prod-docs edit', () => {
  const dir = makeFixture({
    mutateProdDocs: ({ write }) => {
      // A docs-sync'd fix on the branch, in a file the release did not touch.
      write('docs/content/guides/rows/row-moving/row-moving.md', '# Row moving\n\nA prod-docs-only fix.\n');
    },
  });

  try {
    const result = run(dir, ['18.1.0', '18.1.1']);

    assert.equal(result.status, 0, result.stderr);
    // The per-major section and the mixed-commit shadow-dom edit both land.
    assert.match(read(dir, CHANGELOG_18), /^## 18\.1\.1$/m);
    assert.match(read(dir, SHADOW_DOM), /binds copy, cut, and paste/);
    // The prod-docs-only edit is untouched.
    assert.match(read(dir, 'docs/content/guides/rows/row-moving/row-moving.md'), /A prod-docs-only fix\./);
    // The excluded trees are NOT carried: the rolling changelog and the api page
    // still read their base (18.1.0) content.
    assert.doesNotMatch(read(dir, ROLLING_CHANGELOG), /## 18\.1\.1/);
    assert.match(read(dir, API_PAGE), /generated at 18\.1\.0/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('3-way merges a non-overlapping prod-docs edit in a file the release also changed', () => {
  const dir = makeFixture({
    mutateProdDocs: ({ write }) => {
      // Change a CONTEXT line of the release's shadow-dom hunk (the line just
      // above its inserted paragraph). Plain `git apply` rejects a patch whose
      // context no longer matches; only `--3way` reconciles it. So this test
      // fails if `--3way` is dropped.
      write(SHADOW_DOM, SHADOW_DOM_BASE.replace(
        'Salesforce LWS filters composedPath.',
        'Salesforce LWS filters composedPath. (prod-docs clarification)'
      ));
    },
  });

  try {
    const result = run(dir, ['18.1.0', '18.1.1']);

    assert.equal(result.status, 0, result.stderr);
    // Both the prod-docs clarification and the release's inserted paragraph land.
    const shadow = read(dir, SHADOW_DOM);

    assert.match(shadow, /prod-docs clarification/);
    assert.match(shadow, /binds copy, cut, and paste/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('is a no-op when base equals head (a fresh minor/major branch)', () => {
  const dir = makeFixture();

  try {
    const result = run(dir, ['18.1.1', '18.1.1']);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /already at 18\.1\.1/);
    // The head section was never applied, because base === head short-circuits.
    assert.doesNotMatch(read(dir, CHANGELOG_18), /## 18\.1\.1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('is a no-op when the delta touches only excluded trees', () => {
  // Head differs from base ONLY in the rolling changelog and the api page, both
  // excluded, so there is no content delta to apply.
  const dir = makeFixture({ headChangelog18: CHANGELOG_18_BASE, headShadowDom: SHADOW_DOM_BASE });

  try {
    const result = run(dir, ['18.1.0', '18.1.1']);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /No docs\/content delta/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fails closed when a prod-docs edit conflicts with a release change', () => {
  const dir = makeFixture({
    mutateProdDocs: ({ write }) => {
      // Insert a competing paragraph at the SAME gap the release inserts into,
      // so the two additions overlap and `git apply --3way` conflicts.
      write(SHADOW_DOM, SHADOW_DOM_BASE.replace(
        '\n## Known limitations\n',
        '\nA different prod-docs paragraph added in the very same gap.\n\n## Known limitations\n'
      ));
    },
  });

  try {
    const result = run(dir, ['18.1.0', '18.1.1']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /could not cleanly apply/);
    assert.match(result.stderr, /shadow-dom\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fails when a version ref does not resolve', () => {
  const dir = makeFixture();

  try {
    const result = run(dir, ['18.0.9', '18.1.1']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /does not resolve to a commit/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fails on missing arguments', () => {
  const dir = makeFixture();

  try {
    const result = run(dir, ['18.1.0']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// The apply MUST stay 3-way (so a prod-docs edit that does not overlap survives)
// and the two excludes MUST stay (the rolling changelog and the api tree are owned
// by other steps). These are load-bearing against the job's fail-open history, and
// a careless edit to the script would not necessarily fail the behavioral cases
// above, so pin the source too.
test('the script applies 3-way and excludes the rolling changelog and api trees', () => {
  const source = readFileSync(SCRIPT, 'utf8');

  assert.match(source, /'apply', '--3way'/, 'the release-docs delta must be applied with `git apply --3way`');
  assert.match(source, /:\(exclude\)docs\/content\/guides\/upgrade-and-migration\/changelog\/changelog\.md/);
  assert.match(source, /:\(exclude\)docs\/content\/api/);
});
