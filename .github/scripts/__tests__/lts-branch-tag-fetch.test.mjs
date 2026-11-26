import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// `stable-merge` runs "Move version tag to post-merge master commit" and then
// "Create LTS branch for previous even major version". The first step moves the
// remote `X.0.0` tag with the API; the checkout still holds the old local tag.
// A bare `git fetch --tags origin` in the second step then dies with
// `! [rejected] 19.0.0 -> 19.0.0 (would clobber existing tag)` and, because every
// later job needs `stable-merge`, nothing is built or published. The fetch has to
// touch only the previous major's tags, with force.

const publishYml = readFileSync(path.join(repoRoot(), '.github/workflows/publish.yml'), 'utf8');
const STEP_NAME = 'Create LTS branch for previous even major version';

/**
 * The body of a named step, from its `- name:` line to the next step.
 *
 * @param {string} name The step name.
 * @returns {string} The step body.
 */
function step(name) {
  const lines = publishYml.split('\n');
  const start = lines.findIndex(line => new RegExp(`^\\s+- name:\\s*${name}\\s*$`).test(line));

  assert.notEqual(start, -1, `publish.yml: no step named "${name}"`);

  let end = lines.length;

  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s+- name:\s/.test(lines[i])) { end = i; break; }
  }

  return lines.slice(start, end).join('\n');
}

/**
 * The `git fetch` command lines of the LTS step, comments dropped.
 *
 * @returns {string[]} The command lines.
 */
function fetchLines() {
  return step(STEP_NAME)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('git fetch'));
}

/**
 * Runs git in a directory.
 *
 * @param {string} cwd The working directory.
 * @param {string[]} args The git arguments.
 * @returns {string} The trimmed stdout.
 */
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

test('the LTS step fetches only the previous major tags, with force', () => {
  const lines = fetchLines();

  assert.equal(lines.length, 1, 'publish.yml: the LTS step must have exactly one `git fetch`');
  assert.doesNotMatch(lines[0], /--tags/, 'publish.yml: a bare `git fetch --tags` also fetches the moved version tag');
  assert.match(lines[0], /--force|\s\+refs\/tags\//, 'publish.yml: the tag fetch must be forced');
  assert.match(lines[0], /refs\/tags\/\$\{PREV_MAJOR\}\.\*/, 'publish.yml: the tag fetch must be scoped to the previous major');
});

test('the LTS step fetch survives a version tag moved on the remote', () => {
  const [fetchLine] = fetchLines();
  const dir = mkdtempSync(path.join(tmpdir(), 'lts-tag-fetch-'));

  try {
    const origin = path.join(dir, 'origin');
    const clone = path.join(dir, 'clone');
    const commit = (cwd, file) => {
      writeFileSync(path.join(cwd, file), file);
      git(cwd, 'add', file);
      git(cwd, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-m', file);

      return git(cwd, 'rev-parse', 'HEAD');
    };

    git(dir, 'init', '--quiet', origin);
    const lastOfPreviousMajor = commit(origin, 'a');

    git(origin, 'tag', '18.1.3');
    commit(origin, 'b');
    git(origin, 'tag', '19.0.0');
    git(dir, 'clone', '--quiet', origin, clone);

    // The "Move version tag" step: the remote tag moves, the clone keeps the old one.
    const moved = commit(origin, 'c');

    git(origin, 'tag', '--force', '19.0.0', moved);

    assert.throws(
      () => git(clone, 'fetch', '--tags', 'origin'),
      /would clobber existing tag/,
      'the old command must fail here, or this test proves nothing'
    );

    execFileSync('bash', ['-e', '-c', fetchLine], {
      cwd: clone,
      env: { ...process.env, PREV_MAJOR: '18' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const tags = git(clone, 'tag', '--list', '18.*');

    assert.equal(tags, '18.1.3');
    assert.equal(git(clone, 'rev-parse', '18.1.3^{commit}'), lastOfPreviousMajor);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
