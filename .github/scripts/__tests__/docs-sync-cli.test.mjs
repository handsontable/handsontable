import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

const CLI = path.join(repoRoot(), '.github/scripts/docs-sync.mjs');

/**
 * origin (bare) + work clone. develop has: a content-only fix (#101), a mixed
 * commit (#102), a migration guide into 18.2 (#103), a content fix already
 * cherry-picked to prod by hand (#104), and a direct push with no PR number.
 */
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'docs-sync-cli-'));
  const origin = path.join(root, 'origin.git');
  const work = path.join(root, 'work');
  const env = {
    ...process.env,
    GIT_DIR: undefined,
    GIT_AUTHOR_NAME: 'Author', GIT_AUTHOR_EMAIL: 'author@example.com',
    GIT_COMMITTER_NAME: 'Author', GIT_COMMITTER_EMAIL: 'author@example.com',
  };
  const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', env }).trim();
  const write = (rel, text) => {
    mkdirSync(path.dirname(path.join(work, rel)), { recursive: true });
    writeFileSync(path.join(work, rel), text);
  };

  execFileSync('git', ['init', '-q', '--bare', origin], { env });
  execFileSync('git', ['init', '-q', '-b', 'develop', work], { env });
  git(work, ['remote', 'add', 'origin', origin]);

  write('handsontable/package.json', '{"version":"18.2.0-next"}\n');
  write('CHANGELOG.md', '# Handsontable changelog\n\n## [18.1.0] - 2026-09-01\n### Added\n- Added X.\n');
  write('docs/content/guides/a.md', 'a v1\n');
  write('docs/content/guides/d.md', 'd v1\n');
  mkdirSync(path.join(work, '.changelogs'), { recursive: true });
  git(work, ['add', '-A']);
  git(work, ['commit', '-q', '-m', 'base']);
  git(work, ['branch', 'prod-docs/18.1']);

  write('docs/content/guides/a.md', 'a v2\n');
  git(work, ['commit', '-q', '-am', 'Fix a typo in guide a (#101)']);
  const contentOnly = git(work, ['rev-parse', 'HEAD']);

  write('docs/content/guides/b.md', 'b\n');
  write('handsontable/src/core.ts', 'code\n');
  git(work, ['add', '-A']);
  git(work, ['commit', '-q', '-m', 'Add feature with docs (#102)']);

  write('docs/content/guides/upgrade-and-migration/migrating-from-18.1-to-18.2/migrating-from-18.1-to-18.2.md', 'm\n');
  git(work, ['add', '-A']);
  git(work, ['commit', '-q', '-m', 'Add the 18.2 migration guide (#103)']);

  write('docs/content/guides/d.md', 'd v2\n');
  git(work, ['commit', '-q', '-am', 'Fix guide d (#104)']);
  const handPicked = git(work, ['rev-parse', 'HEAD']);

  write('docs/content/guides/e.md', 'e\n');
  git(work, ['add', '-A']);
  git(work, ['commit', '-q', '-m', 'direct push without a number']);

  git(work, ['switch', '-q', 'prod-docs/18.1']);
  write('handsontable/package.json', '{"version":"18.1.0"}\n');
  git(work, ['commit', '-q', '-am', '18.1.0']);
  write('docs/content/guides/d.md', 'd v2\n');
  git(work, ['commit', '-q', '-am', 'Fix guide d (#104) (#150)']);
  git(work, ['switch', '-q', 'develop']);

  git(work, ['push', '-q', 'origin', 'develop', 'prod-docs/18.1']);

  // Fake gh: records argv, answers from canned files keyed by the first two args.
  const ghDir = path.join(root, 'bin');
  const ghLog = path.join(root, 'gh.log');
  const fakeGh = path.join(ghDir, 'gh');

  mkdirSync(ghDir);
  writeFileSync(fakeGh, [
    '#!/usr/bin/env node',
    'const fs = require("node:fs");',
    `fs.appendFileSync(${JSON.stringify(ghLog)}, JSON.stringify(process.argv.slice(2)) + "\\n");`,
    'const a = process.argv.slice(2);',
    'if (a[0] === "api" && /pulls\\/\\d+$/.test(a[1])) {',
    '  const n = Number(a[1].split("/").pop());',
    '  process.stdout.write(JSON.stringify({ number: n, title: `PR ${n}`, body: "", labels: [], user: { login: "someone" } }));',
    '} else if (a[0] === "pr" && a[1] === "list") {',
    '  process.stdout.write("[]");',
    '} else if (a[0] === "pr" && a[1] === "create") {',
    '  process.stdout.write("https://github.com/o/r/pull/200");',
    '} else { process.stdout.write(""); }',
  ].join('\n'));
  chmodSync(fakeGh, 0o755);

  return { root, work, origin, git, contentOnly, handPicked, ghLog, fakeGh };
}

function runCli(f, extra = []) {
  return spawnSync(process.execPath, [CLI, '--repo-dir', f.work, '--gh-bin', f.fakeGh, '--no-llm', '--skip-lint', ...extra], {
    encoding: 'utf8',
    env: { ...process.env, GIT_DIR: undefined, GH_REPO: 'o/r', GH_TOKEN: 'x', DRY_RUN: '', TARGET: '', GITHUB_STEP_SUMMARY: path.join(f.root, 'summary.md') },
  });
}

test('the CLI classifies deterministically, pushes the sync branch, and opens one pull request', () => {
  const f = fixture();

  try {
    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const summary = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    // --no-llm makes every classifier candidate unsure, so nothing is included and
    // no pull request is opened; every other bucket is exercised.
    assert.match(summary, /## Skipped: needs a human decision\n\n- `[0-9a-f]{7}` Fix a typo in guide a \(#101\)/);
    assert.match(summary, /## Skipped: mixed content and other changes\n\n- `[0-9a-f]{7}` Add feature with docs \(#102\): touches source/);
    assert.match(summary, /## Skipped: version-scoped pages\n\n- `[0-9a-f]{7}` Add the 18\.2 migration guide \(#103\)/);
    assert.match(summary, /## Skipped: already on prod\n\n- `[0-9a-f]{7}` Fix guide d \(#104\)/);
    assert.match(summary, /## Skipped: no pull request number\n\n- `[0-9a-f]{7}` direct push without a number/);
    assert.match(summary, /Target: prod-docs\/18\.1@/);
    assert.match(summary, /released 18\.1\.0/);

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

    assert.ok(ghCalls.some((c) => c[0] === 'api' && c[1] === 'repos/o/r/pulls/101'), 'looked up PR 101 for labels');
    assert.ok(!ghCalls.some((c) => c[0] === 'pr' && c[1] === 'create'), 'no pull request when nothing is included');
    assert.equal(f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']), '', 'no branch pushed when nothing is included');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('an include label on the source pull request forces the pick, pushes, and opens the pull request', () => {
  const f = fixture();

  try {
    // Re-point the fake gh so PR 101 carries the include label.
    const script = readFileSync(f.fakeGh, 'utf8').replace('labels: []', 'labels: n === 101 ? [{ name: "docs-sync: include" }] : []');

    writeFileSync(f.fakeGh, script);

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const remoteTip = f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']);

    assert.match(remoteTip, /docs-sync\/prod-docs-18\.1/);

    const picked = f.git(f.work, ['log', '-1', '--format=%s%n%b', 'origin/docs-sync/prod-docs-18.1']);

    assert.match(picked, /Fix a typo in guide a \(#101\)/);
    assert.match(picked, new RegExp(`cherry picked from commit ${f.contentOnly}`));

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    const create = ghCalls.find((c) => c[0] === 'pr' && c[1] === 'create');

    assert.ok(create, 'pull request created');
    assert.equal(create[create.indexOf('--base') + 1], 'prod-docs/18.1');
    assert.equal(create[create.indexOf('--head') + 1], 'docs-sync/prod-docs-18.1');
    assert.equal(create[create.indexOf('--title') + 1], 'Sync docs content from develop to prod-docs/18.1');
    assert.match(create[create.indexOf('--body') + 1], /## Included\n\n- `[0-9a-f]{7}` Fix a typo in guide a \(#101, @someone\)/);
    assert.match(create[create.indexOf('--body') + 1], /\[skip changelog\]/);
    assert.ok(ghCalls.some((c) => c[0] === 'label' && c[1] === 'create' && c[2] === 'docs-sync'), 'labels ensured');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a skip label on the source pull request excludes it, with no branch pushed and no pull request opened', () => {
  const f = fixture();

  try {
    // Re-point the fake gh so PR 101 carries the skip label.
    const script = readFileSync(f.fakeGh, 'utf8').replace('labels: []', 'labels: n === 101 ? [{ name: "docs-sync: skip" }] : []');

    writeFileSync(f.fakeGh, script);

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const summary = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    assert.match(summary, /## Excluded by the classifier\n\n- `[0-9a-f]{7}` Fix a typo in guide a \(#101\): Labelled/);
    assert.equal(f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']), '', 'no branch pushed when the only candidate is excluded');

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

    assert.ok(!ghCalls.some((c) => c[0] === 'pr' && c[1] === 'create'), 'no pull request when nothing is included');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('--dry-run applies locally but pushes nothing and opens nothing', () => {
  const f = fixture();

  try {
    const script = readFileSync(f.fakeGh, 'utf8').replace('labels: []', 'labels: n === 101 ? [{ name: "docs-sync: include" }] : []');

    writeFileSync(f.fakeGh, script);

    const result = runCli(f, ['--dry-run']);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']), '');
    assert.match(result.stdout, /## Included\n\n- `[0-9a-f]{7}` Fix a typo in guide a/);

    const ghCalls = existsSync(f.ghLog) ? readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line)) : [];

    // Under --dry-run nothing writes through gh at all, not just "no create":
    // no pull request opened, edited, or closed, no label ensured, no API mutation.
    assert.ok(!ghCalls.some((c) => (
      (c[0] === 'pr' && ['create', 'edit', 'close'].includes(c[1]))
      || (c[0] === 'label' && c[1] === 'create')
      || (c[0] === 'api' && c.includes('--method'))
    )), 'no write-shaped gh call under --dry-run');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a foreign commit on the sync branch holds the run before classification, without touching the branch or opening a comment', () => {
  const f = fixture();

  try {
    // #101 keeps the base fixture's unlabelled PR (`labels: []`), which is
    // what puts it in `toClassify` -- the candidate the hold path must move
    // to `unsure` instead of asking the model.
    f.git(f.work, ['switch', '-q', '-c', 'docs-sync/prod-docs-18.1', 'prod-docs/18.1']);
    writeFileSync(path.join(f.work, 'docs/content/guides/a.md'), 'a v1 (edited by a human on the sync branch)\n');
    f.git(f.work, ['commit', '-q', '-am', 'Human tweak on the sync branch']);
    f.git(f.work, ['push', '-q', 'origin', 'docs-sync/prod-docs-18.1']);
    f.git(f.work, ['switch', '-q', 'develop']);

    const remoteTipBefore = f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']);

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const remoteTipAfter = f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']);

    assert.equal(remoteTipAfter, remoteTipBefore, 'the sync branch tip is unchanged');

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

    assert.ok(!ghCalls.some((c) => (
      (c[0] === 'pr' && ['create', 'edit', 'close'].includes(c[1]))
      || (c[0] === 'label' && c[1] === 'create')
      || (c[0] === 'api' && c.includes('--method'))
    )), 'no write-shaped gh call while held (the fake gh answers pr list with [], so no pull request exists to comment on)');

    const summary = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    assert.match(summary, /carries commits the bot did not make/);
    assert.match(summary, /## Skipped: needs a human decision\n\n- `[0-9a-f]{7}` Fix a typo in guide a[^\n]*\(#101\)[^\n]*Not classified/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a conflicting cherry-pick reports itself and blocks the push, even under an include label', () => {
  const f = fixture();

  try {
    // Force PR 101 to carry the include label.
    const script = readFileSync(f.fakeGh, 'utf8').replace('labels: []', 'labels: n === 101 ? [{ name: "docs-sync: include" }] : []');

    writeFileSync(f.fakeGh, script);

    // Make the pick of #101 conflict: prod-docs/18.1 changes the same file
    // that #101 changes, from the same base content, to something else.
    f.git(f.work, ['switch', '-q', 'prod-docs/18.1']);
    writeFileSync(path.join(f.work, 'docs/content/guides/a.md'), 'a v1 (hotfixed directly on prod)\n');
    f.git(f.work, ['commit', '-q', '-am', 'Hotfix guide a directly on prod']);
    f.git(f.work, ['switch', '-q', 'develop']);
    f.git(f.work, ['push', '-q', 'origin', 'prod-docs/18.1']);

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']), '', 'no branch pushed when everything conflicts');

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

    assert.ok(!ghCalls.some((c) => c[0] === 'pr' && c[1] === 'create'), 'no pull request when everything conflicts');
    assert.ok(!ghCalls.some((c) => c[0] === 'pr' && c[1] === 'close'), 'the run does not close a pull request it never opened');

    const summary = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    assert.match(summary, /## Skipped: conflict\n\n- `[0-9a-f]{7}` Fix a typo in guide a \(#101\)/);
    assert.match(summary, /1 commit\(s\) conflict with prod-docs\/18\.1; nothing applied, manual port needed/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});
