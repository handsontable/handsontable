import { test, expect, CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG } from '../fixtures/test';
import { GridLayoutsPage } from '../fixtures/pages/GridLayoutsPage';

/**
 * A range selected across a scroll – a click on one cell, a scroll to the grid's far corner, and a
 * Shift+click there – is copied, or cut, whole through the system clipboard, and pasted whole at
 * the top-left of the grid.
 *
 * The gesture has a trap the cell values at the paste anchor cannot see: after the scroll the
 * scrollbar clearance band (#10370) covers the far corner for about a second, and a click into it
 * belongs to the scrollbar, so the selection never reaches the corner and only the first cell is
 * copied. The first pasted cell is right either way. Until DEV-3257 this was photographed in the
 * cross-browser visual suite (`copy-paste.spec.ts` on `/large-dataset-demo`, Chromium only), whose
 * comment said a broken range "shows up only as a changed screenshot". The block's far corner and
 * the selection after the paste are what say the whole range arrived, so those are asserted here.
 *
 * The grid is the demo's: 150 x 150 in a 500 x 500 viewport (`grid-layouts.html?layout=large`).
 */
test.describe('copy and cut of a range selected across a scroll', { tag: [CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG] }, () => {
  let grid: GridLayoutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridLayoutsPage(page, theme, bundle);
    await grid.goto('large');
  });

  /**
   * Selects from cell (1, 1) to the grid's far corner (149, 149) with a click, a scroll and a
   * Shift+click, and checks the selection reached the corner.
   */
  async function selectAcrossTheScroll(): Promise<void> {
    await grid.cell(1, 1).click();
    await grid.scrollViewportTo('end');
    await grid.cell(149, 149).click({ modifiers: ['Shift'] });

    expect(await grid.selected()).toEqual([[1, 1, 149, 149]]);
  }

  test('copies the whole range and pastes it at the top-left cell', async({ page }) => {
    const before = await grid.data();

    await selectAcrossTheScroll();
    await page.keyboard.press('ControlOrMeta+c');

    await grid.scrollViewportTo('start');
    await grid.cell(0, 0).click();
    await page.keyboard.press('ControlOrMeta+v');

    // 149 x 149 cells, from (0, 0): the paste selects what it wrote, and its far corner holds the
    // value the source's far corner held.
    await expect.poll(async() => grid.selected()).toEqual([[0, 0, 148, 148]]);
    expect(await grid.dataAt(0, 0)).toBe(before[1][1]);
    expect(await grid.dataAt(148, 148)).toBe(before[149][149]);
    // A copy leaves the source as it was: its far corner, outside the pasted block, is untouched.
    expect(await grid.dataAt(149, 149)).toBe(before[149][149]);
  });

  test('cuts the whole range and pastes it at the top-left cell', async({ page }) => {
    const before = await grid.data();

    await selectAcrossTheScroll();
    await page.keyboard.press('ControlOrMeta+x');

    // The cut empties the whole source range, its far corner included (an emptied cell holds null).
    await expect.poll(async() => grid.dataAt(149, 149)).toBeNull();
    expect(await grid.dataAt(1, 1)).toBeNull();

    await grid.scrollViewportTo('start');
    await grid.cell(0, 0).click();
    await page.keyboard.press('ControlOrMeta+v');

    await expect.poll(async() => grid.selected()).toEqual([[0, 0, 148, 148]]);
    expect(await grid.dataAt(0, 0)).toBe(before[1][1]);
    expect(await grid.dataAt(148, 148)).toBe(before[149][149]);
    // Outside the pasted block, the cut range stays empty and what was never cut stays as it was.
    expect(await grid.dataAt(149, 149)).toBeNull();
    expect(await grid.dataAt(149, 0)).toBe(before[149][0]);
  });
});
