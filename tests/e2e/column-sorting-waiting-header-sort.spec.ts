import { test, expect } from '../fixtures/test';
import { ColumnSortingWaitingHeaderSortPage, type Row } from '../fixtures/pages/ColumnSortingWaitingHeaderSortPage';

/**
 * A header click made while a cell editor waits for an async validator does not sort at once: the sort
 * waits for the validator to answer, so the rows do not move under the edit. These cases make that click
 * with the real mouse and keyboard, change the grid while the sort waits, and only then answer the
 * validator. Turning the plugin off, loading new data and starting the column order over drop the waiting
 * sort; `updateData()` with the same records keeps it, and so does a second header press made during the wait.
 *
 * The sort waits for the edited cell's own answer: a `validateCells()` batch that answers first leaves the rows
 * where they are, or the edit would be written by visual row onto another record. After a Ctrl+Enter fill it
 * also waits until core wrote the whole fill, which happens only once every cell of it answered.
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

  test('waits for the edited cell when an unrelated validation answers first', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');
    await grid.validateAllCells();
    await expect.poll(() => grid.heldValidationCount()).toBe(7);

    await grid.answerAllButTheEdit();

    expect(await grid.sortConfig()).toEqual([]);
    expect(await grid.labels()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);

    await grid.answerHeldValidations();

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(await grid.labels()).toEqual(['p0', 'p3', 'p2', 'p5', 'zzz', 'p4']);
    expect(await grid.sourceLabels()).toEqual(['p0', 'zzz', 'p2', 'p3', 'p4', 'p5']);
  });

  test('waits for the whole Ctrl+Enter fill when the edited cell answers first', async() => {
    await grid.goto();
    await grid.fillColumnA(1, 3, 'zzz');
    await grid.clickSortHeader(1);

    // The edited cell answers first and ends the editor's wait; core writes the fill only after every cell.
    await grid.answerRows([1]);

    expect(await grid.sortConfig()).toEqual([]);
    expect(await grid.labels()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);

    await grid.answerRows([2, 3]);

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(await grid.sourceLabels()).toEqual(['p0', 'zzz', 'zzz', 'zzz', 'p4', 'p5']);
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

  test('drops the sort when `updateSettings({ columns })` starts the column order over', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');

    await grid.swapColumns();
    await grid.answerValidator();

    expect(await grid.sortConfig()).toEqual([]);
    expect(await grid.columnValues(1)).toEqual(sourceOrder);
  });

  test('keeps the sort through `updateData()` with the same records, as a wrapper re-render sends', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');

    await grid.updateDataWithSameRecords();
    await grid.answerValidator();

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    expect(await grid.labels()).toEqual(['p0', 'p3', 'p2', 'p5', 'zzz', 'p4']);
  });

  test('keeps both presses when the header is clicked twice while the sort waits', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');
    await grid.clickSortHeaderAgain(1);

    await grid.answerValidator();

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
  });

  test('keeps both columns when MultiColumnSorting gets a Ctrl+click while the sort waits', async() => {
    await grid.goto('multiColumnSorting');
    await grid.editThenClickSortHeader(1, 'zzz');
    await grid.clickSortHeaderAgain(0, true);

    await grid.answerValidator();

    await expect.poll(() => grid.sortConfig()).toEqual([
      { column: 1, sortOrder: 'asc' },
      { column: 0, sortOrder: 'asc' },
    ]);
  });

  test('throws nothing when the grid is destroyed while the sort waits', async() => {
    await grid.goto();
    await grid.editThenClickSortHeader(1, 'zzz');

    await grid.destroyGrid();
    await grid.answerValidatorAfterDestroy();
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
