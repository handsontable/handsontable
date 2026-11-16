import { test, expect, THEMES_TAG } from '../fixtures/test';
import { NestedRowsSheetSwitchPage } from '../fixtures/pages/NestedRowsSheetSwitchPage';

/**
 * DEV-3042: a sheet switch runs `loadData()`, and NestedRows drops its collapsed state on every
 * load. The sheets bar did not carry the collapsed parents in a sheet's view state, so a branch
 * collapsed on one sheet came back expanded after a round-trip through another sheet.
 */
test.describe('NestedRows collapse state across a sheet switch', { tag: THEMES_TAG }, () => {
  let grid: NestedRowsSheetSwitchPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new NestedRowsSheetSwitchPage(page, theme, bundle);
    await grid.goto();
  });

  test('a branch collapsed from the row header stays collapsed after a round-trip', async () => {
    await grid.collapseButton(0).click();
    await expect.poll(() => grid.visibleNames()).toEqual(['Europe', 'Asia', 'Japan']);

    await grid.switchToSheet(1);
    await expect.poll(() => grid.visibleNames()).toEqual(['Fruit', 'Apple', 'Vegetables', 'Carrot']);

    await grid.switchToSheet(0);
    await expect.poll(() => grid.visibleNames()).toEqual(['Europe', 'Asia', 'Japan']);
    await expect(grid.cell(1, 0)).toHaveText('Asia');
  });

  test('each sheet keeps its own collapsed branches', async () => {
    await grid.collapseButton(0).click();
    await grid.switchToSheet(1);
    await grid.collapseButton(2).click();
    await expect.poll(() => grid.visibleNames()).toEqual(['Fruit', 'Apple', 'Vegetables']);

    await grid.switchToSheet(0);
    await expect.poll(() => grid.visibleNames()).toEqual(['Europe', 'Asia', 'Japan']);

    await grid.switchToSheet(1);
    await expect.poll(() => grid.visibleNames()).toEqual(['Fruit', 'Apple', 'Vegetables']);
  });

  test('a tree sheet shown after a sheet of arrays turns the plugin back on', async () => {
    await grid.switchToSheet(2);
    await expect.poll(() => grid.isPluginEnabled()).toBe(false);
    expect(await grid.nestedRowsSetting()).toBe(true);

    await grid.switchToSheet(0);

    await expect.poll(() => grid.isPluginEnabled()).toBe(true);
    await expect.poll(() => grid.visibleNames()).toEqual(['Europe', 'Poland', 'Germany', 'Asia', 'Japan']);
    await expect(grid.collapseButton(0)).toBeVisible();
  });

  test('a sheet declared without data starts with object rows and keeps the plugin on', async () => {
    await grid.switchToSheet(3);

    await expect.poll(() => grid.sourceRowsAreObjects()).toBe(true);
    expect(await grid.isPluginEnabled()).toBe(true);
    expect(await grid.nestedRowsSetting()).toBe(true);
  });

  test('a sheet declared without data that turns the plugin off keeps the default blank grid', async () => {
    await grid.switchToSheet(4);

    await expect.poll(() => grid.nestedRowsSetting()).toBe(false);
    expect(await grid.isPluginEnabled()).toBe(false);
    expect(await grid.sourceRowsAreObjects()).toBe(false);
  });
});

test.describe('A blank declared sheet without named columns under NestedRows', { tag: THEMES_TAG }, () => {
  let grid: NestedRowsSheetSwitchPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new NestedRowsSheetSwitchPage(page, theme, bundle, 'nested-rows-sheet-blank-keys');
  });

  test('takes its columns from the opening sheet\'s rows', async () => {
    await grid.goto();
    await grid.switchToSheet(1);

    await expect.poll(() => grid.firstSourceRowKeys()).toEqual(['name']);
    expect(await grid.countCols()).toBe(1);
    expect(await grid.isPluginEnabled()).toBe(true);
  });

  test('takes its columns from the first sheet when activeSheet names no sheet', async () => {
    await grid.gotoWithOutOfRangeActiveSheet();
    await grid.sheetsBar.expectActiveTab(0);
    await grid.switchToSheet(1);

    await expect.poll(() => grid.firstSourceRowKeys()).toEqual(['name']);
    expect(await grid.countCols()).toBe(1);
    expect(await grid.isPluginEnabled()).toBe(true);
  });
});
