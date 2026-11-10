import { devices } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { MenuViewportClampPage } from '../fixtures/pages/MenuViewportClampPage';

/**
 * A menu taller than the viewport is capped to it and scrolls in itself on a touch device. The menu used to run
 * past the bottom of a short viewport, a phone held sideways, and nothing in it scrolled: only the window could
 * reveal the rest, and a page that does not scroll (an app shell) never does. A desktop browser keeps the old
 * behavior, which `menu-viewport-clamp.spec.ts` and the legacy keyboard specs pin, so this spec runs as an iPhone.
 *
 * The fixture runs with `?page=locked`: a fixed, clipping body that nothing scrolls, not even `scrollIntoView()`,
 * which still moves an `overflow: hidden` window. On a scrollable page a menu is reached by scrolling the window,
 * so the cap tests would pass without the cap.
 */
test.use({ ...devices['iPhone 13'], browserName: 'chromium' });

// The viewport the menus are wider than, as the fixture's grid is 320px wide.
const VIEWPORT = { width: 320 };

// Sub-pixel rounding of a box that touches the viewport edge.
const EDGE_TOLERANCE_PX = 0.5;

// A viewport shorter than the context menu on every theme (340 to 474px), so the menu cannot be placed
// inside it whole: it is capped to the viewport and scrolls in itself. A phone held sideways is this short.
const CAPPED_VIEWPORT = { width: 844, height: 300 };

test.describe('menu taller than the viewport', { tag: THEMES_TAG }, () => {
  test.use({ viewport: CAPPED_VIEWPORT });

  let grid: MenuViewportClampPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    // The window cannot scroll, as in an app shell, so the menu can only scroll in itself.
    grid = new MenuViewportClampPage(page, theme, bundle, 'ltr', 'locked');
    await grid.goto();
    await grid.openContextMenuAt(VIEWPORT.width / 2, 100);
  });

  test('is capped to the viewport and scrolls inside itself', async() => {
    const { top, bottom, viewportHeight } = await grid.geometry('context');
    const scroll = await grid.scrollState('context');

    expect(scroll.scrollHeight, 'the menu content fits the viewport, so nothing is capped').toBeGreaterThan(viewportHeight);
    expect(scroll.clientHeight).toBeLessThan(scroll.scrollHeight);
    expect(scroll.overflowY).toBe('auto');
    expect(top).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
    expect(bottom).toBeLessThanOrEqual(viewportHeight + EDGE_TOLERANCE_PX);
  });

  test('reaches its last item with a finger and taps it', async() => {
    const { viewportHeight } = await grid.geometry('context');
    const lastItem = await grid.lastItemText('context');

    await grid.swipeUpOverMenu('context', 1000);
    await expect.poll(async() => {
      const { scrollTop, scrollHeight, clientHeight } = await grid.scrollState('context');

      return Math.abs(scrollHeight - clientHeight - scrollTop) <= 1;
    }).toBe(true);
    await expect.poll(async() => (await grid.lastItemBox('context')).bottom).toBeLessThanOrEqual(viewportHeight);

    await expect(grid.menu('context')).toBeVisible();

    const { top, bottom } = await grid.lastItemBox('context');
    const { x } = (await grid.menu('context').boundingBox())!;

    await grid.page.touchscreen.tap(x + 20, (top + bottom) / 2);
    // The last item is disabled in the fixture, so the tap selects it and the menu stays open.
    await expect(grid.menu('context').locator('td.current')).toHaveText(lastItem);
  });

  test('a swipe scrolls the menu and runs no item', async() => {
    expect((await grid.scrollState('context')).scrollTop).toBe(0);

    await grid.swipeUpOverMenu('context', 150);

    await expect.poll(async() => (await grid.scrollState('context')).scrollTop).toBeGreaterThan(0);
    // An item that ran would have closed the menu.
    await expect(grid.menu('context')).toBeVisible();
  });

  test('scrolls to the item the selection moves to', async() => {
    const { viewportHeight } = await grid.geometry('context');

    await grid.selectLastContextMenuItem();
    await expect.poll(async() => (await grid.lastItemBox('context')).bottom).toBeLessThanOrEqual(viewportHeight);
    expect((await grid.lastItemBox('context')).top).toBeGreaterThanOrEqual(0);
    expect((await grid.scrollState('context')).scrollTop).toBeGreaterThan(0);
  });

  test('places a dropdown menu again when a measurement after it opened makes it too tall', async() => {
    await grid.closeMenu('context');
    await grid.openDropdownMenu(0);

    const open = await grid.geometry('dropdown');

    // The menu fits as it was placed. A shorter viewport leaves it taller than the room, and the Filters
    // plugin measures an open menu again whenever its content changes.
    await grid.page.setViewportSize({ width: CAPPED_VIEWPORT.width, height: Math.floor(open.height) - 10 });
    await grid.refreshMenuDimensions();

    const { top, bottom, viewportHeight } = await grid.geometry('dropdown');
    const scroll = await grid.scrollState('dropdown');

    expect(scroll.scrollHeight, 'the menu fits its holder, so nothing is capped').toBeGreaterThan(scroll.clientHeight);
    expect(scroll.overflowY).toBe('auto');
    expect(top).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
    expect(bottom).toBeLessThanOrEqual(viewportHeight + EDGE_TOLERANCE_PX);

    await grid.swipeUpOverMenu('dropdown', 500);
    await expect.poll(async() => (await grid.okButtonBox()).bottom).toBeLessThanOrEqual(viewportHeight);
  });

  test('drops the cap when a measured dropdown menu fits the viewport again', async() => {
    await grid.closeMenu('context');
    await grid.openDropdownMenu(0);

    const { height } = await grid.geometry('dropdown');

    await grid.page.setViewportSize({ width: CAPPED_VIEWPORT.width, height: Math.floor(height) - 10 });
    await grid.refreshMenuDimensions();
    expect((await grid.scrollState('dropdown')).overflowY).toBe('auto');

    await grid.page.setViewportSize({ width: CAPPED_VIEWPORT.width, height: CAPPED_VIEWPORT.height });
    await grid.refreshMenuDimensions();

    expect((await grid.scrollState('dropdown')).overflowY).toBe('');
  });
});

test.describe('menu that fits the viewport', { tag: THEMES_TAG }, () => {
  test('is not capped and does not scroll', async({ page, theme, bundle }) => {
    const grid = new MenuViewportClampPage(page, theme, bundle);

    await grid.goto();
    await grid.openContextMenuAt(VIEWPORT.width / 2, 20);

    const { height, viewportHeight } = await grid.geometry('context');
    const scroll = await grid.scrollState('context');

    expect(height, 'the menu does not fit the viewport, so it is capped').toBeLessThan(viewportHeight);
    expect(scroll.overflowY).toBe('');
    expect(scroll.scrollHeight).toBe(scroll.clientHeight);
  });
});
