import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scanBalanced,
  extractTestBlocks,
  findCatchSwallows,
  findGamingSignals,
  findDeterminismSmells,
  extractChangedSymbols,
  assessRelevance,
  countMatchers,
  getMutationStatus,
  parseMutationReport,
  runMutation,
  scoreTestSource,
} from '../score.mjs';
import { countTestBlocks } from '../../.github/scripts/lib/test-weakening.mjs';

const MUTATION_STUB = { available: false, reason: 'stryker not installed' };

test('scanBalanced matches brackets across strings, comments, and template expressions', () => {
  // Assembled so the interpolation lands in the scanned text without tripping this file's lint.
  const dollarBrace = '${';
  const src = `it("has ) inside", () => { const s = \`a${dollarBrace}fn({ b: 1 })}c\`; /* } */ // }\n });`;
  const open = src.indexOf('(');

  assert.equal(src[scanBalanced(src, open)], ')');
  // The matching `)` is the second-to-last character (the source ends with `);`).
  assert.equal(scanBalanced(src, open), src.length - 2);
});

test('extractTestBlocks finds it/test blocks with titles and per-block assertion counts', () => {
  const src = `
    describe('suite', () => {
      it('asserts the value', () => { expect(a).toBe(1); expect(b).toBe(2); });
      test('uses a helper', async() => { await grid.expectCell(0, 0, 'A1'); });
    });
  `;
  const blocks = extractTestBlocks(src);

  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.map(b => b.title), ['asserts the value', 'uses a helper']);
  assert.deepEqual(blocks.map(b => b.assertions), [2, 1]);
});

test('extractTestBlocks ignores describe, hooks, and member calls such as regex .test()', () => {
  const src = `
    test.describe('suite', () => {
      test.beforeEach(() => { setup(); });
      const ok = /\\d/.test(value);
      suite.it('not a test block either');
    });
  `;

  assert.equal(extractTestBlocks(src).length, 0);
});

test('extractTestBlocks reads a parameterized it.each table as one titled block that runs one test per row', () => {
  // With the opener matched, the table used to be read as the block's argument
  // list — every `it.each` came back untitled and hollow. The title and body sit
  // in the second call; `rows` carries the table's row count so the score's
  // `tests` agrees with the detector's `countTestBlocks`.
  const src = `
    it.each([
      ['batched', true],
      ['per-cell', false],
    ])('translates columns (%s path)', (_path, rowIndependent) => {
      expect(read(rowIndependent)).toBe(1);
      expect(blank(rowIndependent)).toBe(2);
    });
    describe.each([[1], [2]])('suite %s', (n) => {
      it('plain', () => { expect(n).toBeGreaterThan(0); });
    });
    it.each(cases)('hollow %s', (n) => { run(n); });
  `;
  const blocks = extractTestBlocks(src);

  assert.deepEqual(blocks.map(b => [b.marker, b.title, b.assertions, b.rows]), [
    ['it.each', 'translates columns (%s path)', 2, 2],
    ['it', 'plain', 1, 1],
    ['it.each', 'hollow %s', 0, 1],
  ]);

  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.equal(score.tests, countTestBlocks(src));
  assert.equal(score.tests, 4);
  assert.deepEqual(score.hollowTests, ['hollow %s']);
});

test('hollow detection flags an it() without any assertion', () => {
  const src = `
    it('does nothing', () => { render(); });
    it('asserts', () => { expect(x).toBe(1); });
  `;
  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.deepEqual(score.hollowTests, ['does nothing']);
  assert.equal(score.verdict, 'suspect');
  assert.ok(score.problems.some(p => p.type === 'hollow-tests'));
});

test('a file with no test block at all is a problem', () => {
  const score = scoreTestSource('const helper = () => 1;', { mutation: MUTATION_STUB });

  assert.equal(score.tests, 0);
  assert.ok(score.problems.some(p => p.type === 'no-test-blocks'));
  assert.equal(score.verdict, 'suspect');
});

test('gaming signals: .only, xit, and it.flaky are detected', () => {
  const src = `
    it.only('focused', () => { expect(a).toBe(1); });
    xit('skipped', () => { expect(b).toBe(2); });
    it.flaky('papered over', () => { expect(c).toBe(3); });
  `;
  const signals = findGamingSignals(src);
  const byType = Object.fromEntries(signals.map(s => [s.type, s.count]));

  assert.equal(byType['skip-or-focus'], 2);
  assert.equal(byType['flaky-marker'], 1);

  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.equal(score.verdict, 'suspect');
  assert.ok(score.problems.some(p => p.type === 'gaming-signals'));
});

test('gaming signals: a prefixed .each and a skip/only deep in a modifier chain are focus/skip markers', () => {
  // The scorer shares `countSkipFocus` with the weakening detector; these five
  // openers used to count as test blocks with no gaming signal at all.
  const src = `
    xit.each([[1]])('a', fn);
    fit.each([[1]])('b', fn);
    test.concurrent.only('c', () => { expect(a).toBe(1); });
    test.concurrent.skip('d', () => { expect(b).toBe(2); });
    test.concurrent.only.each([[1]])('e', fn);
  `;
  const byType = Object.fromEntries(findGamingSignals(src).map(s => [s.type, s.count]));

  assert.equal(byType['skip-or-focus'], 5);

  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.equal(score.tests, 5);
  assert.equal(score.verdict, 'suspect');
  assert.ok(score.problems.some(p => p.type === 'gaming-signals'));
});

test('gaming signals: a try/catch that swallows the failure is detected', () => {
  const swallowing = `
    it('cannot fail', async() => {
      try {
        expect(await load()).toBe('x');
      } catch (error) {
        log(error);
      }
    });
  `;

  assert.equal(findCatchSwallows(swallowing), 1);
  assert.equal(scoreTestSource(swallowing, { mutation: MUTATION_STUB }).verdict, 'suspect');
});

test('gaming signals: a catch that rethrows or asserts is not a swallow', () => {
  const rethrowing = 'try { run(); } catch (error) { throw error; }';
  const asserting = 'try { run(); } catch (error) { expect(error.message).toBe("boom"); }';
  const promiseCatch = 'load().catch(handle);';

  assert.equal(findCatchSwallows(rethrowing), 0);
  assert.equal(findCatchSwallows(asserting), 0);
  assert.equal(findCatchSwallows(promiseCatch), 0);
});

test('determinism smells: sleep(, waitForTimeout, and networkidle are detected', () => {
  const src = `
    it('waits blindly', async() => {
      await sleep(500);
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
      expect(x).toBe(1);
    });
  `;
  const smells = findDeterminismSmells(src);
  const types = smells.map(s => s.type);

  assert.deepEqual(types.sort(), ['network-idle', 'sleep-call', 'wait-for-timeout']);

  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.equal(score.verdict, 'suspect');
  assert.ok(score.problems.some(p => p.type === 'determinism-smells'));
});

test('a clean, meaningful test scores clean', () => {
  const src = `
    import { test, expect } from '@playwright/test';
    import { GridPage } from '../fixtures/pages/GridPage';

    test.describe('keyboard navigation', () => {
      test('arrow keys move the selection; an edit commits to the landed cell', async({ page }) => {
        const grid = new GridPage(page);

        await grid.goto();
        await grid.selectCell(0, 0);
        await grid.pressKeys('ArrowDown', 'ArrowRight');
        await grid.typeIntoSelected('X');

        await grid.expectCell(1, 1, 'X');
        await grid.expectCell(0, 0, 'A1');
      });
    });
  `;
  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.equal(score.tests, 1);
  assert.equal(score.assertions, 2);
  assert.deepEqual(score.hollowTests, []);
  assert.deepEqual(score.gamingSignals, []);
  assert.deepEqual(score.determinismSmells, []);
  assert.deepEqual(score.problems, []);
  // Page-object helpers carry the assertions here, so no matcher is counted and
  // the loose-matchers warning must stay quiet.
  assert.deepEqual(score.matchers, { exact: 0, bounded: 0 });
  assert.deepEqual(score.warnings, []);
  assert.equal(score.verdict, 'meaningful');
});

test('matchers breaks assertions down into exact and bounded matcher calls', () => {
  const src = `
    it('pins and bounds', () => {
      expect(a).toBe(1);
      expect(b).toEqual([1]);
      expect(c).toBeGreaterThan(0);
    });
  `;
  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.deepEqual(score.matchers, { exact: 2, bounded: 1 });
  assert.deepEqual(score.warnings, []);
});

test('a test whose every assertion is a bounded matcher gets a loose-matchers-only warning', () => {
  // The single-file analogue of the weakening detector's matcher downgrade: no
  // base revision to diff, but a spec that pins nothing exactly is the shape a
  // downgrade ends in. Warning-only — a relational assertion is legitimate for
  // values no token derives — so the verdict is untouched.
  const src = `
    it('checks something exists', () => {
      expect(result).toBeDefined();
      expect(result.rows).toBeTruthy();
      expect(result.rows.length).toBeGreaterThan(0);
    });
  `;
  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.deepEqual(score.matchers, { exact: 0, bounded: 3 });
  assert.equal(score.verdict, 'meaningful');
  assert.equal(score.warnings.length, 1);
  assert.equal(score.warnings[0].type, 'loose-matchers-only');
  assert.match(score.warnings[0].detail, /toBeDefined/);
  assert.match(score.warnings[0].detail, /toBeGreaterThan/);
});

test('loose-matchers-only stays quiet when an exact matcher or a helper assertion is present', () => {
  const oneExact = 'it("x", () => { expect(a).toBe(1); expect(b).toBeGreaterThan(0); });';
  // A helper carries one of the two assertions, so the bounded matcher does not
  // account for every assertion — the scorer cannot tell what the helper pins.
  const helperAndBounded = `
    it('x', async() => { await grid.expectCell(0, 0, 'A1'); expect(n).toBeGreaterThan(0); });
  `;

  assert.deepEqual(scoreTestSource(oneExact, { mutation: MUTATION_STUB }).warnings, []);
  assert.deepEqual(scoreTestSource(helperAndBounded, { mutation: MUTATION_STUB }).warnings, []);
});

test('countMatchers returns the histogram behind its totals, classified by the detector\'s matcherKind', () => {
  // One regex pass: the scorer reads the per-label detail from the same
  // histogram the totals were summed from.
  const src = 'expect(a).toBe(1); expect(b).not.toBe(0); expect(fn).toThrow(); expect(c).toBeGreaterThan(0);';

  assert.deepEqual(countMatchers(src), {
    exact: 1,
    bounded: 3,
    histogram: { toBe: 1, 'not.toBe': 1, 'toThrow()': 1, toBeGreaterThan: 1 },
  });
  // The score object keeps the two totals only.
  assert.deepEqual(scoreTestSource(src, { mutation: MUTATION_STUB }).matchers, { exact: 1, bounded: 3 });
});

test('loose-matchers-only is raised when the only exact-looking matcher is negated', () => {
  // `.not.toBe(0)` rules one value out; it used to count as the exact `toBe` and
  // suppress the warning.
  const src = 'it("x", () => { expect(a).not.toBe(0); expect(b).toBeGreaterThan(0); });';
  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.deepEqual(score.matchers, { exact: 0, bounded: 2 });
  assert.equal(score.warnings.length, 1);
  assert.equal(score.warnings[0].type, 'loose-matchers-only');
  assert.match(score.warnings[0].detail, /not\.toBe ×1/);
});

test('loose-matchers-only stays quiet for a spec that pins a float with toBeCloseTo', () => {
  // `toBeCloseTo` is bounded in the detector's table, but pinning a value to ten
  // decimal places is the opposite of loose — the detector's `precision-widened`
  // owns its loosening. It is the only sensible matcher in the dimension and
  // export specs, so the warning would fire there constantly.
  const src = 'it("x", () => { expect(w).toBeCloseTo(123.4567890123, 10); });';
  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.deepEqual(score.matchers, { exact: 0, bounded: 1 });
  assert.deepEqual(score.warnings, []);
});

test('loose-matchers-only stays quiet for a spec whose only matcher is a bare not.toThrow()', () => {
  // `expect(fn).not.toThrow()` pins the one outcome "does not throw", the way
  // the NEGATION_PINS do. It used to classify bounded, so a spec that proved
  // only that a call is safe read as loose.
  const src = 'it("x", () => { expect(() => f()).not.toThrow(); });';
  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.deepEqual(score.matchers, { exact: 1, bounded: 0 });
  assert.deepEqual(score.warnings, []);
});

test('extractChangedSymbols reads declarations, calls, and hunk-header context from a diff', () => {
  const diff = [
    'diff --git a/src/helpers/number.ts b/src/helpers/number.ts',
    '--- a/src/helpers/number.ts',
    '+++ b/src/helpers/number.ts',
    '@@ -218,6 +218,10 @@ export function getParsedNumber(numericData) {',
    '+  if (isDotThousandsGroupedInteger(numericData, decimalSeparator)) {',
    '+    const stripped = normalize(numericData);',
    '+  }',
  ].join('\n');
  const symbols = extractChangedSymbols(diff);

  assert.ok(symbols.includes('getParsedNumber'));
  assert.ok(symbols.includes('isDotThousandsGroupedInteger'));
  assert.ok(symbols.includes('stripped'));
});

test('relevance is covered when the test references a changed symbol, and warns when not', () => {
  const diff = '@@ -1,1 +1,2 @@ export function getParsedNumber(data) {\n+  return refine(data);';
  const referencing = 'it("parses", () => { expect(getParsedNumber("7.000")).toBe(7); });';
  const unrelated = 'it("renders", () => { expect(render()).toBe(true); });';

  assert.equal(assessRelevance(referencing, diff).covered, true);
  assert.equal(assessRelevance(unrelated, diff).covered, false);

  const score = scoreTestSource(unrelated, { diff, mutation: MUTATION_STUB });

  assert.equal(score.verdict, 'meaningful');
  assert.ok(score.warnings.some(w => w.type === 'diff-not-referenced'));
});

test('mutation status is the stub while stryker does not resolve, and flips when it does', () => {
  const missing = getMutationStatus(() => {
    throw new Error('MODULE_NOT_FOUND');
  });

  assert.deepEqual(missing, MUTATION_STUB);

  const resolved = getMutationStatus(() => '/node_modules/@stryker-mutator/core/index.js');

  assert.equal(resolved.available, true);
});

test('parseMutationReport aggregates mutant statuses into the standard kill-rate score', () => {
  const report = {
    files: {
      'src/a.ts': { mutants: [{ status: 'Killed' }, { status: 'Killed' }, { status: 'Timeout' }] },
      'src/b.ts': { mutants: [{ status: 'Survived' }, { status: 'NoCoverage' }] },
    },
  };
  const result = parseMutationReport(report);

  // detected = killed(2) + timeout(1) = 3; valid = 3 + survived(1) + noCoverage(1) = 5; score = 60.
  assert.equal(result.killed, 2);
  assert.equal(result.survived, 1);
  assert.equal(result.timeout, 1);
  assert.equal(result.noCoverage, 1);
  assert.equal(result.total, 5);
  assert.equal(result.score, 60);
});

test('parseMutationReport yields a null score when there are no valid mutants', () => {
  assert.equal(parseMutationReport({ files: {} }).score, null);
});

test('runMutation scopes stryker with --mutate and parses the report (injected IO)', () => {
  const calls = [];
  const result = runMutation(['src/helpers/errors.ts'], {
    status: { available: true },
    run: cmd => calls.push(cmd),
    readReport: () => ({
      files: { 'src/helpers/errors.ts': { mutants: [{ status: 'Killed' }, { status: 'Killed' }] } },
    }),
  });

  assert.match(calls[0], /--mutate 'src\/helpers\/errors\.ts'/);
  assert.match(calls[0], /--reporters json/);
  assert.equal(result.available, true);
  assert.equal(result.score, 100);
  assert.equal(result.killed, 2);
});

test('runMutation refuses an unscoped (whole-tree) run', () => {
  const result = runMutation([], { status: { available: true }, run: () => {}, readReport: () => ({}) });

  assert.equal(result.available, true);
  assert.match(result.reason, /no source files/);
});

test('runMutation surfaces a failed stryker run as a reason, not a throw', () => {
  const result = runMutation(['src/a.ts'], {
    status: { available: true },
    run: () => {
      throw new Error('stryker exploded\nstack…');
    },
    readReport: () => ({}),
  });

  assert.equal(result.available, true);
  assert.match(result.reason, /stryker run failed: stryker exploded/);
});
