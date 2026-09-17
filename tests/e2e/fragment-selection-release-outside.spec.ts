import { test, expect } from '../fixtures/test';
import { FragmentSelectionPage } from '../fixtures/pages/FragmentSelectionPage';

/**
 * `fragmentSelection` after a text drag that ends off the grid (DEV-130).
 *
 * The grid clears a text selection when a drag moves over something it will not let the user
 * select, such as a header. It tells a drag from a hover by a flag that `mousedown` sets and
 * `mouseup` clears. A button released off the grid never reaches the grid's own `mouseup` listener,
 * so the flag stayed set. The next hover over a header then looked like a drag and wiped the text
 * the user had just selected — with no button held at all.
 */
test.describe('fragmentSelection after a drag released off the grid', () => {
  let grid: FragmentSelectionPage;

  const HOVERS: { label: string, hover: (page: FragmentSelectionPage) => Promise<number> }[] = [
    { label: 'a row header', hover: page => page.hoverRowHeader(1) },
    { label: 'the column header row', hover: page => page.hoverColumnHeader() },
  ];

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FragmentSelectionPage(page, theme, bundle);
    await grid.goto();
  });

  for (const target of HOVERS) {
    test(`keeps the selected text when the pointer then hovers ${target.label}`, async () => {
      await grid.initGrid({ rowHeaders: true, colHeaders: true, fragmentSelection: true });
      await grid.clearTextSelection();

      await grid.dragFromCellOutOfGrid('master', 1, 0);

      // The drag has to leave a selection behind, or the hover below has nothing to lose and the
      // test passes without covering anything. The exact text varies with how far drag-to-scroll
      // moved the columns, so the hover is checked against whatever this is.
      const selected = await grid.selectedText();

      expect(selected.length).toBeGreaterThan(0);

      const headerMoves = await target.hover(grid);

      // Proves the pointer really reached a header. A hover that stopped over the cells would keep
      // the selection whether or not the bug is there.
      expect(headerMoves).toBeGreaterThan(0);
      expect(await grid.selectedText()).toEqual(selected);
    });
  }
});
