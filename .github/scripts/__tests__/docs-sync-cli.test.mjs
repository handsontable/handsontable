import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  execFileSync, spawn, spawnSync,
} from 'node:child_process';
import {
  chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import {
  cacheKey, promptHash, loadPrompt,
} from '../lib/docs-sync/classify.mjs';
import { STATE_MARKER } from '../lib/docs-sync/pr-body.mjs';

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
  // A pending changelog entry on develop, so the classifier's read of
  // `.changelogs/` (via `git ls-tree`/`git show` against origin/develop, not
  // the local working tree) has something to find.
  write('.changelogs/13000.json', `${JSON.stringify({
    issuesOrigin: 'private', title: 'Added X.', type: 'added', issueOrPR: 13000, breaking: false, framework: 'none',
  })}\n`);
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

  // Fake gh: records argv, answers driven by `answers.json` (path in
  // FAKE_GH_ANSWERS) so a test configures behavior by writing that file
  // instead of patching the script's own source.
  const ghDir = path.join(root, 'bin');
  const ghLog = path.join(root, 'gh.log');
  const fakeGh = path.join(ghDir, 'gh');
  const answersPath = path.join(root, 'answers.json');

  mkdirSync(ghDir);
  writeFileSync(answersPath, '{}');
  writeFileSync(fakeGh, [
    '#!/usr/bin/env node',
    'const fs = require("node:fs");',
    `fs.appendFileSync(${JSON.stringify(ghLog)}, JSON.stringify(process.argv.slice(2)) + "\\n");`,
    'const a = process.argv.slice(2);',
    'let answers = {};',
    'try { answers = JSON.parse(fs.readFileSync(process.env.FAKE_GH_ANSWERS, "utf8")); } catch {}',
    'const pulls404All = answers.pulls404 === true || process.env.FAKE_GH_PULLS_404 === "1";',
    'const pulls404Some = Array.isArray(answers.pulls404) ? answers.pulls404 : [];',
    'if (a[0] === "api" && /pulls\\/\\d+$/.test(a[1])) {',
    '  const n = Number(a[1].split("/").pop());',
    '  if (pulls404All || pulls404Some.includes(n)) { process.stderr.write("Not Found (HTTP 404)"); process.exit(1); }',
    '  if (answers.openPr && n === answers.openPr.number) {',
    '    process.stdout.write(JSON.stringify({ number: n, title: `PR ${n}`, body: answers.openPr.body ?? "", labels: [], user: { login: "someone" } }));',
    '  } else {',
    '    const includeLabels = answers.includeLabels || [];',
    '    const skipLabels = answers.skipLabels || [];',
    '    const labels = includeLabels.includes(n) ? [{ name: "docs-sync: include" }] : (skipLabels.includes(n) ? [{ name: "docs-sync: skip" }] : []);',
    '    process.stdout.write(JSON.stringify({ number: n, title: `PR ${n}`, body: "", labels, user: { login: "someone" } }));',
    '  }',
    '} else if (a[0] === "pr" && a[1] === "list" && a.includes("--label")) {',
    '  process.stdout.write(JSON.stringify(answers.labelledPrs || []));',
    '} else if (a[0] === "pr" && a[1] === "list") {',
    '  const openPr = answers.openPr;',
    '  process.stdout.write(JSON.stringify(openPr ? [{ number: openPr.number, url: openPr.url }] : []));',
    '} else if (a[0] === "pr" && a[1] === "create") {',
    '  process.stdout.write("https://github.com/o/r/pull/200");',
    '} else if (a[0] === "api" && /\\/comments$/.test(a[1]) && a.includes("--slurp")) {',
    '  process.stdout.write("[[]]");',
    '} else if (a[0] === "api" && /\\/labels\\//.test(a[1])) {',
    '  const name = decodeURIComponent(a[1].split("/labels/").pop());',
    '  const existingLabels = answers.existingLabels || [];',
    '  if (!existingLabels.includes(name)) { process.stderr.write("Not Found (HTTP 404)"); process.exit(1); }',
    '  process.stdout.write(JSON.stringify({ name }));',
    '} else { process.stdout.write(""); }',
  ].join('\n'));
  chmodSync(fakeGh, 0o755);

  return {
    root, work, origin, git, contentOnly, handPicked, ghLog, fakeGh, answersPath,
  };
}

/**
 * Configure the fake `gh` for one run by writing `answers.json`. See the
 * fake gh script in `fixture()` for the keys it reads.
 *
 * @param {object} f Fixture returned by `fixture()`.
 * @param {object} answers
 */
function writeAnswers(f, answers) {
  writeFileSync(f.answersPath, JSON.stringify(answers));
}

function runCli(f, extra = [], envOverrides = {}) {
  return spawnSync(process.execPath, [CLI, '--repo-dir', f.work, '--gh-bin', f.fakeGh, '--no-llm', '--skip-lint', ...extra], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_DIR: undefined,
      GH_REPO: 'o/r',
      GH_TOKEN: 'x',
      DRY_RUN: '',
      TARGET: '',
      GITHUB_STEP_SUMMARY: path.join(f.root, 'summary.md'),
      FAKE_GH_ANSWERS: f.answersPath,
      ...envOverrides,
    },
  });
}

/**
 * Spawn the CLI against an in-process fake LiteLLM server on `port`, with the
 * classifier live (no `--no-llm`). Async on purpose: `spawnSync` would block
 * this process's event loop so the in-process server could never answer.
 *
 * @param {object} f A `fixture()`.
 * @param {{ port: number, extraEnv?: object }} options
 * @returns {Promise<{ status: number, stdout: string, stderr: string }>}
 */
function spawnCli(f, { port, extraEnv = {} }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, '--repo-dir', f.work, '--gh-bin', f.fakeGh, '--skip-lint'], {
      env: {
        ...process.env,
        GIT_DIR: undefined,
        GH_REPO: 'o/r',
        GH_TOKEN: 'x',
        DRY_RUN: '',
        TARGET: '',
        GITHUB_STEP_SUMMARY: path.join(f.root, 'summary.md'),
        FAKE_GH_ANSWERS: f.answersPath,
        LITELLM_BASE_URL: `http://127.0.0.1:${port}`,
        LITELLM_API_KEY: 'test-key',
        DOCS_SYNC_MODEL: 'test-model',
        // Blanked like GIT_DIR/DRY_RUN/TARGET so an inherited value from the
        // developer's own shell (docs/AGENTS.md tells people to export these)
        // cannot flip the omitted-by-default assertions; a run that needs them
        // passes them through extraEnv.
        DOCS_SYNC_TEMPERATURE: undefined,
        DOCS_SYNC_JSON_MODE: undefined,
        ...extraEnv,
      },
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => { resolve({ status, stdout, stderr }); });
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
    assert.match(summary, /## Skipped: needs a human decision\n\n- `[0-9a-f]{7}` Fix a typo in guide a #101/);
    assert.match(summary, /## Skipped: mixed content and other changes\n\n- `[0-9a-f]{7}` Add feature with docs #102: touches source/);
    assert.match(summary, /## Skipped: version-scoped pages\n\n- `[0-9a-f]{7}` Add the 18\.2 migration guide #103/);
    assert.match(summary, /## Skipped: already on prod\n\n- `[0-9a-f]{7}` Fix guide d #104/);
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
    writeAnswers(f, { includeLabels: [101] });

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

test('the lint gate invokes eslint directly by path, not npx, and a pass lets the push through', () => {
  const f = fixture();

  try {
    // Untracked but ignored, mirroring the real `docs/.gitignore`: the CLI
    // refuses to run over a dirty working tree, and this stub must not
    // register as one.
    writeFileSync(path.join(f.work, '.git/info/exclude'), 'docs/node_modules/\n', { flag: 'a' });
    mkdirSync(path.join(f.work, 'docs/node_modules/eslint/bin'), { recursive: true });
    writeFileSync(path.join(f.work, 'docs/node_modules/eslint/bin/eslint.js'), '#!/usr/bin/env node\nprocess.exit(0);\n');

    writeAnswers(f, { includeLabels: [101] });

    const result = spawnSync(process.execPath, [CLI, '--repo-dir', f.work, '--gh-bin', f.fakeGh, '--no-llm'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_DIR: undefined,
        GH_REPO: 'o/r',
        GH_TOKEN: 'x',
        DRY_RUN: '',
        TARGET: '',
        GITHUB_STEP_SUMMARY: path.join(f.root, 'summary.md'),
        FAKE_GH_ANSWERS: f.answersPath,
      },
    });

    assert.equal(result.status, 0, result.stderr);

    const remoteTip = f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']);

    assert.match(remoteTip, /docs-sync\/prod-docs-18\.1/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a real lint failure on the rebuilt tree blocks the push', () => {
  const f = fixture();

  try {
    // Untracked but ignored, mirroring the real `docs/.gitignore`: the CLI
    // refuses to run over a dirty working tree, and this stub must not
    // register as one.
    writeFileSync(path.join(f.work, '.git/info/exclude'), 'docs/node_modules/\n', { flag: 'a' });
    mkdirSync(path.join(f.work, 'docs/node_modules/eslint/bin'), { recursive: true });
    writeFileSync(path.join(f.work, 'docs/node_modules/eslint/bin/eslint.js'), '#!/usr/bin/env node\nconsole.error("fake lint error");\nprocess.exit(1);\n');

    writeAnswers(f, { includeLabels: [101] });

    const result = spawnSync(process.execPath, [CLI, '--repo-dir', f.work, '--gh-bin', f.fakeGh, '--no-llm'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_DIR: undefined,
        GH_REPO: 'o/r',
        GH_TOKEN: 'x',
        DRY_RUN: '',
        TARGET: '',
        GITHUB_STEP_SUMMARY: path.join(f.root, 'summary.md'),
        FAKE_GH_ANSWERS: f.answersPath,
      },
    });

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /Docs lint failed|fake lint error/);
    assert.equal(f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']), '', 'nothing pushed when lint fails');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a skip label on the source pull request excludes it, with no branch pushed and no pull request opened', () => {
  const f = fixture();

  try {
    writeAnswers(f, { skipLabels: [101] });

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const summary = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    assert.match(summary, /## Excluded by the classifier\n\n- `[0-9a-f]{7}` Fix a typo in guide a #101: Labeled/);
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
    writeAnswers(f, { includeLabels: [101] });

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

test('an include-labeled candidate on a held run renders as skipped, not included', () => {
  const f = fixture();

  try {
    // Same foreign-commit setup as the hold tests below, plus an include
    // label on #101's source pull request -- #101 lands in report.included
    // during the candidate loop (which runs before the hold check), so this
    // exercises the hold path's own redirect of report.included into unsure.
    f.git(f.work, ['switch', '-q', '-c', 'docs-sync/prod-docs-18.1', 'prod-docs/18.1']);
    writeFileSync(path.join(f.work, 'docs/content/guides/a.md'), 'a v1 (edited by a human on the sync branch)\n');
    f.git(f.work, ['commit', '-q', '-am', 'Human tweak on the sync branch']);
    f.git(f.work, ['push', '-q', 'origin', 'docs-sync/prod-docs-18.1']);
    f.git(f.work, ['switch', '-q', 'develop']);

    writeAnswers(f, { includeLabels: [101] });

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const summary = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    assert.match(summary, /## Included\n\nNone\./);
    assert.match(summary, /## Skipped: needs a human decision\n\n- `[0-9a-f]{7}` Fix a typo in guide a #101: Not applied: the sync branch carries commits the bot did not make\./);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a dirty working tree refuses to rebuild the sync branch rather than discarding uncommitted edits', () => {
  const f = fixture();

  try {
    // An uncommitted edit to a tracked file, left behind exactly like a
    // developer's own local --dry-run invocation would.
    writeFileSync(path.join(f.work, 'docs/content/guides/a.md'), 'dirty, uncommitted\n');

    const result = runCli(f);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Refusing to rebuild docs-sync\/prod-docs-18\.1.*uncommitted changes/s);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a foreign commit on the sync branch holds the run before classification, without touching the branch or opening a comment', () => {
  const f = fixture();

  try {
    // #101 keeps the base fixture's unlabeled PR (`labels: []`), which is
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
    assert.match(summary, /## Skipped: needs a human decision\n\n- `[0-9a-f]{7}` Fix a typo in guide a[^\n]*#101[^\n]*Not classified/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a conflicting cherry-pick reports itself and blocks the push, even under an include label', () => {
  const f = fixture();

  try {
    writeAnswers(f, { includeLabels: [101] });

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

    assert.match(summary, /## Skipped: conflict\n\n- `[0-9a-f]{7}` Fix a typo in guide a #101/);
    assert.match(summary, /1 commit\(s\) conflict with prod-docs\/18\.1; nothing applied, manual port needed/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('an open pull request gets updated, not created', () => {
  const f = fixture();

  try {
    writeAnswers(f, {
      openPr: { number: 42, url: 'https://github.com/o/r/pull/42', body: '' },
      includeLabels: [101],
    });

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    const edit = ghCalls.find((c) => c[0] === 'pr' && c[1] === 'edit' && c[2] === '42');

    assert.ok(edit, 'pr edit 42 called');
    assert.match(edit[edit.indexOf('--body') + 1], /## Included/);
    assert.match(edit[edit.indexOf('--body') + 1], /\(#101/);
    assert.ok(!ghCalls.some((c) => c[0] === 'pr' && c[1] === 'create'), 'no pull request created when one is already open');
    assert.match(f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']), /docs-sync\/prod-docs-18\.1/, 'branch pushed');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a second run over an unchanged develop skips the push but still updates the pull request', () => {
  const f = fixture();

  try {
    writeAnswers(f, {
      includeLabels: [101],
      openPr: { number: 42, url: 'https://github.com/o/r/pull/42', body: '' },
    });

    const result1 = runCli(f);

    assert.equal(result1.status, 0, result1.stderr);

    const tipAfterFirst = f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']);

    writeFileSync(f.ghLog, '');

    // No new commits landed on develop between runs, and the fixture's
    // answers are unchanged, so the second run re-cherry-picks the exact
    // same commit onto the exact same target tip -- a byte-identical tree
    // under a fresh committer date. The push must be skipped.
    const result2 = runCli(f);

    assert.equal(result2.status, 0, result2.stderr);

    const tipAfterSecond = f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']);

    assert.equal(tipAfterSecond, tipAfterFirst, 'the sync branch is not re-pushed when its tree is unchanged');
    assert.match(result2.stdout, /skipping the push/);

    const ghCalls2 = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

    assert.ok(ghCalls2.some((c) => c[0] === 'pr' && c[1] === 'edit' && c[2] === '42'), 'the pull request is still updated even though nothing was pushed');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('zero included candidates with an open pull request closes it', () => {
  const f = fixture();

  try {
    // No labels on #101: under --no-llm it is unsure, so nothing is included
    // and nothing conflicts -- the shape that must close an open pull request.
    writeAnswers(f, { openPr: { number: 42, url: 'https://github.com/o/r/pull/42', body: '' } });

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

    assert.ok(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'close' && c[2] === '42'), 'pr close 42 called');
    assert.equal(f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']), '', 'no branch pushed');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('the rollover closes only stale bases, and never for an explicitly overridden target', () => {
  const f = fixture();

  try {
    writeAnswers(f, {
      includeLabels: [101],
      labelledPrs: [
        {
          number: 7, baseRefName: 'prod-docs/17.9', headRefName: 'docs-sync/prod-docs-17.9', url: 'u7',
        },
        {
          number: 8, baseRefName: 'prod-docs/18.1', headRefName: 'docs-sync/prod-docs-18.1', url: 'u8',
        },
      ],
    });

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

    assert.ok(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'close' && c[2] === '7'), 'the stale pull request against prod-docs/17.9 is closed');
    assert.ok(!ghCalls.some((c) => c[0] === 'pr' && c[1] === 'close' && c[2] === '8'), 'the pull request already against the current target is left alone');

    // A release cut makes prod-docs/18.2 the new highest branch. A second run
    // with an explicit --target back at 18.1 must never run the rollover.
    f.git(f.work, ['branch', 'prod-docs/18.2', 'prod-docs/18.1']);
    f.git(f.work, ['push', '-q', 'origin', 'prod-docs/18.2']);
    writeFileSync(f.ghLog, '');

    const result2 = runCli(f, ['--target', 'prod-docs/18.1']);

    assert.equal(result2.status, 0, result2.stderr);

    const ghCalls2 = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));

    assert.ok(!ghCalls2.some((c) => c[0] === 'pr' && c[1] === 'close'), 'no pull request closed when the target is set explicitly');
    assert.match(result2.stdout, /was set explicitly; skipping/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a hold with an open pull request posts the sticky comment, and leaves the sync branch untouched', () => {
  const f = fixture();

  try {
    // Same hold setup as the earlier foreign-commit test, plus an open pull request.
    f.git(f.work, ['switch', '-q', '-c', 'docs-sync/prod-docs-18.1', 'prod-docs/18.1']);
    writeFileSync(path.join(f.work, 'docs/content/guides/a.md'), 'a v1 (edited by a human on the sync branch)\n');
    f.git(f.work, ['commit', '-q', '-am', 'Human tweak on the sync branch']);
    f.git(f.work, ['push', '-q', 'origin', 'docs-sync/prod-docs-18.1']);
    f.git(f.work, ['switch', '-q', 'develop']);

    writeAnswers(f, { openPr: { number: 42, url: 'https://github.com/o/r/pull/42', body: '' } });

    const remoteTipBefore = f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']);

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const remoteTipAfter = f.git(f.work, ['ls-remote', '--heads', f.origin, 'docs-sync/prod-docs-18.1']);

    assert.equal(remoteTipAfter, remoteTipBefore, 'the sync branch tip is unchanged');

    const ghCalls = readFileSync(f.ghLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    const post = ghCalls.find((c) => c[0] === 'api' && c[1] === '--method' && c[2] === 'POST' && c[3] === 'repos/o/r/issues/42/comments');

    assert.ok(post, 'posted a comment on the open pull request');
    assert.match(post[5], /^body=<!-- docs-sync-hold -->/);
    assert.match(post[5], /## Skipped: needs a human decision/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('an invalid explicit target fails fast', () => {
  const f = fixture();

  try {
    const result = runCli(f, ['--target', 'nope']);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Target must look like prod-docs\/<major>\.<minor>/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a run whose pull request lookups all 404 refuses to continue', () => {
  const f = fixture();

  try {
    // Only #101 reaches the lookup: #102 is mixed, #103 is version-scoped,
    // #104 is already on prod, and the last commit has no pull request
    // number -- all filtered before the lookup. So this is one failure and
    // zero successes, the exact shape the mass-404 guard exists for.
    const result = runCli(f, [], { FAKE_GH_PULLS_404: '1' });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Every pull request lookup failed \(1 of 1\)/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a real 404 on one pull request lookup is recorded with a reason, and never resurrects a floating (#n)', () => {
  const f = fixture();

  try {
    // A second content-only candidate with its own pull request number, so
    // the mass-404 guard (lookupFailures > 0 && lookupSuccesses === 0) does
    // not fire: #105 succeeds normally, #101 hits a real 404 selectively --
    // the shape that exercises the per-candidate `continue` instead of the
    // mass-abort path.
    writeFileSync(path.join(f.work, 'docs/content/guides/f.md'), 'f\n');
    f.git(f.work, ['add', '-A']);
    f.git(f.work, ['commit', '-q', '-m', 'Fix guide f (#105)']);
    f.git(f.work, ['push', '-q', 'origin', 'develop']);

    writeAnswers(f, { pulls404: [101] });

    const result = runCli(f);

    assert.equal(result.status, 0, result.stderr);

    const summary = readFileSync(path.join(f.root, 'summary.md'), 'utf8');
    const section = summary.match(/## Skipped: no pull request number\n\n([\s\S]*?)\n\n##/);

    assert.ok(section, 'section rendered');

    const row101 = section[1].split('\n').find((line) => line.includes('Fix a typo in guide a'));

    assert.ok(row101, 'row for #101 present');
    assert.match(row101, /Fix a typo in guide a: No pull request #101 on GitHub\./);
    // The bug this guards: appending the note after the subject left the
    // subject's own trailing `(#101)` unstripped, so a floating `(#101)`
    // showed up a second time in the middle of the row.
    assert.doesNotMatch(row101, /\(#\d+\).*\(#\d+\)/);
    // The unaffected direct-push case (no `reason`) still renders exactly as
    // before: bare `ref(i)`, no trailing colon.
    assert.match(section[1], /`[0-9a-f]{7}` direct push without a number$/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a cached decision under the current prompt hash skips the model; a stale prompt hash does not', async() => {
  const f = fixture();
  const requests = [];
  const nextDecision = { decision: 'include', reason: 'the model decided this' };

  const server = createServer((req, res) => {
    let body = '';

    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      requests.push(JSON.parse(body));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(nextDecision) } }] }));
    });
  });

  await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });

  const { port } = server.address();
  const hash = promptHash(await loadPrompt());

  // Deliberately `spawn`, not `spawnSync`: the fake LiteLLM server above lives
  // in this same process. `spawnSync` fully blocks this process's event loop
  // until the child exits, so the server could never accept the child's
  // connection or run its request handler -- the child's fetch would hang
  // until it exhausted `llm.mjs`'s retry budget (3 attempts x 60s timeout +
  // backoff = ~183s) and then fail. Confirmed empirically: with `spawnSync`
  // here, the stale-prompt-hash run (the one that must call the model)
  // reliably took ~185s and exited 1; switching to `spawn` drops it back to
  // the sub-second range and both cache scenarios pass.
  const runWithoutNoLlm = (extraAnswers, extraEnv = {}) => {
    writeAnswers(f, extraAnswers);

    return spawnCli(f, { port, extraEnv });
  };

  try {
    // Cache hit: a prior run's state block, under the CURRENT prompt hash,
    // already has a decision for candidate #101's commit. The model must
    // not be called, and the cached decision (not the server's canned
    // answer) must be what shows up in the rendered report.
    const cachedState = {
      version: 1,
      promptHash: hash,
      decisions: { [cacheKey(f.contentOnly, hash)]: { decision: 'exclude', reason: 'cached from a prior run' } },
    };
    const cachedBody = `Prior run.\n\n<!-- ${STATE_MARKER}\n${JSON.stringify(cachedState)}\n-->`;

    const first = await runWithoutNoLlm({ openPr: { number: 500, url: 'https://github.com/o/r/pull/500', body: cachedBody } });

    assert.equal(first.status, 0, first.stderr);
    assert.equal(requests.length, 0, 'a cache hit under the current prompt hash must not call the model');

    const summary1 = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    assert.match(summary1, /## Excluded by the classifier\n\n- `[0-9a-f]{7}` Fix a typo in guide a #101: cached from a prior run/);

    // Cache invalidation: same state shape, but a stale promptHash. The
    // model must be called this time, and its answer (not the stale cache)
    // must be what shows up.
    rmSync(path.join(f.root, 'summary.md'), { force: true });

    const staleState = { ...cachedState, promptHash: 'stale0000000' };
    const staleBody = `Prior run.\n\n<!-- ${STATE_MARKER}\n${JSON.stringify(staleState)}\n-->`;

    const second = await runWithoutNoLlm({ openPr: { number: 500, url: 'https://github.com/o/r/pull/500', body: staleBody } });

    assert.equal(second.status, 0, second.stderr);
    assert.equal(requests.length, 1, 'a stale prompt hash must call the model exactly once for the one classifiable candidate');
    assert.equal(requests[0].messages[1].role, 'user');
    // With DOCS_SYNC_TEMPERATURE unset, the request omits temperature entirely,
    // and DOCS_SYNC_JSON_MODE defaults on, so response_format is sent.
    assert.ok(!('temperature' in requests[0]), 'temperature is omitted when the variable is unset');
    assert.deepEqual(requests[0].response_format, { type: 'json_object' }, 'json mode is on by default');

    const summary2 = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    assert.match(summary2, /## Included\n\n- `[0-9a-f]{7}` Fix a typo in guide a \(#101, @someone\)/);

    // DOCS_SYNC_TEMPERATURE and DOCS_SYNC_JSON_MODE reach the request body when set.
    rmSync(path.join(f.root, 'summary.md'), { force: true });

    const third = await runWithoutNoLlm(
      { openPr: { number: 500, url: 'https://github.com/o/r/pull/500', body: staleBody } },
      { DOCS_SYNC_TEMPERATURE: '0.2', DOCS_SYNC_JSON_MODE: 'off' },
    );

    assert.equal(third.status, 0, third.stderr);
    assert.equal(requests.length, 2, 'the third run calls the model again under the stale prompt hash');
    assert.equal(requests[1].temperature, 0.2, 'a configured temperature is forwarded to the request');
    assert.ok(!('response_format' in requests[1]), 'json mode off omits response_format');
  } finally {
    server.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a failed classifier call logs the whole body but bounds the step summary', async() => {
  const f = fixture();
  const bigBody = `<!DOCTYPE html><html><head><title>Blocked</title></head><body>${'Z'.repeat(20_000)}</body></html>`;
  const server = createServer((req, res) => {
    // Drain the request so the response goes out; the body itself is not needed.
    req.resume();

    req.on('end', () => {
      res.writeHead(403, {
        'Content-Type': 'text/html', 'cf-ray': 'testray-WAW', 'cf-mitigated': 'challenge', server: 'cloudflare',
      });
      res.end(bigBody);
    });
  });

  await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });

  const { port } = server.address();

  try {
    writeAnswers(f, {});

    const result = await spawnCli(f, { port });

    assert.notEqual(result.status, 0, 'the 403 aborts the run');
    // The job log (stdout) carries the response whole, including the far end of
    // the body and the Cloudflare-block hint from the headers.
    assert.ok(result.stdout.includes('Z'.repeat(20_000)), 'the full block-page body reaches the job log');
    assert.match(result.stdout, /Looks like a Cloudflare edge block/);
    assert.match(result.stdout, /cf-ray=testray-WAW/);
    assert.doesNotMatch(result.stdout, /cut for the step summary/, 'the job log is never cut');

    // The step summary is bounded and fenced, with a pointer to the uncut log.
    const summary = readFileSync(path.join(f.root, 'summary.md'), 'utf8');

    assert.match(summary, /\[cut for the step summary; full text in the job log\]/);
    assert.match(summary, /````/, 'the summary body is fenced so GitHub renders it literally');
    assert.ok(!summary.includes('Z'.repeat(20_000)), 'the summary does not carry the whole body');
  } finally {
    server.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});
