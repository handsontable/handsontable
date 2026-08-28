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

    test('opens the editor when the arrow is pressed with the left button', async() => {
      await grid.arrow(0, 0).click();

      await expect.poll(() => grid.isEditorOpen()).toBe(true);
    });

    test('leaves the editor closed when the arrow is pressed with the right button', async() => {
      await grid.arrow(0, 0).click({ button: 'right' });

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

      expect(await grid.isEditorOpen()).toBe(false);
    });
  });
});
