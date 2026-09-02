import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOUNDED_MATCHERS, EXACT_MATCHERS, countAssertions, countSkipFocus, detectMatcherDowngrade,
  detectPrecisionWidening, detectWeakening, formatFinding, matcherHistogram, parseNameStatus,
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
  assert.equal(findings[0].kind, 'assertions-removed');
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

  assert.ok(findings.some(f => f.kind === 'skip-or-focus-added'));
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

  assert.ok(findings.some(f => f.kind === 'skip-or-focus-added'));
  assert.equal(findings.find(f => f.kind === 'skip-or-focus-added').after, 2);
  assert.equal(severity, 'flag');
});

test('detectWeakening stays quiet for a healthy newly added spec', () => {
  // Growing from empty must never read as "assertions removed".
  const added = 'it("x", async() => { expect(a).toBe(1); expect(b).toBe(2); });';
  const { findings, severity } = detectWeakening('', added, { sourceChanged: true });

  assert.equal(findings.length, 0);
  assert.equal(severity, 'ok');
});

test('EXACT_MATCHERS and BOUNDED_MATCHERS are disjoint tables pinning the documented split', () => {
  const overlap = EXACT_MATCHERS.filter(matcher => BOUNDED_MATCHERS.includes(matcher));

  assert.deepEqual(overlap, []);
  assert.ok(EXACT_MATCHERS.includes('toBe'));
  assert.ok(EXACT_MATCHERS.includes('toHaveBeenCalledTimes'));
  assert.ok(BOUNDED_MATCHERS.includes('toBeGreaterThanOrEqual'));
  assert.ok(BOUNDED_MATCHERS.includes('toBeCloseTo'));
  assert.ok(Object.isFrozen(EXACT_MATCHERS));
  assert.ok(Object.isFrozen(BOUNDED_MATCHERS));
});

test('matcherHistogram counts each matcher by name without confusing shared prefixes', () => {
  // `toBe(` must not swallow `toBeGreaterThan(`, `toMatch(` must not swallow
  // `toMatchObject(`, `toContain(` must not swallow `toContainEqual(`; `.not.`
  // and a chain broken across lines still count.
  const src = `
    expect(a).toBe(1);
    expect(b).not.toBe(2);
    expect(c)
      .toBeGreaterThan(0);
    expect(d).toMatch(/x/);
    expect(e).toMatchObject({ x: 1 });
    expect(f).toContain('a');
    expect(g).toContainEqual({ a: 1 });
    expect(spy).toHaveBeenCalledTimes(3);
  `;

  assert.deepEqual(matcherHistogram(src), {
    toBe: 2,
    toBeGreaterThan: 1,
    toMatch: 1,
    toMatchObject: 1,
    toContain: 1,
    toContainEqual: 1,
    toHaveBeenCalledTimes: 1,
  });
  assert.deepEqual(matcherHistogram(''), {});
  assert.deepEqual(matcherHistogram(null), {});
});

test('detectMatcherDowngrade flags exact → bounded even when the assertion count ROSE', () => {
  // The first real miss: `toHaveBeenCalledTimes(300)` became
  // `toBeGreaterThanOrEqual(300)` while a third assertion was added, so the
  // count-only detector saw growth and stayed silent.
  const before = `
    it('renders every row once', async() => {
      expect(renderSpy).toHaveBeenCalledTimes(300);
      expect(countRows()).toBe(300);
    });
  `;
  const after = `
    it('renders every row once', async() => {
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(300);
      expect(countRows()).toBe(300);
      expect(countCols()).toBe(10);
    });
  `;

  assert.ok(countAssertions(after) > countAssertions(before), 'premise: the assertion count rose');

  assert.deepEqual(detectMatcherDowngrade(before, after), {
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'toHaveBeenCalledTimes', from: 1, to: 0 }],
    boundedRises: [{ matcher: 'toBeGreaterThanOrEqual', from: 0, to: 1 }],
  });

  const { findings, severity } = detectWeakening(before, after, { sourceChanged: true });

  assert.ok(!findings.some(f => f.kind === 'assertions-removed'), 'the count detector stays quiet here');
  assert.ok(findings.some(f => f.kind === 'matcher-downgrade'));
  assert.equal(severity, 'flag');
});

test('detectMatcherDowngrade flags a deleted exact assertion replaced by a loose one (count FLAT)', () => {
  // The second real miss: a committed-value `toBe` was deleted while another
  // assertion was added, so the count stayed flat.
  const before = `
    expect(getDataAtCell(1, 1)).toBe('committed');
    expect(isEditorOpened()).toBe(false);
  `;
  const after = `
    expect(isEditorOpened()).toBe(false);
    expect(getDataAtCell(1, 1)).toBeDefined();
  `;

  assert.equal(countAssertions(before), countAssertions(after), 'premise: the assertion count is flat');

  assert.deepEqual(detectMatcherDowngrade(before, after), {
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'toBe', from: 2, to: 1 }],
    boundedRises: [{ matcher: 'toBeDefined', from: 0, to: 1 }],
  });

  const { findings } = detectWeakening(before, after);

  assert.deepEqual(findings.map(f => f.kind), ['matcher-downgrade']);
});

test('detectMatcherDowngrade is quiet on a pure addition of assertions', () => {
  const before = 'expect(a).toBe(1);';
  const after = 'expect(a).toBe(1); expect(b).toEqual([1]); expect(c).toBeGreaterThan(0); expect(d).toContain(1);';

  assert.equal(detectMatcherDowngrade(before, after), null);

  const { findings, severity } = detectWeakening(before, after, { sourceChanged: true });

  assert.deepEqual(findings, []);
  assert.equal(severity, 'ok');
});

test('detectMatcherDowngrade is quiet when a non-matcher assertion helper is renamed', () => {
  const before = 'verifyCell(0, 0, "A1"); expect(x).toBe(1);';
  const after = 'verifyCellValue(0, 0, "A1"); expect(x).toBe(1);';

  assert.equal(detectMatcherDowngrade(before, after), null);
  assert.deepEqual(detectWeakening(before, after).findings, []);
});

test('detectMatcherDowngrade is quiet on an exact → exact change (toBe → toEqual)', () => {
  const before = 'expect(a).toBe(1); expect(b).toBe(2);';
  const after = 'expect(a).toEqual(1); expect(b).toEqual(2);';

  assert.equal(detectMatcherDowngrade(before, after), null);
  assert.deepEqual(detectWeakening(before, after).findings, []);
});

test('detectMatcherDowngrade is quiet when a file only ADDS a bounded matcher with no exact drop', () => {
  const before = 'expect(a).toBe(1);';
  const after = 'expect(a).toBe(1); expect(b).toBeGreaterThan(0);';

  assert.equal(detectMatcherDowngrade(before, after), null);
  assert.deepEqual(detectWeakening(before, after).findings, []);
});

test('detectMatcherDowngrade leaves an exact drop with no bounded rise to the count detector', () => {
  // A plain removal is already reported as `assertions-removed`; reporting it
  // twice would only add noise.
  const before = 'expect(a).toBe(1); expect(b).toBe(2);';
  const after = 'expect(a).toBe(1);';

  assert.equal(detectMatcherDowngrade(before, after), null);
  assert.deepEqual(detectWeakening(before, after).findings.map(f => f.kind), ['assertions-removed']);
});

test('detectPrecisionWidening flags toBeCloseTo digits going down', () => {
  const before = 'expect(width).toBeCloseTo(expected, 5);';
  const after = 'expect(width).toBeCloseTo(expected, 2);';

  assert.deepEqual(detectPrecisionWidening(before, after), {
    kind: 'precision-widened',
    widenings: [{ from: 5, to: 2 }],
  });

  const { findings } = detectWeakening(before, after);

  assert.deepEqual(findings.map(f => f.kind), ['precision-widened']);
});

test('detectPrecisionWidening ignores tightening, unchanged calls, and a non-literal digits argument', () => {
  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y, 2);',
    'expect(x).toBeCloseTo(y, 5);',
  ), null, 'tightening is not weakening');

  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(Math.max(a, b), 5);',
    'expect(x).toBeCloseTo(Math.max(a, b), 5);',
  ), null, 'a comma inside the first argument is not a digits argument');

  assert.deepEqual(detectPrecisionWidening(
    'expect(x).toBeCloseTo(Math.max(a, b), 5);',
    'expect(x).toBeCloseTo(Math.max(a, b), 3);',
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 3 }] });

  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y, 5);',
    'expect(x).toBeCloseTo(y, digits);',
  ), null, 'a digits argument that is not an integer literal cannot be judged, so it never flags');
});

test('detectPrecisionWidening reads the digits argument past an escaped quote in the first argument', () => {
  // The argument scanner skips string literals. An escaped quote inside one
  // (`'a\'b'`) must not end the literal early — otherwise the stray closing
  // quote opens a second "string" that runs to end of file, the list never
  // closes, and a real widening goes unreported. `String.raw` keeps each input
  // byte-for-byte what the spec file would contain.
  assert.deepEqual(detectPrecisionWidening(
    String.raw`expect(x).toBeCloseTo(f('a\'b'), 5);`,
    String.raw`expect(x).toBeCloseTo(f('a\'b'), 2);`,
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 2 }] }, 'escaped single quote');

  // One escaped quote, deliberately: with an even count a broken scanner falls
  // back into sync by accident and the case would pass without the fix.
  assert.deepEqual(detectPrecisionWidening(
    String.raw`expect(x).toBeCloseTo(g("5\" tall"), 4);`,
    String.raw`expect(x).toBeCloseTo(g("5\" tall"), 1);`,
  ), { kind: 'precision-widened', widenings: [{ from: 4, to: 1 }] }, 'escaped double quote');

  // An escaped backslash right before the closing quote (`'a\\'`) must consume
  // only its own partner, so the quote that follows still closes the literal.
  assert.deepEqual(detectPrecisionWidening(
    String.raw`expect(x).toBeCloseTo(f('a\\'), 5);`,
    String.raw`expect(x).toBeCloseTo(f('a\\'), 3);`,
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 3 }] }, 'escaped backslash before the closing quote');
});

test('detectPrecisionWidening treats an omitted digits argument as the default of 2', () => {
  // Jest and Jasmine both default `numDigits` to 2, so dropping the argument
  // from `toBeCloseTo(x, 5)` widens the tolerance.
  assert.deepEqual(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y, 5);',
    'expect(x).toBeCloseTo(y);',
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 2 }] });

  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y);',
    'expect(x).toBeCloseTo(y, 2);',
  ), null);
});

test('formatFinding renders every finding kind as one readable line', () => {
  assert.equal(formatFinding({ kind: 'assertions-removed', before: 5, after: 4 }), 'assertions 5 → 4');
  assert.equal(formatFinding({ kind: 'skip-or-focus-added', before: 0, after: 1 }), 'skip/focus markers 0 → 1');
  assert.equal(formatFinding({
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'toHaveBeenCalledTimes', from: 1, to: 0 }],
    boundedRises: [{ matcher: 'toBeGreaterThanOrEqual', from: 0, to: 1 }],
  }), 'matcher downgrade — exact toHaveBeenCalledTimes 1 → 0; bounded toBeGreaterThanOrEqual 0 → 1');
  assert.equal(formatFinding({
    kind: 'precision-widened',
    widenings: [{ from: 5, to: 2 }],
  }), 'toBeCloseTo precision widened — 5 → 2 digits');
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
