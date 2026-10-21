import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { SheetsBarDataBoundSettingsPage } from '../fixtures/pages/SheetsBarDataBoundSettingsPage';

/**
 * A switch applies the arriving sheet's `settings` while the grid still holds the departing
 * sheet's data, and loads the arriving data after. A plugin that reads the data when its settings
 * are applied therefore read the wrong sheet: NestedRows judged a flat array and turned itself
 * off, and ColumnSummary checked its endpoints against the departing sheet's size and wrote its
 * results into that sheet's data. Separately, the reset of a never-visited sheet cleared the
 * merges after it brought hidden and trimmed rows back, so the merged cell kept its `rowspan`.
 */
test.describe('SheetsBar settings that read the data', { tag: BUNDLES_TAG }, () => {
  let grid: SheetsBarDataBoundSettingsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarDataBoundSettingsPage(page, theme, bundle);
  });

  test.describe('NestedRows', () => {
    test('stays on when a switch lands on a nested sheet', async() => {
      await grid.goto('nestedRows');

      expect(await grid.switchTo('Tree')).toEqual([true]);

      expect(await grid.consoleMessages()).toEqual([]);
      expect(await grid.isPluginEnabled('nestedRows')).toBe(true);
      expect(await grid.countRows()).toBe(2);
      await expect(grid.cell(0, 0)).toHaveText('Parent');
      await expect(grid.cell(1, 0)).toHaveText('Child');
    });

    test('survives a round trip through the flat sheet', async() => {
      await grid.goto('nestedRows');

      expect(await grid.switchTo('Tree', 'Plain')).toEqual([true, true]);

      expect(await grid.isPluginEnabled('nestedRows')).toBe(false);
      await expect(grid.cell(0, 0)).toHaveText('a');

      expect(await grid.switchTo('Tree')).toEqual([true]);

      expect(await grid.consoleMessages()).toEqual([]);
      expect(await grid.isPluginEnabled('nestedRows')).toBe(true);
      await expect(grid.cell(1, 0)).toHaveText('Child');
    });

    test('loads a nested sheet after another nested sheet with its declared hidden row', async() => {
      await grid.goto('nestedRows');

      expect(await grid.switchTo('Tree', 'Tree2')).toEqual([true, true]);

      expect(await grid.consoleMessages()).toEqual([]);
      expect(await grid.isPluginEnabled('nestedRows')).toBe(true);
      expect(await grid.countRows()).toBe(4);
      expect(await grid.isRowHidden(2)).toBe(true);
      expect(await grid.dataAtCell(3, 0)).toBe('Third');
    });

    test('pads a nested sheet against its flattened rows, not its top-level entries', async() => {
      await grid.goto('nestedRowsPadded');

      expect(await grid.switchTo('Tree')).toEqual([true]);

      expect(await grid.consoleMessages()).toEqual([]);
      expect(await grid.countRows()).toBe(5);
      expect(await grid.declaredSheetLength(1)).toBe(1);
    });

    test('is on when the workbook opens on a nested sheet', async() => {
      await grid.goto('nestedRows', { open: 1 });

      expect(await grid.activeSheetName()).toBe('Tree');
      expect(await grid.consoleMessages()).toEqual([]);
      expect(await grid.isPluginEnabled('nestedRows')).toBe(true);
      expect(await grid.countRows()).toBe(2);
      await expect(grid.cell(1, 0)).toHaveText('Child');
    });
  });

  test.describe('ColumnSummary', () => {
    test('is checked against the arriving sheet', async() => {
      await grid.goto('columnSummary');

      expect(await grid.switchTo('Big')).toEqual([true]);

      expect(await grid.consoleMessages()).toEqual([]);
      expect(await grid.dataAtCell(9, 4)).toBe(378);
    });

    test('writes nothing into the departing sheet', async() => {
      await grid.goto('columnSummary');

      expect(await grid.switchTo('Wide', 'Big')).toEqual([true, true]);
      expect(await grid.dataAtCell(9, 4)).toBe(378);

      expect(await grid.switchTo('Wide')).toEqual([true]);

      expect(await grid.declaredSheetCell(2, 9, 4)).toBe(94);
      expect(await grid.dataAtCell(9, 4)).toBe(94);
    });

    test('does not run the departing summary against the arriving sheet', async() => {
      await grid.goto('columnSummary');

      expect(await grid.switchTo('Big', 'Big2')).toEqual([true, true]);

      expect(await grid.consoleMessages()).toEqual([]);
      expect(await grid.declaredSheetCell(3, 9, 4)).toBe(94);
      expect(await grid.dataAtCell(9, 5)).toBe(369);
    });

    test('is computed on a switch when Formulas is on', async() => {
      await grid.goto('formulasSummary');

      expect(await grid.switchTo('S', 'P', 'S')).toEqual([true, true, true]);

      expect(await grid.consoleMessages()).toEqual([]);
      expect(grid.pageErrors).toEqual([]);
      expect(await grid.dataAtCell(19, 4)).toBe(378);
    });

    test('is computed when the workbook opens on a summary sheet', async() => {
      await grid.goto('columnSummary', { open: 1 });

      expect(await grid.activeSheetName()).toBe('Big');
      expect(await grid.consoleMessages()).toEqual([]);
      expect(await grid.dataAtCell(9, 4)).toBe(378);
    });
  });

  test('computes a summary over the flattened rows of a nested sheet', async() => {
    await grid.goto('nestedSummary');

    expect(await grid.switchTo('Mixed')).toEqual([true]);

    expect(await grid.consoleMessages()).toEqual([]);
    expect(await grid.countRows()).toBe(4);
    expect(await grid.dataAtCell(3, 0)).toBe(6);
  });

  test('a merged cell leaves no span behind on a sheet without merges', async() => {
    await grid.goto('mergeCells');
    await expect(grid.spannedCells()).toHaveCount(1);

    expect(await grid.switchTo('C', 'A')).toEqual([true, true]);

    await expect(grid.spannedCells()).toHaveCount(0);
  });
});
