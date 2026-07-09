import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNewJasmineSpec } from '../../../.github/scripts/lib/presence-gate.mjs';
import { sessionEditsFile, stopVerdict } from '../session.mjs';

test('sessionEditsFile is per-session and sanitized', () => {
  const a = sessionEditsFile('abc-123');
  const b = sessionEditsFile('abc-123');
  const c = sessionEditsFile('other/../id');

  assert.equal(a, b, 'same id → same path');
  assert.notEqual(a, c);
  assert.match(c, /other_+id\.edits$/, 'unsafe chars replaced');
});

test('stopVerdict blocks on a NEW Jasmine spec created this turn', () => {
  const v = stopVerdict(
    [{ status: 'A', path: 'handsontable/src/plugins/filters/__tests__/new.spec.js' }],
    isNewJasmineSpec,
  );

  assert.equal(v.block, true);
  assert.equal(v.reason, 'new-jasmine-spec');
});

test('stopVerdict does NOT block on source-without-test (pre-push/CI owns existence)', () => {
  const v = stopVerdict(
    [{ status: 'M', path: 'handsontable/src/plugins/filters/filters.ts' }],
    isNewJasmineSpec,
  );

  assert.equal(v.block, false);
});

test('stopVerdict does NOT block on a new Playwright spec or a modified Jasmine spec', () => {
  const newPlaywright = [{ status: 'A', path: 'tests/e2e/x.spec.ts' }];
  const modifiedJasmine = [{ status: 'M', path: 'handsontable/src/plugins/filters/__tests__/filters.spec.js' }];

  assert.equal(stopVerdict(newPlaywright, isNewJasmineSpec).block, false);
  assert.equal(stopVerdict(modifiedJasmine, isNewJasmineSpec).block, false);
});
