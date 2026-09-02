import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scanBalanced,
  extractTestBlocks,
  findCatchSwallows,
  findGamingSignals,
  findDeterminismSmells,
  extractChangedSymbols,
  assessRelevance,
  getMutationStatus,
  parseMutationReport,
  runMutation,
  scoreTestSource,
  scoreTestFile,
} from '../score.mjs';

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

test('determinism smells: setTimeout( and waitForNextAnimationFrames( are detected', () => {
  const src = `
    it('waits blindly, in disguise', async() => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await page.evaluate(() => new Promise(resolve => window.setTimeout(resolve, 50)));
      await waitForNextAnimationFrames(2);
      expect(x).toBe(1);
    });
  `;
  const smells = findDeterminismSmells(src);
  const byType = Object.fromEntries(smells.map(s => [s.type, s.count]));

  assert.deepEqual(byType, { 'set-timeout': 2, 'fixed-frame-wait': 1 });

  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.equal(score.verdict, 'suspect');
  assert.ok(score.problems.some(p => p.type === 'determinism-smells'));
});

test('determinism smells: timer look-alikes and the condition-based waiters are not smells', () => {
  const src = `
    it('waits on the condition', async() => {
      hot._registerTimeout(callback, 100);
      clearTimeout(timerId);
      await waitUntil(() => spy.calls.count() === 1);
      await waitForNextAnimationFramesToSettle();
      await expect.poll(() => grid.rowCount()).toBe(5);
      expect(x).toBe(1);
    });
  `;

  assert.deepEqual(findDeterminismSmells(src), []);
});

test('the counterexample fixtures each carry exactly the one smell they exist to prove', async() => {
  const counterexamples = fileURLToPath(
    new URL('../fixtures/e2e-escape-cancels-edit/counterexamples/', import.meta.url),
  );
  // One counterexample per determinism signal, so every signal is proven to fire on its own.
  const expectedByFile = {
    'escape-cancels-edit-sleep.spec.js': 'sleep-call',
    'escape-cancels-edit-wait-for-timeout.spec.ts': 'wait-for-timeout',
    'escape-cancels-edit-network-idle.spec.ts': 'network-idle',
    'escape-cancels-edit-set-timeout.spec.ts': 'set-timeout',
    'escape-cancels-edit-frame-wait.spec.js': 'fixed-frame-wait',
  };

  assert.deepEqual(
    Object.values(expectedByFile).sort(),
    findDeterminismSmells('sleep( waitForTimeout( networkidle setTimeout( waitForNextAnimationFrames(')
      .map(smell => smell.type).sort(),
    'the table above names every signal the scorer knows',
  );

  for (const [file, type] of Object.entries(expectedByFile)) {
    const score = await scoreTestFile(join(counterexamples, file));

    assert.deepEqual(score.determinismSmells, [{ type, count: 1 }], file);
    assert.equal(score.verdict, 'suspect', file);
    assert.deepEqual(score.problems.map(p => p.type), ['determinism-smells'], file);
  }
});

test('run-eval: every reference scores meaningful and every counterexample scores suspect', () => {
  const runEval = fileURLToPath(new URL('../run-eval.mjs', import.meta.url));
  const output = execFileSync(process.execPath, [runEval, '--json'], { encoding: 'utf8' });
  const { results, structuralErrors } = JSON.parse(output);
  const byRole = role => results.filter(result => result.role === role);

  assert.deepEqual(structuralErrors, []);
  assert.ok(byRole('reference').length >= 3, 'the three reference cases are scored');
  assert.ok(byRole('counterexample').length >= 5, 'the counterexamples (one per determinism signal) are scored');
  assert.ok(byRole('reference').every(result => result.score.verdict === 'meaningful'));
  assert.ok(byRole('counterexample').every(result => result.score.verdict === 'suspect'));
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
  assert.equal(score.verdict, 'meaningful');
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
