import { test, expect, THEMES_TAG } from '../fixtures/test';
import { MenuViewportClampPage, type MenuGeometry } from '../fixtures/pages/MenuViewportClampPage';

/**
 * A menu that fits on neither side of the point it opens at stays inside the viewport. The positioner
 * tried the inline-end side, fell back to the other side when the menu did not fit, and never asked
 * whether that side fit either, so on a narrow viewport the menu's inline-start edge went past the
 * edge of the screen and its first controls were clipped (the column dropdown of a 390px phone).
 *
 * The viewport is 320px, the width WCAG 1.4.10 (Reflow) is measured at, and the point is in the
 * middle of it: a menu about 200px wide then misses both sides by a wide margin on every theme, so
 * the outcome does not depend on a theme's paddings. The menu's width is asserted as the
 * precondition, or a menu that happened to fit on one side would pass on unfixed code.
 *
 * The positioner places `style.left` in page coordinates, so the window-scrolled cases, one per
 * document direction, are what tell a clamp against the viewport from a clamp against the page's left
 * edge. A menu wider than the viewport, and the arithmetic of both directions, are pinned in
 * `positioner.unit.ts`, where the widths can be chosen.
 */
const VIEWPORT = { width: 320, height: 720 };

// Wider than any point in the middle of the viewport leaves room for on either side (160px), with a
// margin for the point being a few pixels off the middle.
const WIDE_MENU_PX = 190;

// Sub-pixel rounding of a box that touches the viewport edge.
const EDGE_TOLERANCE_PX = 0.5;

/**
 * Asserts the menu is wide enough to prove something and lies inside the viewport.
 *
 * @param {MenuGeometry} geometry The menu's box and the viewport width.
 */
function expectInsideViewport({ left, right, width, viewportWidth }: MenuGeometry): void {
  expect(width, 'the menu is too narrow to miss both sides of the point').toBeGreaterThan(WIDE_MENU_PX);
  expect(left).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
  expect(right).toBeLessThanOrEqual(viewportWidth + EDGE_TOLERANCE_PX);
}

test.use({ viewport: VIEWPORT });

for (const dir of ['ltr', 'rtl'] as const) {
  test.describe(`menu in a narrow viewport (${dir})`, { tag: THEMES_TAG }, () => {
    let grid: MenuViewportClampPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new MenuViewportClampPage(page, theme, bundle, dir);
      await grid.goto();
    });

    test('the dropdown menu stays inside the viewport', async() => {
      await grid.openDropdownMenu(0);

      expectInsideViewport(await grid.geometry('dropdown'));
    });

    test('the context menu stays inside the viewport', async() => {
      await grid.openContextMenuAt(VIEWPORT.width / 2, 120);

      expectInsideViewport(await grid.geometry('context'));
    });
  });
}

// The window scrolls toward the inline end, which is a negative offset in an RTL document.
for (const { dir, scrollX } of [{ dir: 'ltr', scrollX: 1000 }, { dir: 'rtl', scrollX: -1000 }] as const) {
  test.describe(`menu in a narrow viewport (${dir}, scrolled window)`, { tag: THEMES_TAG }, () => {
    let grid: MenuViewportClampPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new MenuViewportClampPage(page, theme, bundle, dir, 'wide');
      await grid.goto();
      await grid.scrollWindowTo(scrollX);
    });

    test('the dropdown menu stays inside the viewport of a window scrolled sideways', async() => {
      await grid.openDropdownMenu(0);

      expectInsideViewport(await grid.geometry('dropdown'));
    });

    test('the context menu stays inside the viewport of a window scrolled sideways', async() => {
      await grid.openContextMenuAt(VIEWPORT.width / 2, 120);

      expectInsideViewport(await grid.geometry('context'));
    });
  });
}

test.describe('submenu in a narrow viewport', { tag: THEMES_TAG }, () => {
  test('stays inside the viewport when it fits on neither side of its parent menu', async({ page, theme, bundle }) => {
    const grid = new MenuViewportClampPage(page, theme, bundle);

    await grid.goto();
    // Near the inline start, so the parent menu has the room it needs, and its submenu has not: it
    // would reach past the viewport on the parent's right, and start left of it on the parent's left.
    await grid.openContextMenuAt(30, 120);
    await grid.openAlignmentSubmenu();

    const parent = await grid.geometry('context');
    const submenu = await grid.geometry('submenu');

    expect(parent.right + submenu.width, 'the submenu fits on the right of its parent').toBeGreaterThan(parent.viewportWidth);
    expect(parent.left - submenu.width, 'the submenu fits on the left of its parent').toBeLessThan(0);
    expect(submenu.left).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
    expect(submenu.right).toBeLessThanOrEqual(submenu.viewportWidth + EDGE_TOLERANCE_PX);
  });
});

test.describe('menu that fits on the inline-end side', { tag: THEMES_TAG }, () => {
  test('opens at the pointer, as before', async({ page, theme, bundle }) => {
    const grid = new MenuViewportClampPage(page, theme, bundle);
    // Near the inline start, the menu has the room it needs on the inline-end side of the point.
    const x = 10;

    await grid.goto();
    await grid.openContextMenuAt(x, 120);

    const { left, right, width, viewportWidth } = await grid.geometry('context');

    expect(width).toBeGreaterThan(WIDE_MENU_PX);
    expect(right).toBeLessThan(viewportWidth);
    expect(left).toBeCloseTo(x, 0);
  });
});
