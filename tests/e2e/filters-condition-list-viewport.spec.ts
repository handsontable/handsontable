import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FiltersConditionListViewportPage } from '../fixtures/pages/FiltersConditionListViewportPage';

/**
 * The Filters condition list opens under its select and is placed by the select, not by the room around it. On a page
 * whose window cannot scroll (an app shell, a frame the size of its content) a list that ends below the viewport had
 * rows nothing could bring into view. The list now moves up so its bottom edge ends inside the viewport (and its top
 * edge stays inside when it is taller), and a list taller than the viewport is capped to it and scrolls inside itself.
 *
 * The fixture runs with `?page=locked`: a fixed, clipping body that nothing scrolls, not even `scrollIntoView()`. On a
 * scrollable page the lower rows are reached by scrolling the window, so these tests would pass without the fix.
 * The list's height is a theme token, so every viewport here is sized from the measured list.
 */

const WIDTH = 844;

// Sub-pixel rounding of a box that touches the viewport edge.
const EDGE_TOLERANCE_PX = 1;

// How far the list's top may sit from its select's top when there is room: the list overlaps its select by a pixel
// or two (see `filters/__tests__/component/conditional.spec.js`).
const ANCHOR_TOLERANCE_PX = 15;

// A viewport tall enough for the dropdown menu and the list under it on every theme.
const TALL_VIEWPORT = { width: WIDTH, height: 900 };

test.describe('Filters condition list on a page that cannot scroll', { tag: THEMES_TAG }, () => {
  test.use({ viewport: TALL_VIEWPORT });

  let grid: FiltersConditionListViewportPage;
  let listHeight: number;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersConditionListViewportPage(page, theme, bundle, 'ltr', 'locked');
    await grid.goto();
    await grid.openConditionList();
    listHeight = (await grid.listGeometry()).height;
    await grid.closeConditionList();
  });

  /**
   * Resizes the viewport and opens the list again, because the list is placed and capped once, when it opens.
   *
   * @param {number} height The viewport height in pixels.
   */
  async function reopenInViewportOf(height: number) {
    await grid.page.setViewportSize({ width: WIDTH, height });
    await grid.openConditionList();
  }

  test('stays under its select and uncapped when the viewport has room', async() => {
    await grid.openConditionList();

    const { top, bottom, selectTop, viewportHeight } = await grid.listGeometry();
    const scroll = await grid.scrollState('conditions');

    expect(bottom).toBeLessThanOrEqual(viewportHeight);
    expect(Math.abs(top - selectTop)).toBeLessThan(ANCHOR_TOLERANCE_PX);
    expect(scroll.overflowY).toBe('visible');
    expect(scroll.clientHeight).toBe(scroll.scrollHeight);
  });

  test('moves up into the viewport when its bottom would lie below it, and is not capped', async() => {
    // The list fits the viewport, but only just: with it under its select it would end below the edge.
    await reopenInViewportOf(listHeight + 20);

    const { top, bottom, selectTop, viewportHeight } = await grid.listGeometry();
    const scroll = await grid.scrollState('conditions');

    expect(selectTop + listHeight, 'the list under its select fits, so nothing is moved').toBeGreaterThan(viewportHeight);
    expect(top).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
    expect(bottom).toBeLessThanOrEqual(viewportHeight + EDGE_TOLERANCE_PX);
    expect(scroll.overflowY).toBe('visible');
    expect(scroll.clientHeight).toBe(scroll.scrollHeight);
  });

  test('keeps its left edge on its select where the room to the right is short', async() => {
    // The list and the select are wider than what is left of a narrow viewport to the right of the select. A menu kept
    // in the viewport on both axes would flip to the other side of the select there; this one only moves vertically.
    await grid.page.setViewportSize({ width: 320, height: TALL_VIEWPORT.height });
    await grid.openConditionList();

    const { left, selectLeft } = await grid.listGeometry();

    expect(Math.abs(left - selectLeft)).toBeLessThan(ANCHOR_TOLERANCE_PX);
  });

  test.describe('in a viewport shorter than the list', () => {
    test.beforeEach(async() => {
      await reopenInViewportOf(Math.round(listHeight * 0.6));
    });

    test('is capped to the viewport and scrolls inside itself', async() => {
      const { top, bottom, viewportHeight } = await grid.listGeometry();
      const scroll = await grid.scrollState('conditions');

      expect(scroll.scrollHeight, 'the list fits the viewport, so nothing is capped').toBeGreaterThan(viewportHeight);
      expect(scroll.clientHeight).toBeLessThan(scroll.scrollHeight);
      expect(scroll.overflowY).toBe('auto');
      expect(top).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
      expect(bottom).toBeLessThanOrEqual(viewportHeight + EDGE_TOLERANCE_PX);
    });

    test('leaves the dropdown menu around it as it was', async() => {
      // Only the condition list asks to be capped on a desktop browser. The menus that rely on the window scroll do not.
      const scroll = await grid.scrollState('dropdown');

      expect(scroll.overflowY).toBe('visible');
      expect(scroll.clientHeight).toBe(scroll.scrollHeight);
    });

    test('reaches its last item with the mouse wheel and picks it', async() => {
      const lastItemText = (await grid.items().last().innerText()).trim();

      await grid.list().hover();
      await grid.page.mouse.wheel(0, 2000);
      await expect.poll(async() => {
        const { scrollTop, scrollHeight, clientHeight } = await grid.scrollState('conditions');

        return scrollHeight - clientHeight - scrollTop;
      }).toBeLessThanOrEqual(1);
      // The wheel moves the list's holder and does not close the list.
      await expect(grid.list()).toBeVisible();

      const { bottom: itemBottom } = await grid.lastItemBox('conditions');
      const { viewportHeight } = await grid.listGeometry();

      expect(itemBottom).toBeLessThanOrEqual(viewportHeight + EDGE_TOLERANCE_PX);

      await grid.items().last().click();
      await expect(grid.list()).toBeHidden();
      await expect(grid.caption()).toHaveText(lastItemText);
    });

    test('reaches its last item with the keyboard and picks it', async() => {
      const lastItemText = (await grid.items().last().innerText()).trim();

      await grid.page.keyboard.press('End');
      await expect.poll(async() => {
        const { bottom } = await grid.lastItemBox('conditions');
        const { viewportHeight } = await grid.listGeometry();

        return bottom <= viewportHeight + EDGE_TOLERANCE_PX;
      }).toBe(true);

      await grid.page.keyboard.press('Enter');
      await expect(grid.list()).toBeHidden();
      await expect(grid.caption()).toHaveText(lastItemText);
    });
  });
});
