import { test, expect } from '../fixtures/test';
import { FragmentSelectionPage } from '../fixtures/pages/FragmentSelectionPage';

/**
 * `fragmentSelection` after a text drag that ends off the grid (DEV-130).
 *
 * The grid clears a text selection when a drag moves over something it will not let the user
 * select, such as a header. It tells a drag from a hover by a flag that `mousedown` sets and
 * `mouseup` clears. A button released off the grid never reaches the grid's own `mouseup` listener,
 * so the flag stayed set. The next hover over a header then looked like a drag and wiped the text
 * the user had just selected – with no button held at all.
 */
test.describe('fragmentSelection after a drag released off the grid', () => {
  let grid: FragmentSelectionPage;

  const HOVERS: { label: string, hover: () => Promise<number> }[] = [
    { label: 'a row header', hover: () => grid.hoverRowHeader(1) },
    { label: 'the column header row', hover: () => grid.hoverColumnHeader() },
  ];

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FragmentSelectionPage(page, theme, bundle);
    await grid.goto();
  });

  for (const target of HOVERS) {
    test(`keeps the selected text when the pointer then hovers ${target.label}`, async () => {
      // Two stretched columns and an auto height leave the grid nothing to scroll. A drag past the
      // edge of a scrollable grid scrolls it, the scroll redraws the cells, and a redraw moves the
      // selection's ends, so the text read before the hover would stop matching the text after it.
      await grid.initGrid({
        rowHeaders: true,
        colHeaders: true,
        fragmentSelection: true,
        maxCols: 2,
        stretchH: 'all',
        height: 'auto',
      });
      await grid.clearTextSelection();

      const releasedOffGrid = await grid.dragFromCellOutOfGrid(1, 0);

      // Without these, the hover below could pass while covering nothing: a release on the grid
      // clears the flag the normal way, and a drag that selected nothing has nothing to lose.
      expect(releasedOffGrid).toBe(true);
      expect(await grid.scrollPosition()).toEqual({ left: 0, top: 0 });

      const selected = await grid.selectedText();

      // The drag starts in cell 1,0 and leaves through the right edge, so it crosses cell 1,1.
      expect(selected).toContain('R1C1');

      const headerMoves = await target.hover();

      // Proves the pointer really reached a header. A hover that stopped over the cells would keep
      // the selection whether or not the bug is there.
      expect(headerMoves).toBeGreaterThan(0);
      expect(await grid.selectedText()).toEqual(selected);
    });
  }
});
