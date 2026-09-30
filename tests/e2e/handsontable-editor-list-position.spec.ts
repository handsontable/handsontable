import { test, expect } from '../fixtures/test';
import { HandsontableEditorListPositionPage, type Layout, type Variant } from '../fixtures/pages/HandsontableEditorListPositionPage';

/**
 * Where the `handsontable`, `dropdown`, and `multiselect` editors' lists open, relative to the cell being
 * edited, on a page the WINDOW scrolls and in a sized grid that scrolls its own holder, after scrolling
 * to the bottom and inline end.
 *
 * The `handsontable` list opens toward the inline end (right in LTR, left in RTL) when it fits there,
 * even when it would fit toward the inline start as well, and flips toward the inline start when it
 * does not fit and has more room there. It opens below the cell when it fits there, even when it would
 * fit above as well, and flips above when it does not fit below and has more room above. It stays in
 * the viewport. `HandsontableEditor#flipDropdownHorizontallyIfNeeded` and
 * `#flipDropdownVerticallyIfNeeded` (`handsontable/src/editors/handsontableEditor/handsontableEditor.ts`)
 * decide it.
 *
 * The `dropdown` editor extends that editor and flips the same way, but sizes its list itself
 * (`AutocompleteEditor#updateDropdownDimensions`): trimmed to the cell's width by default, so it stays
 * on the cell's inline start and only the vertical flip moves it.
 *
 * The `multiselect` editor places its list with its own code (`MultiSelectEditor#refreshDimensions`,
 * `handsontable/src/editors/multiSelectEditor/multiSelectEditor.ts`) and the same horizontal rule. Its
 * list is 177–202 px wide, narrower than the `handsontable` one, so it has points of its own. Only the
 * top row is used: below the cell its list starts flush with the cell's bottom, but flipped above, the
 * offset `DropdownController` computes overlaps the cell by 4–10 px depending on the theme. That is a
 * known vertical defect, tracked on its own, and not what these tests are about.
 *
 * The two layouts reach different branches of the horizontal flip. On a page the window scrolls, the
 * room is measured from the viewport, through `view.isHorizontallyScrollableByWindow()`. It is measured
 * from the grid's inline-start edge: the left edge in LTR, the right edge in RTL, where the page's
 * `scrollX` runs negative and the cell is measured from the grid's right edge. That layout also runs
 * with the grid 600 px from the page's inline-start edge, so the grid root is narrower than the viewport
 * and its edge is not the page's (neither `scrollX` nor the root's width can stand in for the offset
 * there). And it runs in a transformed container, which makes the containing block of the `fixed` list
 * a box that scrolls with the page: the room is still the viewport's. The last describe block scrolls
 * the page with a list open, because every page scroll decides the side again. In a sized grid, the
 * room is measured from the grid's own workspace, on purpose: the fixture's grid is 1000 px wide in a
 * 1280 px viewport, so from a cell near the grid's inline end the list flips although the viewport still
 * has room. A sized grid also runs with the page in the other direction (an RTL grid on an LTR page, and
 * the mirror), since the flip reads the grid's direction and not the document's.
 *
 * The Jasmine positioning specs pin the horizontal flip of a sized grid in one layout direction each,
 * and the vertical side only as "touching the cell", because there the side depends on the theme.
 * The visual captures under `js-only/editors/` were the only guard of the rest.
 *
 * Each point forces its placement on every theme. The `handsontable` list is 334–388 px wide and
 * 190–273 px tall across the themes, and the room each point leaves clears or misses it by 60 px or
 * more (the least is `horizon`'s mid-height points, which fit below by 60 px and above by 61). The
 * `dropdown` list is 263–371 px tall (ten options), so at mid-height on `horizon` it fits neither below
 * nor above and is trimmed to whole rows instead of flipped; its points are the top and bottom ones,
 * which clear or miss it by 139 px or more. The `multiselect` list is 320–475 px tall and fits below the
 * top row by 154 px or more (`horizon`, on a page the window scrolls). Its flipping points leave 101 px
 * of room, 76 px short of its narrowest width (177 px), and its other points leave 500 px or more.
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

// The dropdown's list is trimmed to the cell, so every point expects it on the cell's width, and the
// mid-height points are left out (see the docblock above).
const DROPDOWN_POINTS: Point[] = POINTS
  .filter(({ name }) => !name.startsWith('middle'))
  .map(point => ({ ...point, aligned: { ltr: 'cell width', rtl: 'cell width' } }));

// The multiselect's list is narrower, so its flipping point is 40 px from the inline-end edge of the box
// that scrolls, which leaves 101 px of room. On the inline-start side 40 px lands on the row
// header, so each direction keeps the handsontable editor's point there. Top row only (see the docblock
// above).
const MULTISELECT_POINTS: Record<'ltr' | 'rtl', Point[]> = {
  ltr: [
    { name: 'top-left', x: 120, y: 60, aligned: { ltr: 'left edge', rtl: 'left edge' }, side: 'below' },
    { name: 'top-center', x: 'center', y: 60, aligned: { ltr: 'left edge', rtl: 'left edge' }, side: 'below' },
    { name: 'top-right', x: -40, y: 60, aligned: { ltr: 'right edge', rtl: 'right edge' }, side: 'below' },
  ],
  rtl: [
    { name: 'top-left', x: 40, y: 60, aligned: { ltr: 'left edge', rtl: 'left edge' }, side: 'below' },
    { name: 'top-center', x: 'center', y: 60, aligned: { ltr: 'right edge', rtl: 'right edge' }, side: 'below' },
    { name: 'top-right', x: -150, y: 60, aligned: { ltr: 'right edge', rtl: 'right edge' }, side: 'below' },
  ],
};

/**
 * Opens the editor from every point and asserts the placement each one forces.
 *
 * @param {HandsontableEditorListPositionPage} grid The page object.
 * @param {Point[]} points The points and what each forces.
 */
async function expectEveryPoint(grid: HandsontableEditorListPositionPage, points: Point[]): Promise<void> {
  await grid.scrollToEnd();

  for (const point of points) {
    const coords = await grid.openEditorAt(point.x, point.y);

    await expect.poll(() => grid.listPlacement(coords), { message: `from the ${point.name} point` })
      .toEqual({ aligned: point.aligned[grid.dir], side: point.side, inViewport: 'yes' });

    await grid.closeEditor();
  }
}

const LAYOUT_NAMES: Record<Layout, string> = {
  window: 'on a page the window scrolls',
  sized: 'in a sized grid that scrolls itself',
};

/**
 * The layouts both editors run in. The window layout keeps the page in the grid's direction: an RTL
 * grid on an LTR page the window scrolls opens on the grid's last columns, so cell (0, 0) never renders
 * (tests/AGENTS.md).
 */
const CASES: { title: string; variant: Omit<Variant, 'type'> }[] = [
  { title: `${LAYOUT_NAMES.window} (LTR)`, variant: { dir: 'ltr', layout: 'window' } },
  { title: `${LAYOUT_NAMES.window} (RTL)`, variant: { dir: 'rtl', layout: 'window' } },
  {
    title: `${LAYOUT_NAMES.window}, 600 px from its inline-start edge (LTR)`,
    variant: { dir: 'ltr', layout: 'window', inset: 'start' },
  },
  {
    title: `${LAYOUT_NAMES.window}, 600 px from its inline-start edge (RTL)`,
    variant: { dir: 'rtl', layout: 'window', inset: 'start' },
  },
  {
    title: `${LAYOUT_NAMES.window}, in a transformed container (LTR)`,
    variant: { dir: 'ltr', layout: 'window', wrap: 'transform' },
  },
  {
    title: `${LAYOUT_NAMES.window}, in a transformed container (RTL)`,
    variant: { dir: 'rtl', layout: 'window', wrap: 'transform' },
  },
  { title: `${LAYOUT_NAMES.sized} (LTR)`, variant: { dir: 'ltr', layout: 'sized' } },
  { title: `${LAYOUT_NAMES.sized} (RTL)`, variant: { dir: 'rtl', layout: 'sized' } },
  { title: `${LAYOUT_NAMES.sized} (an RTL grid on an LTR page)`, variant: { dir: 'rtl', layout: 'sized', doc: 'ltr' } },
  { title: `${LAYOUT_NAMES.sized} (an LTR grid on an RTL page)`, variant: { dir: 'ltr', layout: 'sized', doc: 'rtl' } },
];

test.describe('handsontable editor list position', () => {
  for (const { title, variant } of CASES) {
    test(`opens toward the room it has from every point, ${title}`, async({ page, theme, bundle }) => {
      const grid = new HandsontableEditorListPositionPage(page, theme, bundle, variant);

      await grid.goto();
      await expectEveryPoint(grid, POINTS);
    });
  }
});

test.describe('dropdown editor list position', () => {
  for (const { title, variant } of CASES) {
    test(`keeps its list on the cell and opens it toward the room it has, ${title}`, async({
      page, theme, bundle,
    }) => {
      const grid = new HandsontableEditorListPositionPage(page, theme, bundle, { ...variant, type: 'dropdown' });

      await grid.goto();
      await expectEveryPoint(grid, DROPDOWN_POINTS);
    });
  }
});

test.describe('multiselect editor list position', () => {
  for (const { title, variant } of CASES) {
    test(`opens toward the room it has, ${title}`, async({ page, theme, bundle }) => {
      const grid = new HandsontableEditorListPositionPage(page, theme, bundle, { ...variant, type: 'multiselect' });

      await grid.goto();
      await expectEveryPoint(grid, MULTISELECT_POINTS[variant.dir]);
    });
  }
});

// The side an open list takes is decided again on every page scroll (`HandsontableEditor`'s document
// `scroll` listener, the multiselect's scroll follow), so the window branch runs again there too. Both
// lists are wider than the cell, so scrolling the cell to the viewport's inline-end edge leaves them no
// room on that side (the cell's own width, 100 px, against a list of 177 px or more), and scrolling back
// gives it back.
const OPENS_FROM: Record<'ltr' | 'rtl', { opening: string; flipped: string }> = {
  ltr: { opening: 'left edge', flipped: 'right edge' },
  rtl: { opening: 'right edge', flipped: 'left edge' },
};

test.describe('editor list position while the page scrolls', () => {
  for (const type of ['handsontable', 'multiselect'] as const) {
    for (const dir of ['ltr', 'rtl'] as const) {
      test(`the ${type} editor's list moves to the side with room as the window scrolls (${dir.toUpperCase()})`, async({
        page, theme, bundle,
      }) => {
        const grid = new HandsontableEditorListPositionPage(page, theme, bundle, { dir, layout: 'window', type });
        const { opening, flipped } = OPENS_FROM[dir];

        await grid.goto();
        await grid.scrollToEnd();

        const coords = await grid.openEditorAt('center', 60);

        await expect.poll(() => grid.listPlacement(coords), { message: 'when it opens' })
          .toEqual({ aligned: opening, side: 'below', inViewport: 'yes' });

        const dx = await grid.moveCellToInlineEndEdge(coords);

        await expect.poll(() => grid.listPlacement(coords), { message: 'with the cell at the inline-end edge' })
          .toEqual({ aligned: flipped, side: 'below', inViewport: 'yes' });

        await grid.scrollWindowBy(-dx, coords);

        await expect.poll(() => grid.listPlacement(coords), { message: 'scrolled back' })
          .toEqual({ aligned: opening, side: 'below', inViewport: 'yes' });
      });
    }
  }
});
