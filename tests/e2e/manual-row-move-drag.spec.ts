import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * A row selected by its header and dragged up by that header, with the real mouse, on the shared `/`
 * grid: the click selects the whole row, and the drop puts the row in the place of the row it was
 * dropped on, keeping it selected. `manualRowMove.spec.js` asserts the order for many drag shapes with
 * simulated events; the real gesture on this grid was the `change-rows-order` visual spec's, two
 * captures taken right after the click and the release with nothing asserted. Since DEV-3351 the
 * visual spec keeps the row selected by its header (the active row header's look), and the move is
 * asserted here.
 */
test.describe('moving a row by dragging its header', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('selects the row by its header and moves it to where it is dropped, still selected', async() => {
    const moved = await grid.dataAt(3, 0);

    // The first capture: the row selected by its header.
    await grid.rowHeader(3).click();

    expect(await grid.selected()).toEqual([[3, -1, 3, 8]]);
    expect(await grid.activeHeaders()).toEqual(['row-header-3']);

    // The second capture: the header dragged onto row 1's, which puts the row in its place.
    await grid.dragRowHeaderOnto(3, 1);

    expect(await grid.physicalRows(5)).toEqual([0, 3, 1, 2, 4]);
    expect(await grid.dataAt(1, 0)).toBe(moved);
    expect(await grid.selected()).toEqual([[1, -1, 1, 8]]);
    expect(await grid.activeHeaders()).toEqual(['row-header-1']);
  });
});
