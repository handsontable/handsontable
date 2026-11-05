import { test, expect } from '../fixtures/test';
import { ColumnSortingWaitingHeaderSortPage, type Row } from '../fixtures/pages/ColumnSortingWaitingHeaderSortPage';

/**
 * A header click made while a cell editor waits for an async validator does not sort at once: the sort
 * waits for the validator to answer, so the rows do not move under the edit. These cases make that click
 * with the real mouse and keyboard, change the grid while the sort waits, and only then answer the
 * validator. Turning the plugin off and loading new data drop the waiting sort; `updateData()` keeps it.
 *
 * The fixture's validator holds its callback until the spec answers it, so the wait has no timer. The
 * first case is the positive control: without it, a gesture that never queued a sort would pass every
 * "did not sort" case.
 */
test.describe('a header sort waiting for an async validator', () => {
  const sourceOrder = ['p0', 'zzz', 'p2', 'p3', 'p4', 'p5'];
  const newRows: Row[] = [['n0', 3], ['n1', 1], ['n2', 2], ['n3', 0]];
  let grid: ColumnSortingWaitingHeaderSortPage;
  let pageErrors: string[];

  test.beforeEach(async({ page, theme, bundle }) => {
    pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    grid = new ColumnSortingWaitingHeaderSortPage(page, theme, bundle);
  });

  test.afterEach(async() => {
    expect(pageErrors).toEqual([]);
    expect(await grid.asyncErrors()).toEqual([]);
  });

  test('sorts once the validator answers when nothing changes in between', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');

    expect(await grid.sortConfig()).toEqual([]);

    await grid.answerValidator();

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(await grid.labels()).toEqual(['p0', 'p3', 'p2', 'p5', 'zzz', 'p4']);
  });

  test('drops the sort when `updateSettings()` turns ColumnSorting off', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');

    await grid.disableBySettings();
    await grid.answerValidator();

    expect(await grid.isPluginEnabled()).toBe(false);
    expect(await grid.labels()).toEqual(sourceOrder);
  });

  test('drops the sort when `disablePlugin()` turns ColumnSorting off', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');

    await grid.disablePlugin();
    await grid.answerValidator();

    expect(await grid.isPluginEnabled()).toBe(false);
    expect(await grid.labels()).toEqual(sourceOrder);
  });

  test('drops the sort when `loadData()` replaces the rows', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');

    await grid.loadData(newRows);
    await grid.answerValidator();

    expect(await grid.sortConfig()).toEqual([]);
    expect(await grid.labels()).toEqual(['n0', 'n1', 'n2', 'n3']);
  });

  test('keeps the sort through `updateData()`, which the wrappers call while an edit waits', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');

    await grid.updateData(newRows);
    await grid.answerValidator();

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test('drops the sort when `updateSettings()` turns MultiColumnSorting off', async() => {
    await grid.goto('multiColumnSorting');
    await grid.editThenClickSortHeader(1, 'zzz');

    await grid.disableBySettings();
    await grid.answerValidator();

    expect(await grid.isPluginEnabled()).toBe(false);
    expect(await grid.labels()).toEqual(sourceOrder);
  });
});
