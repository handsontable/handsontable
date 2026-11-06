import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { SheetsBarFormulasOrderPage } from '../fixtures/pages/SheetsBarFormulasOrderPage';

/**
 * The Formulas plugin mirrors a sort or a row and column move into the engine, which moves the formula
 * cells with them, while the sheet's data keeps its own order. A sheet switch reloaded that data and
 * sorted it again, which gave other formulas than the ones the user left, and the formula text the bar
 * wrote back after a rename or a row insert did not match the sheet it was written into.
 */
test.describe('SheetsBar formulas across a sorted or moved sheet', { tag: BUNDLES_TAG }, () => {
  let grid: SheetsBarFormulasOrderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarFormulasOrderPage(page, theme, bundle);
  });

  test.describe('rename', () => {
    test('keeps the formulas of a sorted sheet when a sheet they reference is renamed', async() => {
      await grid.goto('sortedReport');
      await grid.sort(1, 'asc');

      expect(await grid.renameSheet('Prices', 'Costs')).toBe(true);

      expect(await grid.declaredSheetCell(0, 0, 0)).toBe('=Costs!A1');
      expect(await grid.declaredSheetCell(0, 1, 0)).toBe('plain text');
      expect(await grid.consoleMessages()).toEqual([]);
    });
  });

  test.describe('sheet names HyperFormula reads only in quotes', () => {
    test('opens the editor on the quoted name and keeps the value when Enter commits it', async() => {
      await grid.goto('quotedNames');
      await expect(grid.cell(0, 0)).toHaveText('7');

      expect(await grid.openEditor(0, 0)).toBe('=\'Лист2\'!A1');
      await grid.page.keyboard.press('Enter');
      await expect(grid.cell(0, 0)).toHaveText('7');

      expect(await grid.renameSheet('Prices', '2026')).toBe(true);
      await expect(grid.cell(0, 1)).toHaveText('99');

      expect(await grid.openEditor(0, 1)).toBe('=\'2026\'!A1');
      await grid.page.keyboard.press('Enter');
      await expect(grid.cell(0, 1)).toHaveText('99');
      expect(await grid.consoleMessages()).toEqual([]);
    });
  });

  test.describe('sheet names the engine reads as one', () => {
    test('gives a later sheet whose name differs only in case an engine sheet of its own', async() => {
      await grid.goto('clashingNames');

      expect(await grid.switchTo('data (2)')).toEqual([true]);
      await expect(grid.cell(0, 0)).toHaveText('small');
      expect(await grid.switchTo('Summary')).toEqual([true]);
      await expect(grid.cell(0, 0)).toHaveText('big');
      expect(await grid.engineSheetNames()).toEqual(['Data', 'Summary', 'data (2)']);
      expect(await grid.consoleMessages()).toEqual([
        'warn: The sheets "Data" and "data (2)" use the same formula engine sheet name (the engine ignores ' +
          'letter case). "data" was registered as "data (2)". Formulas that reference "data" read the sheet "Data".',
      ]);
    });
  });

  test.describe('remove and add', () => {
    test('repaints a formula that reads a sheet removed and added again', async() => {
      await grid.goto('sortedReport');
      await expect(grid.cell(0, 0)).toHaveText('99');

      expect(await grid.removeSheet('Prices')).toBe(true);
      await expect(grid.cell(0, 0)).toHaveText('#REF!');

      await grid.addSheet('Prices', [[7]]);
      await expect(grid.cell(0, 0)).toHaveText('7');
      expect(await grid.consoleMessages()).toEqual([]);
    });
  });

  test.describe('structural changes', () => {
    test('moves a reference on another sheet when a row is inserted above the cell it reads', async() => {
      await grid.goto('summary');
      await grid.alter('insert_row_above', 0);

      expect(await grid.switchTo('Summary')).toEqual([true]);

      await expect(grid.cell(0, 0)).toHaveText('50');
      expect(await grid.declaredSheetCell(1, 0, 0)).toBe('=Data!A6');
    });

    test('shows #REF! on another sheet when the row it reads is removed', async() => {
      await grid.goto('summary');
      await grid.alter('remove_row', 4);

      expect(await grid.switchTo('Summary')).toEqual([true]);

      await expect(grid.cell(0, 0)).toHaveText('#REF!');
      expect(await grid.declaredSheetCell(1, 0, 0)).toBe('=#REF!');
    });

    test('moves the references of a sorted sheet the user left, so a later order keeps its values', async() => {
      await grid.goto('sortedSummary');

      expect(await grid.switchTo('Summary')).toEqual([true]);

      await grid.sort(1, 'asc');

      expect(await grid.getData()).toEqual([[10, 'a'], [50, 'b']]);
      expect(await grid.switchTo('Data')).toEqual([true]);

      await grid.alter('insert_row_above', 0);

      expect(await grid.declaredSheetCell(1, 0, 0)).toBe('=Data!$A$6');
      expect(await grid.declaredSheetCell(1, 1, 0)).toBe('=Data!$A$2');
      expect(await grid.switchTo('Summary')).toEqual([true]);
      expect(await grid.getData()).toEqual([[10, 'a'], [50, 'b']]);

      await grid.sort(1, 'desc');

      expect(await grid.switchTo('Data', 'Summary')).toEqual([true, true]);
      expect(await grid.getData()).toEqual([[50, 'b'], [10, 'a']]);

      await grid.clearSort();

      expect(await grid.switchTo('Data', 'Summary')).toEqual([true, true]);
      expect(await grid.getData()).toEqual([[50, 'b'], [10, 'a']]);
      expect(await grid.declaredSheetCell(1, 0, 0)).toBe('=Data!$A$6');
      expect(await grid.declaredSheetCell(1, 1, 0)).toBe('=Data!$A$2');
      expect(await grid.consoleMessages()).toEqual([]);
    });
  });

  test.describe('a sorted sheet the user left, after a structural change on the sheet it reads', () => {
    for (const [workbook, first] of [['ownRefFirst', true], ['ownRefSecond', false]] as const) {
      test(`keeps its own references in its own order (${first ? 'sorted as the first sheet' : 'sorted after a switch'})`, async() => {
        await grid.goto(workbook);

        if (!first) {
          expect(await grid.switchTo('S')).toEqual([true]);
        }

        await grid.sort(0, 'asc');

        expect(await grid.getData()).toEqual([[1, 11], [2, 12], [3, 13]]);
        expect(await grid.switchTo('Main')).toEqual([true]);

        await grid.alter('insert_row_above', 0);

        expect(await grid.sheetData('S')).toEqual([
          [3, '=Main!$A$2+A1'], [1, '=Main!$A$2+A2'], [2, '=Main!$A$2+A3'],
        ]);

        await grid.alter('remove_row', 0);

        expect(await grid.sheetData('S')).toEqual([
          [3, '=Main!$A$1+A1'], [1, '=Main!$A$1+A2'], [2, '=Main!$A$1+A3'],
        ]);
        expect(await grid.switchTo('S')).toEqual([true]);

        await grid.clearSort();

        expect(await grid.switchTo('Main', 'S')).toEqual([true, true]);
        expect(await grid.getData()).toEqual([[3, 13], [1, 11], [2, 12]]);
      });
    }

    test('keeps relative references and a formula typed after the sort in its own order', async() => {
      await grid.goto('relativeDesc');

      expect(await grid.switchTo('S')).toEqual([true]);

      await grid.sort(0, 'desc');
      await grid.setDataAtCell(6, 1, '=Main!A3');

      expect(await grid.switchTo('Main')).toEqual([true]);

      await grid.alter('insert_row_above', 0);

      expect(await grid.sheetData('S')).toEqual([
        ...[1, 2, 3, 4, 5, 6].map(n => [n, `=Main!A${n + 1}`]),
        [null, '=Main!A4'],
      ]);
      expect(await grid.switchTo('S')).toEqual([true]);

      await grid.clearSort();

      expect(await grid.switchTo('Main', 'S')).toEqual([true, true]);
      expect(await grid.getData()).toEqual([
        ...[1, 2, 3, 4, 5, 6].map(n => [n, n * 10]),
        [null, 30],
      ]);
    });
  });

  test.describe('a moved sheet the user left, after a structural change on the sheet it reads', () => {
    const expectedRows = [1, 2, 3, 4].map(n => [n, `=Main!A${n + 1}`]);

    test('keeps the references of a row moved up on the cells they read', async() => {
      await grid.goto('movedRows');
      await grid.moveRow(3, 0);

      expect(await grid.getData()).toEqual([[4, 40], [1, 10], [2, 20], [3, 30]]);
      expect(await grid.switchTo('Main')).toEqual([true]);

      await grid.alter('insert_row_above', 0);

      expect(await grid.sheetData('S')).toEqual(expectedRows);
      expect(await grid.switchTo('S')).toEqual([true]);
      expect(await grid.getData()).toEqual([[4, 40], [1, 10], [2, 20], [3, 30]]);
    });

    test('keeps the references of a row moved down on the cells they read', async() => {
      await grid.goto('movedRows');
      await grid.moveRow(0, 3);

      expect(await grid.getData()).toEqual([[2, 20], [3, 30], [4, 40], [1, 10]]);
      expect(await grid.switchTo('Main')).toEqual([true]);

      await grid.alter('insert_row_above', 0);

      expect(await grid.sheetData('S')).toEqual(expectedRows);
      expect(await grid.switchTo('S')).toEqual([true]);
      expect(await grid.getData()).toEqual([[2, 20], [3, 30], [4, 40], [1, 10]]);
    });

    test('keeps the references of a moved column on the cells they read', async() => {
      await grid.goto('movedColumnRefs');
      await grid.moveColumn(2, 0);

      expect(await grid.getData()).toEqual([[30, 10, 20]]);
      expect(await grid.switchTo('Main')).toEqual([true]);

      await grid.alter('insert_col_start', 0);

      expect(await grid.sheetData('S')).toEqual([['=Main!B1', '=Main!C1', '=Main!D1']]);
      expect(await grid.switchTo('S')).toEqual([true]);
      expect(await grid.getData()).toEqual([[30, 10, 20]]);
    });

    test('shifts back only what the sort moved, on a sheet moved and then sorted', async() => {
      await grid.goto('movedRows');
      await grid.moveRow(3, 0);
      await grid.sort(0, 'desc');

      expect(await grid.getData()).toEqual([[4, 40], [3, 10], [2, 20], [1, 30]]);
      expect(await grid.switchTo('Main')).toEqual([true]);

      await grid.alter('insert_row_above', 0);

      expect(await grid.sheetData('S')).toEqual(expectedRows);
      expect(await grid.switchTo('S')).toEqual([true]);
      expect(await grid.getData()).toEqual([[4, 40], [3, 10], [2, 20], [1, 30]]);

      await grid.clearSort();

      expect(await grid.getData()).toEqual([[4, 40], [1, 10], [2, 20], [3, 30]]);
      expect(await grid.consoleMessages()).toEqual([]);
    });
  });

  test.describe('a moved sheet\'s references to its own cells, after a structural change on the sheet it reads', () => {
    test('keeps a moved column\'s own references on the cells they read', async() => {
      await grid.goto('ownRefColumns');
      await grid.moveColumn(2, 0);

      expect(await grid.switchTo('Main')).toEqual([true]);

      await grid.alter('insert_row_above', 0);

      expect(await grid.sheetData('S')).toEqual([
        [1, 2, '=Main!A2+B1', '=C1*2'],
        [3, 4, '=Main!A3+B2', '=C2*2'],
      ]);
      expect(await grid.switchTo('S')).toEqual([true]);

      await grid.moveColumn(0, 2);

      expect(await grid.switchTo('Main', 'S')).toEqual([true, true]);
      expect(await grid.getData()).toEqual([[1, 2, 12, 24], [3, 4, 24, 48]]);
    });

    test('keeps a moved row\'s own references on the cells they read', async() => {
      await grid.goto('ownRefRows');
      await grid.moveRow(0, 3);

      expect(await grid.switchTo('Main')).toEqual([true]);

      await grid.alter('insert_row_above', 0);

      expect(await grid.sheetData('S')).toEqual(
        [1, 2, 3, 4, 5].map(n => [n, `=SUM(Main!A${n + 1}:A${n + 2})`, `=Main!B${n + 1}*A${n}`]),
      );
    });

    test('keeps the own references of a sheet moved and then sorted on the cells they read', async() => {
      await grid.goto('ownRefSorted');
      await grid.moveRow(3, 0);
      await grid.sort(0, 'desc');

      expect(await grid.switchTo('Main')).toEqual([true]);

      await grid.alter('insert_row_above', 0);

      expect(await grid.sheetData('S')).toEqual([1, 2, 3, 4].map(n => [n, `=Main!A${n + 1}+A${n}`]));
      expect(await grid.consoleMessages()).toEqual([]);
    });
  });

  test.describe('round trips', () => {
    test('reads a sorted sheet the same way on the first visit and on a later one', async() => {
      await grid.goto('sortedData');
      await grid.sort(0, 'asc');

      expect(await grid.switchTo('Summary')).toEqual([true]);
      await expect(grid.cell(0, 0)).toHaveText('10');

      expect(await grid.switchTo('Data', 'Summary')).toEqual([true, true]);
      await expect(grid.cell(0, 0)).toHaveText('10');
    });

    test('keeps the formulas of a moved column through a sheet without formulas', async() => {
      await grid.goto('movedColumns');
      await grid.moveColumn(2, 0);
      await expect(grid.cell(0, 0)).toHaveText('3');

      expect(await grid.switchTo('Plain', 'Sheet')).toEqual([true, true]);

      await expect(grid.cell(0, 0)).toHaveText('3');
      await expect(grid.cell(1, 0)).toHaveText('7');
    });

    test('keeps the formulas of a moved column through another formulas sheet', async() => {
      await grid.goto('movedColumns');
      await grid.moveColumn(2, 0);

      expect(await grid.switchTo('Other', 'Sheet')).toEqual([true, true]);

      await expect(grid.cell(0, 0)).toHaveText('3');
      await expect(grid.cell(1, 0)).toHaveText('7');
    });

    const changes: Array<[string, (page: SheetsBarFormulasOrderPage) => Promise<void>, unknown[][]]> = [
      ['a row inserted', page => page.alter('insert_row_above', 0), [[null, null], [1, 10], [2, 20], [3, 30]]],
      ['a row removed', page => page.alter('remove_row', 0), [[2, 20], [3, 30]]],
      ['a formula edited', page => page.setDataAtCell(0, 1, '=A1*100'), [[1, 100], [2, 20], [3, 30]]],
    ];

    changes.forEach(([name, change, expected]) => {
      test(`keeps the values of a sorted sheet after ${name}`, async() => {
        await grid.goto('sortedFormulas');
        await grid.sort(0, 'asc');

        expect(await grid.getData()).toEqual([[1, 10], [2, 20], [3, 30]]);

        await change(grid);

        expect(await grid.getData()).toEqual(expected);
        expect(await grid.switchTo('Other', 'Sheet')).toEqual([true, true]);
        expect(await grid.getData()).toEqual(expected);
      });
    });

    test('keeps the values of a sheet with a moved row after a row inserted', async() => {
      await grid.goto('sortedFormulas');
      await grid.moveRow(0, 2);
      await grid.alter('insert_row_above', 0);

      const before = await grid.getData();

      expect(await grid.switchTo('Other', 'Sheet')).toEqual([true, true]);

      expect(await grid.getData()).toEqual(before);
    });

    test('keeps the formulas of a moved column on a sheet with an engine of its own', async() => {
      await grid.goto('ownEngineColumns');
      await grid.moveColumn(0, 2);

      expect(await grid.getData()).toEqual([[2, 3, 1], [4, 7, 3]]);
      expect(await grid.switchTo('Plain', 'Sheet')).toEqual([true, true]);

      expect(await grid.getData()).toEqual([[2, 3, 1], [4, 7, 3]]);
    });

    test('keeps the values of a sheet with an engine of its own after a moved row and a row inserted', async() => {
      await grid.goto('ownEngineRows');
      await grid.moveRow(4, 0);
      await grid.alter('insert_row_above', 2);

      const before = await grid.getData();

      expect(before).toEqual([[30, 1030], [50, 1050], [null, null], [20, 1020], [40, 1040], [10, 1010]]);
      expect(await grid.switchTo('Plain', 'Sheet')).toEqual([true, true]);

      expect(await grid.getData()).toEqual(before);
    });

    test('keeps a SUM over a sorted column after a cell of that column is edited', async() => {
      await grid.goto('sortedSum');
      await grid.sort(0, 'asc');
      await grid.setDataAtCell(0, 0, 10);
      await expect(grid.cell(1, 1)).toHaveText('15');

      expect(await grid.switchTo('Other', 'Sheet')).toEqual([true, true]);

      await expect(grid.cell(1, 1)).toHaveText('15');
    });
  });

  test.describe('formula text', () => {
    test('is shown per sheet, and kept through a sheet without formulas', async() => {
      await grid.goto('showFormulas');
      await grid.showFormulas();
      await expect(grid.cell(0, 1)).toHaveText('=A1+1');

      expect(await grid.switchTo('F2')).toEqual([true]);
      expect(await grid.isShowingFormulas()).toBe(false);
      await expect(grid.cell(0, 1)).toHaveText('3');

      expect(await grid.switchTo('F1')).toEqual([true]);
      await expect(grid.cell(0, 1)).toHaveText('=A1+1');

      expect(await grid.switchTo('Plain', 'F1')).toEqual([true, true]);
      expect(await grid.isShowingFormulas()).toBe(true);
      await expect(grid.cell(0, 1)).toHaveText('=A1+1');
    });
  });
});
