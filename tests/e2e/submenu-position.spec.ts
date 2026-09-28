import { test, expect } from '../fixtures/test';
import { SubmenuPositionPage } from '../fixtures/pages/SubmenuPositionPage';

/**
 * Where a menu's submenu opens relative to the item it belongs to, for the context menu and the
 * dropdown menu, in LTR and RTL, with the grid at rest and scrolled.
 *
 * The submenu opens beside its parent menu, edge to edge: on the inline end side by default (right
 * in LTR, left in RTL), and on the other side when it does not fit. It opens downward from its row,
 * so its first row lines up with that row, and flips upward when it does not fit below, so its last
 * row lines up with it. It never leaves the viewport. `Positioner` in
 * `handsontable/src/plugins/contextMenu/menu/positioner.ts` does all of it, for both menus.
 *
 * #11505 moved this coverage out of the Jasmine positioning specs and into visual captures, which
 * were then its only guard. A capture shows where the submenu was drawn, not that it was drawn in
 * the right place for that corner, so these tests assert the placement from DOM rects and the
 * captures that remain are a look check.
 *
 * Each corner forces its placement on every theme: the fixture's menus are one-row-deep at the
 * anchor, so the room left beside and below does not depend on the theme's row height.
 */

/**
 * A corner of the viewport to right-click in, as offsets from its edges (a negative offset counts
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
  { name: 'bottom-left', x: 80, y: -80, side: { ltr: 'right', rtl: 'right' }, rows: 'above' },
  { name: 'bottom-right', x: -80, y: -80, side: { ltr: 'left', rtl: 'left' }, rows: 'above' },
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

for (const dir of ['ltr', 'rtl'] as const) {
  test.describe(`submenu placement (${dir})`, () => {
    let grid: SubmenuPositionPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new SubmenuPositionPage(page, theme, bundle, dir);

      await grid.goto();
    });

    for (const scrolled of [false, true]) {
      // #dev-1895: the submenu once added the grid's scroll offset to its position.
      const where = scrolled ? ', with the grid scrolled to its bottom and inline end' : '';

      test(`the context menu's submenu opens beside its item from every corner${where}`, async() => {
        if (scrolled) {
          await grid.scrollGridToBottomAndInlineEnd();
        }

        for (const corner of CORNERS) {
          await grid.openContextMenuAt(corner.x, corner.y);
          await grid.openAlignmentSubmenu('context');

          await expect.poll(() => grid.submenuPlacement('context'), { message: `from the ${corner.name} corner` })
            .toEqual({ side: corner.side[dir], rows: corner.rows, inViewport: true });

          await grid.closeMenus('context');
        }
      });

      test(`the dropdown menu's submenu opens beside its item at both inline edges${where}`, async() => {
        if (scrolled) {
          await grid.scrollGridToBottomAndInlineEnd();
        }

        for (const { edge, side } of DROPDOWN_EDGES) {
          await grid.openDropdownMenuAtInlineEdge(edge);
          await grid.openAlignmentSubmenu('dropdown');

          // The dropdown menu opens under its header, so there is always room below.
          await expect.poll(() => grid.submenuPlacement('dropdown'), { message: `at the inline ${edge}` })
            .toEqual({ side: side[dir], rows: 'below', inViewport: true });

          await grid.closeMenus('dropdown');
        }
      });
    }
  });
}
