import { test, expect } from '../fixtures/test';
import { SubmenuPositionPage, type Layout } from '../fixtures/pages/SubmenuPositionPage';

/**
 * Where a menu's submenu opens relative to the item it belongs to, for the context menu and the
 * dropdown menu, in both grid directions and both document directions, with the grid at rest, with
 * its holder scrolled, and with the window scrolled.
 *
 * The submenu opens beside its parent menu, edge to edge: on the inline end side by default (right
 * in LTR, left in RTL), and on the other side when it does not fit. It opens downward from its row
 * when it fits there, so its first row lines up with that row, even when it would fit above as
 * well. When it does not fit below, it flips upward, so its last row lines up with the row. It never
 * leaves the viewport. `Positioner` in `handsontable/src/plugins/contextMenu/menu/positioner.ts`
 * does all of it, for both menus.
 *
 * #11505 moved this coverage out of the Jasmine positioning specs and into visual captures, which
 * were then its only guard. A capture shows where the submenu was drawn, not that it was drawn in
 * the right place for that corner, so these tests assert the placement from DOM rects and the
 * captures that remain are a look check.
 *
 * Each point forces its placement on every theme. The fixture's menus are short, so the room each
 * point leaves beside, above, and below the pointer and the "Alignment" row clears or misses the menu
 * and its submenu by 56 px or more on every theme at 1280 × 720 (the least is the `classic` menu at
 * the bottom corners, which misses the room below by 56 px). A theme's row height moves the row, but
 * not by that much.
 */

/**
 * A point of the viewport to right-click at, as offsets from its edges (a negative offset counts
 * from the right or bottom edge), and the placement it forces.
 */
interface Corner {
  name: string;
  x: number;
  y: number;
  side: { ltr: string; rtl: string };
  rows: string;
}

const CORNERS: Corner[] = [
  { name: 'top-left', x: 80, y: 80, side: { ltr: 'right', rtl: 'right' }, rows: 'below' },
  // The middle of the top edge has room on both sides, so it shows the default side of each direction.
  { name: 'top-center', x: 640, y: 80, side: { ltr: 'right', rtl: 'left' }, rows: 'below' },
  { name: 'top-right', x: -80, y: 80, side: { ltr: 'left', rtl: 'left' }, rows: 'below' },
  // Mid-height, the menu fits above the pointer and below it, and its submenu fits above its row and
  // below it (by 76 px or more each way on every theme), so these two show the default: a positioner
  // that preferred upward fails here only.
  { name: 'middle-left', x: 80, y: 310, side: { ltr: 'right', rtl: 'right' }, rows: 'below' },
  { name: 'middle-right', x: -80, y: 310, side: { ltr: 'left', rtl: 'left' }, rows: 'below' },
  { name: 'bottom-left', x: 80, y: -40, side: { ltr: 'right', rtl: 'right' }, rows: 'above' },
  { name: 'bottom-right', x: -80, y: -40, side: { ltr: 'left', rtl: 'left' }, rows: 'above' },
];

/**
 * A column at one inline edge of the grid's visible area, and the side its dropdown's submenu takes.
 * The inline start has room toward the inline end, so the submenu takes the default side; the
 * inline end does not, so it flips.
 */
const DROPDOWN_EDGES = [
  { edge: 'start' as const, side: { ltr: 'right', rtl: 'left' } },
  { edge: 'end' as const, side: { ltr: 'left', rtl: 'right' } },
];

/**
 * The document's direction and the grid's. The first two set the grid's direction on an LTR page;
 * the last two put the grid on an RTL page, following it or overriding it. The Jasmine placement
 * tests #11505 deleted ran on all four.
 */
const LAYOUTS: Layout[] = [
  { doc: 'ltr', grid: 'ltr' },
  { doc: 'ltr', grid: 'rtl' },
  { doc: 'rtl', grid: 'inherit' },
  { doc: 'rtl', grid: 'ltr' },
];

for (const layout of LAYOUTS) {
  test.describe(`submenu placement (grid ${layout.grid}, document ${layout.doc})`, () => {
    for (const scrolled of [false, true]) {
      // The grid's own holder scrolls here, so its scroll offset must not reach the submenu's position.
      const where = scrolled ? ', with the grid scrolled to its bottom and inline end' : '';

      test(`the context menu's submenu opens beside its item from every corner${where}`, async({
        page, theme, bundle,
      }) => {
        const grid = new SubmenuPositionPage(page, theme, bundle, layout);

        await grid.goto();

        if (scrolled) {
          await grid.scrollGridToBottomAndInlineEnd();
        }

        for (const corner of CORNERS) {
          const point = await grid.openContextMenuAt(corner.x, corner.y);

          // The menu follows the same rule from the pointer as its submenu does from its row.
          await expect.poll(() => grid.contextMenuRows(point), { message: `the menu, at the ${corner.name} corner` })
            .toBe(corner.rows);
          await grid.openAlignmentSubmenu('context');

          await expect.poll(() => grid.submenuPlacement('context'), { message: `from the ${corner.name} corner` })
            .toEqual({ side: corner.side[grid.dir], rows: corner.rows, inViewport: true });

          await grid.closeMenus('context');
        }
      });

      test(`the dropdown menu's submenu opens beside its item at both inline edges${where}`, async({
        page, theme, bundle,
      }) => {
        const grid = new SubmenuPositionPage(page, theme, bundle, layout);

        await grid.goto();

        if (scrolled) {
          await grid.scrollGridToBottomAndInlineEnd();
        }

        for (const { edge, side } of DROPDOWN_EDGES) {
          await grid.openDropdownMenuAtInlineEdge(edge);
          await grid.openAlignmentSubmenu('dropdown');

          // The dropdown menu opens under its header, so there is always room below.
          await expect.poll(() => grid.submenuPlacement('dropdown'), { message: `at the inline ${edge}` })
            .toEqual({ side: side[grid.dir], rows: 'below', inViewport: true });

          await grid.closeMenus('dropdown');
        }
      });
    }

    // handsontable#10967: with the WINDOW scrolled sideways, the submenu once mixed viewport and
    // document coordinates and opened away from its parent. The grid's own scroll above cannot show it.
    test('the context menu\'s submenu opens beside its item with the window scrolled sideways', async({
      page, theme, bundle,
    }) => {
      const grid = new SubmenuPositionPage(page, theme, bundle, layout, 'wide');
      // An RTL page starts at its right edge and scrolls to negative offsets.
      const offset = layout.doc === 'rtl' ? -300 : 300;

      await grid.goto();
      await grid.scrollWindowTo(offset);
      await grid.openContextMenuAt(640, 80);
      // By pointer, not by keyboard: an ArrowDown in the menu scrolls the window back to its start.
      await grid.hoverAlignmentSubmenu('context');

      await expect.poll(() => grid.submenuPlacement('context'))
        .toEqual({ side: grid.dir === 'rtl' ? 'left' : 'right', rows: 'below', inViewport: true });
      // The window was still scrolled when the submenu opened, so this measured the case it names.
      expect(await grid.windowScrollX()).toBe(offset);
    });
  });
}
