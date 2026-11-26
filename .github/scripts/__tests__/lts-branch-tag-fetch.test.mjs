import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, steps } from '../lib/workflow-text.mjs';

// `stable-merge` runs "Move version tag to post-merge master commit" and then
// "Create LTS branch for previous even major version". The first step moves the
// remote `X.0.0` tag with the API; the checkout still holds the old local tag.
// A bare `git fetch --tags origin` after that dies with
// `! [rejected] 19.0.0 -> 19.0.0 (would clobber existing tag)` and, because every
// later job needs `stable-merge`, nothing is built or published. Any tag fetch after
// the move has to touch only the previous major's tags, with force.

const publishYml = readFileSync(path.join(repoRoot(), '.github/workflows/publish.yml'), 'utf8');
const MOVE_STEP = 'Move version tag to post-merge master commit';
const LTS_STEP = 'Create LTS branch for previous even major version';

// A developer's global git config can sign commits or set core.hooksPath, and a git hook
// exports GIT_DIR; either would make the fixture depend on the machine (same isolation as
// breaking-check-git.test.mjs). LC_ALL=C keeps git's messages in English for the assertion.
const GIT_ENV = {
  ...process.env,
  LC_ALL: 'C',
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'lts-tag-fetch test',
  GIT_AUTHOR_EMAIL: 'lts-tag-fetch@test.invalid',
  GIT_COMMITTER_NAME: 'lts-tag-fetch test',
  GIT_COMMITTER_EMAIL: 'lts-tag-fetch@test.invalid',
};

delete GIT_ENV.GIT_DIR;
delete GIT_ENV.GIT_WORK_TREE;
delete GIT_ENV.GIT_INDEX_FILE;

/**
 * The steps of the `stable-merge` job.
 *
 * @returns {string[]} One entry per step.
 */
function stableMergeSteps() {
  const found = steps(job(publishYml, 'stable-merge'));

  assert.ok(found.length > 0, 'publish.yml: no steps found in the stable-merge job');

  return found;
}

/**
 * The index of a named step in the `stable-merge` job.
 *
 * @param {string[]} found The job's steps.
 * @param {string} name The step name.
 * @returns {number} The index.
 */
function indexOfStep(found, name) {
  const index = found.findIndex(body => new RegExp(`^- name:\\s*${name}\\s*$`, 'm').test(body));

  assert.notEqual(index, -1, `publish.yml: no step named "${name}" in stable-merge`);

  return index;
}

/**
 * The command lines of a step that start with `git fetch`, comments dropped.
 *
 * @param {string} body The step body.
 * @returns {string[]} The command lines.
 */
function fetchLines(body) {
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('git fetch'));
}

/**
 * Runs git in a directory, isolated from the host's git config.
 *
 * @param {string} cwd The working directory.
 * @param {string[]} args The git arguments.
 * @returns {string} The trimmed stdout.
 */
function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    env: GIT_ENV,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

test('no step after the version tag move runs a bare tag fetch', () => {
  const found = stableMergeSteps();
  const afterMove = found.slice(indexOfStep(found, MOVE_STEP) + 1);

  assert.ok(afterMove.length > 0, 'publish.yml: expected steps after the version tag move');

  for (const body of afterMove) {
    for (const line of fetchLines(body)) {
      assert.doesNotMatch(
        line,
        /--tags/,
        `publish.yml: "${line}" also fetches the version tag the previous step moved`
      );
    }
  }
});

test('the LTS step fetches only the previous major tags, with force', () => {
  const found = stableMergeSteps();
  const lines = fetchLines(found[indexOfStep(found, LTS_STEP)]);

  assert.equal(lines.length, 1, 'publish.yml: the LTS step must have exactly one `git fetch`');
  assert.match(lines[0], /--force|\s\+refs\/tags\//, 'publish.yml: the tag fetch must be forced');
  assert.match(
    lines[0],
    /refs\/tags\/\$\{?PREV_MAJOR\}?\.\*/,
    'publish.yml: the tag fetch must be scoped to the previous major'
  );
});

test('the LTS step fetch survives a version tag moved on the remote', () => {
  const found = stableMergeSteps();
  const [fetchLine] = fetchLines(found[indexOfStep(found, LTS_STEP)]);
  const dir = mkdtempSync(path.join(tmpdir(), 'lts-tag-fetch-'));

  try {
    const origin = path.join(dir, 'origin');
    const clone = path.join(dir, 'clone');
    const commit = (cwd, file) => {
      writeFileSync(path.join(cwd, file), file);
      git(cwd, 'add', file);
      git(cwd, 'commit', '--quiet', '--no-gpg-sign', '-m', file);

      return git(cwd, 'rev-parse', 'HEAD');
    };

    git(dir, 'init', '--quiet', origin);
    commit(origin, 'a');
    git(origin, 'tag', '18.1.2');
    const lastOfPreviousMajor = commit(origin, 'b');

    git(origin, 'tag', '18.1.3');
    commit(origin, 'c');
    git(origin, 'tag', '19.0.0');
    git(dir, 'clone', '--quiet', origin, clone);

    // The "Move version tag" step: the remote version tag moves, the clone keeps the old one.
    // A previous-major tag moving too is what `--force` is for.
    const moved = commit(origin, 'd');

    git(origin, 'tag', '--force', '19.0.0', moved);
    git(origin, 'tag', '--force', '18.1.2', moved);

    assert.throws(
      () => git(clone, 'fetch', '--tags', 'origin'),
      /would clobber existing tag/,
      'the old command must fail here, or this test proves nothing'
    );

    execFileSync('bash', ['-e', '-c', fetchLine], {
      cwd: clone,
      env: { ...GIT_ENV, PREV_MAJOR: '18' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    assert.equal(git(clone, 'rev-parse', '18.1.3^{commit}'), lastOfPreviousMajor);
    assert.equal(git(clone, 'rev-parse', '18.1.2^{commit}'), moved, 'a moved previous-major tag must be updated');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
