import { test, expect } from '../fixtures/test';
import { FiltersAvailableConditionsPage, SEPARATOR_LABEL as SEP } from '../fixtures/pages/FiltersAvailableConditionsPage';

/**
 * Coverage for DEV-3056 - choosing which operators the "Filter by condition" selects offer, through
 * `filters.availableConditions`.
 *
 * The fixture builds the per-column case: a grid-level rule drops "Is not between" from numeric
 * columns, Category (text) and Qty (numeric) carry their own allow-lists, and Product (text) and
 * Price (numeric) carry nothing of their own. So one grid shows the stock list, an inherited rule,
 * and a column rule that replaces the grid one.
 *
 * How the setting resolves (shapes, validation, warnings) is pinned by the unit suites
 * (`availableConditions.unit.ts`, `perColumnFilters.unit.js`). These specs cover what the user sees:
 * the list in the open menu, and the filter a picked condition applies.
 */
test.describe('filters.availableConditions', () => {
  let grid: FiltersAvailableConditionsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersAvailableConditionsPage(page, theme, bundle);
    await grid.goto();
  });

  test('shows the stock list on a text column with no rule', async() => {
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

  test('drops only the excluded operator on a numeric column that inherits the grid rule', async() => {
    await grid.openMenu('Price');
    await grid.openConditionSelect();

    await expect.poll(() => grid.conditionOptions()).toEqual([
      'None', SEP,
      'Is empty', 'Is not empty', SEP,
      'Is equal to', 'Is not equal to', SEP,
      'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to', 'Is between',
    ]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('shows a column allow-list in its own order', async() => {
    await grid.openMenu('Category');
    await grid.openConditionSelect();

    await expect.poll(() => grid.conditionOptions()).toEqual([
      'None', SEP,
      'Is equal to', 'Is not equal to', SEP,
      'Is empty', 'Is not empty',
    ]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('gives the second condition select the same column list', async() => {
    await grid.openMenu('Qty');
    // The second select shows up only once the first one holds a condition.
    await grid.openConditionSelect();
    await grid.pickCondition('Greater than');
    await grid.openConditionSelect(1);

    await expect.poll(() => grid.conditionOptions()).toEqual([
      'None', SEP,
      'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to', SEP,
      'Is between',
    ]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('filters by a condition picked from a column allow-list', async() => {
    await grid.openMenu('Qty');
    await grid.openConditionSelect();
    await grid.pickCondition('Greater than');
    await grid.typeConditionValue('100');
    await grid.confirmMenu();

    await expect.poll(() => grid.columnValues(3)).toEqual([120, 310, 900]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps showing, and applying, a condition the list no longer offers', async() => {
    // A condition added through the API is not limited by the list. The select must still name it,
    // or the column would filter with nothing in its own menu to say why.
    await grid.filterThroughApi(2, 'not_between', [50, 1000]);

    await expect.poll(() => grid.columnValues(2)).toEqual([30, 1890, 9]);

    await grid.openMenu('Price');

    await expect(grid.conditionCaption()).toHaveText('Is not between');

    await grid.openConditionSelect();

    await expect.poll(() => grid.conditionOptions()).not.toContain('Is not between');
    expect(grid.pageErrors).toEqual([]);
  });

  test('shows the stock numeric list once the grid rule is removed', async() => {
    // The positive control for the inherited case: the same column offers "Is not between" as
    // soon as the grid-level rule is gone, so the test above cannot pass on a list that never had it.
    await grid.rebuild({ filters: true });
    await grid.openMenu('Price');
    await grid.openConditionSelect();

    await expect.poll(() => grid.conditionOptions()).toContain('Is not between');
    expect(grid.pageErrors).toEqual([]);
  });
});
