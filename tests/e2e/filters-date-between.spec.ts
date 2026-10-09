import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FiltersAvailableConditionsPage } from '../fixtures/pages/FiltersAvailableConditionsPage';

const FIXTURE = 'filters-date-between.html';

/**
 * Regression coverage for DEV-3278.
 *
 * "Is between" on a `date` column used to render two free-text inputs, although the condition
 * parses its arguments as ISO dates only. A date typed the way the column displays it
 * (`1/1/20`) matched nothing. The condition key is shared with the numeric column, so the input
 * type has to follow the column type, on the first selection and when the saved state is restored.
 */
test.describe('Filters - "Is between" input type', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: FiltersAvailableConditionsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersAvailableConditionsPage(page, theme, bundle, FIXTURE);
    await grid.goto();
  });

  test('renders date inputs on a date column', async() => {
    await grid.openMenu('Sell date');
    await grid.openConditionSelect();
    await grid.pickCondition('Is between');

    await expect(grid.conditionInputs()).toHaveCount(2);
    await expect(grid.conditionInputs().nth(0)).toHaveAttribute('type', 'date');
    await expect(grid.conditionInputs().nth(1)).toHaveAttribute('type', 'date');
  });

  test('filters a date column by ISO values entered in the date inputs', async() => {
    await grid.openMenu('Sell date');
    await grid.openConditionSelect();
    await grid.pickCondition('Is between');
    await grid.conditionInputs().nth(0).fill('2020-01-01');
    await grid.conditionInputs().nth(1).fill('2020-06-30');
    await grid.confirmMenu();

    await expect.poll(() => grid.columnValues(0)).toEqual(['2020-01-15', '2020-03-10', '2020-06-30']);
  });

  test('keeps the condition key "between" on a date column', async({ page }) => {
    await grid.openMenu('Sell date');
    await grid.openConditionSelect();
    await grid.pickCondition('Is between');
    await grid.conditionInputs().nth(0).fill('2020-01-01');
    await grid.conditionInputs().nth(1).fill('2020-06-30');
    await grid.confirmMenu();

    const names = await page.evaluate(
      () => window.hot.getPlugin('filters').exportConditions()
        .flatMap((column: { conditions: { name: string }[] }) => column.conditions.map(({ name }) => name)));

    expect(names).toEqual(['between']);
  });

  test('restores date inputs when the menu reopens on a condition set through the API', async() => {
    await grid.filterThroughApi(0, 'between', ['2020-01-01', '2020-06-30']);
    await grid.openMenu('Sell date');

    await expect(grid.conditionCaption()).toHaveText('Is between');
    await expect(grid.conditionInputs()).toHaveCount(2);
    await expect(grid.conditionInputs().nth(0)).toHaveAttribute('type', 'date');
    await expect(grid.conditionInputs().nth(0)).toHaveValue('2020-01-01');
    await expect(grid.conditionInputs().nth(1)).toHaveAttribute('type', 'date');
    await expect(grid.conditionInputs().nth(1)).toHaveValue('2020-06-30');
  });

  test('keeps text inputs on a numeric column', async() => {
    await grid.openMenu('Qty');
    await grid.openConditionSelect();
    await grid.pickCondition('Is between');

    await expect(grid.conditionInputs()).toHaveCount(2);
    await expect(grid.conditionInputs().nth(0)).toHaveAttribute('type', 'text');
    await expect(grid.conditionInputs().nth(1)).toHaveAttribute('type', 'text');
  });
});
