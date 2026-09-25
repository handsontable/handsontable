import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { reviewFiles } from '../visual-diff-report.mjs';

// What the `visual-diff-report` artifact carries. A reviewer downloads it when the hosted report is
// unreachable, and on a fork pull request it is the only place the images are, so it has to hold every
// image the report shows for a difference, and nothing the report shows for a passing screenshot — that
// half is the tier's golden set twice over. The workflow half (the staging step and the upload share a
// condition and a directory) is pinned in .github/scripts/__tests__/visual-diff-report.test.mjs.

const PACKAGE_ROOT = join(import.meta.dirname, '..', '..');
const CHANGED = 'js/chromium-theme-main/multi-frameworks/filters/escaping-the-menu-12.png';
const ADDED = 'js/chromium-theme-main/multi-frameworks/new-demo-1.png';
const DELETED = 'js/chromium-theme-main/multi-frameworks/old-demo-1.png';
const PASSED = 'js/chromium-theme-main/multi-frameworks/basic-1.png';

/**
 * A reg-suit-shaped report: every bucket reg-cli writes, relative directory names included.
 *
 * @param {object} [overrides] Keys to replace.
 * @returns {object} The report.
 */
function report(overrides = {}) {
  return {
    failedItems: [CHANGED],
    newItems: [ADDED],
    deletedItems: [DELETED],
    passedItems: [PASSED],
    expectedItems: [CHANGED, DELETED, PASSED],
    actualItems: [CHANGED, ADDED, PASSED],
    diffItems: [CHANGED],
    actualDir: 'actual',
    expectedDir: 'expected',
    diffDir: 'diff',
    ...overrides,
  };
}

test('a changed item brings its three images, a new one its render, a deleted one its golden', () => {
  const { files, refused } = reviewFiles(report());

  assert.deepEqual(files, [
    'index.html',
    'out.json',
    `expected/${CHANGED}`,
    `actual/${CHANGED}`,
    `diff/${CHANGED}`,
    `actual/${ADDED}`,
    `expected/${DELETED}`,
  ]);
  assert.deepEqual(refused, []);
});

test('a passing screenshot contributes nothing', () => {
  const { files } = reviewFiles(report({
    failedItems: [], newItems: [], deletedItems: [], diffItems: [], passedItems: [PASSED, CHANGED],
  }));

  assert.deepEqual(files, ['index.html', 'out.json'], 'a clean report still ships the report itself');
  assert.ok(!files.some(file => file.endsWith(PASSED)));
});

test('the directories come from the report, so the staged tree matches the paths index.html uses', () => {
  const { files } = reviewFiles(report({ actualDir: 'a', expectedDir: 'e/', diffDir: 'd' }));

  assert.ok(files.includes(`e/${CHANGED}`), 'a trailing slash must not double the separator');
  assert.ok(files.includes(`a/${CHANGED}`));
  assert.ok(files.includes(`d/${CHANGED}`));

  // reg-cli always writes them; a report without them falls back to reg-suit's own names.
  const bare = report();

  delete bare.actualDir;
  delete bare.expectedDir;
  delete bare.diffDir;
  assert.deepEqual(reviewFiles(bare).files, reviewFiles(report()).files);
});

test('the diff image is the one reg-cli lists, not one derived from the item name', () => {
  // reg-cli swaps the extension for `.png`; listing what it wrote keeps that rule in reg-cli.
  const { files } = reviewFiles(report({ failedItems: ['js/a/b.jpg'], diffItems: ['js/a/b.png'] }));

  assert.ok(files.includes('diff/js/a/b.png'));
  assert.ok(!files.includes('diff/js/a/b.jpg'));
});

test('a path that leaves the working directory is refused, not staged', () => {
  const { files, refused } = reviewFiles(report({
    failedItems: ['../../etc/passwd'], newItems: ['/etc/hosts'], deletedItems: ['C:/x.png'], diffItems: [],
  }));

  assert.deepEqual(refused, ['expected/../../etc/passwd', 'actual/../../etc/passwd']);
  assert.ok(!files.some(file => file.includes('..')));
  // A leading slash after the directory prefix is still inside it; only the prefix-free forms escape.
  assert.ok(files.includes('actual//etc/hosts'));
  assert.ok(files.includes('expected/C:/x.png'));
  assert.deepEqual(reviewFiles(report({ actualDir: '/tmp', failedItems: [], diffItems: [] })).refused,
    [`/tmp/${ADDED}`]);
  assert.deepEqual(reviewFiles(report({ expectedDir: '..', failedItems: [], diffItems: [] })).refused,
    [`../${DELETED}`]);
});

test('each file is listed once, and a missing report stages nothing', () => {
  const { files } = reviewFiles(report({ failedItems: [CHANGED, CHANGED], newItems: [CHANGED] }));

  assert.equal(files.filter(file => file === `actual/${CHANGED}`).length, 1);
  assert.deepEqual(reviewFiles(null), { files: [], refused: [] });
  // A malformed bucket is ignored rather than thrown on: the artifact is for reading, never a verdict.
  assert.deepEqual(reviewFiles({ failedItems: 'x', newItems: [null, 7] }).files, ['index.html', 'out.json']);
});

/**
 * A `.reg/` directory holding the report, its manifest, and every image the report names, passing ones too.
 *
 * @param {object|null} manifest The `out.json` to write, or `null` for none.
 * @param {string[]} [skip] Files to leave out of the tree.
 * @returns {{regDir: string, destination: string}} The working directory and an unused destination.
 */
function workspace(manifest, skip = []) {
  const dir = mkdtempSync(join(tmpdir(), 'visual-diff-report-'));
  const regDir = join(dir, '.reg');
  const files = ['index.html', `expected/${CHANGED}`, `actual/${CHANGED}`, `diff/${CHANGED}`, `actual/${ADDED}`,
    `expected/${DELETED}`, `expected/${PASSED}`, `actual/${PASSED}`, 'comment.md'];

  files.filter(file => !skip.includes(file)).forEach((file) => {
    mkdirSync(dirname(join(regDir, file)), { recursive: true });
    writeFileSync(join(regDir, file), file);
  });

  if (manifest) {
    writeFileSync(join(regDir, 'out.json'), JSON.stringify(manifest));
  } else {
    mkdirSync(regDir, { recursive: true });
  }

  return { regDir, destination: join(dir, 'staged') };
}

/**
 * Every file under a directory, relative to it.
 *
 * @param {string} dir The directory.
 * @returns {string[]} The files, sorted.
 */
function tree(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => relative(dir, join(entry.parentPath, entry.name)).split('\\').join('/'))
    .sort();
}

/**
 * Run the script as the workflow does, with `VISUAL_GATE_DIR` pointing it at the fixture.
 *
 * @param {string} regDir The working directory.
 * @param {string[]} args The arguments.
 * @returns {{status: number, stdout: string, stderr: string}} What it did.
 */
function stage(regDir, args) {
  return spawnSync(process.execPath, [join(PACKAGE_ROOT, 'scripts', 'stage-diff-report.mjs'), ...args], {
    env: { PATH: process.env.PATH, VISUAL_GATE_DIR: regDir },
    encoding: 'utf8',
  });
}

test('the script copies exactly the review set, byte for byte, and leaves the passing images behind', () => {
  const { regDir, destination } = workspace(report());
  const result = stage(regDir, [destination]);

  try {
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(tree(destination), [...reviewFiles(report()).files].sort());
    assert.equal(readFileSync(join(destination, `diff/${CHANGED}`), 'utf8'), `diff/${CHANGED}`);
    assert.deepEqual(JSON.parse(readFileSync(join(destination, 'out.json'), 'utf8')), report());
    assert.doesNotMatch(result.stdout, /::warning/);
    assert.match(result.stdout, /Visual diff report: 7 file\(s\), 0\.0 MB, staged in /);
  } finally {
    rmSync(dirname(regDir), { recursive: true, force: true });
  }
});

test('a file the report names but .reg lacks is a warning, and the rest still stages', () => {
  const { regDir, destination } = workspace(report(), [`diff/${CHANGED}`]);
  const result = stage(regDir, [destination]);

  try {
    assert.equal(result.status, 0, 'the artifact is for reading: a gap never fails the job');
    assert.match(result.stdout, /::warning title=Visual diff report::1 file\(s\) the report names are not in /);
    assert.ok(tree(destination).includes(`actual/${CHANGED}`));
    assert.ok(!tree(destination).includes(`diff/${CHANGED}`));
  } finally {
    rmSync(dirname(regDir), { recursive: true, force: true });
  }
});

test('a refused path is a warning, and nothing outside .reg is copied', () => {
  // `actual/../outside.png`: a copy that followed it would read `.reg/outside.png` and write
  // `staged/outside.png`, both inside the fixture, so the test can see the escape without touching tmpdir.
  const { regDir, destination } = workspace(report({ newItems: ['../outside.png'] }));

  writeFileSync(join(regDir, 'outside.png'), 'outside');

  const result = stage(regDir, [destination]);

  try {
    assert.equal(result.status, 0);
    assert.match(result.stdout, /::warning title=Visual diff report::1 path\(s\) in out\.json leave the working /);
    assert.ok(!tree(destination).includes('outside.png'));
    assert.ok(tree(destination).includes(`actual/${CHANGED}`), 'the rest of the report still stages');
  } finally {
    rmSync(dirname(regDir), { recursive: true, force: true });
  }
});

test('no out.json stages nothing and says why, without failing the job', () => {
  const { regDir, destination } = workspace(null);
  const result = stage(regDir, [destination]);

  try {
    assert.equal(result.status, 0);
    assert.match(result.stdout, /No comparison result read .*there is no diff report to stage\./);
    // No `index.html` either: a report without its manifest describes nothing this run compared.
    assert.deepEqual(tree(destination), []);
    assert.doesNotMatch(result.stdout, /::warning/, 'the upload step warns about the empty artifact itself');
  } finally {
    rmSync(dirname(regDir), { recursive: true, force: true });
  }
});

test('a missing or non-empty destination is refused, and nothing in it is touched', () => {
  const { regDir, destination } = workspace(report());

  try {
    const bare = stage(regDir, []);

    assert.equal(bare.status, 1);
    assert.match(bare.stderr, /Usage: node visual-tests\/scripts\/stage-diff-report\.mjs <destination>/);

    mkdirSync(destination);
    writeFileSync(join(destination, 'keep.txt'), 'keep');

    const occupied = stage(regDir, [destination]);

    assert.equal(occupied.status, 1);
    assert.match(occupied.stderr, /Refusing to stage into .*: the directory is not empty\./);
    assert.deepEqual(tree(destination), ['keep.txt']);
  } finally {
    rmSync(dirname(regDir), { recursive: true, force: true });
  }
});
