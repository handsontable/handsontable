import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * Values written into a checkbox cell by paste and by the fill handle (DEV-355).
 *
 * The checkbox renderer matched its templates regardless of letter case, but the checkbox value
 * setter compared them exactly, so a pasted `'False'` showed an unchecked box while the data held the
 * string `'False'` – which a backend may read as true. Both now match through one function and the
 * template value is stored. A value that matches neither template (`'Ted'`) is still stored and shown
 * as `#bad-value#` by default; the new `checkbox` validator is opt-in and lets a column flag it, or
 * reject it with `allowInvalid: false`.
 */
test.describe('checkbox cells and written values', { tag: THEMES_TAG }, () => {
  let grid: SelectionFeaturesPage;

  // A: names (a fill-handle source), B: default checkbox, C: text (the drag target, so the drag
  // crosses B), D: yes/no checkbox.
  const DATA = [
    ['Ted', true, 'c1', 'yes'],
    ['Ann', false, 'c2', 'no'],
    ['Bob', true, 'c3', 'yes'],
  ];
  const columns = (checkbox: Record<string, unknown> = {}) => [
    {},
    { type: 'checkbox', ...checkbox },
    {},
    { type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no', ...checkbox },
  ];

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionFeaturesPage(page, theme, bundle);
    await grid.goto();
  });

  test('stores the template value for a pasted case variant of a template', async () => {
    await grid.initGrid({ data: DATA, columns: columns() });

    await grid.pasteText(0, 1, 'False');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: false, badValue: false, invalid: false });

    await grid.pasteText(1, 1, 'TRUE');
    await expect.poll(() => grid.checkboxCell(1, 1)).toEqual({ value: true, badValue: false, invalid: false });

    await grid.pasteText(1, 3, 'YES');
    await expect.poll(() => grid.checkboxCell(1, 3)).toEqual({ value: 'yes', badValue: false, invalid: false });
  });

  // Pins the default: no validator on the cell type, so a non-template value is kept and shown as
  // `#bad-value#`, exactly as before.
  test('keeps a non-template value as #bad-value# when the cell has no validator', async () => {
    await grid.initGrid({ data: DATA, columns: columns() });

    await grid.selectCells(0, 0, 0, 0);
    await grid.dragFillHandleTo(0, 2);

    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: 'Ted', badValue: true, invalid: false });
  });

  test('marks a non-template value invalid with the opt-in checkbox validator', async () => {
    await grid.initGrid({ data: DATA, columns: columns({ validator: 'checkbox' }) });

    await grid.selectCells(0, 0, 0, 0);
    await grid.dragFillHandleTo(0, 2);

    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: 'Ted', badValue: true, invalid: true });

    // (2, 1) starts as `true`, so the paste is visible.
    await grid.pasteText(2, 1, 'false');
    await expect.poll(() => grid.checkboxCell(2, 1)).toEqual({ value: false, badValue: false, invalid: false });
  });

  test('rejects a non-template value with the checkbox validator and allowInvalid: false', async () => {
    await grid.initGrid({ data: DATA, columns: columns({ validator: 'checkbox', allowInvalid: false }) });

    await grid.selectCells(0, 0, 0, 0);
    await grid.dragFillHandleTo(0, 2);

    // The text column the drag also covered is filled; the checkbox keeps its value.
    await expect(grid.cell(0, 2)).toHaveText('Ted');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: true, badValue: false, invalid: false });

    // Each paste also covers a text cell, the positive control that the paste landed.
    await grid.pasteText(1, 2, 'pasted\tmaybe');
    await grid.pasteText(2, 0, 'Zed\tTed');
    await expect(grid.cell(1, 2)).toHaveText('pasted');
    await expect(grid.cell(2, 0)).toHaveText('Zed');
    await expect.poll(() => grid.checkboxCell(1, 3)).toEqual({ value: 'no', badValue: false, invalid: false });
    await expect.poll(() => grid.checkboxCell(2, 1)).toEqual({ value: true, badValue: false, invalid: false });
  });

  test('accepts an empty unchecked template under allowEmpty: false', async () => {
    await grid.initGrid({
      data: DATA,
      columns: [{}, { type: 'checkbox', checkedTemplate: 'X', uncheckedTemplate: '', validator: 'checkbox',
        allowEmpty: false, allowInvalid: false }, {}, {}],
    });

    await grid.pasteText(0, 1, 'X');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: 'X', badValue: false, invalid: false });

    // Unticking writes the empty template, which is valid.
    await grid.pressKeyOnCell(0, 1, 'Space');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: '', badValue: false, invalid: false });
  });

  test('keeps both states for templates that differ only in letter case', async () => {
    await grid.initGrid({
      data: [['a', 'Y'], ['b', 'Y']],
      columns: [{}, { type: 'checkbox', checkedTemplate: 'Y', uncheckedTemplate: 'y' }],
    });

    await grid.pasteText(0, 1, 'y');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: 'y', badValue: false, invalid: false });

    await grid.pressKeyOnCell(1, 1, 'Space');
    await expect.poll(() => grid.checkboxCell(1, 1)).toEqual({ value: 'y', badValue: false, invalid: false });
    await grid.pressKeyOnCell(1, 1, 'Space');
    await expect.poll(() => grid.checkboxCell(1, 1)).toEqual({ value: 'Y', badValue: false, invalid: false });
  });

  test('leaves an UndoRedo write verbatim', async () => {
    await grid.initGrid({ data: [['a', 'False']], columns: [{}, { type: 'checkbox' }] });

    await grid.pasteText(0, 1, 'TRUE');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: true, badValue: false, invalid: false });

    await grid.setCellValueWithSource(0, 1, 'False', 'UndoRedo.undo');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: 'False', badValue: false, invalid: false });

    // Positive control: the same write from an edit stores the template.
    await grid.setCellValueWithSource(0, 1, 'False', 'edit');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: false, badValue: false, invalid: false });
  });

  test('stores the template for a value written into a row that was never rendered', async () => {
    const rows = Array.from({ length: 300 }, (_, row) => [`r${row}`, null]);

    await grid.initGrid({ data: rows, columns: [{}, { type: 'checkbox' }] });
    // The precondition: the row has never been rendered, so its meta has no templates yet.
    await expect.poll(() => grid.isCellRendered(250, 1)).toBe(false);

    await grid.setCellValueWithSource(250, 1, 'true', 'edit');
    await grid.setCellValueWithSource(251, 1, 'FALSE', 'edit');

    await expect.poll(() => grid.sourceCellValue(250, 1)).toBe(true);
    await expect.poll(() => grid.sourceCellValue(251, 1)).toBe(false);
  });

  // The renderer draws a loaded `'TRUE'` as checked, so the toggle and the export read it the same
  // way (the export is pinned in `exportFile/__tests__/types/xlsx/cell-types.spec.js`). The sort maps a
  // case variant only onto a template the column defines (the next test); with the default templates
  // it keeps sorting by the default comparator.
  test('toggles a loaded case variant with Space like the template it renders as', async () => {
    await grid.initGrid({ data: [['a', 'TRUE'], ['b', 'False']], columns: [{}, { type: 'checkbox' }] });

    await grid.pressKeyOnCell(0, 1, 'Space');
    await expect.poll(() => grid.checkboxCell(0, 1)).toEqual({ value: false, badValue: false, invalid: false });

    await grid.pressKeyOnCell(1, 1, 'Space');
    await expect.poll(() => grid.checkboxCell(1, 1)).toEqual({ value: true, badValue: false, invalid: false });
  });

  test('sorts a case variant with the template it renders as', async () => {
    await grid.initGrid({
      data: [['a', 'YES'], ['b', 'No'], ['c', 'yes'], ['d', 'no'], ['e', 'Yes']],
      columns: [{}, { type: 'checkbox', checkedTemplate: 'Yes', uncheckedTemplate: 'No' }],
      columnSorting: true,
    });

    await grid.sortColumn(1, 'asc');

    await expect.poll(() => grid.visualColumnData(0)).toEqual(['b', 'd', 'a', 'c', 'e']);
  });
});

