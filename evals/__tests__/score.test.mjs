import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scanBalanced,
  extractTestBlocks,
  findCatchSwallows,
  findGamingSignals,
  findDeterminismSmells,
  findViewportSmells,
  findUnassertedCaptures,
  extractChangedSymbols,
  assessRelevance,
  getMutationStatus,
  parseMutationReport,
  runMutation,
  scoreTestSource,
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
    readReport: () => ({ files: { 'src/helpers/errors.ts': { mutants: [{ status: 'Killed' }, { status: 'Killed' }] } } }),
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
    run: () => { throw new Error('stryker exploded\nstack…'); },
    readReport: () => ({}),
  });

  assert.equal(result.available, true);
  assert.match(result.reason, /stryker run failed: stryker exploded/);
});

// --- theme-sensitive-viewport: a rendered-row count without a pinned viewport ---
test('viewport smell: a rendered-count assertion in a describe with no width/height and no scroll is flagged', () => {
  const src = `
    describe('virtual rendering', () => {
      beforeEach(async() => {
        handsontable({ data: createSpreadsheetData(100, 10) });
      });

      it('renders only the visible rows', async() => {
        expect(countVisibleRows()).toBe(10);
        expect(getRenderedRowsCount()).toBe(12);
      });
    });
  `;

  assert.equal(findViewportSmells(src), 2);

  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.ok(score.determinismSmells.some(s => s.type === 'theme-sensitive-viewport' && s.count === 2));
  assert.equal(score.verdict, 'suspect');
  assert.ok(score.problems.some(p => p.type === 'determinism-smells' && /theme-sensitive-viewport/.test(p.detail)));
});

test('viewport smell: an explicit width/height or a scrollViewportTo in the describe pins the viewport', () => {
  const pinned = `
    describe('virtual rendering', () => {
      beforeEach(async() => {
        handsontable({ data: createSpreadsheetData(100, 10), width: 400, height: 200 });
      });
      it('renders only the visible rows', async() => {
        expect(countVisibleRows()).toBe(10);
      });
    });
  `;
  const scrolled = `
    describe('virtual rendering', () => {
      it('renders the rows around the scroll target', async() => {
        handsontable({ data: createSpreadsheetData(100, 10) });
        await scrollViewportTo({ row: 50, verticalSnap: 'top' });
        expect(getRenderedRowsCount()).toBeGreaterThan(0);
      });
    });
  `;

  assert.equal(findViewportSmells(pinned), 0);
  assert.equal(findViewportSmells(scrolled), 0);
});

test('viewport smell: a viewport pinned in an OUTER describe covers the nested describe', () => {
  const src = `
    describe('pagination', () => {
      beforeEach(async() => {
        handsontable({ data: createSpreadsheetData(100, 10), height: 300 });
      });
      describe('page size', () => {
        it('shows one page of rows', async() => {
          expect(countVisibleRows()).toBe(10);
        });
      });
    });
  `;

  assert.equal(findViewportSmells(src), 0);
});

test('viewport smell: colWidths/rowHeights are not a viewport, and Playwright :visible counts are covered', () => {
  const sized = `
    describe('rows', () => {
      beforeEach(async() => {
        handsontable({ data: createSpreadsheetData(100, 10), rowHeights: 23, colWidths: 50 });
      });
      it('counts', async() => { expect(countRenderedRows()).toBe(10); });
    });
  `;
  const playwright = `
    test.describe('virtual rows', () => {
      test('renders a window of rows', async({ page }) => {
        const grid = new GridPage(page);
        await grid.goto();
        await expect(page.locator('.ht_master tbody tr:visible')).toHaveCount(12);
      });
    });
  `;

  assert.equal(findViewportSmells(sized), 1, 'rowHeights/colWidths do not pin the viewport');
  assert.equal(findViewportSmells(playwright), 1);
  const dataCount = 'it("plain", () => { expect(countRows()).toBe(3); });';

  assert.equal(findViewportSmells(dataCount), 0, 'a data count is not a rendered count');
});

test('viewport smell: a `:visible` selector is a rendered-count read only when something counts it', () => {
  // Interaction and single-element reads on a visible-filtered locator count nothing.
  const clicks = `
    test.describe('context menu', () => {
      test('opens on the visible cell', async({ page }) => {
        await page.locator('td:visible').click();
        const corner = page.locator('.wtBorder.corner:visible').first();
        await expect(corner).toBeVisible();
        await expect(page.locator('.htContextMenu:visible')).toBeVisible();
      });
    });
  `;

  assert.equal(findViewportSmells(clicks), 0, 'a bare :visible click or .first() is not a count');

  // The same selectors become rendered counts when a count is taken on them.
  const counted = `
    test.describe('virtual rows', () => {
      test('counts inline', async({ page }) => {
        await expect(page.locator('tbody tr:visible')).toHaveCount(12);
      });
      test('counts a captured locator', async({ page }) => {
        const rows = page.locator('tbody tr:visible');
        const before = await rows.count();
        await page.mouse.wheel(0, 3000);
        await expect(rows).not.toHaveCount(before + 1);
      });
      test('counts by expect().count', async({ page }) => {
        const cells = page.locator('td:visible');
        expect(await cells.count()).toBeGreaterThan(0);
      });
    });
  `;

  assert.equal(findViewportSmells(counted), 3, 'one read per counted :visible selector');

  // A captured locator that is only interacted with later stays a non-count.
  const capturedClick = `
    test('captures then clicks', async({ page }) => {
      const cell = page.locator('td:visible');
      await cell.click();
      await expect(cell).toBeFocused();
    });
  `;

  assert.equal(findViewportSmells(capturedClick), 0);
});

test('viewport smell: comments neither pin the viewport nor count as a rendered-count read', () => {
  // The words `height:` and `:visible` appear only in prose here — the grid setup itself pins nothing.
  const proseOnly = `
    describe('rows', () => {
      beforeEach(async() => {
        // No width/height: the grid takes the page layout's size.
        handsontable({ data: createSpreadsheetData(100, 10) });
      });
      /* a :visible count follows */
      it('counts', async() => { expect(countVisibleRows()).toBe(27); });
    });
  `;

  assert.equal(findViewportSmells(proseOnly), 1, 'the comment must not read as a pinned viewport');
  assert.equal(findViewportSmells('// tr:visible is what we count\nit("x", () => { expect(a).toBe(1); });'), 0);
});

// --- unasserted-capture: an awaited value that never reaches an assertion ---
test('unasserted capture: a `const x = await …` never used in an assertion is flagged, by name', () => {
  const src = `
    test('reads the row count', async({ page }) => {
      const grid = new GridPage(page);
      await grid.goto();
      const rows = await grid.rowCount();
      const first = await grid.cell(0, 0).textContent();
      await expect(grid.cell(0, 0)).toBeVisible();
    });
  `;
  const captures = findUnassertedCaptures(src);

  assert.equal(captures.length, 2);
  assert.deepEqual(captures.map(c => c.name).sort(), ['first', 'rows']);
  assert.equal(captures[0].test, 'reads the row count');

  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.ok(score.structureSmells.some(s => s.type === 'unasserted-capture' && s.count === 2));
  assert.equal(score.verdict, 'suspect');
  assert.ok(score.problems.some(p => p.type === 'structure-smells' && /rows/.test(p.detail)));
});

test('unasserted capture: a capture used inside expect(...), its matcher chain, or an assertion helper is fine', () => {
  const src = `
    it('asserts every capture', async() => {
      const rows = await grid.rowCount();
      const expected = await readExpected();
      const editor = await grid.openEditor(1, 1);
      const cell = await grid.cellLocator(0, 0);
      expect(rows).toBe(expected);
      await editor.expectVisible();
      await expect(cell).toHaveText('A1');
    });
  `;

  assert.deepEqual(findUnassertedCaptures(src), []);
  assert.deepEqual(scoreTestSource(src, { mutation: MUTATION_STUB }).structureSmells, []);
});

test('unasserted capture: only awaited captures count, the scope is the test body, and comments do not assert', () => {
  const src = `
    const shared = await setup();
    it('one', async() => {
      const grid = new GridPage(page);
      let count = await grid.rowCount();
      expect(count).toBe(5);
    });
    it('two', async() => {
      const other = await grid.rowCount();
      // expect(other).toBe(5);
      expect(1).toBe(1);
    });
  `;
  const captures = findUnassertedCaptures(src);

  assert.deepEqual(captures.map(c => [c.test, c.name]), [['two', 'other']]);
});

test('unasserted capture: a `$`-bearing identifier is matched literally, so its assertion is found', () => {
  // `$` is the one regex metacharacter an identifier can carry; escaped, `$rows`
  // finds its use inside expect(); unescaped it would read as an end anchor and
  // every `$`-named capture would be reported as unasserted.
  const src = `
    it('uses dollar names', async() => {
      const $rows = await grid.rowCount();
      const $$total = await grid.totalRows();
      const $dropped = await grid.cell(0, 0).textContent();
      expect($rows).toBe($$total);
    });
  `;

  assert.deepEqual(findUnassertedCaptures(src).map(c => c.name), ['$dropped']);
});

test('the new smells leave a clean, meaningful test clean', () => {
  const src = `
    test.describe('virtual rendering', () => {
      test('renders a window of rows', async({ page }) => {
        const grid = new GridPage(page);
        await grid.goto({ width: 400, height: 300 });
        const rows = await grid.renderedRowCount();
        expect(rows).toBe(12);
      });
    });
  `;
  const score = scoreTestSource(src, { mutation: MUTATION_STUB });

  assert.deepEqual(score.determinismSmells, []);
  assert.deepEqual(score.structureSmells, []);
  assert.equal(score.verdict, 'meaningful');
});
