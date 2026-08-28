import { test, expect } from '../fixtures/test';
import { AutocompleteAsyncSourcePage } from '../fixtures/pages/AutocompleteAsyncSourcePage';

const EDITORS = ['autocomplete', 'dropdown'] as const;

/**
 * DEV-2677. `autocompleteRenderer` registers a `mousedown` listener that opens the editor when the
 * press lands on a cell's dropdown arrow. It tested only the target's class and never the mouse
 * button, so a right-click on the arrow opened the editor - on a grid with a context menu, that
 * handed the user the editor and the menu at once. Walkontable restricts its own
 * double-click-to-open path to the left button; this path now does the same.
 *
 * Both halves are asserted every time. A case that only checked the right button would pass on a
 * "fix" that deleted the affordance, and opening the list from its arrow is behavior users have
 * relied on for a decade.
 *
 * The negative case anchors on the selection rather than polling for the editor to stay closed:
 * `expect.poll` retries until its condition holds, so it would report success on an editor that
 * opened one tick later. A right-button press selects the cell, so waiting for the selection to
 * land gives a deterministic point at which a single, non-retrying assertion is meaningful.
 */
EDITORS.forEach((editor) => {
  test.describe(`${editor} editor dropdown arrow`, () => {
    let grid: AutocompleteAsyncSourcePage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor });
      await grid.goto();
    });

    // Cell (1, 1) rather than (0, 0), and the editor's own coordinates rather than just "an editor
    // is open". To be clear about what that does and does not cover: the renderer builds its arrow
    // listener once and closes over the FIRST rendered cell's coordinates, and no assertion here
    // can catch that today - the pair reaches only `isCell()`, and `prepareEditor()` takes the
    // edited cell from the live selection, so the editor's coordinates and `getSelected()` are the
    // same state. Clicking a cell that is not the first one, and reading the coordinates the editor
    // was actually prepared with, is what would surface it if a later change starts honoring the
    // coordinates the listener passes. It does catch an editor reused without a re-`prepare()`.
    test('opens the editor when the arrow is pressed with the left button', async() => {
      await grid.arrow(1, 1).click();

      await expect.poll(() => grid.isEditorOpen()).toBe(true);
      expect(await grid.editorCoords()).toEqual([1, 1]);
    });

    test('leaves the editor closed when the arrow is pressed with the right button', async() => {
      await grid.arrow(0, 0).click({ button: 'right' });

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

      expect(await grid.isEditorOpen()).toBe(false);
    });
  });
});
