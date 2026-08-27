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

  test('confirming a list whose every shown value is ticked keeps the rest of the filter',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();

      // Name goes first, so the Color list is scoped by it.
      await grid.openMenu('Name');
      await grid.uncheckValue('Eve');
      await grid.confirmMenu();

      await grid.openMenu('Color');
      await grid.uncheckValue('Blue');
      await grid.confirmMenu();

      // Narrow Name until the only Color left in scope is Green - which is ticked. Every value the
      // Color list can show is now selected, but Red and Blue are still part of the filter.
      await grid.openMenu('Name');
      await grid.uncheckValue('Alice');
      await grid.uncheckValue('Charlie');
      await grid.confirmMenu();

      await grid.openMenu('Color');

      expect(await grid.listedValues()).toEqual([
        { checked: true, label: 'Green' },
      ]);

      // "Everything on screen is ticked" must not be read as "there is no filter here". Confirming
      // untouched used to drop the Color condition outright, taking the excluded Blue with it.
      await grid.confirmMenu();

      await grid.openMenu('Name');
      await grid.checkValue('Alice');
      await grid.checkValue('Charlie');
      await grid.confirmMenu();

      // Charlie is Blue, which the user excluded, so he must stay filtered out.
      expect(await grid.columnValues(0)).toEqual(['Alice', 'Bob', 'Dave']);
    });

  test('"Select all" clears the column even when the list cannot show every selected value',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();

      await grid.openMenu('Name');
      await grid.uncheckValue('Eve');
      await grid.confirmMenu();

      await grid.openMenu('Color');
      await grid.uncheckValue('Blue');
      await grid.confirmMenu();

      // Narrow Name so Red leaves the Color list while staying selected.
      await grid.openMenu('Name');
      await grid.uncheckValue('Alice');
      await grid.confirmMenu();

      // "Select all" means this column stops filtering, so the unlisted Red has to go with it.
      await grid.openMenu('Color');
      await grid.selectAllValues();
      await grid.confirmMenu();

      // Put every name back. With the Color filter really gone, all five rows return.
      await grid.openMenu('Name');
      await grid.checkValue('Alice');
      await grid.checkValue('Eve');
      await grid.confirmMenu();

      expect(await grid.columnValues(0)).toEqual(['Alice', 'Bob', 'Charlie', 'Dave', 'Eve']);

      // The rows cannot tell the two apart: a condition naming every colour shows the same grid as
      // no condition at all. Every value of both columns is now selected, so nothing may be left in
      // the stack - a leftover Color condition here would mean "Select all" never released it.
      expect(await grid.exportedConditions()).toEqual([]);
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

    // None of the three names left in scope is Red, so the assertion above holds either way. Put
    // Alice back: her row is Red, so it only stays hidden if "Clear" really dropped Red.
    await grid.openMenu('Name');
    await grid.checkValue('Alice');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual([]);
  });

  test('re-ticking everything after "Clear" releases the column again', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();

    await grid.openMenu('Color');
    await grid.clearAllValues();
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual([]);

    // Ticking every box back is the same as never having filtered, so the column has to let go of
    // its condition. "Clear" must not leave a mark that outlives the empty selection it described.
    await grid.openMenu('Color');
    await grid.checkValue('Blue');
    await grid.checkValue('Green');
    await grid.checkValue('Red');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['Alice', 'Bob', 'Charlie', 'Dave', 'Eve']);
    expect(await grid.exportedConditions()).toEqual([]);
  });

  test('an emptied list with nothing to show still excludes everything after a reopen',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();

      // Name hides every row, so Color is left with nothing to list.
      await grid.openMenu('Name');
      await grid.clearAllValues();
      await grid.confirmMenu();

      // "Clear" on that empty list still says "exclude everything in this column".
      await grid.openEmptyMenu('Color');
      await grid.clearAllValues({ expectEmptyList: true });
      await grid.confirmMenu();

      // Reopening shows the same empty box. Confirming it untouched must not read "nothing is
      // selected" as "nothing is filtered" - that would quietly release the column, and an empty
      // list gives the checkboxes no way to say otherwise.
      await grid.openEmptyMenu('Color');
      await grid.confirmMenu();

      await grid.openMenu('Name');
      await grid.selectAllValues();
      await grid.confirmMenu();

      // Name lets every row through again, so only Color can still be holding them back.
      expect(await grid.columnValues(0)).toEqual([]);
    });

  test('confirming an empty list on a column that was never filtered adds no condition',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();

      // Nothing survives the Name filter, so every other column is left with nothing to list.
      await grid.openMenu('Name');
      await grid.clearAllValues();
      await grid.confirmMenu();

      expect(await grid.columnValues(0)).toEqual([]);

      // Color was never filtered - its list is empty only because Name hides every row. An empty
      // box means "exclude everything" only when the user emptied it, never when there was nothing
      // to show in the first place.
      await grid.openEmptyMenu('Color');

      expect(await grid.listedValues()).toEqual([]);

      await grid.confirmMenu();

      await grid.openMenu('Name');
      await grid.selectAllValues();
      await grid.confirmMenu();

      // Releasing Name has to bring every row back. A condition picked up by Color would hold them
      // out for good, because its list can never show a value again.
      expect(await grid.columnValues(0)).toEqual(['Alice', 'Bob', 'Charlie', 'Dave', 'Eve']);
      expect(await grid.exportedConditions()).toEqual([]);
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
