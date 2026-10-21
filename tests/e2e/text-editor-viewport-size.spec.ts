import { test, expect, THEMES_TAG } from '../fixtures/test';
import { TextEditorViewportSizePage, type EditorViewportRead } from '../fixtures/pages/TextEditorViewportSizePage';

/**
 * What the open editor's size says about the viewport it must fit, computed from ONE read. A check that holds is
 * `true`; one that fails is a sentence with the measured numbers, so a failed poll prints them in its diff.
 *
 * @param {EditorViewportRead} read One read of the editor, its cell and the holder.
 */
function judge(read: EditorViewportRead) {
  // The editor starts 1px before its cell, over the grid line the previous cell draws on its inline-end side (this
  // cell draws no inline-start border of its own: it is not a borderless first column), so its width is the room
  // from the cell to the end of the viewport plus that pixel.
  const room = read.holderClientWidth - read.cellOffsetInHolder + 1;

  return {
    cellOffsetInHolder: read.cellOffsetInHolder,
    // The premise of the room calculation, asserted rather than assumed: an editor shifted further toward the
    // start with the right width would still end inside the viewport.
    startsOnePxBeforeTheCell: read.editorLeft === read.cellLeft - 1
      || `the editor starts at ${read.editorLeft}px, the cell at ${read.cellLeft}px`,
    widthIsTheRoomToTheViewportEnd: read.editorWidth === room
      || `the editor is ${read.editorWidth}px wide, the room from its cell to the end of the viewport is ${room}px`,
    endsInsideTheViewport: read.editorRight <= read.holderClientRight
      || `the editor ends at ${read.editorRight}px, the viewport ends at ${read.holderClientRight}px`,
  };
}

/**
 * The size of the text editor against the viewport of a small grid – migrated from the legacy textEditor case
 * "should be displayed and resized properly, so it doesn't exceed the viewport dimensions", a Jasmine case that
 * timed out (15 s) in 6 red runs in 30 days, every one of them passing alone.
 *
 * The grid is 300x200 with 40px columns, 20 spare rows and 20 spare columns, and a long text in cell (1, 1), so the
 * editor has more text than room. The theme decides the rows' height and the cells' padding and border, which feed
 * the editor's size, so every theme runs it.
 */
test.describe('text editor size against the viewport', { tag: THEMES_TAG }, () => {
  let grid: TextEditorViewportSizePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new TextEditorViewportSizePage(page, theme, bundle);
    await grid.goto();
  });

  // The user opens the editor with Enter on a cell that holds a long text: the editor grows to the end of the grid's
  // viewport and not past it. (The legacy case then called `scrollViewportTo({ col: 3 })`, which scrolls nothing in
  // this grid, and re-measured the same state; the next test is the one that really moves the viewport.)
  test('opens as wide as the room to the end of the viewport', async() => {
    await grid.openEditor(1, 1);

    await expect.poll(
      async() => judge(await grid.readEditorViewport(1, 1)),
      { message: 'the editor grew to the end of the viewport' }
    ).toEqual({
      // The cell sits where the fixture put it, 40px from the viewport's start, so nothing has scrolled.
      cellOffsetInHolder: 40,
      startsOnePxBeforeTheCell: true,
      widthIsTheRoomToTheViewportEnd: true,
      endsInsideTheViewport: true,
    });
  });

  // The application scrolls the viewport so that the edited column is the first one, with the editor open: the cell
  // moves 40px towards the viewport's start, and the editor grows by the same 40px, so it still ends where the
  // viewport ends and never past it.
  test('keeps ending at the end of the viewport when the viewport scrolls under the open editor', async() => {
    await grid.openEditor(1, 1);
    await grid.scrollColumnToViewportStart(1);

    await expect.poll(
      async() => judge(await grid.readEditorViewport(1, 1)),
      { message: 'the editor follows the scrolled cell and still ends at the end of the viewport' }
    ).toEqual({
      // The cell is now at the viewport's start edge.
      cellOffsetInHolder: 0,
      startsOnePxBeforeTheCell: true,
      widthIsTheRoomToTheViewportEnd: true,
      endsInsideTheViewport: true,
    });
  });
});
