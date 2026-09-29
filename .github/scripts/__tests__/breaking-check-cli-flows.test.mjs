import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MARKER, renderCleared } from '../lib/breaking-check/comment.mjs';
import { repoRoot } from '../lib/repo-root.mjs';

const script = path.join(repoRoot(), '.github/scripts/breaking-check.mjs');

const result = (overrides = {}) => ({
  removedNames: [{ name: 'gone', kind: 'option', file: 'f.ts', line: '', publicScore: null }],
  defaultsTouched: false,
  defaultsEvidence: null,
  declared: { breakingEntry: false, removedRegistryTouched: false, deprecationWarnAdded: false },
  flagged: true,
  jevUsed: false,
  candidateCount: 1,
  sentToJev: 0,
  unscoredNames: [],
  ...overrides,
});

/**
 * Run the CLI with `--from-json ... --comment 5` against a stub `gh` first on
 * PATH. The stub records every call and answers the comment listing with
 * `existing`.
 *
 * @returns {string[][]} The recorded `gh` calls.
 */
function runComment(saved, existing) {
  const dir = mkdtempSync(path.join(tmpdir(), 'breaking-check-gh-'));
  const bin = path.join(dir, 'bin');
  const log = path.join(dir, 'calls.log');
  const canned = path.join(dir, 'canned.json');
  const input = path.join(dir, 'result.json');

  mkdirSync(bin);
  writeFileSync(log, '');
  writeFileSync(canned, JSON.stringify([existing]));
  writeFileSync(input, JSON.stringify(saved));
  writeFileSync(path.join(bin, 'gh'), [
    '#!/usr/bin/env node',
    "const fs = require('node:fs');",
    'const args = process.argv.slice(2);',
    'fs.appendFileSync(process.env.GH_STUB_LOG, `${JSON.stringify(args)}\\n`);',
    "if (args.includes('--slurp')) { process.stdout.write(fs.readFileSync(process.env.GH_STUB_CANNED, 'utf8')); }",
    '',
  ].join('\n'));
  chmodSync(path.join(bin, 'gh'), 0o755);

  execFileSync(process.execPath, [script, '--from-json', input, '--comment', '5'], {
    encoding: 'utf8',
    env: {
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      GITHUB_REPOSITORY: 'o/r',
      GH_STUB_LOG: log,
      GH_STUB_CANNED: canned,
    },
  });

  return readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
}

const bot = { login: 'github-actions[bot]' };
const writes = (calls) => calls.filter((args) => args.includes('--method'));

test('a flagged result posts the advisory comment when none exists', () => {
  const calls = runComment(result(), []);

  assert.equal(writes(calls).length, 1);
  assert.deepEqual(writes(calls)[0].slice(0, 4), ['api', '--method', 'POST', 'repos/o/r/issues/5/comments']);
  assert.match(writes(calls)[0][5], new RegExp(`^body=${MARKER}\\n### Possible breaking change`));
});

test('a flagged result updates the bot comment in place', () => {
  const calls = runComment(result(), [{ id: 7, body: `${MARKER}\nold`, user: bot }]);

  assert.deepEqual(writes(calls)[0].slice(0, 4), ['api', '--method', 'PATCH', 'repos/o/r/issues/comments/7']);
});

test('a result that no longer flags rewrites the bot comment to the cleared text', () => {
  const clean = result({ flagged: false, removedNames: [] });
  const calls = runComment(clean, [{ id: 7, body: `${MARKER}\nold`, user: bot }]);

  assert.deepEqual(writes(calls), [
    ['api', '--method', 'PATCH', 'repos/o/r/issues/comments/7', '-f', `body=${MARKER}\n${renderCleared(clean)}`],
  ]);
});

test('a declared breaking entry rewrites the bot comment with that reason', () => {
  const declared = result({ declared: { breakingEntry: true } });
  const calls = runComment(declared, [{ id: 7, body: `${MARKER}\nold`, user: bot }]);

  assert.match(writes(calls)[0][5], /now declares this breaking change/);
});

test('nothing is written when the result is clean and no marker comment exists', () => {
  const calls = runComment(result({ flagged: false, removedNames: [] }), [{ id: 1, body: 'unrelated', user: bot }]);

  assert.equal(writes(calls).length, 0);
});

test('nothing is written when the bot comment already holds the cleared text', () => {
  const clean = result({ flagged: false, removedNames: [] });
  const calls = runComment(clean, [{ id: 7, body: `${MARKER}\n${renderCleared(clean)}`, user: bot }]);

  assert.equal(writes(calls).length, 0);
});

test('a marker pasted by another user is never edited', () => {
  const clean = result({ flagged: false, removedNames: [] });
  const calls = runComment(clean, [{ id: 3, body: `${MARKER}\nspoof`, user: { login: 'someone' } }]);

  assert.equal(writes(calls).length, 0);
});
