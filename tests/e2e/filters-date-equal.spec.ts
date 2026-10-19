import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FiltersAvailableConditionsPage } from '../fixtures/pages/FiltersAvailableConditionsPage';

const GRID = {
  data: [
    ['2019-12-31', '2019-12-31', 5, 'alpha', '09:00', '2019-12-31T09:00:00'],
    ['2020-01-15', '2020-01-15', 15, 'beta', '10:30', '2020-01-15T10:30:00'],
    ['2020-03-10', '2020-03-10', 25, 'gamma', '12:15', '2020-03-10T12:15:00'],
  ],
  colHeaders: ['Sell date', 'Delivery', 'Qty', 'Name', 'Starts', 'Meets'],
  columns: [
    { type: 'date', locale: 'en-US', dateFormat: { dateStyle: 'short' } },
    { type: 'intl-date', locale: 'en-US', dateFormat: { dateStyle: 'short' } },
    { type: 'numeric' },
    { type: 'text' },
    { type: 'intl-time', locale: 'en-US' },
    { type: 'intl-datetime', locale: 'en-US' },
  ],
};

const DATE_COLUMNS = [
  { header: 'Sell date', col: 0 },
  { header: 'Delivery', col: 1 },
];

/**
 * "Is equal to" and "Is not equal to" are shared by every column type, and they compare ISO date
 * strings on date columns, so the input type has to follow the column type. A date typed the way
 * the column displays it (`1/15/20`) matches nothing.
 *
 * The input-type and restore tests fail without the descriptor change. The text-input tests on
 * other column types, the filtering tests, and the condition key test are regression guards: they
 * pin what the change must not alter. `intl-time` and `intl-datetime` stay text on purpose, because
 * their cells can hold seconds that a native time input cannot express.
 */
test.describe('Filters - "Is equal to" input type', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: FiltersAvailableConditionsPage;

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersAvailableConditionsPage(page, theme, bundle);
    await grid.goto();
    await grid.rebuild(GRID);
  });

  for (const { header } of DATE_COLUMNS) {
    for (const condition of ['Is equal to', 'Is not equal to']) {
      test(`renders a date input for "${condition}" on the "${header}" column`, async() => {
        await grid.openMenu(header);
        await grid.openConditionSelect();
        await grid.pickCondition(condition);

        await expect(grid.conditionInputs()).toHaveCount(1);
        await expect(grid.conditionInputs().first()).toHaveAttribute('type', 'date');
      });
    }
  }

  for (const header of ['Qty', 'Name', 'Starts', 'Meets']) {
    test(`keeps a text input for "Is equal to" on the "${header}" column`, async() => {
      await grid.openMenu(header);
      await grid.openConditionSelect();
      await grid.pickCondition('Is equal to');

      await expect(grid.conditionInputs().first()).toHaveAttribute('type', 'text');
    });
  }

  for (const { header, col } of DATE_COLUMNS) {
    test(`keeps the matching row for "Is equal to" on the "${header}" column`, async() => {
      await grid.openMenu(header);
      await grid.openConditionSelect();
      await grid.pickCondition('Is equal to');
      await grid.conditionInputs().first().fill('2020-01-15');
      await grid.confirmMenu();

      await expect.poll(() => grid.columnValues(col)).toEqual(['2020-01-15']);
    });

    test(`drops the matching row for "Is not equal to" on the "${header}" column`, async() => {
      await grid.openMenu(header);
      await grid.openConditionSelect();
      await grid.pickCondition('Is not equal to');
      await grid.conditionInputs().first().fill('2020-01-15');
      await grid.confirmMenu();

      await expect.poll(() => grid.columnValues(col)).toEqual(['2019-12-31', '2020-03-10']);
    });
  }

  test('switches the shared input back to text when the next column is not a date column', async({ page }) => {
    await grid.openMenu('Sell date');
    await grid.openConditionSelect();
    await grid.pickCondition('Is equal to');
    await expect(grid.conditionInputs().first()).toHaveAttribute('type', 'date');
    await page.keyboard.press('Escape');
    await expect(grid.menu).toBeHidden();

    await grid.openMenu('Qty');
    await grid.openConditionSelect();
    await grid.pickCondition('Is equal to');

    await expect(grid.conditionInputs().first()).toHaveAttribute('type', 'text');
  });

  test('keeps the condition key "eq" on a date column', async({ page }) => {
    await grid.openMenu('Sell date');
    await grid.openConditionSelect();
    await grid.pickCondition('Is equal to');
    await grid.conditionInputs().first().fill('2020-01-15');
    await grid.confirmMenu();

    const names = await page.evaluate(
      () => window.hot.getPlugin('filters').exportConditions()
        .flatMap((column: { conditions: { name: string }[] }) => column.conditions.map(({ name }) => name)));

    expect(names).toEqual(['eq']);
  });

  test('restores the date input when the menu reopens on a condition set through the API', async() => {
    await grid.filterThroughApi(0, 'eq', ['2020-01-15']);
    await grid.openMenu('Sell date');

    await expect(grid.conditionCaption()).toHaveText('Is equal to');
    await expect(grid.conditionInputs()).toHaveCount(1);
    await expect(grid.conditionInputs().first()).toHaveAttribute('type', 'date');
    await expect(grid.conditionInputs().first()).toHaveValue('2020-01-15');
  });

  test('restores the date input for a "Is not equal to" condition set through the API', async() => {
    await grid.filterThroughApi(0, 'neq', ['2020-01-15']);
    await grid.openMenu('Sell date');

    await expect(grid.conditionCaption()).toHaveText('Is not equal to');
    await expect(grid.conditionInputs().first()).toHaveAttribute('type', 'date');
    await expect(grid.conditionInputs().first()).toHaveValue('2020-01-15');
  });
});
