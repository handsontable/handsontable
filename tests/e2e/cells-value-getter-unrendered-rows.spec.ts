import { test, expect } from '../fixtures/test';
import { CellsValueGetterUnrenderedRowsPage } from '../fixtures/pages/CellsValueGetterUnrenderedRowsPage';

/**
 * With `applyCellsToDataReads` on, a `valueGetter` the `cells` function supplies applies to every row a
 * data read returns. Without it a read applies it only to rows with stored cell meta: the rows the grid
 * has rendered and not yet evicted after a scroll, so `getData()` depends on the scroll position, and a
 * header sort puts the rows in raw-value order (`sort-value-getter-guard.spec.ts` pins that default).
 * The Filters column read follows the same option, so a condition compares the value the getter shows.
 * Only a real browser renders a band of rows and evicts the rest, so the eviction part can only be
 * checked here; the unit cases live in `dataMap.unit.js` and `filters/__tests__/cellsValueGetterReads.unit.js`.
 */
test.describe('cells() valueGetter on rows the grid has not rendered', () => {
  let grid: CellsValueGetterUnrenderedRowsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CellsValueGetterUnrenderedRowsPage(page, theme, bundle);
    await grid.goto();
  });

  test('reads a row that was never rendered through the getter', async() => {
    expect(await grid.readCell(900, 0)).toEqual({ value: 'Xv900', hasStoredMeta: false });
    expect(await grid.rowOfGetData(900)).toEqual(['Xv900', 99]);
  });

  test('keeps reading a row through the getter after a scroll evicted its meta', async() => {
    // The positive control: the first row is rendered and stores meta before the scroll.
    expect(await grid.readCell(0, 0)).toEqual({ value: 'Xv0', hasStoredMeta: true });

    await grid.scrollToLastRow();

    expect(await grid.readCell(0, 0)).toEqual({ value: 'Xv0', hasStoredMeta: false });
    expect(await grid.rowOfGetData(0)).toEqual(['Xv0', 999]);
  });

  test('sorts a column by the value the getter shows, rendered or not', async() => {
    await grid.sortByHeader(1);

    // The getter shows 999 minus each stored number, so an ascending sort reverses the rows.
    expect(await grid.physicalRowsAtTop(3)).toEqual([999, 998, 997]);
    await expect(grid.cell(0, 1)).toHaveText('0');
  });

  test('filters a row that was never rendered by the value the getter shows', async() => {
    await grid.filterColumnEquals(0, 'Xv900');

    expect(await grid.countRows()).toBe(1);
    expect(await grid.physicalRowsAtTop(1)).toEqual([900]);
    await expect(grid.cell(0, 0)).toHaveText('Xv900');
  });

  test('keeps filtering a row by the getter after a scroll evicted its meta', async() => {
    await grid.scrollToLastRow();

    expect(await grid.readCell(0, 0)).toEqual({ value: 'Xv0', hasStoredMeta: false });

    await grid.filterColumnEquals(0, 'Xv0');

    expect(await grid.countRows()).toBe(1);
    expect(await grid.physicalRowsAtTop(1)).toEqual([0]);
    await expect(grid.cell(0, 0)).toHaveText('Xv0');
  });
});
