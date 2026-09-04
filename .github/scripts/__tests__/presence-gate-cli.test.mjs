import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// End-to-end runs of the presence-gate CLI against a throwaway git repository,
// with the environment the `presence` job in checks.yml hands it (GATE_BASE =
// the base SHA, GATE_MODE, GITHUB_ACTIONS). The lib tests pin each detector on
// synthetic diffs; these pin the plumbing between `git diff` and the detectors
// — which files reach them — and that the verdict is untouched by it.

const CLI = path.join(repoRoot(), '.github/scripts/test-presence-gate.mjs');

/**
 * A git environment that ignores the developer's own configuration and the
 * variables a hook exports (a `GIT_DIR` from a lefthook run would point every
 * child at the wrong repository).
 */
const GIT_ENV = (() => {
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Presence Gate Test',
    GIT_AUTHOR_EMAIL: 'presence-gate@test.invalid',
    GIT_COMMITTER_NAME: 'Presence Gate Test',
    GIT_COMMITTER_EMAIL: 'presence-gate@test.invalid',
  };

  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;
  delete env.GATE_BASE;
  delete env.GATE_MODE;
  delete env.GATE_PR_BODY;
  delete env.GATE_PR_BODY_FILE;

  return env;
})();

const SOURCE = 'handsontable/src/tableView.ts';
const PAGE_OBJECT = 'tests/fixtures/pages/GridPage.ts';
const SPEC = 'tests/e2e/overlays.spec.ts';
const DOC = 'docs/content/guides/rtl.md';
const RTL_SOURCE_LINE = '  if (this.hot.isRtl()) { offset = -offset; }\n';

/**
 * Run git in the repository.
 *
 * @param {string} cwd The repository root.
 * @param {...string} args Git arguments.
 * @returns {string} Trimmed stdout.
 */
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, env: GIT_ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/**
 * Write a file under the repository, creating its directories.
 *
 * @param {string} root The repository root.
 * @param {string} file Repo-relative path.
 * @param {string} content File content.
 * @param {{append?: boolean}} [options] `append` adds to an existing file.
 */
function write(root, file, content, { append = false } = {}) {
  const target = path.join(root, file);

  mkdirSync(path.dirname(target), { recursive: true });
  (append ? appendFileSync : writeFileSync)(target, content);
}

/**
 * Build a repository with a base commit holding a source file, a page object,
 * a Playwright spec, and a docs page, then a head commit that adds RTL logic
 * to the source plus whatever the scenario appends to the other files.
 *
 * @param {{pageObject?: string, spec?: string, doc?: string, source?: string}} head Lines appended in the head commit.
 * @returns {{root: string, base: string}} The repository root and the base SHA.
 */
function buildRepo(head) {
  const root = mkdtempSync(path.join(tmpdir(), 'presence-gate-cli-'));

  git(root, 'init', '-q');
  write(root, SOURCE, 'export class TableView {\n  render() {}\n}\n');
  write(root, PAGE_OBJECT, 'export class GridPage {\n  async goto() {}\n}\n');
  write(root, SPEC, 'test(\'renders\', async() => {\n  await grid.goto();\n});\n');
  write(root, DOC, '# Layout direction\n');
  write(root, 'pnpm-lock.yaml', 'lockfileVersion: 9\n');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'base');

  const base = git(root, 'rev-parse', 'HEAD');

  write(root, SOURCE, head.source ?? RTL_SOURCE_LINE, { append: true });

  for (const [file, line] of [[PAGE_OBJECT, head.pageObject], [SPEC, head.spec], [DOC, head.doc]]) {
    if (line !== undefined) {
      write(root, file, line, { append: true });
    }
  }
  write(root, 'pnpm-lock.yaml', 'packages:\n  rtl-polyfill: 1.0.0\n', { append: true });
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'head');

  return { root, base };
}

/**
 * Run the CLI the way the `presence` job does.
 *
 * @param {{root: string, base: string}} repo The repository.
 * @param {{mode?: string}} [options] `mode` — GATE_MODE (default 'warn', as in CI).
 * @returns {{status: number|null, stdout: string, stderr: string}} The run.
 */
function runGate({ root, base }, { mode = 'warn' } = {}) {
  const result = spawnSync(process.execPath, [CLI], {
    cwd: root,
    encoding: 'utf8',
    env: { ...GIT_ENV, GATE_BASE: base, GATE_MODE: mode, GITHUB_ACTIONS: 'true' },
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const PAIRING_LINE = '  async initRtlGrid() { return this.initGrid({ layoutDirection: \'rtl\' }); }\n';
const SILENT_LINE = '  async reload() { await this.goto(); }\n';
const SPEC_LINE = '  await grid.expectCell(0, 0, \'A1\');\n';

test('an RTL source change paired only by a page object under tests/** raises no rtl-correlation warning through the CLI', () => {
  // The spec change is coverage for the verdict; it never mentions RTL, so the
  // page object is the only thing that can pair the source change.
  const run = runGate(buildRepo({ pageObject: PAIRING_LINE, spec: SPEC_LINE }), { mode: 'block' });

  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /✅ Pass\./);
  assert.doesNotMatch(run.stdout, /rtl-correlation/, `the page object pairs the change:\n${run.stdout}`);
  assert.doesNotMatch(run.stderr, /rtl-correlation/, 'no ::warning annotation either');
  assert.doesNotMatch(run.stdout, /Advisory warnings skipped/, 'the wider pathspec still reads cleanly');
});

test('the same change with a page object that never mentions RTL warns — the detector runs, and the pairing came from the page object', () => {
  const run = runGate(buildRepo({ pageObject: SILENT_LINE, spec: SPEC_LINE }), { mode: 'block' });

  assert.equal(run.status, 0, 'advisories never touch the exit code');
  assert.match(run.stdout, /✅ Pass\./);
  assert.match(run.stdout, /⚠️ \*\*rtl-correlation\*\*/);
  assert.match(run.stdout, new RegExp(`- \`${SOURCE.replace(/\//g, '\\/')}\``));
  assert.match(run.stderr, /^::warning title=Test-presence gate \(rtl-correlation\)::/m);
});

test('an RTL mention in a docs page does not pair the source change — the pathspec admits tests/**, not everything', () => {
  const run = runGate(buildRepo({ doc: 'Handsontable supports RTL layouts.\n', spec: SPEC_LINE }));

  assert.equal(run.status, 0);
  assert.match(run.stdout, /rtl-correlation/, 'prose is not coverage');
});

test('a page object change is advisory input, not coverage: the blocking verdict is unchanged', () => {
  // Source + page object, no spec: the gate must still say "missing coverage"
  // and exit 1 in block mode. Widening the advisory pathspec must never widen
  // what the verdict accepts.
  const paired = runGate(buildRepo({ pageObject: PAIRING_LINE }), { mode: 'block' });

  assert.equal(paired.status, 1, paired.stdout);
  assert.match(paired.stdout, /❌ Source changed with no matching test change/);
  assert.match(paired.stdout, new RegExp(`- \`${SOURCE.replace(/\//g, '\\/')}\``));
  assert.doesNotMatch(paired.stdout, /rtl-correlation/, 'the page object still pairs the RTL logic below a red verdict');

  const warnMode = runGate(buildRepo({ pageObject: PAIRING_LINE }));

  assert.equal(warnMode.status, 0, 'warn mode reports and exits 0');
  assert.match(warnMode.stdout, /❌ Source changed with no matching test change/);
});
