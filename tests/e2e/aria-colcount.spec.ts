import { test, expect } from '../fixtures/test';
import { AriaColcountPage } from '../fixtures/pages/AriaColcountPage';

/**
 * The grid root's `aria-colcount` is the number of data columns plus the number of row-header
 * columns. It has to follow both counts when they change after the grid is built, not only at
 * construction.
 */
test.describe('aria-colcount on the grid root', () => {
  let grid: AriaColcountPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AriaColcountPage(page, theme, bundle);
    await grid.goto();
  });

  test('counts the row-header column of a grid with row headers', async() => {
    await grid.expectColcount(5);
  });

  test('counts both row-header columns of a grid built with row selection', async() => {
    await grid.rebuild({ rowSelection: true });

    await grid.expectColcount(6);
  });

  test('follows row selection turned on and off through updateSettings', async() => {
    await grid.updateSettings({ rowSelection: true });
    await grid.expectColcount(6);

    await grid.updateSettings({ rowSelection: false });
    await grid.expectColcount(5);

    await grid.updateSettings({ rowSelection: true });
    await grid.expectColcount(6);
  });

  test('follows row headers turned on and off through updateSettings', async() => {
    await grid.rebuild({ rowHeaders: false });
    await grid.expectColcount(4);

    await grid.updateSettings({ rowHeaders: true });
    await grid.expectColcount(5);

    await grid.updateSettings({ rowHeaders: false });
    await grid.expectColcount(4);
  });

  test('follows the column count of data loaded with loadData', async() => {
    await grid.loadData(3, 7);

    await grid.expectColcount(8);
  });

  test('follows settings changed before each loadData, as a sheet switch does', async() => {
    await grid.updateSettings({ rowSelection: true });
    await grid.loadData(3, 2);
    await grid.expectColcount(4);

    await grid.updateSettings({ rowSelection: false });
    await grid.loadData(3, 6);
    await grid.expectColcount(7);

    await grid.updateSettings({ rowSelection: true, rowHeaders: false });
    await grid.loadData(3, 3);
    await grid.expectColcount(4);
  });

  test('follows settings changed after each loadData', async() => {
    await grid.loadData(3, 2);
    await grid.updateSettings({ rowSelection: true });
    await grid.expectColcount(4);

    await grid.loadData(3, 6);
    await grid.updateSettings({ rowSelection: false });
    await grid.expectColcount(7);
  });

  test('follows columns inserted and removed with alter', async() => {
    await grid.alter('insert_col_start', 0, 2);
    expect(await grid.countCols()).toBe(6);
    await grid.expectColcount(7);

    await grid.alter('remove_col', 0, 3);
    expect(await grid.countCols()).toBe(3);
    await grid.expectColcount(4);
  });
});
