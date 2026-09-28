import { test, expect } from '../fixtures/test';
import { ListCellArrowLayoutPage, type ListCellType } from '../fixtures/pages/ListCellArrowLayoutPage';

// The three cell types that render `htAutocompleteArrow`: `dropdown` and `handsontable` both
// delegate to `autocompleteRenderer` like `autocomplete`. `date` and `time` carry no arrow and
// are out of scope. `multiselect` uses a different element (`.ht-multi-select-arrow`) and is
// covered by `cell-dropdown-arrow-button.spec.ts`.
const CELL_TYPES: ListCellType[] = ['autocomplete', 'dropdown', 'handsontable'];

/**
 * DEV-348 (GitHub #3116). A long value in an `autocomplete` / `dropdown` / `handsontable` cell
 * wrapped the right-floated `.htAutocompleteArrow` onto a second line when `colWidths` pinned the
 * column (and silently disabled AutoColumnSize). The in-cell arrow is now out of flow with its
 * width reserved as trailing padding: AutoColumnSize expands to fit the value plus the arrow, and
 * a fixed `colWidths` column keeps the arrow on the first line. These three cell types also keep
 * their value on a single line and truncate it with an ellipsis, which overrides `wordWrap` /
 * `textEllipsis` (DEV-28, a 19.0 breaking change: #13463 added it, #13508 reverted it, this
 * relands it).
 *
 * The load-bearing assertion under `colWidths` is the arrow's top sitting inside the first line
 * box. On the pre-fix float layout that unbreakable token fills the line and the arrow drops
 * below it; every other property (trailing-edge placement, one-line autosize) can hold on a
 * "fix" that only recenters the wrapped arrow. The single-line case pins the reland: a breakable
 * phrase that used to wrap now stays on one line, so `wordWrap` no longer reaches these types.
 */
CELL_TYPES.forEach((cellType) => {
  test.describe(`${cellType} list-cell arrow layout`, () => {
    let grid: ListCellArrowLayoutPage;

    test.beforeEach(({ page, theme, bundle }) => {
      grid = new ListCellArrowLayoutPage(page, theme, bundle, cellType);
    });

    test('keeps the arrow on the first line under colWidths with a long value', async() => {
      await grid.goto({ mode: 'colWidths' });

      const {
        arrow, cell, contentBoxRight, lineHeight, paddingTop, arrowEndGap, cellHorizontalPadding,
        hasClip,
      } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();

      // Pre-fix: the unbreakable token fills the line and the floated arrow wraps onto line 2.
      expect(arrow!.top).toBeLessThan(cell.top + paddingTop + lineHeight);
      // The reserved padding places the arrow at or past the content-box trailing edge, so the
      // value clips (or wraps) before the arrow rather than under it.
      expect(arrow!.left).toBeGreaterThanOrEqual(contentBoxRight - 1);
      // The old float's `margin-inline-end: 1px` gap from the cell padding-box edge.
      expect(hasClip).toBe(false);
      expect(arrowEndGap).not.toBeNull();
      expect(Math.abs(arrowEndGap! - (cellHorizontalPadding + 1))).toBeLessThan(1);
    });

    test('grows the column to fit the value plus the arrow under autoColumnSize', async() => {
      await grid.goto({ mode: 'autosize' });

      const {
        arrow, cell, content, contentBoxRight, lineHeight, paddingTop,
      } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();
      expect(content).not.toBeNull();

      // The reserved padding widens the AutoColumnSize ghost sample (it renders the real
      // renderer), so an autosized column fits the value plus the arrow on one line.
      // `content.height` alone is not enough: an unbreakable token already sits on one line
      // when it overflows a too-narrow column (`overflow: hidden` on the cell). The value
      // ending before the arrow is what proves the column grew to include the arrow slot.
      expect(content!.height).toBeLessThanOrEqual(lineHeight + 1);
      expect(arrow!.top).toBeLessThan(cell.top + paddingTop + lineHeight);
      expect(arrow!.left).toBeGreaterThanOrEqual(contentBoxRight - 1);
      expect(content!.right).toBeLessThanOrEqual(arrow!.left + 1);
    });

    test('keeps a breakable value on one line by default and truncates it with an ellipsis', async() => {
      await grid.goto({ mode: 'wrap' });

      const { arrow, cell, content, contentBoxRight, lineHeight, paddingTop } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();
      expect(content).not.toBeNull();

      // DEV-28 reland: these three cell types default `textEllipsis: true`, so a breakable phrase in
      // a 100px column that used to wrap onto several lines (#13508) now stays on one line. The
      // inverse of the pre-reland assertion.
      expect(content!.height).toBeLessThanOrEqual(lineHeight + 1);
      // Pin the ellipsis itself, not only "one line": without `text-overflow` the value would still
      // be one line (the TD clips), so this is the load-bearing part of the reland.
      await expect(grid.cell(0, 0)).toHaveCSS('text-overflow', 'ellipsis');
      // The arrow stays on the first line, clear of the value at the reserved content-box edge.
      expect(arrow!.top).toBeLessThan(cell.top + paddingTop + lineHeight);
      expect(arrow!.left).toBeGreaterThanOrEqual(contentBoxRight - 1);
    });

    test('wraps again when the column opts out with textEllipsis: false', async() => {
      await grid.goto({ mode: 'wrap', listEllipsis: 'off' });

      const { content, lineHeight } = await grid.metrics(0, 0);

      expect(content).not.toBeNull();

      // The single-line rendering is a recoverable type default, not a fixed rule: `textEllipsis:
      // false` on the column restores wrapping, so the breakable phrase spans several lines again.
      expect(content!.height).toBeGreaterThan(lineHeight + 1);
    });

    test('leaves a sibling text column wrapping (the default is scoped to the list types)', async() => {
      await grid.goto({ mode: 'wrap', sideColumn: 'wrap' });

      const list = await grid.metrics(0, 0);
      const text = await grid.metrics(0, 1);

      expect(list.content).not.toBeNull();
      expect(text.content).not.toBeNull();

      // The list cell is single-line by default; the neighbouring `text` cell with the same value
      // still wraps, proving the default comes from the cell type and not a wide CSS selector.
      expect(list.content!.height).toBeLessThanOrEqual(list.lineHeight + 1);
      expect(text.content!.height).toBeGreaterThan(text.lineHeight + 1);
    });

    test('shows the ellipsis inside the clip on an exact-height row, for a list and a text cell', async() => {
      // `tall` provides a positive `rowHeights`, which an exact-height row requires.
      await grid.goto({ mode: 'tall', rowHeightMode: 'exact', sideColumn: 'ellipsis' });

      const list = await grid.metrics(0, 0);
      const text = await grid.metrics(0, 1);

      expect(list.hasClip).toBe(true);
      expect(text.hasClip).toBe(true);

      // `text-overflow` does not inherit into the absolutely positioned `.htCellClip`, so the
      // general `_base.scss` rule sets it there for any `htTextEllipsis` cell — the list cell (via
      // its type default) and a plain `text` column that opts in with `textEllipsis: true`.
      await expect(grid.cell(0, 0).locator('.htCellClip')).toHaveCSS('text-overflow', 'ellipsis');
      await expect(grid.cell(0, 1).locator('.htCellClip')).toHaveCSS('text-overflow', 'ellipsis');
    });

    test('anchors the arrow beside the first line on a tall row', async() => {
      await grid.goto({ mode: 'tall' });

      const { arrow, cell, lineHeight, paddingTop } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();

      // Precondition: the row is much taller than one line, so "beside the first line" and
      // "centered in the cell" are far apart.
      expect(cell.height).toBeGreaterThan(lineHeight * 2);

      const arrowCenterY = arrow!.top + ((arrow!.bottom - arrow!.top) / 2);

      expect(arrowCenterY).toBeLessThanOrEqual(cell.top + paddingTop + lineHeight);
    });

    test('reserves the arrow at the leading edge in RTL', async() => {
      await grid.goto({ mode: 'colWidths', dir: 'rtl' });

      const {
        arrow, cell, contentBoxLeft, lineHeight, paddingTop, arrowEndGap, cellHorizontalPadding,
      } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();

      expect(arrow!.top).toBeLessThan(cell.top + paddingTop + lineHeight);

      const cellCenterX = cell.left + (cell.width / 2);
      const arrowCenterX = arrow!.left + ((arrow!.right - arrow!.left) / 2);

      // `inset-inline-end` flips to the visual left in RTL...
      expect(arrowCenterX).toBeLessThan(cellCenterX);
      // ...and the arrow sits at or past the content-box leading edge, so the value never
      // paints under it.
      expect(arrow!.right).toBeLessThanOrEqual(contentBoxLeft + 1);
      expect(arrowEndGap).not.toBeNull();
      expect(Math.abs(arrowEndGap! - (cellHorizontalPadding + 1))).toBeLessThan(1);
    });

    test('vertically centers the arrow with the value under htMiddle', async() => {
      await grid.goto({ mode: 'tall', align: 'middle' });

      const { arrow, cell, content, lineHeight, paddingTop, hasClip } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();
      expect(content).not.toBeNull();
      expect(hasClip).toBe(false);
      expect(cell.height).toBeGreaterThan(lineHeight * 2);

      const cellCenterY = cell.top + (cell.height / 2);
      const arrowCenterY = arrow!.top + ((arrow!.bottom - arrow!.top) / 2);
      const contentCenterY = content!.top + ((content!.bottom - content!.top) / 2);

      // Fixture actually applied `htMiddle`: the value is in the middle, not on the first line.
      expect(contentCenterY).toBeGreaterThan(cell.top + paddingTop + lineHeight);
      expect(Math.abs(contentCenterY - cellCenterY)).toBeLessThan(lineHeight);
      // A fixed `top` from cell padding leaves the arrow near the first line (~8px); the float
      // used to sit with the value (~37px in a 90px cell).
      expect(Math.abs(arrowCenterY - contentCenterY)).toBeLessThan(6);
    });

    test('anchors the arrow with the value under htBottom', async() => {
      await grid.goto({ mode: 'tall', align: 'bottom' });

      const { arrow, cell, content, lineHeight, paddingTop, hasClip } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();
      expect(content).not.toBeNull();
      expect(hasClip).toBe(false);
      expect(cell.height).toBeGreaterThan(lineHeight * 2);

      const cellCenterY = cell.top + (cell.height / 2);
      const arrowCenterY = arrow!.top + ((arrow!.bottom - arrow!.top) / 2);
      const contentCenterY = content!.top + ((content!.bottom - content!.top) / 2);

      // Fixture actually applied `htBottom`: the value sits in the lower half, not the first line.
      expect(contentCenterY).toBeGreaterThan(cellCenterY);
      expect(content!.bottom).toBeGreaterThan(cell.top + paddingTop + lineHeight * 2);
      expect(Math.abs(arrowCenterY - contentCenterY)).toBeLessThan(6);
    });

    test('vertically centers the arrow with the value under htMiddle on an exact-height row', async() => {
      await grid.goto({ mode: 'tall', align: 'middle', rowHeightMode: 'exact' });

      const {
        arrow, cell, content, lineHeight, paddingTop, arrowEndGap, hasClip,
      } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();
      expect(content).not.toBeNull();
      expect(hasClip).toBe(true);
      expect(cell.height).toBeGreaterThan(lineHeight * 2);
      expect(arrowEndGap).not.toBeNull();
      expect(Math.abs(arrowEndGap! - 1)).toBeLessThan(1);

      const cellCenterY = cell.top + (cell.height / 2);
      const arrowCenterY = arrow!.top + ((arrow!.bottom - arrow!.top) / 2);
      const contentCenterY = content!.top + ((content!.bottom - content!.top) / 2);

      expect(contentCenterY).toBeGreaterThan(cell.top + paddingTop + lineHeight);
      expect(Math.abs(contentCenterY - cellCenterY)).toBeLessThan(lineHeight);
      expect(Math.abs(arrowCenterY - contentCenterY)).toBeLessThan(6);
    });

    test('anchors the arrow with the value under htBottom on an exact-height row', async() => {
      await grid.goto({ mode: 'tall', align: 'bottom', rowHeightMode: 'exact' });

      const {
        arrow, cell, content, lineHeight, paddingTop, arrowEndGap, hasClip,
      } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();
      expect(content).not.toBeNull();
      expect(hasClip).toBe(true);
      expect(cell.height).toBeGreaterThan(lineHeight * 2);
      expect(arrowEndGap).not.toBeNull();
      expect(Math.abs(arrowEndGap! - 1)).toBeLessThan(1);

      const cellCenterY = cell.top + (cell.height / 2);
      const arrowCenterY = arrow!.top + ((arrow!.bottom - arrow!.top) / 2);
      const contentCenterY = content!.top + ((content!.bottom - content!.top) / 2);

      expect(contentCenterY).toBeGreaterThan(cellCenterY);
      expect(content!.bottom).toBeGreaterThan(cell.top + paddingTop + lineHeight * 2);
      expect(Math.abs(arrowCenterY - contentCenterY)).toBeLessThan(6);
    });
  });
});
