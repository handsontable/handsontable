import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

/**
 * Regression coverage for issue #12226.
 *
 * A column's own filter must not narrow down its own "filter by value" list. Before
 * the fix the list was rebuilt from the rows still visible in the grid, so applying
 * "Contains" hid the values that did not match — leaving them impossible to check
 * back on. The list of any OTHER column stays narrowed down by the preceding
 * columns' filters, which is the intended pivot-style behavior.
 */
test.describe('Filters — "filter by value" list', () => {
  test('keeps every value of a column that is filtered by a condition', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();
    await grid.openMenu('Name');
    await grid.applyCondition('Contains', 'li');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Charlie']);

    await grid.openMenu('Name');

    expect(await grid.listedValues()).toEqual([
      { checked: true, label: 'Alice' },
      { checked: true, label: 'Bob' },
      { checked: true, label: 'Charlie' },
      { checked: true, label: 'Dave' },
      { checked: true, label: 'Eve' },
    ]);
  });

  test('confirming that list without a change does not alter the filtering', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();
    await grid.openMenu('Name');
    await grid.applyCondition('Contains', 'li');
    await grid.confirmMenu();

    await grid.openMenu('Name');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Charlie']);
  });

  test('a value the condition filters out can still be unchecked', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();
    await grid.openMenu('Name');
    await grid.applyCondition('Contains', 'li');
    await grid.confirmMenu();

    // "Bob" is filtered out by the condition, so it is only reachable because the list
    // is no longer narrowed down by that condition.
    await grid.openMenu('Name');
    await grid.uncheckValue('Bob');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Charlie']);

    // Dropping the condition leaves the "by value" one behind - "Bob" stays out.
    await grid.openMenu('Name');
    await grid.selectCondition('None');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Charlie', 'Dave', 'Eve']);
  });

  test('an already visible value can be unchecked to narrow the result further',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();
      await grid.openMenu('Name');
      await grid.applyCondition('Contains', 'li');
      await grid.confirmMenu();

      await grid.openMenu('Name');
      await grid.uncheckValue('Alice');
      await grid.confirmMenu();

      expect(await grid.columnValues(0)).toEqual(['Charlie']);
    });

  test('another column\'s list follows the filtered column even after it was confirmed once',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();

      // Confirming a column's menu stores its component state. That stored list must not outlive
      // the filtering, or the column freezes on the values it happened to hold at that moment.
      await grid.openMenu('Color');
      await grid.confirmMenu();

      await grid.openMenu('Name');
      await grid.applyCondition('Contains', 'li');
      await grid.confirmMenu();

      await grid.openMenu('Color');

      expect(await grid.listedValues()).toEqual([
        { checked: true, label: 'Blue' },
        { checked: true, label: 'Red' },
      ]);
    });

  test('confirming a narrowed list keeps the values it cannot show', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();

    // Name is filtered first, so the Color list is scoped by it.
    await grid.openMenu('Name');
    await grid.uncheckValue('Eve');
    await grid.confirmMenu();

    await grid.openMenu('Color');
    await grid.uncheckValue('Blue');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Bob', 'Dave']);

    // Narrow Name further. Alice was the only Red row still passing, so Red drops off the Color
    // list even though the user never touched the Color filter.
    await grid.openMenu('Name');
    await grid.uncheckValue('Alice');
    await grid.confirmMenu();

    await grid.openMenu('Color');

    // Blue still has Charlie's row, so it stays listed and unchecked. Red has no row left, so it
    // drops off the list entirely while remaining selected.
    expect(await grid.listedValues()).toEqual([
      { checked: false, label: 'Blue' },
      { checked: true, label: 'Green' },
    ]);

    // Confirming without touching anything must not shrink the Color filter to what is on screen.
    // Red is still selected, it just has no row to show it.
    await grid.confirmMenu();

    // Putting Alice back proves Red survived: her Red row returns instead of staying filtered out.
    await grid.openMenu('Name');
    await grid.checkValue('Alice');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Bob', 'Dave']);
    expect(await grid.columnValues(1)).toEqual(['Red', 'Green', 'Green']);
  });

  test('"Clear" also clears the selected values the list cannot show', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();

    await grid.openMenu('Name');
    await grid.uncheckValue('Eve');
    await grid.confirmMenu();

    await grid.openMenu('Color');
    await grid.uncheckValue('Blue');
    await grid.confirmMenu();

    await grid.openMenu('Name');
    await grid.uncheckValue('Alice');
    await grid.confirmMenu();

    // Red is selected but unlisted at this point. "Clear" has to drop it too, or the box would
    // look empty while the filter still matched rows.
    await grid.openMenu('Color');
    await grid.clearAllValues();
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual([]);
  });

  test('another column\'s list stays narrowed down by the filtered column', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();
    await grid.openMenu('Name');
    await grid.applyCondition('Contains', 'li');
    await grid.confirmMenu();

    await grid.openMenu('Color');

    // Only the "Alice"/"Charlie" rows survive the Name filter, so the Color list
    // holds their colors alone.
    expect(await grid.listedValues()).toEqual([
      { checked: true, label: 'Blue' },
      { checked: true, label: 'Red' },
    ]);
  });
});
