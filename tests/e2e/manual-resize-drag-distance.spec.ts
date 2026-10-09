import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { GridLayoutsPage } from '../fixtures/pages/GridLayoutsPage';

/**
 * A column or a row resized by dragging its header's handle grows by exactly the distance dragged.
 *
 * Until DEV-3257 the cross-browser visual suite photographed both drags on `/cell-types-demo`
 * (`columns-resize.spec.ts`, `rows-resize.spec.ts`) and asserted nothing, so a drag that failed, or
 * landed a few pixels off, was the golden. The row axis was asserted exactly by
 * `manual-resize-guide-geometry.spec.ts`, and the column axis only loosely, by
 * `manual-resize-drag-interruption.spec.ts`, which compares exact sizes since DEV-3257 too. The
 * dragged size is the pointer's travel, a whole number of CSS pixels, so both are compared exactly
 * here. The grid has the demo's hidden and frozen columns. The first column dragged is the fifth one, past a
 * hidden column and outside the frozen three, as the demo's "Cost" was. Neither of its neighbors is
 * hidden, so the width a hidden-column indicator adds to a column beside it plays no part.
 *
 * The other columns sit beside a hidden one, so they render 15 px wider than the size `ManualColumnResize`
 * stores for them: the indicator's room is added on top. Such a column still grows by the distance
 * dragged, and the stored size, which `getManualSize()` returns and `setManualSize()` takes, grows by
 * it too. Each of those drags starts from a fresh page, because a second press on a handle inside the
 * double-click window is an auto-size.
 */
test.describe('resizing by dragging a header handle', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: GridLayoutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridLayoutsPage(page, theme, bundle);
    await grid.goto('frozen-hidden');
  });

  test('widens a column by the distance its handle is dragged', async() => {
    const { width } = await grid.sizes(4, 2);

    await grid.dragColumnHandle(4, 60);

    await expect.poll(async() => (await grid.sizes(4, 2)).width).toBe(width + 60);
  });

  test('widens a column beside a hidden column by the distance its handle is dragged', async() => {
    const { width } = await grid.sizes(3, 2);

    await grid.dragColumnHandle(3, 60);

    await expect.poll(async() => (await grid.sizes(3, 2)).width).toBe(width + 60);
    expect(await grid.manualColumnSize(3)).toBe(150);
  });

  test('narrows a frozen column beside hidden columns by the distance its handle is dragged', async() => {
    const { width } = await grid.sizes(1, 2);

    await grid.dragColumnHandle(1, -30);

    await expect.poll(async() => (await grid.sizes(1, 2)).width).toBe(width - 30);
    expect(await grid.manualColumnSize(1)).toBe(60);
  });

  test('widens a frozen column beside hidden columns by the distance its handle is dragged', async() => {
    const { width } = await grid.sizes(1, 2);

    await grid.dragColumnHandle(1, 60);

    await expect.poll(async() => (await grid.sizes(1, 2)).width).toBe(width + 60);
  });

  test('widens a column beside a hidden column that already has a stored size by the distance dragged', async() => {
    await grid.updateSettings({ manualColumnResize: [90, 90, 90, 120] });
    await expect.poll(async() => (await grid.sizes(3, 2)).width).toBe(135);

    await grid.dragColumnHandle(3, 20);

    await expect.poll(async() => (await grid.sizes(3, 2)).width).toBe(155);
    expect(await grid.manualColumnSize(3)).toBe(140);
  });

  test('leaves a column beside a hidden column as wide as it was when the resize is cancelled', async() => {
    const { width } = await grid.sizes(3, 2);

    await grid.cancelColumnResizes();
    await grid.dragColumnHandle(3, 60);

    await expect.poll(async() => (await grid.sizes(3, 2)).width).toBe(width);
  });

  test('stores the dragged size for every selected column', async() => {
    await grid.clickColumnHeader(3);
    await grid.clickColumnHeader(4, ['Shift']);
    const next = (await grid.sizes(4, 2)).width;

    await grid.dragColumnHandle(3, 60);

    await expect.poll(async() => grid.manualColumnSize(4)).toBe(150);
    expect(await grid.manualColumnSize(3)).toBe(150);
    expect((await grid.sizes(4, 2)).width).toBe(next + 60);
  });

  test('auto-sizes a column beside a hidden column and keeps the room of its indicator', async() => {
    await (await grid.columnHeader(3)).hover();
    await expect(grid.grid.locator('.manualColumnResizer')).toBeAttached();
    await grid.grid.locator('.manualColumnResizer').dblclick();

    await expect.poll(async() => grid.manualColumnSize(3)).not.toBeNull();
    const stored = await grid.manualColumnSize(3);

    await expect.poll(async() => (await grid.sizes(3, 2)).width).toBe(stored! + 15);
  });

  test('heightens a row by the distance its handle is dragged', async() => {
    const { height } = await grid.sizes(4, 2);

    await grid.dragRowHandle(2, 60);

    await expect.poll(async() => (await grid.sizes(4, 2)).height).toBe(height + 60);
  });
});
