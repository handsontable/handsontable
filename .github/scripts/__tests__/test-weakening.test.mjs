import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOUNDED_MATCHERS, EXACT_MATCHERS, NEGATION_PINS, THROW_MATCHERS, countAssertions, countSkipFocus,
  countTableRows, countTestBlocks, detectMatcherDowngrade, detectPrecisionWidening, detectWeakening,
  formatFinding, matcherHistogram, matcherKind, parseNameStatus,
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
  // A parameterized opener carries its modifier like any other, and so does a
  // prefixed one — `xit.each(` used to count zero markers.
  assert.equal(countSkipFocus('it.only.each([[1]])("a", fn); test.skip.each([[1]])("b", fn);'), 2);
  assert.equal(countSkipFocus('xit.each([[1]])("a", fn); fit.each([[1]])("b", fn); xtest.each([[1]])("c", fn);'), 3);
  assert.equal(countSkipFocus('it.each([[1]])("a", fn);'), 0);
  // `skip`/`only` counts wherever it sits in the modifier chain; the other
  // modifiers are not markers (the scorer reports `fixme`/`todo` on its own).
  assert.equal(countSkipFocus(
    'test.concurrent.only("a", fn); test.concurrent.skip("b", fn); test.skip.concurrent("c", fn);',
  ), 3);
  assert.equal(countSkipFocus('test.concurrent("a", fn); test.fixme("b", fn); it.todo("c");'), 0);
  // Playwright spells a focused or skipped suite through `test.`.
  assert.equal(countSkipFocus('test.describe.only("s", fn); test.describe.skip("t", fn);'), 2);
  // An identifier that merely ends in a name is not an opener.
  assert.equal(countSkipFocus('exit(); benefit.only(); prefix.skip();'), 0);
});

test('countSkipFocus and countTestBlocks read one opener grammar: every focused or skipped block is one marker', () => {
  // `countSkipFocus` used to carry its own regex — `.each` only after a dot
  // modifier, no modifier chain, no prefix before `.each` — so `xit.each(`,
  // `fit.each(`, `test.concurrent.only(`, `test.concurrent.skip(`, and
  // `test.concurrent.only.each(` each counted one block and zero markers. Walk
  // the grammar `TEST_CALL_RE` accepts (both names, both prefixes, every
  // modifier chain up to two deep, with and without `.each`) and check that a
  // block is a marker exactly when it is `x`/`f`-prefixed or carries `skip` or
  // `only` anywhere in its chain.
  const modifiers = ['only', 'skip', 'fixme', 'fails', 'failing', 'flaky', 'concurrent', 'serial', 'todo'];
  const chains = [[], ...modifiers.map(m => [m]), ...modifiers.flatMap(a => modifiers.map(b => [a, b]))];
  const openers = [];

  for (const name of ['it', 'test']) {
    for (const each of [false, true]) {
      const call = each ? '.each([[1]])("a", fn);' : '("a", fn);';

      for (const prefix of ['x', 'f']) {
        openers.push({ src: `${prefix}${name}${call}`, marker: true });
      }
      for (const chain of chains) {
        openers.push({
          src: `${name}${chain.map(m => `.${m}`).join('')}${call}`,
          marker: chain.includes('skip') || chain.includes('only'),
        });
      }
    }
  }

  assert.ok(openers.length > 300, 'premise: the walk covers the grammar');

  for (const { src, marker } of openers) {
    assert.equal(countTestBlocks(src), 1, `${src} is one block`);
    assert.equal(countSkipFocus(src), marker ? 1 : 0, `${src} is ${marker ? 'one marker' : 'no marker'}`);
  }
});

test('detectWeakening flags a new spec born with a prefixed .each or a skip/only deep in a modifier chain', () => {
  // The five openers that used to count one block and zero markers each, so a
  // new spec born with any of them raised no finding at all.
  const born = [
    'xit.each([[1]])("a", fn);',
    'fit.each([[1]])("b", fn);',
    'test.concurrent.only("c", fn);',
    'test.concurrent.skip("d", fn);',
    'test.concurrent.only.each([[1]])("e", fn);',
  ];

  for (const src of born) {
    const { findings, severity } = detectWeakening('', src, { sourceChanged: true });

    assert.deepEqual(findings, [{ kind: 'skip-or-focus-added', before: 0, after: 1 }], src);
    assert.equal(severity, 'flag', src);
  }

  const spec = born.join('\n');

  assert.equal(countTestBlocks(spec), 5);
  assert.deepEqual(detectWeakening('', spec).findings, [{ kind: 'skip-or-focus-added', before: 0, after: 5 }]);
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

test('the matcher tables are disjoint and pin the documented split', () => {
  const overlap = EXACT_MATCHERS
    .filter(matcher => BOUNDED_MATCHERS.includes(matcher) || THROW_MATCHERS.includes(matcher))
    .concat(BOUNDED_MATCHERS.filter(matcher => THROW_MATCHERS.includes(matcher)));

  assert.deepEqual(overlap, []);
  assert.ok(EXACT_MATCHERS.includes('toBe'));
  assert.ok(EXACT_MATCHERS.includes('toHaveBeenCalledTimes'));
  assert.ok(BOUNDED_MATCHERS.includes('toBeGreaterThanOrEqual'));
  assert.ok(BOUNDED_MATCHERS.includes('toBeCloseTo'));
  // The loose form of `toHaveBeenCalledTimes`.
  assert.ok(BOUNDED_MATCHERS.includes('toHaveBeenCalled'));

  // Playwright: the value-pinning locator/page assertions are exact, the
  // substring and class-subset checks are bounded. New E2E is Playwright, so
  // this is the tier that grows.
  for (const name of ['toHaveText', 'toHaveValue', 'toHaveCount', 'toHaveAttribute', 'toHaveClass',
    'toHaveCSS', 'toHaveId', 'toHaveJSProperty', 'toHaveURL', 'toHaveTitle']) {
    assert.ok(EXACT_MATCHERS.includes(name), name);
  }
  assert.ok(BOUNDED_MATCHERS.includes('toContainText'));
  assert.ok(BOUNDED_MATCHERS.includes('toContainClass'));

  // The throw family is exact with an argument and bounded without (see matcherKind).
  assert.deepEqual([...THROW_MATCHERS], ['toThrow', 'toThrowError', 'toThrowWithCause']);
  // A negation that pins a value is the negation of a BOUNDED matcher.
  assert.ok(NEGATION_PINS.every(name => BOUNDED_MATCHERS.includes(name)));

  for (const table of [EXACT_MATCHERS, BOUNDED_MATCHERS, THROW_MATCHERS, NEGATION_PINS]) {
    assert.ok(Object.isFrozen(table));
  }
});

test('matcherHistogram labels each call by name, negation, and bare-throw form without confusing prefixes', () => {
  // `toBe(` must not swallow `toBeGreaterThan(`, `toMatch(` must not swallow
  // `toMatchObject(`, `toContain(` must not swallow `toContainEqual(` or
  // `toContainText(`; a chain broken across lines still counts. A negated call
  // is its own label (`not.toBe`) — adding `.not.` used to be invisible — and a
  // bare `toThrow()` diffs apart from `toThrow('message')`.
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
    await expect(cell).toHaveText('A1');
    await expect(cell).toContainText('A');
    expect(fn).toThrow();
    expect(fn).toThrow('boom');
    expect(fn).not.toThrow( );
    expect(fn).toThrowError('boom');
  `;

  assert.deepEqual(matcherHistogram(src), {
    toBe: 1,
    'not.toBe': 1,
    toBeGreaterThan: 1,
    toMatch: 1,
    toMatchObject: 1,
    toContain: 1,
    toContainEqual: 1,
    toHaveBeenCalledTimes: 1,
    toHaveText: 1,
    toContainText: 1,
    'toThrow()': 1,
    toThrow: 1,
    'not.toThrow()': 1,
    toThrowError: 1,
  });
  // Playwright's state-only assertions are neither exact nor bounded (module
  // header): they never enter the histogram. A negated Playwright value
  // assertion labels like any other negation.
  assert.deepEqual(matcherHistogram('await expect(l).toBeVisible(); await expect(l).not.toBeHidden();'), {});
  assert.deepEqual(matcherHistogram('await expect(cell).not.toHaveText(\'A1\');'), { 'not.toHaveText': 1 });
  assert.deepEqual(matcherHistogram(''), {});
  assert.deepEqual(matcherHistogram(null), {});
});

test('matcherKind classifies a label by table, by negation, and by a bare throw', () => {
  assert.equal(matcherKind('toBe'), 'exact');
  assert.equal(matcherKind('toHaveText'), 'exact');
  assert.equal(matcherKind('toBeGreaterThan'), 'bounded');
  assert.equal(matcherKind('toContainText'), 'bounded');
  // A negation rules one value out — unless the negation itself pins one.
  assert.equal(matcherKind('not.toBe'), 'bounded');
  assert.equal(matcherKind('not.toHaveBeenCalledTimes'), 'bounded');
  assert.equal(matcherKind('not.toBeGreaterThan'), 'bounded');
  assert.equal(matcherKind('not.toHaveBeenCalled'), 'exact');
  assert.equal(matcherKind('not.toBeDefined'), 'exact');
  // The throw family pins the error only when given an argument, and negation
  // flips the pair: a bare `not.toThrow()` pins the one outcome "does not
  // throw" (179 bare calls in `handsontable/` — 172 `not.toThrow()`, 7
  // `not.toThrowError()` — and none with an argument), while
  // `not.toThrow('msg')` rules one error out. The bare negation used to
  // classify bounded, so a spec whose only matcher was `not.toThrow()` read as loose.
  assert.equal(matcherKind('toThrow'), 'exact');
  assert.equal(matcherKind('toThrowError'), 'exact');
  assert.equal(matcherKind('toThrowWithCause'), 'exact');
  assert.equal(matcherKind('toThrow()'), 'bounded');
  assert.equal(matcherKind('toThrowError()'), 'bounded');
  assert.equal(matcherKind('not.toThrow()'), 'exact');
  assert.equal(matcherKind('not.toThrowError()'), 'exact');
  assert.equal(matcherKind('not.toThrow'), 'bounded');
  assert.equal(matcherKind('not.toThrowWithCause'), 'bounded');
  // Outside the tables: state-only Playwright assertions and unknown names.
  assert.equal(matcherKind('toBeVisible'), null);
  assert.equal(matcherKind('not.toBeVisible'), null);
  assert.equal(matcherKind('toFoo'), null);
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

test('detectMatcherDowngrade flags a Playwright toHaveText → toContainText swap (count FLAT)', () => {
  // `tests/e2e/*.spec.ts` is the tier that grows, and its value-pinning locator
  // assertions used to sit outside both tables, so this swap reported nothing.
  const before = `
    await expect(cell).toHaveText('A1');
    await expect(rows).toHaveCount(5);
  `;
  const after = `
    await expect(cell).toContainText('A');
    await expect(rows).toHaveCount(5);
  `;

  assert.equal(countAssertions(before), countAssertions(after), 'premise: the assertion count is flat');
  assert.deepEqual(detectMatcherDowngrade(before, after), {
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'toHaveText', from: 1, to: 0 }],
    boundedRises: [{ matcher: 'toContainText', from: 0, to: 1 }],
  });
  assert.deepEqual(detectWeakening(before, after).findings.map(f => f.kind), ['matcher-downgrade']);
});

test('detectMatcherDowngrade flags toHaveBeenCalledTimes → toHaveBeenCalled and toThrowError(msg) → toThrow()', () => {
  // `toHaveBeenCalled()` is the loose form of `toHaveBeenCalledTimes(n)`, and a
  // bare `toThrow()` only proves that something threw where `toThrowError('msg')`
  // pinned the error. Both keep the assertion count flat.
  assert.deepEqual(detectMatcherDowngrade(
    'expect(spy).toHaveBeenCalledTimes(3);',
    'expect(spy).toHaveBeenCalled();',
  ), {
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'toHaveBeenCalledTimes', from: 1, to: 0 }],
    boundedRises: [{ matcher: 'toHaveBeenCalled', from: 0, to: 1 }],
  });

  assert.deepEqual(detectMatcherDowngrade(
    'expect(fn).toThrowError(\'boom\');',
    'expect(fn).toThrow();',
  ), {
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'toThrowError', from: 1, to: 0 }],
    boundedRises: [{ matcher: 'toThrow()', from: 0, to: 1 }],
  });

  // Dropping the argument from the SAME matcher is the same downgrade — the bare
  // form is its own label, so the two diff apart.
  assert.deepEqual(detectMatcherDowngrade(
    'expect(fn).toThrow(\'boom\');',
    'expect(fn).toThrow();',
  ), {
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'toThrow', from: 1, to: 0 }],
    boundedRises: [{ matcher: 'toThrow()', from: 0, to: 1 }],
  });

  // Under negation the pair flips: `not.toThrow()` pins "does not throw", and
  // narrowing it to `not.toThrow('boom')` lets every other error through.
  assert.deepEqual(detectMatcherDowngrade(
    'expect(fn).not.toThrow();',
    'expect(fn).not.toThrow(\'boom\');',
  ), {
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'not.toThrow()', from: 1, to: 0 }],
    boundedRises: [{ matcher: 'not.toThrow', from: 0, to: 1 }],
  });

  // The other direction tightens, and is not a finding.
  assert.equal(detectMatcherDowngrade('expect(fn).toThrow();', 'expect(fn).toThrow(\'boom\');'), null);
  assert.equal(detectMatcherDowngrade(
    'expect(spy).toHaveBeenCalled();',
    'expect(spy).toHaveBeenCalledTimes(1);',
  ), null);

  // The price of pinning `not.toThrow()` as exact (module header): an exact →
  // exact swap that trades a value pin for the outcome pin keeps the exact
  // total flat with no bounded rise, so nothing reports it.
  assert.equal(detectMatcherDowngrade('expect(r).toBe(5);', 'expect(() => f()).not.toThrow();'), null);
  assert.deepEqual(detectWeakening('expect(r).toBe(5);', 'expect(() => f()).not.toThrow();').findings, []);
});

test('detectMatcherDowngrade flags an exact matcher that gained a .not. (toBe(5) → not.toBe(0))', () => {
  // `.not.toBe(0)` rules one value out and proves almost nothing. Before the
  // negation was its own label it counted as the exact `toBe`, so adding `.not.`
  // was invisible to every detector.
  assert.deepEqual(detectMatcherDowngrade('expect(x).toBe(5);', 'expect(x).not.toBe(0);'), {
    kind: 'matcher-downgrade',
    exactDrops: [{ matcher: 'toBe', from: 1, to: 0 }],
    boundedRises: [{ matcher: 'not.toBe', from: 0, to: 1 }],
  });

  // The two negations that pin a value stay exact, so the equivalent rewrites
  // `toHaveBeenCalledTimes(0)` → `not.toHaveBeenCalled()` and `toBe(undefined)`
  // → `not.toBeDefined()` are not findings.
  assert.equal(detectMatcherDowngrade(
    'expect(spy).toHaveBeenCalledTimes(0);',
    'expect(spy).not.toHaveBeenCalled();',
  ), null);
  assert.equal(detectMatcherDowngrade('expect(x).toBe(undefined);', 'expect(x).not.toBeDefined();'), null);
});

test('detectMatcherDowngrade is quiet when the file ends up MORE exact overall (totals rule)', () => {
  // The calibration false positive: one change renamed 42 `toBeGreaterThan` to
  // `toBe` and 11 `toEqual` to `toContain`. Per label that is one exact drop and
  // one bounded rise, yet the total exact count went UP — the spec pins more
  // than before. Same shape, smaller.
  const before = `
    expect(a).toEqual(['x', 'y']);
    expect(b).toEqual(['x']);
    expect(c).toBeGreaterThan(0);
    expect(d).toBeGreaterThan(0);
    expect(e).toBeGreaterThan(0);
  `;
  const after = `
    expect(a).toContain('x');
    expect(b).toContain('x');
    expect(c).toBe(1);
    expect(d).toBe(2);
    expect(e).toBe(3);
  `;

  assert.equal(detectMatcherDowngrade(before, after), null);
  assert.deepEqual(detectWeakening(before, after).findings, []);

  // A flat total is still a finding (the count-rose shape above keeps its `toBe`
  // while trading one exact call for a bounded one); only a RISING total is
  // quiet. The documented price: a real `toBe` → `toBeDefined` beside two new
  // `toEqual` hides behind the rising total.
  assert.equal(detectMatcherDowngrade(
    'expect(a).toBe(1);',
    'expect(a).toBeDefined(); expect(b).toEqual(1); expect(c).toEqual(2);',
  ), null);
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

test('detectPrecisionWidening reads the digits argument past a comment between the arguments', () => {
  // The scanner skips comments the way it skips strings. Without that, `// relaxed`
  // made the second argument text fail the integer check — a real widening
  // dropped — and an apostrophe in the comment opened a "string" that ran to the
  // end of the file.
  assert.deepEqual(detectPrecisionWidening(
    'expect(x).toBeCloseTo(w, 5);',
    'expect(x).toBeCloseTo(w, // relaxed\n  2);',
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 2 }] }, 'line comment');

  assert.deepEqual(detectPrecisionWidening(
    'expect(x).toBeCloseTo(w, 5);',
    'expect(x).toBeCloseTo(w, // that\'s the width\n  2);',
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 2 }] }, 'apostrophe inside a line comment');

  assert.deepEqual(detectPrecisionWidening(
    'expect(x).toBeCloseTo(w, 5);',
    'expect(x).toBeCloseTo(w, /* was 5 */ 2);',
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 2 }] }, 'block comment');
});

test('detectPrecisionWidening never turns a scan it cannot trust into a finding', () => {
  // A bracket inside a comment or a regex literal used to end the scan early; the
  // truncated one-entry list then read as "digits omitted" and pushed the default
  // of 2 — a scan failure reported as a 5 → 2 widening. Comments are skipped now,
  // so the first case reads its real digits; a regex literal cannot be read, so
  // the call is not judged at all.
  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y, 5);',
    'expect(x).toBeCloseTo(y /* keep )*/, 5);',
  ), null, 'a bracket inside a block comment');

  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y, 5);',
    String.raw`expect(x).toBeCloseTo(f(/\)/), 5);`,
  ), null, 'a bracket inside a regex literal');

  // The trade-off: a real widening beside a regex literal goes unreported too.
  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(f(/x/), 5);',
    'expect(x).toBeCloseTo(f(/x/), 2);',
  ), null, 'a regex literal makes the call unjudgeable in both directions');

  // A division is not a regex start, so the call is still judged.
  assert.deepEqual(detectPrecisionWidening(
    'expect(x).toBeCloseTo(width / 2, 5);',
    'expect(x).toBeCloseTo(width / 2, 2);',
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 2 }] }, 'division');

  // A regex literal after a keyword (`return /x/`) is a regex start too, so the
  // call is not judged — this shape used to invent a 5 → 2 widening — while an
  // identifier that merely starts with a keyword still divides and is judged.
  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y, 5);',
    String.raw`expect(x).toBeCloseTo((() => { return /\)/.test(s) ? 1 : 2; })(), 5);`,
  ), null, 'a bracket inside a regex literal after return');
  assert.deepEqual(detectPrecisionWidening(
    'expect(x).toBeCloseTo(newValue / 2, 5);',
    'expect(x).toBeCloseTo(newValue / 2, 2);',
  ), { kind: 'precision-widened', widenings: [{ from: 5, to: 2 }] }, 'an identifier starting with a keyword divides');

  // An unterminated comment never closes the list: null, never the default.
  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y, 5);',
    'expect(x).toBeCloseTo(y, // the file ends here',
  ), null, 'unterminated line comment');
  assert.equal(detectPrecisionWidening(
    'expect(x).toBeCloseTo(y, 5);',
    'expect(x).toBeCloseTo(y /* the file ends here',
  ), null, 'unterminated block comment');
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

test('detectWeakening flags a deleted test block even when the assertion count ROSE (tests-removed)', () => {
  // The most direct road to green: delete the failing `it()` and grow the
  // survivor. The assertion count rises, the exact histogram is flat, and the
  // lone bounded rise is not a finding on its own — so nothing else sees it.
  const before = `
    it('a', () => { expect(a).toBe(1); });
    it('b', () => { expect(b).toBe(2); });
  `;
  const after = `
    it('b', () => { expect(b).toBe(2); expect(c).toBe(3); expect(d).toContain(1); });
  `;

  assert.ok(countAssertions(after) > countAssertions(before), 'premise: the assertion count rose');
  assert.equal(detectMatcherDowngrade(before, after), null, 'premise: the exact histogram is flat');
  assert.equal(countTestBlocks(before), 2);
  assert.equal(countTestBlocks(after), 1);

  const { findings, severity } = detectWeakening(before, after);

  assert.deepEqual(findings, [{ kind: 'tests-removed', before: 2, after: 1 }]);
  assert.equal(severity, 'warn');
  assert.equal(detectWeakening(before, after, { sourceChanged: true }).severity, 'flag');
});

test('countTestBlocks counts every it/test opener form and ignores look-alikes', () => {
  assert.equal(countTestBlocks(
    'it("a", fn); test("b", fn); xit("c", fn); fit("d", fn); it.skip("e", fn); test.only("f", fn);',
  ), 6);
  assert.equal(countTestBlocks('test.concurrent.only("g", fn);'), 1, 'chained modifiers');
  // Member accesses, suites, and hooks are not test blocks.
  assert.equal(countTestBlocks('/re/.test(x); suite.it("a"); describe("d", fn); beforeEach(fn);'), 0);
  assert.equal(countTestBlocks('test.describe("d", fn); test.beforeEach(fn);'), 0);
  assert.equal(countTestBlocks(''), 0);
  assert.equal(countTestBlocks(null), 0);
});

test('countTestBlocks counts a parameterized table by its rows, and a table it cannot read as one', () => {
  // `it.each` used to match nothing: a spec made of tables counted zero blocks,
  // deleting a table was invisible, and folding two `it()` into one table read
  // as 2 → 0. A row is a top-level element of the array literal — the tests the
  // runner registers — whatever its shape.
  const table = `
    it.each([
      ['batched', true],
      ['per-cell', false],
      ['nested, with a comma', { rows: [1, 2] }],
    ])('translates columns (%s path)', (_path, rowIndependent) => {
      expect(read(rowIndependent)).toBe(1);
    });
  `;

  assert.equal(countTestBlocks(table), 3);
  assert.equal(countTestBlocks('test.each([1, 2])("n %s", fn);'), 2, 'primitive rows');
  assert.equal(countTestBlocks('it.each([[1], [2],])("n %s", fn);'), 2, 'a trailing comma is not a row');
  assert.equal(countTestBlocks('it.each([{ a: 1 }, { a: 2 }])("n $a", fn);'), 2, 'object rows');
  assert.equal(countTableRows('[[1], [2], [3]])("n", fn)', 0), 3);
  // Modifiers and prefixes ride along; `describe.each` is a suite, not a block,
  // so the block inside it counts once.
  assert.equal(countTestBlocks(
    'xit.each([[1]])("a", fn); test.skip.each([[1]])("b", fn); test.concurrent.only.each([[1], [2]])("c", fn);',
  ), 4);
  assert.equal(countTestBlocks('describe.each([[1], [2]])("suite %s", (n) => { it("a", fn); });'), 1);
  // A table the scanner cannot read as an array literal is the minimal claim: one block.
  assert.equal(countTestBlocks('it.each(cases)("n %s", fn);'), 1, 'a variable');
  assert.equal(countTestBlocks('it.each(rows.map(toCase))("n %s", fn);'), 1, 'a call');
  assert.equal(countTestBlocks('it.each([[1], [2]'), 1, 'an unterminated table');
  assert.equal(countTestBlocks('it.each([])("n", fn);'), 1, 'an empty table');
  // Documented blind spot: a table written as a tagged template is not counted
  // (the cell values, `${…}` expressions in a real table, are elided here).
  assert.equal(countTestBlocks('it.each`\n  a | b\n  1 | 2\n`("n", fn);'), 0);
});

test('a commented-out table row is not counted while a commented-out it() still is (module header)', () => {
  // The row counter runs on `splitTopLevelArgs`, which skips comments; the
  // opener regexes do not. So `tests-removed` sees a row commented out, and a
  // table commented out whole (its rows become unreadable, so it counts as
  // one), but never a plain `it()` commented out.
  const two = 'it("a", () => { expect(a).toBe(1); });\nit("b", () => { expect(b).toBe(2); });';
  const oneCommented = 'it("a", () => { expect(a).toBe(1); });\n// it("b", () => { expect(b).toBe(2); });';

  assert.equal(countTestBlocks(oneCommented), 2);
  assert.deepEqual(detectWeakening(two, oneCommented).findings, []);

  const table = 'it.each([\n  ["a", 1],\n  ["b", 2],\n])("n %s", fn);';
  const rowCommented = 'it.each([\n  ["a", 1],\n  // ["b", 2],\n])("n %s", fn);';
  const tableCommented = '// it.each([\n//   ["a", 1],\n//   ["b", 2],\n// ])("n %s", fn);';

  assert.equal(countTestBlocks(rowCommented), 1);
  assert.deepEqual(detectWeakening(table, rowCommented).findings, [{ kind: 'tests-removed', before: 2, after: 1 }]);
  assert.equal(countTestBlocks(tableCommented), 1);
  assert.deepEqual(detectWeakening(table, tableCommented).findings, [{ kind: 'tests-removed', before: 2, after: 1 }]);
});

test('tests-removed is quiet when two it() fold into one two-row it.each table', () => {
  // The refactor a reviewer wants left alone. Before the table counted by rows it
  // read as test blocks 2 → 0. The assertion count is NOT row-aware — two
  // `expect(` became one — so the count detector still reports; that is the
  // documented price (module header).
  const before = `
    it('f(1)', () => { expect(f(1)).toBe(1); });
    it('f(2)', () => { expect(f(2)).toBe(2); });
  `;
  const after = `
    it.each([[1], [2]])('f(%s)', (n) => { expect(f(n)).toBe(n); });
  `;

  assert.equal(countTestBlocks(before), countTestBlocks(after));
  assert.deepEqual(detectWeakening(before, after).findings.map(f => f.kind), ['assertions-removed']);
});

test('tests-removed flags a deleted it.each table, and a deleted row, beside a growing survivor', () => {
  // The parameterized version of the deleted-`it()` shape: the failing coverage
  // was a table (or one of its rows), and the survivor grew to keep the
  // assertion count flat, so `assertions-removed` says nothing.
  const before = `
    it('a', () => { expect(a).toBe(1); });
    it.each([[1], [2]])('f(%s)', (n) => { expect(f(n)).toBe(n); });
  `;
  const tableDeleted = `
    it('a', () => { expect(a).toBe(1); expect(b).toBe(2); });
  `;
  const rowDeleted = `
    it('a', () => { expect(a).toBe(1); });
    it.each([[1]])('f(%s)', (n) => { expect(f(n)).toBe(n); });
  `;

  assert.equal(countAssertions(before), countAssertions(tableDeleted), 'premise: the assertion count is flat');
  assert.deepEqual(detectWeakening(before, tableDeleted).findings, [{ kind: 'tests-removed', before: 3, after: 1 }]);
  assert.equal(countAssertions(before), countAssertions(rowDeleted), 'premise: the assertion count is flat');
  assert.deepEqual(detectWeakening(before, rowDeleted).findings, [{ kind: 'tests-removed', before: 3, after: 2 }]);
});

test('tests-removed is quiet when blocks are added or the spec is new', () => {
  const one = 'it("a", () => { expect(a).toBe(1); });';
  const two = `${one} it("b", () => { expect(b).toBe(2); });`;

  assert.deepEqual(detectWeakening(one, two).findings, []);
  assert.deepEqual(detectWeakening('', one, { sourceChanged: true }).findings, []);
});

test('formatFinding renders every finding kind as one readable line', () => {
  assert.equal(formatFinding({ kind: 'assertions-removed', before: 5, after: 4 }), 'assertions 5 → 4');
  assert.equal(formatFinding({ kind: 'tests-removed', before: 3, after: 2 }), 'test blocks 3 → 2');
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
