import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The three scripts that apply the quarantine, run as CI runs them. The libs they call are unit-tested on
// their own; what only a spawn can prove is the wiring in between: that the gate and the nightly actually
// partition before they judge, that the nightly does it in the full tier alone, that an unreadable file
// fails closed with its reason and still leaves a comment and a summary behind, and that the record goes
// out whatever happens to the quarantine.

const PACKAGE_ROOT = join(import.meta.dirname, '..', '..');
const ITEM = 'js/chromium-theme-main-dark/multi-frameworks/filters/escaping-the-menu-12.png';
// Live against the real clock, which is the one the scripts read.
const EXPIRES = new Date(Date.now() + (10 * 86400000)).toISOString().slice(0, 10);
const LIVE = {
  entries: [{
    taskId: 'DEV-1234',
    expires: EXPIRES,
    capture: 'multi-frameworks/filters/escaping-the-menu-12',
    legs: ['js/chromium-theme-main-dark'],
    why: 'focus timer',
  }],
};

/**
 * A working directory holding one `out.json` whose only difference is the quarantinable item.
 *
 * @param {object} [quarantine] The quarantine file to write beside it, when any.
 * @returns {{dir: string, quarantineFile: string}} The directory and the quarantine path in it.
 */
function workspace(quarantine) {
  const dir = mkdtempSync(join(tmpdir(), 'visual-quarantine-scripts-'));
  const quarantineFile = join(dir, 'visual-quarantine.json');

  writeFileSync(join(dir, 'out.json'), JSON.stringify({
    failedItems: [ITEM], newItems: [], deletedItems: [], passedItems: ['js/chromium/a-1.png'],
  }));

  if (quarantine) {
    writeFileSync(quarantineFile, JSON.stringify(quarantine));
  }

  return { dir, quarantineFile };
}

/**
 * Run one script with an environment built from scratch, so a CI job's own `GITHUB_OUTPUT` and
 * `GITHUB_STEP_SUMMARY` never receive what the script writes here.
 *
 * @param {string} script The script under `visual-tests/scripts/`.
 * @param {string} dir The working directory, as `VISUAL_GATE_DIR`.
 * @param {object} env The variables that differ per case.
 * @returns {{status: number, stdout: string, stderr: string, output: string, summary: string}} What it did.
 */
function run(script, dir, env) {
  const output = join(dir, 'github-output');
  const summary = join(dir, 'step-summary');

  writeFileSync(output, '');
  writeFileSync(summary, '');

  const result = spawnSync(process.execPath, [join(PACKAGE_ROOT, 'scripts', script)], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      VISUAL_GATE_DIR: dir,
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
      GITHUB_REF_NAME: 'develop',
      GITHUB_SHA: '0123456789abcdef0123',
      ...env,
    },
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    output: readFileSync(output, 'utf8'),
    summary: readFileSync(summary, 'utf8'),
  };
}

test('the gate partitions before it judges: a live entry makes the only difference clean', () => {
  const { dir, quarantineFile } = workspace(LIVE);
  const result = run('visual-gate.mjs', dir, { VISUAL_QUARANTINE_FILE: quarantineFile });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.output, /^verdict=clean$/m);
  assert.match(readFileSync(join(dir, 'comment.md'), 'utf8'), /### Quarantined — reported, not blocking/);
  rmSync(dir, { recursive: true });
});

test('the gate reads no quarantine unless one is named, as the docs suite runs it', () => {
  const { dir } = workspace(LIVE);
  const result = run('visual-gate.mjs', dir, {});

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.output, /^verdict=changed$/m, 'the difference is judged as a difference');
  assert.doesNotMatch(readFileSync(join(dir, 'comment.md'), 'utf8'), /uarantine/);
  rmSync(dir, { recursive: true });
});

test('an unreadable quarantine fails the gate closed, with the reason, and still writes the comment', () => {
  const { dir, quarantineFile } = workspace();
  const result = run('visual-gate.mjs', dir, { VISUAL_QUARANTINE_FILE: quarantineFile });

  assert.equal(result.status, 1);
  assert.match(result.output, /^verdict=error$/m);
  assert.match(readFileSync(join(dir, 'comment.md'), 'utf8'), /could not apply the quarantine/);
  assert.match(result.stderr, /VISUAL_QUARANTINE_FILE/, 'the hint names the file, not the comparison step');
  rmSync(dir, { recursive: true });
});

test('the nightly partitions in the full tier, and the seed never does', () => {
  const full = workspace(LIVE);
  const nightly = run('seed-report.mjs', full.dir, {
    VISUAL_TIER: 'full',
    VISUAL_QUARANTINE_FILE: full.quarantineFile,
  });

  assert.equal(nightly.status, 0, nightly.stderr);
  assert.match(nightly.output, /^verdict=clean$/m);
  assert.match(nightly.summary, /### Quarantined — reported, not blocking/);
  assert.match(nightly.stdout, /::warning title=Quarantined capture \(DEV-1234\)::/);
  rmSync(full.dir, { recursive: true });

  const push = workspace(LIVE);
  const seed = run('seed-report.mjs', push.dir, { VISUAL_TIER: 'seed', VISUAL_QUARANTINE_FILE: push.quarantineFile });

  assert.equal(seed.status, 0, 'a seed never fails on a difference');
  assert.match(seed.output, /^verdict=changed$/m, 'the seed reports the difference as the merge\'s own');
  assert.doesNotMatch(seed.summary, /uarantine/);
  rmSync(push.dir, { recursive: true });
});

test('an unreadable quarantine fails the nightly, and the summary still says what differed and why', () => {
  const { dir, quarantineFile } = workspace();
  const result = run('seed-report.mjs', dir, { VISUAL_TIER: 'full', VISUAL_QUARANTINE_FILE: quarantineFile });

  assert.equal(result.status, 1);
  assert.match(result.summary, /escaping-the-menu-12\.png/, 'the unpartitioned differences are listed');
  assert.match(result.summary, /The quarantine could not be applied, so this run fails/);
  assert.match(result.output, /^verdict=/m, 'the outputs are still written for the later steps');
  rmSync(dir, { recursive: true });
});

test('the record stamps a live entry, and goes out unstamped when the quarantine cannot be read', () => {
  const stamped = workspace(LIVE);

  mkdirSync(join(stamped.dir, 'actual', 'js/chromium-theme-main-dark/multi-frameworks/filters'), { recursive: true });
  writeFileSync(join(stamped.dir, 'actual', ITEM), 'png bytes');
  // A deleted item differs too, so the log line counts it among what was compared.
  writeFileSync(join(stamped.dir, 'out.json'), JSON.stringify({
    failedItems: [ITEM], newItems: [], deletedItems: ['js/chromium/gone-1.png'], passedItems: ['js/chromium/a-1.png'],
  }));

  const env = { VISUAL_TIER: 'pr', HEAD_SHA: 'feedfacecafebeef' };
  const first = run('compare-record.mjs', stamped.dir, { ...env, VISUAL_QUARANTINE_FILE: stamped.quarantineFile });
  const record = JSON.parse(readFileSync(join(stamped.dir, 'visual-compare-pr-feedfacecafe.json'), 'utf8'));

  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /Visual compare record: 2 differing item\(s\) of 3 compared/);
  assert.equal(record.items[0].quarantine, `DEV-1234 until ${EXPIRES} — focus timer`);
  assert.match(record.items[0].actualSha256, /^[0-9a-f]{64}$/);
  rmSync(stamped.dir, { recursive: true });

  const broken = workspace();
  const second = run('compare-record.mjs', broken.dir, { ...env, VISUAL_QUARANTINE_FILE: broken.quarantineFile });
  const files = readdirSync(broken.dir).filter(name => name.startsWith('visual-compare-'));

  assert.equal(second.status, 0, 'the record never fails the job');
  assert.match(second.stdout, /::warning title=Visual compare record::The quarantine was not applied/);
  assert.deepEqual(files, ['visual-compare-pr-feedfacecafe.json'], 'the ledger does not lose the run');
  assert.equal(JSON.parse(readFileSync(join(broken.dir, files[0]), 'utf8')).items[0].quarantine, null);
  assert.ok(!existsSync(join(broken.dir, 'comment.md')), 'the record writes nothing but itself');
  rmSync(broken.dir, { recursive: true });
});
