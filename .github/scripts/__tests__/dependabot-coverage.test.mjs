import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

/**
 * Dependabot opens a security fix PR only for a lockfile that an `updates` block
 * covers, and `allow`/`ignore` filter security updates as well as version
 * updates. Alerts piled up for months while the only block allowed
 * `@playwright/test` alone. These tests pin the coverage so a new lockfile, or a
 * narrowing filter, fails here instead of going quiet in the alert list.
 *
 * Text-based, not YAML-parsed: no YAML parser is a dependency of the repo root.
 */

const root = repoRoot();
const config = readFileSync(path.join(root, '.github/dependabot.yml'), 'utf8');
const LOCKFILE_NAMES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];

/**
 * Split the config into its `updates` blocks, comments stripped.
 *
 * @returns {string[]} One source chunk per `- package-ecosystem:` block.
 */
function updateBlocks() {
  const source = config
    .split('\n')
    .filter(line => !/^\s*#/.test(line))
    .join('\n');

  return source.split(/^\s*-\s+package-ecosystem:/m).slice(1);
}

/**
 * Read the quoted string items of a YAML list key inside a block.
 *
 * @param {string} block One `updates` block.
 * @param {string} key The list key, e.g. `directories` or `exclude-patterns`.
 * @returns {string[]|null} The items, or null when the block has no such list.
 */
function listOf(block, key) {
  const list = block.match(new RegExp(`^(\\s*)${key}:\\s*\\n((?:\\1\\s+-\\s*"[^"]+"\\s*\\n)+)`, 'm'));

  return list ? [...list[2].matchAll(/"([^"]+)"/g)].map(m => m[1]) : null;
}

/**
 * Read the directory patterns a block declares, from `directory:` or `directories:`.
 *
 * @param {string} block One `updates` block.
 * @returns {string[]} Directory patterns, each starting with `/`.
 */
function directoriesOf(block) {
  const single = block.match(/^\s*directory:\s*"([^"]+)"/m);

  if (single) {
    return [single[1]];
  }

  const list = listOf(block, 'directories');

  assert.ok(list, `block declares neither directory nor directories:\n${block}`);

  return list;
}

/**
 * Match a repo directory against a Dependabot pattern where `*` is one path segment.
 *
 * @param {string} pattern Dependabot directory pattern.
 * @param {string} dir Repo directory, `/`-rooted.
 * @returns {boolean}
 */
function matches(pattern, dir) {
  const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+')}$`);

  return regex.test(dir);
}

const blocks = updateBlocks();
const patterns = blocks.flatMap(directoriesOf);
const lockfileDirs = execFileSync('git', ['ls-files', ...LOCKFILE_NAMES.flatMap(name => [name, `**/${name}`])], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .map(file => `/${path.posix.dirname(file)}`.replace(/^\/\.$/, '/'));

test('the config declares at least one updates block', () => {
  assert.ok(blocks.length > 0, '.github/dependabot.yml has no updates blocks');
});

test('every committed lockfile is covered by an updates block', () => {
  const uncovered = lockfileDirs.filter(dir => !patterns.some(pattern => matches(pattern, dir)));

  assert.deepEqual(
    uncovered,
    [],
    `lockfiles without a Dependabot block get no security fix PRs: ${uncovered.join(', ')}`
  );
});

test('every configured directory pattern resolves to a committed lockfile', () => {
  const empty = patterns.filter(pattern => !lockfileDirs.some(dir => matches(pattern, dir)));

  assert.deepEqual(
    empty,
    [],
    `a directory without a lockfile gets manifest-only PRs that fail the frozen-lockfile install: ${empty.join(', ')}`
  );
});

test('no block narrows security updates with allow or ignore', () => {
  blocks.forEach((block) => {
    assert.doesNotMatch(
      block,
      /^\s*(allow|ignore):/m,
      `allow/ignore also filter security updates, which hides alerts from Dependabot:\n${block}`
    );
  });
});

test('every block is security-only and groups its security fixes', () => {
  blocks.forEach((block) => {
    assert.match(
      block,
      /^\s*open-pull-requests-limit:\s*0\s*$/m,
      `version updates must stay off (open-pull-requests-limit: 0):\n${block}`
    );
    assert.match(
      block,
      /^\s*applies-to:\s*security-updates\s*$/m,
      `security fixes must be grouped into one PR:\n${block}`
    );
  });
});

test('every security group keeps Playwright out', () => {
  blocks.forEach((block) => {
    const excluded = listOf(block, 'exclude-patterns') ?? [];

    ['@playwright/*', 'playwright', 'playwright-core'].forEach((name) => {
      assert.ok(
        excluded.includes(name),
        `${name} must be excluded: a Playwright bump fails playwright-version-sync.test.mjs and would hold back every other fix in the group:\n${block}`
      );
    });
  });
});
