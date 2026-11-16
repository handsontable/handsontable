import { test, expect } from '../fixtures/test';
import { MenuExecuteCommandPage } from '../fixtures/pages/MenuExecuteCommandPage';

const SEED = [
  ['A1', 'B1', 'C1'],
  ['A2', 'B2', 'C2'],
  ['A3', 'B3', 'C3'],
  ['A4', 'B4', 'C4'],
  ['A5', 'B5', 'C5'],
];

/** The seed with one whole column blanked, the result `clear_column` leaves behind. */
const withClearedColumn = (col: number) => SEED.map(row => row.map((value, index) => (index === col ? null : value)));

/**
 * `executeCommand()` runs a menu command with no menu open, so the `selection` argument a menu click
 * hands to a callback is absent. `clear_column` read `selection[0]` and threw
 * `Cannot read properties of undefined (reading '0')` on every programmatic call. The other
 * predefined items read the selection from the instance and never had the problem.
 *
 * The keys the `DropdownMenu` docs listed beyond its defaults (`undo`, `redo`, `row_above`, `row_below`,
 * `remove_row`), and `clear_column` for the `ContextMenu`, were never registered by default, so they
 * throw `Menu command '<key>' not exists.` unless the menu's setting lists them: the second block pins
 * that behavior.
 */
test.describe('clear_column through executeCommand()', () => {
  let grid: MenuExecuteCommandPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new MenuExecuteCommandPage(page, theme, bundle);
    await grid.goto();
    await grid.configure({ dropdownMenu: true, contextMenu: ['clear_column'] });
  });

  for (const plugin of ['dropdownMenu', 'contextMenu'] as const) {
    test.describe(`${plugin}`, () => {
      test('clears the selected column and only that one', async () => {
        await grid.selectColumns(1);

        expect(await grid.executeCommand(plugin, 'clear_column')).toBeNull();
        expect(await grid.data()).toEqual(withClearedColumn(1));
      });

      test('clears every column of a multi-column selection', async () => {
        await grid.selectColumns(0, 1);

        expect(await grid.executeCommand(plugin, 'clear_column')).toBeNull();
        expect(await grid.data()).toEqual(SEED.map(row => [null, null, row[2]]));
      });

      test('does nothing and does not throw when nothing is selected', async () => {
        await grid.deselect();

        expect(await grid.executeCommand(plugin, 'clear_column')).toBeNull();
        expect(await grid.data()).toEqual(SEED);
      });

      test('does nothing and does not throw when a cell, not a column, is selected', async () => {
        await grid.selectCellProgrammatically(1, 1);

        expect(await grid.executeCommand(plugin, 'clear_column')).toBeNull();
        expect(await grid.data()).toEqual(SEED);
      });

      test('clears the column in one undo step', async () => {
        await grid.selectColumns(1);
        await grid.executeCommand(plugin, 'clear_column');
        expect(await grid.data()).toEqual(withClearedColumn(1));

        await grid.undo();
        expect(await grid.data()).toEqual(SEED);
      });

      test('still honors a selection passed as the argument', async () => {
        // The selected column is 1, the argument names column 2: the argument wins, as it always did.
        await grid.selectColumns(1);

        const selection = [{ start: { row: 0, col: 2 }, end: { row: 4, col: 2 } }];

        expect(await grid.executeCommand(plugin, 'clear_column', selection)).toBeNull();
        expect(await grid.data()).toEqual(withClearedColumn(2));
      });
    });
  }
});

test.describe('DropdownMenu#executeCommand() with keys outside the defaults', () => {
  let grid: MenuExecuteCommandPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new MenuExecuteCommandPage(page, theme, bundle);
    await grid.goto();
  });

  test('throws for a built-in key the default items do not register', async () => {
    await grid.configure({ dropdownMenu: true });

    for (const key of ['undo', 'redo', 'row_above', 'row_below', 'remove_row']) {
      expect(await grid.executeCommand('dropdownMenu', key)).toBe(`Menu command '${key}' not exists.`);
    }
  });

  test('throws for clear_column on a context menu with the default items', async () => {
    await grid.configure({ contextMenu: true });
    expect(await grid.executeCommand('contextMenu', 'clear_column')).toBe("Menu command 'clear_column' not exists.");
  });

  test('runs a built-in key once the dropdownMenu setting lists it', async () => {
    await grid.configure({ dropdownMenu: ['undo', 'redo', '---------', 'clear_column'] });
    await grid.editCell(0, 0, 'edited');
    await grid.expectCell(0, 0, 'edited');

    expect(await grid.executeCommand('dropdownMenu', 'undo')).toBeNull();
    await grid.expectCell(0, 0, 'A1');

    expect(await grid.executeCommand('dropdownMenu', 'redo')).toBeNull();
    await grid.expectCell(0, 0, 'edited');
  });

  test('runs the default column commands', async () => {
    await grid.configure({ dropdownMenu: true });
    await grid.selectColumns(1);

    expect(await grid.executeCommand('dropdownMenu', 'col_right')).toBeNull();
    expect(await grid.countCols()).toBe(4);

    expect(await grid.executeCommand('dropdownMenu', 'make_read_only')).toBeNull();
    expect(await grid.cellMeta(0, 1, 'readOnly')).toBe(true);

    expect(await grid.executeCommand('dropdownMenu', 'alignment:center')).toBeNull();
    expect(await grid.cellMeta(0, 1, 'className')).toContain('htCenter');

    expect(await grid.executeCommand('dropdownMenu', 'remove_col')).toBeNull();
    expect(await grid.countCols()).toBe(3);
  });
});
