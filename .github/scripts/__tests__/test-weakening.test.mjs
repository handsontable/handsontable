import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countAssertions, countSkipFocus, detectWeakening, parseNameStatus,
} from '../lib/test-weakening.mjs';

test('countAssertions counts expect() and assert/verify helpers', () => {
  assert.equal(countAssertions('expect(a).toBe(1); expect(b).toBe(2);'), 2);
  assert.equal(countAssertions('assertGridState(x); verifyCell(y);'), 2);
  assert.equal(countAssertions('const x = 1;'), 0);
});

test('countSkipFocus counts .skip/.only and x/f prefixed forms', () => {
  assert.equal(countSkipFocus('it.only(() => {}); describe.skip(() => {});'), 2);
  assert.equal(countSkipFocus('xit("a"); fdescribe("b"); xdescribe("c");'), 3);
  assert.equal(countSkipFocus('it("normal", () => {});'), 0);
});

test('detectWeakening flags removed assertions', () => {
  const before = 'it("x", () => { expect(a).toBe(1); expect(b).toBe(2); });';
  const after = 'it("x", () => { expect(a).toBe(1); });';
  const { findings, severity } = detectWeakening(before, after);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, 'assertions-removed');
  assert.equal(severity, 'warn');
});

test('detectWeakening escalates to flag when source also changed', () => {
  const before = 'expect(a).toBe(1); expect(b).toBe(2);';
  const after = 'expect(a).toBe(1);';
  const { severity } = detectWeakening(before, after, { sourceChanged: true });

  assert.equal(severity, 'flag');
});

test('detectWeakening flags a newly added skip', () => {
  const before = 'it("x", () => { expect(a).toBe(1); });';
  const after = 'it.skip("x", () => { expect(a).toBe(1); });';
  const { findings } = detectWeakening(before, after);

  assert.ok(findings.some(f => f.type === 'skip-or-focus-added'));
});

test('detectWeakening is quiet when assertions grow and nothing is skipped', () => {
  const before = 'expect(a).toBe(1);';
  const after = 'expect(a).toBe(1); expect(b).toBe(2);';
  const { findings, severity } = detectWeakening(before, after, { sourceChanged: true });

  assert.equal(findings.length, 0);
  assert.equal(severity, 'ok');
});

test('detectWeakening flags a NEWLY ADDED spec born with a skip (diffed against empty)', () => {
  // The gaming move the gate exists for: a new spec satisfies the presence gate
  // while .skip means it never runs. Added files are compared against ''.
  const added = 'it.skip("x", () => { expect(a).toBe(1); }); xit("y", () => {});';
  const { findings, severity } = detectWeakening('', added, { sourceChanged: true });

  assert.ok(findings.some(f => f.type === 'skip-or-focus-added'));
  assert.equal(findings.find(f => f.type === 'skip-or-focus-added').after, 2);
  assert.equal(severity, 'flag');
});

test('detectWeakening stays quiet for a healthy newly added spec', () => {
  // Growing from empty must never read as "assertions removed".
  const added = 'it("x", async() => { expect(a).toBe(1); expect(b).toBe(2); });';
  const { findings, severity } = detectWeakening('', added, { sourceChanged: true });

  assert.equal(findings.length, 0);
  assert.equal(severity, 'ok');
});

test('parseNameStatus handles modified, added, and renamed rows', () => {
  const rows = parseNameStatus([
    'M\ttests/e2e/grid.spec.ts',
    'A\ttests/e2e/new.spec.ts',
    'R100\ttests/e2e/old.spec.ts\ttests/e2e/renamed.spec.ts',
  ].join('\n'));

  assert.deepEqual(rows[0], { status: 'M', oldPath: 'tests/e2e/grid.spec.ts', path: 'tests/e2e/grid.spec.ts' });
  assert.deepEqual(rows[1], { status: 'A', oldPath: 'tests/e2e/new.spec.ts', path: 'tests/e2e/new.spec.ts' });
  // Renames keep the OLD path for the base-side read — comparing a renamed spec
  // against empty would false-positive its pre-existing skips as newly added.
  assert.deepEqual(rows[2], { status: 'R', oldPath: 'tests/e2e/old.spec.ts', path: 'tests/e2e/renamed.spec.ts' });
});

test('parseNameStatus returns no rows for empty input', () => {
  assert.deepEqual(parseNameStatus(''), []);
  assert.deepEqual(parseNameStatus(null), []);
});
