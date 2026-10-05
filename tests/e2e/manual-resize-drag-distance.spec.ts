import { test, expect } from '../fixtures/test';
import { GridLayoutsPage } from '../fixtures/pages/GridLayoutsPage';

/**
 * A column or a row resized by dragging its header's handle grows by exactly the distance dragged,
 * on a grid with hidden and frozen columns.
 *
 * Until DEV-3257 the cross-browser visual suite photographed both drags on `/cell-types-demo`
 * (`columns-resize.spec.ts`, `rows-resize.spec.ts`) and asserted nothing, so a drag that failed, or
 * landed a few pixels off, was the golden. The row axis is asserted exactly by
 * `manual-resize-guide-geometry.spec.ts`; the column axis only loosely, by
 * `manual-resize-drag-interruption.spec.ts` (a 40 px drag adds more than 30). The dragged size is the
 * pointer's travel, a whole number of CSS pixels, so both are compared exactly here. The column is the
 * fifth one, past a hidden column and outside the frozen three, as the demo's "Cost" was.
 */
test.describe('resizing by dragging a header handle', () => {
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

  test('heightens a row by the distance its handle is dragged', async() => {
    const { height } = await grid.sizes(4, 2);

    await grid.dragRowHandle(2, 60);

    await expect.poll(async() => (await grid.sizes(4, 2)).height).toBe(height + 60);
  });
});
