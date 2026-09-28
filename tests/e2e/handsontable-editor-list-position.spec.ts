import { test, expect } from '../fixtures/test';
import { HandsontableEditorListPositionPage, type Layout } from '../fixtures/pages/HandsontableEditorListPositionPage';

/**
 * Where the `handsontable` editor's list opens, relative to the cell being edited, on a page the
 * WINDOW scrolls and in a sized grid that scrolls its own holder, after scrolling to the bottom and
 * inline end.
 *
 * The list opens toward the inline end (right in LTR, left in RTL) when it fits there, even when it
 * would fit toward the inline start as well, and flips toward the inline start when it does not fit
 * and has more room there. It opens below the cell when it fits there, even when it would fit above
 * as well, and flips above when it does not fit below and has more room above. It stays in the
 * viewport. `HandsontableEditor#flipDropdownHorizontallyIfNeeded` and
 * `#flipDropdownVerticallyIfNeeded` (`handsontable/src/editors/handsontableEditor/handsontableEditor.ts`)
 * decide it.
 *
 * The two layouts reach different branches of the horizontal flip. On a page the window scrolls,
 * the room is measured from the viewport, through `view.isHorizontallyScrollableByWindow()` and
 * `rootWindow.scrollX`. In a sized grid it is measured from the grid's own workspace, on purpose: the
 * fixture's grid is 1000 px wide in a 1280 px viewport, so from a cell near the grid's inline end the
 * list flips although the viewport still has room.
 *
 * The Jasmine positioning specs pin the horizontal flip of a sized grid in one layout direction each,
 * and the vertical side only as "touching the cell", because there the side depends on the theme.
 * The visual captures under `js-only/editors/handsontable/` were the only guard of the rest.
 *
 * Each point forces its placement on every theme. The list is 334–388 px wide and 190–273 px tall
 * across the themes, and the room each point leaves clears or misses it by 60 px or more (the least
 * is `horizon`'s mid-height points, which fit below by 60 px and above by 61).
 */

/**
 * A point of the box that scrolls (the viewport, or the grid's holder), as offsets from its edges (a
 * negative offset counts from the right or bottom edge, `center` is the middle), and the placement it
 * forces.
 */
interface Point {
  name: string;
  x: number | 'center';
  y: number | 'center';
  aligned: { ltr: string; rtl: string };
  side: string;
}

const POINTS: Point[] = [
  { name: 'top-left', x: 120, y: 60, aligned: { ltr: 'left edge', rtl: 'left edge' }, side: 'below' },
  // The middle of the top edge has room both ways, so it shows the default of each direction.
  { name: 'top-center', x: 'center', y: 60, aligned: { ltr: 'left edge', rtl: 'right edge' }, side: 'below' },
  { name: 'top-right', x: -150, y: 60, aligned: { ltr: 'right edge', rtl: 'right edge' }, side: 'below' },
  // Mid-height, the list fits below the cell and above it, so these show that it opens below.
  { name: 'middle-left', x: 120, y: 'center', aligned: { ltr: 'left edge', rtl: 'left edge' }, side: 'below' },
  { name: 'middle-right', x: -150, y: 'center', aligned: { ltr: 'right edge', rtl: 'right edge' }, side: 'below' },
  { name: 'bottom-left', x: 120, y: -110, aligned: { ltr: 'left edge', rtl: 'left edge' }, side: 'above' },
  { name: 'bottom-right', x: -150, y: -110, aligned: { ltr: 'right edge', rtl: 'right edge' }, side: 'above' },
];

/**
 * Opens the editor from every point and asserts the placement each one forces.
 *
 * @param {HandsontableEditorListPositionPage} grid The page object.
 */
async function expectEveryPoint(grid: HandsontableEditorListPositionPage): Promise<void> {
  await grid.scrollToEnd();

  for (const point of POINTS) {
    const coords = await grid.openEditorAt(point.x, point.y);

    await expect.poll(() => grid.listPlacement(coords), { message: `from the ${point.name} point` })
      .toEqual({ aligned: point.aligned[grid.dir], side: point.side, inViewport: true });

    await grid.closeEditor();
  }
}

const LAYOUT_NAMES: Record<Layout, string> = {
  window: 'on a page the window scrolls',
  sized: 'in a sized grid that scrolls itself',
};

test.describe('handsontable editor list position', () => {
  for (const layout of ['window', 'sized'] as Layout[]) {
    test(`opens toward the room it has from every point, ${LAYOUT_NAMES[layout]} (LTR)`, async({
      page, theme, bundle,
    }) => {
      const grid = new HandsontableEditorListPositionPage(page, theme, bundle, 'ltr', layout);

      await grid.goto();
      await expectEveryPoint(grid);
    });
  }

  test(`opens toward the room it has from every point, ${LAYOUT_NAMES.sized} (RTL)`, async({
    page, theme, bundle,
  }) => {
    const grid = new HandsontableEditorListPositionPage(page, theme, bundle, 'rtl', 'sized');

    await grid.goto();
    await expectEveryPoint(grid);
  });

  // Known product bug (measured 2026-09-28 on all three themes): on an RTL page scrolled by the
  // window, the list always opens aligned to the cell's LEFT edge and extends right, so from a cell
  // near the viewport's right edge it runs off-screen (cell 1100–1200, list 1100–1466 on a 1280 px
  // viewport). The window branch of the horizontal flip measures from the left and adds the RTL
  // document's negative `scrollX`. The sized RTL grid above is correct. Unpark with the fix.
  // eslint-disable-next-line no-restricted-syntax -- DEV-3138: RTL window-scrolled list opens off-screen; unpark with the fix
  test.fixme(`opens toward the room it has from every point, ${LAYOUT_NAMES.window} (RTL)`, async({
    page, theme, bundle,
  }) => {
    const grid = new HandsontableEditorListPositionPage(page, theme, bundle, 'rtl', 'window');

    await grid.goto();
    await expectEveryPoint(grid);
  });
});
