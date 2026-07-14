import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countAssertions, countSkipFocus, detectWeakening } from '../lib/test-weakening.mjs';

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
