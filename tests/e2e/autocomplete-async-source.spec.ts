import { test, expect } from '../fixtures/test';
import { AutocompleteAsyncSourcePage } from '../fixtures/pages/AutocompleteAsyncSourcePage';

const EDITORS = ['autocomplete', 'dropdown'] as const;

const CHOICES = {
  0: ['Alpha', 'Alfa', 'Alto'],
  1: ['Bravo', 'Bruno', 'Brisk'],
};

/**
 * Returns the list sorted, so a case pins WHICH choices are shown without also pinning the order
 * `updateChoicesList()` happens to produce for them.
 */
function sorted(values: string[]): string[] {
  return [...values].sort();
}

/**
 * DEV-2653. `AutocompleteEditor` asks a user-supplied `source` for its choices and, until this was
 * guarded, did nothing with the answer's timing. Two things made a late answer harmful rather than
 * inert: `HandsontableEditor.close()` only hides the nested grid, so the object stays alive and
 * willing to re-render, and `hot._registerTimeout()` has no cancel path, so the deferred
 * `queryChoices()` calls survive a close too. A response arriving after the editor closed re-showed
 * the suggestion list over a cell that was no longer being edited and called `hot.listen()`,
 * handing keyboard control back to the grid.
 *
 * The fixture's `source` answers only when a case tells it to, so "the answer arrives late" is
 * stated exactly instead of being raced against a timer.
 *
 * Both halves of the defect are asserted every time. `updateChoicesList()` sets `display` and calls
 * `hot.listen()` independently, so a case that checked only the dropdown would pass on a fix that
 * still stole focus.
 */
EDITORS.forEach((editor) => {
  test.describe(`${editor} editor with an asynchronous source`, () => {
    let grid: AutocompleteAsyncSourcePage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor });
      await grid.goto();
    });

    test('ignores a source response that arrives after Escape closed the editor', async() => {
      await grid.openEditor(0, 0);

      await grid.page.keyboard.press('Escape');

      await expect.poll(() => grid.isEditorOpen()).toBe(false);
      await expect.poll(() => grid.isDropdownShown()).toBe(false);

      await grid.clickOutsideInput();

      const listenCountBeforeResponse = await grid.listenCount();

      // A zero here would mean nothing was ever in flight and the case proved nothing.
      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      await expect.poll(() => grid.isDropdownShown()).toBe(false);
      expect(await grid.dropdownChoices()).toEqual([]);
      expect(await grid.listenCount()).toBe(listenCountBeforeResponse);
      expect(await grid.isGridListening()).toBe(false);
      expect(await grid.activeElementTestId()).toBe('outside-input');
    });

    test('ignores a source response that arrives after an outside click closed the editor', async() => {
      await grid.openEditor(0, 0);

      // A different close path from Escape: `DropdownEditor.finishEditing()` rewrites
      // `restoreOriginalValue` from the active range, which Escape never reaches.
      await grid.clickOutsideInput();

      await expect.poll(() => grid.isEditorOpen()).toBe(false);
      await expect.poll(() => grid.isDropdownShown()).toBe(false);

      const listenCountBeforeResponse = await grid.listenCount();

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      await expect.poll(() => grid.isDropdownShown()).toBe(false);
      expect(await grid.dropdownChoices()).toEqual([]);
      expect(await grid.listenCount()).toBe(listenCountBeforeResponse);
      expect(await grid.isGridListening()).toBe(false);
      expect(await grid.activeElementTestId()).toBe('outside-input');
    });

    test('ignores a source response from a previous edit after the editor reopened elsewhere', async() => {
      await grid.openEditor(0, 0);

      await grid.page.keyboard.press('Escape');

      await expect.poll(() => grid.isEditorOpen()).toBe(false);

      // The editor is a per-instance singleton, so this is the SAME object, now editing another
      // column and back in the `EDITING` state. A guard that only reads the state cannot tell the
      // stale response apart from the current one - the query generation is what does.
      await grid.openEditor(0, 1);

      expect(await grid.resolveQueries(1)).toBeGreaterThan(0);

      await expect.poll(() => grid.isDropdownShown()).toBe(true);
      await expect.poll(async() => sorted(await grid.dropdownChoices())).toEqual(sorted(CHOICES[1]));

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      expect(sorted(await grid.dropdownChoices())).toEqual(sorted(CHOICES[1]));
      expect(sorted(await grid.rawChoices() as string[])).toEqual(sorted(CHOICES[1]));
      expect(await grid.isDropdownShown()).toBe(true);
    });
  });
});
