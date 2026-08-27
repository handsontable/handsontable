import { test, expect } from '../fixtures/test';
import { AutocompleteAsyncSourcePage } from '../fixtures/pages/AutocompleteAsyncSourcePage';

const EDITORS = ['autocomplete', 'dropdown'] as const;

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
 * The guard is keyed on `close()`, which bumps a query generation, rather than on either state
 * flag. Neither flag describes a closed editor on its own: `state` stays `EDITING` when
 * `refreshDimensions()` closes an editor whose cell scrolled out of the rendered range, and
 * `_opened` stays false after that same cell scrolls back and the editor is shown again.
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

      const ownChoices = sorted(await grid.choicesFor(1));

      await expect.poll(() => grid.isDropdownShown()).toBe(true);
      await expect.poll(async() => sorted(await grid.dropdownChoices())).toEqual(ownChoices);

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      expect(sorted(await grid.dropdownChoices())).toEqual(ownChoices);
      expect(sorted(await grid.rawChoices() as string[])).toEqual(ownChoices);
      expect(await grid.isDropdownShown()).toBe(true);
    });
  });

  test.describe(`${editor} editor closed by scrolling its cell out of view`, () => {
    let grid: AutocompleteAsyncSourcePage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor, scenario: 'scroll' });
      await grid.goto();
    });

    test('ignores a source response that arrives after the scroll closed the editor', async() => {
      await grid.openEditor(0, 0);

      await grid.scrollToRow(60);

      // Pin the close AND the state it leaves behind before resolving anything. Without this the
      // case would pass whenever the scroll left row 0 rendered, having proved nothing - and the
      // `STATE_EDITING` half is the whole reason this case exists, since it is what a guard reading
      // `state` alone would wave through.
      await expect.poll(() => grid.isEditorOpen()).toBe(false);
      expect(await grid.editorState()).toBe('STATE_EDITING');
      expect(await grid.isDropdownShown()).toBe(false);

      const listenCountBeforeResponse = await grid.listenCount();

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      await expect.poll(() => grid.isDropdownShown()).toBe(false);
      expect(await grid.dropdownChoices()).toEqual([]);
      expect(await grid.listenCount()).toBe(listenCountBeforeResponse);
    });

    test('starts no new query when a timeout scheduled before the close fires after it', async() => {
      await grid.openEditor(0, 0);

      const queriesBefore = await grid.totalQueryCount();

      // Invalidating the query already in flight is not enough on its own. A `queryChoices()`
      // timeout scheduled in the 10-20 ms before the close still fires afterwards, and `state` is
      // `EDITING` by then, so it would start a FRESH query - current by every other measure - and
      // re-show the list over the closed editor once that one answered.
      await grid.scheduleQueryThenClose();

      expect(await grid.editorState()).toBe('STATE_EDITING');
      expect(await grid.isEditorOpen()).toBe(false);
      expect(await grid.totalQueryCount()).toBe(queriesBefore);

      await grid.resolveQueries(0);

      expect(await grid.isDropdownShown()).toBe(false);
      expect(await grid.dropdownChoices()).toEqual([]);
    });
  });
});
