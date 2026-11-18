import { test, expect } from '../fixtures/test';
import { FiltersAvailableConditionsPage, SEPARATOR_LABEL as SEP } from '../fixtures/pages/FiltersAvailableConditionsPage';

/**
 * Coverage for the "Is checked" and "Is unchecked" conditions a checkbox column offers in its
 * "Filter by condition" list, on top of the text conditions it always had.
 *
 * The rule (which values each condition matches, the templates, the availability checks) is pinned by
 * the unit suites (`condition/checked.unit.ts`, `condition/unchecked.unit.ts`, `checkboxConditions.unit.js`,
 * `getAvailableConditions.unit.js`). These specs cover what the user sees and operates: the list in the
 * open menu, and the filter a picked condition applies, by mouse and by keyboard.
 */
test.describe('filters: checkbox conditions', () => {
  let grid: FiltersAvailableConditionsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersAvailableConditionsPage(page, theme, bundle);
    await grid.goto();
    await grid.rebuild({
      data: [
        ['Racing Socks', true],
        ['Mountain Frame', false],
        ['Cycling Cap', true],
        ['Road Tire Tube', null],
        ['Water Bottle', false],
      ],
      colHeaders: ['Product', 'In stock'],
      columns: [{ type: 'text' }, { type: 'checkbox' }],
      filters: true,
    });
  });

  test('lists "Is checked" and "Is unchecked" after "Is not empty" on a checkbox column', async() => {
    await grid.openMenu('In stock');
    await grid.openConditionSelect();

    await expect.poll(() => grid.conditionOptions()).toEqual([
      'None', SEP,
      'Is empty', 'Is not empty', SEP,
      'Is checked', 'Is unchecked', SEP,
      'Is equal to', 'Is not equal to', SEP,
      'Begins with', 'Ends with', SEP,
      'Contains', 'Does not contain',
    ]);
    await expect(grid.conditionsMenu.getByRole('menuitem', { name: 'Is checked', exact: true })).toBeVisible();
    await expect(grid.conditionsMenu.getByRole('menuitem', { name: 'Is unchecked', exact: true })).toBeVisible();
    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps the text list unchanged on a text column', async() => {
    await grid.openMenu('Product');
    await grid.openConditionSelect();

    await expect.poll(() => grid.conditionOptions()).toEqual([
      'None', SEP,
      'Is empty', 'Is not empty', SEP,
      'Is equal to', 'Is not equal to', SEP,
      'Begins with', 'Ends with', SEP,
      'Contains', 'Does not contain',
    ]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('filters the checked rows with "Is checked" picked by mouse', async() => {
    await grid.openMenu('In stock');
    await grid.openConditionSelect();
    await grid.pickCondition('Is checked');

    await expect(grid.conditionCaption()).toHaveText('Is checked');
    await expect(grid.conditionInputs()).toHaveCount(0);

    await grid.confirmMenu();

    await expect.poll(() => grid.columnValues(0)).toEqual(['Racing Socks', 'Cycling Cap']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('filters the unchecked rows with "Is unchecked" chosen by keyboard only', async() => {
    await grid.openMenuWithKeyboard(1);
    await grid.focusConditionSelectWithKeyboard();
    await grid.chooseConditionWithKeyboard('Is unchecked');

    await expect(grid.conditionCaption()).toHaveText('Is unchecked');

    await grid.confirmMenuWithKeyboard();

    // The empty cell renders as an unchecked box but holds no template, so "Is unchecked" leaves it out.
    await expect.poll(() => grid.columnValues(0)).toEqual(['Mountain Frame', 'Water Bottle']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('reads templates a cells() function sets on rows that were never rendered', async() => {
    await grid.rebuildWithCellTemplates(500);
    await grid.filterThroughApi(1, 'checked', []);

    // Every other row holds 'Y', and the grid draws only a few of the 500 rows.
    await expect.poll(() => grid.rowCount()).toBe(250);

    await grid.rebuildWithCellTemplates(500);
    await grid.filterThroughApi(1, 'unchecked', []);

    await expect.poll(() => grid.rowCount()).toBe(250);
    expect(grid.pageErrors).toEqual([]);
  });

  test('accepts the conditions through addCondition()', async() => {
    await grid.filterThroughApi(1, 'checked', []);

    await expect.poll(() => grid.columnValues(0)).toEqual(['Racing Socks', 'Cycling Cap']);
    expect(grid.pageErrors).toEqual([]);
  });
});
