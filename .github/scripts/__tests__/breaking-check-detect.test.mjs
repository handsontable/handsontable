import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_NAME_THRESHOLD, detect } from '../lib/breaking-check/detect.mjs';

const diff = (filePath, removed) => ({
  path: filePath,
  text: [
    `diff --git a/${filePath} b/${filePath}`, `--- a/${filePath}`, `+++ b/${filePath}`, '@@ -1,2 +1,1 @@',
    ...removed.map((l) => `-${l}`),
  ].join('\n'),
});

const goneEverywhere = () => { throw Object.assign(new Error('no match'), { status: 1 }); };
const methodDiff = [diff('handsontable/src/plugins/p/p.ts', ['  oldMethod() {'])];
const jevReturning = (noul) => ({ ask: async () => ({ answers: { c0: { type: 'noul', noul } } }) });

test('the threshold is the calibrated 0.04', () => {
  assert.equal(PUBLIC_NAME_THRESHOLD, 0.04);
});

test('a score of 0.04 flags and 0.039 does not', async () => {
  const at = await detect({ allFiles: methodDiff, git: goneEverywhere, ref: 'HEAD', jevClient: jevReturning(0.04) });
  const below = await detect({ allFiles: methodDiff, git: goneEverywhere, ref: 'HEAD', jevClient: jevReturning(0.039) });

  assert.equal(at.flagged, true);
  assert.equal(at.jevUsed, true);
  assert.deepEqual(at.removedNames.map((n) => [n.name, n.publicScore]), [['oldMethod', 0.04]]);
  assert.equal(below.flagged, false);
  assert.deepEqual(below.removedNames, []);
  assert.equal(below.candidateCount, 1);
  assert.equal(below.sentToJev, 1);
});

test('a name that still exists is not flagged and Jev is not asked', async () => {
  const jevClient = { ask: async () => { throw new Error('should not be called'); } };
  const result = await detect({ allFiles: methodDiff, git: () => '', ref: 'HEAD', jevClient });

  assert.equal(result.flagged, false);
  assert.equal(result.candidateCount, 0);
  assert.equal(result.sentToJev, 0);
});

test('a metaSchema default change flags without any removed name', async () => {
  const allFiles = [diff('handsontable/src/dataMap/metaManager/metaSchema.ts', ['  undo: true,'])];
  // `undo` still exists elsewhere, so it is not a gone name.
  const result = await detect({ allFiles, git: () => '', ref: 'HEAD', jevClient: null });

  assert.equal(result.defaultsTouched, true);
  assert.equal(result.flagged, true);
  assert.deepEqual(result.removedNames, []);
  assert.match(result.defaultsEvidence, /undo: true/);
});

test('without a Jev client, every gone candidate counts and scores are null', async () => {
  const result = await detect({ allFiles: methodDiff, git: goneEverywhere, ref: 'HEAD', jevClient: null });

  assert.equal(result.jevUsed, false);
  assert.equal(result.flagged, true);
  assert.deepEqual(result.removedNames.map((n) => [n.name, n.publicScore]), [['oldMethod', null]]);
});

test('a Jev error warns and falls back to code-only', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const jevClient = { ask: async () => { throw new Error('boom'); } };
  const result = await detect({ allFiles: methodDiff, git: goneEverywhere, ref: 'HEAD', jevClient });

  assert.equal(result.jevUsed, false);
  assert.equal(result.flagged, true);
  assert.equal(result.removedNames[0].publicScore, null);
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /boom/);
});

test('a missing or non-numeric answer flags generously with a null score', async () => {
  const missing = await detect({
    allFiles: methodDiff, git: goneEverywhere, ref: 'HEAD', jevClient: { ask: async () => ({ answers: {} }) },
  });
  const garbled = await detect({
    allFiles: methodDiff,
    git: goneEverywhere,
    ref: 'HEAD',
    jevClient: { ask: async () => ({ answers: { c0: { type: 'noul', noul: 'high' } } }) },
  });

  for (const result of [missing, garbled]) {
    assert.equal(result.flagged, true);
    assert.equal(result.jevUsed, true);
    assert.deepEqual(result.removedNames.map((n) => [n.name, n.publicScore]), [['oldMethod', null]]);
  }
});

test('only the first 40 gone candidates are scored, and the rest stay visible as unscoredNames', async () => {
  const removed = Array.from({ length: 45 }, (_, i) => `  method${i}() {`);
  const allFiles = [diff('handsontable/src/plugins/p/p.ts', removed)];
  const answers = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`c${i}`, { type: 'noul', noul: 0.5 }]));
  const result = await detect({
    allFiles, git: goneEverywhere, ref: 'HEAD', jevClient: { ask: async () => ({ answers }) },
  });

  assert.equal(result.candidateCount, 45);
  assert.equal(result.sentToJev, 40);
  assert.equal(result.removedNames.length, 40);
  assert.deepEqual(result.unscoredNames.map((n) => n.name), ['method40', 'method41', 'method42', 'method43', 'method44']);
});

test('declared signals are read from all files, including a breaking changelog entry', async () => {
  const entry = {
    path: '.changelogs/1.json',
    text: 'diff --git a/.changelogs/1.json b/.changelogs/1.json\n--- /dev/null\n+++ b/.changelogs/1.json\n@@ -0,0 +1 @@\n+  "breaking": true',
  };
  const result = await detect({ allFiles: [...methodDiff, entry], git: goneEverywhere, ref: 'HEAD', jevClient: null });

  assert.equal(result.declared.breakingEntry, true);
  assert.equal(result.flagged, true);
});
