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

    const changes: Array<[string, (page: SheetsBarFormulasOrderPage) => Promise<void>]> = [
      ['a row inserted', page => page.alter('insert_row_above', 0)],
      ['a row removed', page => page.alter('remove_row', 0)],
      ['a formula edited', page => page.setDataAtCell(0, 1, '=A1*100')],
    ];

    changes.forEach(([name, change]) => {
      test(`keeps the values of a sorted sheet after ${name}`, async() => {
        await grid.goto('sortedFormulas');
        await grid.sort(0, 'asc');
        await change(grid);

        const before = await grid.getData();

        expect(await grid.switchTo('Other', 'Sheet')).toEqual([true, true]);

        expect(await grid.getData()).toEqual(before);
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
