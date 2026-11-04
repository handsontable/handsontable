import { test, expect, THEMES_TAG } from '../fixtures/test';
import { EditorContainerResizePage, type Box } from '../fixtures/pages/EditorContainerResizePage';

/**
 * An open editor must stay on its cell when the grid's own size changes. A grid sized in viewport
 * units shrinks when the soft keyboard of an Android WebView resizes the page, and the edited cell
 * at the bottom then left the rendered range while the editor stayed where it was, under the
 * keyboard. A stretched grid moves its columns on a narrower window, and the editor stayed at the
 * column's old position.
 *
 * The cases compare the editor's offset from its cell before and after the resize, so the fixed
 * offset a theme puts between the two cancels out.
 */
test.describe('editor on a grid that changes size', { tag: THEMES_TAG }, () => {
  let grid: EditorContainerResizePage;

  /**
   * A whole-pixel difference, with `-0` folded into `0` so a sub-pixel offset cannot fail a
   * `toEqual` that expects `0`.
   */
  const pixels = (value: number) => Math.round(value) + 0;

  /**
   * The offset of a box's top-start corner from the cell's.
   */
  const offset = (cell: Box, box: Box) => ({ dx: pixels(cell.left - box.left), dy: pixels(cell.top - box.top) });

  test.beforeEach(async({ page, theme, bundle }) => {
    await page.setViewportSize({ width: 900, height: 400 });
    grid = new EditorContainerResizePage(page, theme, bundle);
  });

  test('keeps the edited cell in view and the editor on it when the grid gets shorter', async() => {
    await grid.goto('height');
    await grid.openEditorAt(39, 11);
    await expect(grid.textarea).toBeFocused();
    await grid.page.keyboard.type('xyz');

    const before = await grid.editorState(39, 11);
    const offsetBefore = offset(before.cell!, before.anchor!);

    // Less than half the height: the edited last row falls out of the rendered range unless the
    // grid scrolls it back in.
    await grid.resizeViewport(900, 180);

    await expect.poll(async() => {
      const state = await grid.editorState(39, 11);

      return {
        opened: state.opened,
        focused: state.textareaFocused,
        value: state.value,
        offset: state.cell && state.anchor ? offset(state.cell, state.anchor) : null,
      };
    }).toEqual({ opened: true, focused: true, value: 'R40C12xyz', offset: offsetBefore });

    await grid.page.keyboard.press('Enter');

    expect(await grid.dataAt(39, 11)).toBe('R40C12xyz');
  });

  for (const editor of ['dropdown', 'select', 'multiselect'] as const) {
    test(`keeps the ${editor} editor open on its cell when the grid gets shorter`, async() => {
      await grid.goto('height', editor);
      await grid.openEditorAt(39, 11);

      const before = await grid.editorState(39, 11);
      const offsetBefore = before.anchor ? offset(before.cell!, before.anchor) : null;

      await grid.resizeViewport(900, 180);

      await expect.poll(async() => {
        const { opened, cell, anchor, popup } = await grid.editorState(39, 11);

        return {
          opened,
          offset: cell && anchor ? offset(cell, anchor) : null,
          // The select editor has no list; the others must still show theirs.
          hasPopup: popup !== null,
          // The list touches its cell, below or above it: which side has room is the theme's row
          // heights' call, so the side is not asserted.
          popupBesideCell: !popup || (cell !== null &&
            (Math.abs(popup.top - cell.bottom) <= 2 || Math.abs(popup.bottom - cell.top) <= 2)),
        };
      }).toEqual({ opened: true, offset: offsetBefore, hasPopup: editor !== 'select', popupBesideCell: true });
    });
  }

  test('moves the editor with its cell when stretched columns get narrower', async() => {
    await grid.goto('width');
    await grid.openEditorAt(9, 3);

    const before = await grid.editorState(9, 3);
    const offsetBefore = offset(before.cell!, before.anchor!);
    const extraWidthBefore = pixels(before.anchor!.width - before.cell!.width);

    await grid.resizeViewport(500, 400);

    await expect.poll(async() => {
      const { opened, textareaFocused, cell, anchor } = await grid.editorState(9, 3);

      return {
        opened,
        focused: textareaFocused,
        offset: cell && anchor ? offset(cell, anchor) : null,
        // The editor narrows with its column instead of keeping the old column's width.
        extraWidth: cell && anchor ? pixels(anchor.width - cell.width) : null,
      };
    }).toEqual({ opened: true, focused: true, offset: offsetBefore, extraWidth: extraWidthBefore });
  });

  test('places the select editor on its cell after a resize during a rejected validation', async() => {
    await grid.goto('height', 'select', 'async');
    await grid.openEditorAt(39, 11);

    const before = await grid.editorState(39, 11);
    const offsetBefore = offset(before.cell!, before.anchor!);

    // Confirming the edit parks the editor in the waiting state until the validator answers.
    await grid.page.keyboard.press('Enter');
    await expect.poll(() => grid.pendingValidations()).toBe(1);
    expect((await grid.editorState(39, 11)).state).toBe('STATE_WAITING');

    await grid.resizeViewport(900, 180);
    await grid.waitForFrames();
    await grid.settleValidation(false);

    // The rejected edit goes back to editing, and the editor sits on the cell the grid now shows.
    await expect.poll(async() => {
      const { opened, state, cell, anchor } = await grid.editorState(39, 11);

      return {
        opened,
        state,
        offset: cell && anchor ? offset(cell, anchor) : null,
      };
    }).toEqual({ opened: true, state: 'STATE_EDITING', offset: offsetBefore });
  });

  test('does not scroll the grid for an edit that waits for its validator, even after a sort', async() => {
    await grid.goto('height', 'text', 'async');
    await grid.openEditorAt(39, 11);
    await grid.page.keyboard.type('xyz');
    await grid.page.keyboard.press('Enter');
    await expect.poll(() => grid.pendingValidations()).toBe(1);

    // The sort moves the record of the edit off visual row 39, which the waiting editor still holds.
    // Looking at the top of the grid then puts the record out of the rendered range.
    const sortedRow = await grid.sortByFirstColumn(39);

    expect(sortedRow).toBeLessThan(39);

    await grid.scrollGridToTop();

    const scrollBefore = await grid.holderScroll();

    expect(scrollBefore.top).toBe(0);

    await grid.resizeViewport(900, 180);
    await grid.waitForFrames();

    expect(await grid.holderScroll()).toEqual(scrollBefore);

    // Positive control: the validator accepts the edit and the editor closes, so the wait was real.
    await grid.settleValidation(true);
    await expect.poll(async() => (await grid.editorState(39, 11)).opened).toBe(false);
  });

  test('places the editor after rendering resumes when the grid resized while it was suspended', async() => {
    await grid.goto('height');
    await grid.openEditorAt(39, 11);
    await grid.page.keyboard.type('xyz');

    const before = await grid.editorState(39, 11);
    const offsetBefore = offset(before.cell!, before.anchor!);

    await grid.suspendRender();
    await grid.resizeViewport(900, 180);
    await grid.waitForFrames();
    await grid.resumeRender();

    await expect.poll(async() => {
      const state = await grid.editorState(39, 11);

      return {
        opened: state.opened,
        focused: state.textareaFocused,
        value: state.value,
        offset: state.cell && state.anchor ? offset(state.cell, state.anchor) : null,
      };
    }).toEqual({ opened: true, focused: true, value: 'R40C12xyz', offset: offsetBefore });
  });

  test('does not scroll the grid on a resize while no editor is open', async() => {
    await grid.goto('height');
    await grid.openEditorAt(39, 11);
    await grid.page.keyboard.press('Escape');

    const scrollBefore = await grid.holderScroll();

    await grid.resizeViewport(900, 180);
    await grid.waitForFrames();

    // The selection stays on the last cell, which the shorter grid no longer renders: the grid
    // kept its scroll position.
    expect(await grid.holderScroll()).toEqual(scrollBefore);
    expect(await grid.isCellRendered(39, 11)).toBe(false);

    // Positive control: the same resize with the editor open does scroll the cell back in.
    await grid.resizeViewport(900, 400);
    await grid.openEditorAt(39, 11);
    await grid.resizeViewport(900, 180);

    await expect.poll(() => grid.isCellRendered(39, 11)).toBe(true);
  });

  test('does not scroll the grid when its size is refreshed but did not change', async() => {
    await grid.goto('height');
    await grid.openEditorAt(39, 11);
    // The edited cell stays rendered, a few pixels short of fully visible.
    await grid.scrollHolderUpBy(10);

    const scrollBefore = await grid.holderScroll();

    expect((await grid.editorState(39, 11)).opened).toBe(true);

    await grid.refreshDimensionsAtSameSize();
    await grid.waitForFrames();

    expect(await grid.holderScroll()).toEqual(scrollBefore);

    // Positive control: a refresh that does change the size scrolls the cell fully back in.
    await grid.resizeViewport(900, 390);

    await expect.poll(async() => (await grid.holderScroll()).top).toBeGreaterThan(scrollBefore.top);
  });
});
