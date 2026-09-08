import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { RootSizeOptionsPage } from '../fixtures/pages/RootSizeOptionsPage';

/**
 * #8688: the dropdown editor's list used to be cut off by the grid root's `overflow: clip` (any
 * sized `height`, and `height: 'auto'` before DEV-2789) or by a scrolling ancestor. The list is
 * now positioned against the viewport, so the only edge that can cut it is the window's.
 *
 * Every case hit-tests the options instead of counting them: under a clip an option cell exists
 * and has a size while nothing on screen can reach it, so `toBeVisible()` and `toHaveCount()`
 * both pass on the broken build. Only `elementFromPoint` tells the two apart.
 */

const OPTIONS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

interface Box { top: number; bottom: number; left: number; right: number }

interface Rects { list: Box; cell: Box; root: Box; container: Box }

/**
 * How many options a pointer can actually reach.
 */
async function reachableOptions(page: Page): Promise<number> {
  return page.evaluate(() => {
    const list = document.querySelector('.handsontableEditor');
    const cells = document.querySelectorAll('.handsontableEditor .ht_master tbody td');
    let reached = 0;

    cells.forEach((td) => {
      const r = td.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);

      if (hit && list?.contains(hit)) {
        reached += 1;
      }
    });

    return reached;
  });
}

/**
 * Opens the editor through the keyboard: a centred click on a dropdown cell can land on its
 * arrow and open the list by itself, so the Enter would then close it (`tests/AGENTS.md`).
 */
async function openDropdown(page: Page, row: number, col: number): Promise<void> {
  await page.evaluate(([r, c]) => window.hot.selectCell(r, c), [row, col] as const);
  await page.keyboard.press('Enter');
  await expect(page.locator('.handsontableEditor .ht_master tbody td')).toHaveCount(OPTIONS.length);
}

/**
 * The list, the edited cell, the grid root, and the fixture's parent container, in viewport
 * coordinates.
 */
async function rects(page: Page): Promise<Rects> {
  return page.evaluate(() => {
    const toBox = (r: DOMRect) => ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
    const editor = window.hot.getActiveEditor();
    const container = document.getElementById('container');

    if (!container) {
      throw new Error('container is not rendered');
    }

    return {
      list: toBox(editor.htContainer.getBoundingClientRect()),
      cell: toBox(editor.getEditedCell().getBoundingClientRect()),
      root: toBox(window.hot.rootElement.getBoundingClientRect()),
      container: toBox(container.getBoundingClientRect()),
    };
  });
}

test.describe('dropdown editor list escapes the grid clip (#8688)', () => {
  let grid: RootSizeOptionsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new RootSizeOptionsPage(page, theme, bundle);
    await grid.goto();
  });

  test('shows every option on a `height: "auto"` grid shorter than the list (the reported shape)',
    async ({ page }) => {
      await grid.rebuild({
        height: 'auto',
        data: [['', ''], ['', ''], ['', '']],
        columns: [{}, { type: 'dropdown', source: OPTIONS }],
      });
      await openDropdown(page, 2, 1);

      const { list, cell, root } = await rects(page);

      expect(await reachableOptions(page)).toBe(OPTIONS.length);
      // The whole point: the list is taller than the grid and hangs below it.
      expect(list.top).toBeGreaterThanOrEqual(cell.bottom - 1);
      expect(list.bottom).toBeGreaterThan(root.bottom);
    });

  test('shows every option on a grid with a fixed `height` that clips its root', async ({ page }) => {
    await grid.rebuild({
      height: 150,
      data: [['', ''], ['', ''], ['', '']],
      columns: [{}, { type: 'dropdown', source: OPTIONS }],
    });

    expect((await grid.rootState()).computedOverflowY).toBe('clip');

    await openDropdown(page, 2, 1);

    const { list, cell, root } = await rects(page);

    expect(await reachableOptions(page)).toBe(OPTIONS.length);
    expect(list.top).toBeGreaterThanOrEqual(cell.bottom - 1);
    expect(list.bottom).toBeGreaterThan(root.bottom);
  });

  test('shows every option on a `height: "auto"` grid inside a scrolling parent', async ({ page }) => {
    await grid.rebuild({
      height: 'auto',
      columns: [{}, { type: 'dropdown', source: OPTIONS }],
    }, 'bounded');

    // The last row the 300px parent shows in full, asked of the grid rather than hardcoded: the
    // row band depends on the theme's row height (`tests/AGENTS.md`).
    const row = await page.evaluate(() => window.hot.getLastFullyVisibleRow());

    await openDropdown(page, row, 1);

    const { list, cell, container } = await rects(page);

    expect(await reachableOptions(page)).toBe(OPTIONS.length);
    expect(list.top).toBeGreaterThanOrEqual(cell.bottom - 1);
    expect(list.bottom).toBeGreaterThan(container.bottom);
  });

  test('follows the cell when the page scrolls', async ({ page }) => {
    // A spacer pushes the page past the viewport so the window can scroll.
    await page.evaluate(() => {
      const spacer = document.createElement('div');

      spacer.style.height = '2000px';
      document.body.appendChild(spacer);
    });
    await grid.rebuild({
      height: 150,
      data: [['', ''], ['', ''], ['', '']],
      columns: [{}, { type: 'dropdown', source: OPTIONS }],
    });
    await openDropdown(page, 2, 1);

    const before = await rects(page);

    await page.evaluate(() => {
      window.scrollBy(0, 80);

      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    });

    const after = await rects(page);

    // The cell moved with the page; the list moved with the cell.
    expect(after.cell.bottom).toBeCloseTo(before.cell.bottom - 80, 0);
    expect(after.list.top - after.cell.bottom).toBeCloseTo(before.list.top - before.cell.bottom, 0);
    expect(await reachableOptions(page)).toBe(OPTIONS.length);
  });

  test('flips above the cell when the viewport below is too short, and stays reachable', async ({ page }) => {
    const viewport = page.viewportSize();

    if (!viewport) {
      throw new Error('viewport size is not set');
    }

    // Park the grid at the bottom of the viewport so the list has to go up.
    await page.evaluate((h) => {
      const container = document.getElementById('container');

      if (container) {
        container.style.marginTop = `${h - 120}px`;
      }
    }, viewport.height);
    await grid.rebuild({
      height: 100,
      data: [['', ''], ['', ''], ['', '']],
      columns: [{}, { type: 'dropdown', source: OPTIONS }],
    });
    await openDropdown(page, 0, 1);

    const { list, cell, root } = await rects(page);

    expect(list.bottom).toBeLessThanOrEqual(cell.top + 1);
    expect(list.top).toBeLessThan(root.top);
    expect(list.top).toBeGreaterThanOrEqual(0);
    expect(await reachableOptions(page)).toBeGreaterThan(0);
  });
});
