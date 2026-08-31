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
 * The fix keys on `close()` rather than on either state flag, because neither describes a closed
 * editor on its own: `state` stays `EDITING` when `refreshDimensions()` closes an editor whose cell
 * scrolled out of the rendered range, and `_opened` stays false after that same cell scrolls back
 * and the editor is shown again. `close()` cancels the queries the editor deferred and ends the
 * edit session that its `source` callbacks were issued under.
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

      // Count the EDITOR's queries, not every query: `autocompleteValidator` calls the same user
      // `source` on the strict save path, so a bare "something was in flight" guard can be met by
      // the validator alone and prove nothing about the editor.
      expect(await grid.editorQueryCount(0)).toBe(1);
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

      expect(await grid.editorQueryCount(0)).toBe(1);
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

  /**
   * The guard has to tell "the edit ended" apart from "the edit is busy". `WAITING` is busy: an
   * async validator is running, `close()` has not been called, so `beforeKeyDown` is still hooked
   * and keystrokes still schedule queries. Under `allowInvalid: false` the editor then goes back to
   * `EDITING` rather than closing. Rejecting those queries would stop the list refreshing for the
   * length of every validation, which `develop` did not do.
   */
  test.describe(`${editor} editor with an async validator in flight`, () => {
    let grid: AutocompleteAsyncSourcePage;

    test.beforeEach(async({ page, theme, bundle }) => {
      // `ordering` tags each answer with the index of the query it belongs to. Without that the
      // second response is byte-identical to the first, the list never visibly changes, and the
      // callback-guard half of this case would pass on the stale list.
      grid = new AutocompleteAsyncSourcePage(page, theme, bundle, {
        editor,
        validator: 'slowAsync',
        scenario: 'ordering',
      });
      await grid.goto();
    });

    test('still refreshes the list while the editor waits on validation', async() => {
      await grid.openEditor(0, 0);

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);
      await expect.poll(() => grid.isDropdownShown()).toBe(true);

      // Commit without settling the validator: the editor parks in `WAITING`, still open.
      await grid.page.keyboard.press('Enter');
      await expect.poll(() => grid.editorState()).toBe('STATE_WAITING');
      expect(await grid.isEditorOpen()).toBe(true);

      await grid.scheduleAnotherQuery();

      // The query has to reach the `source` at all - that is the half the entry guard decides.
      const states = await grid.queryStates(0);

      expect(states.filter(state => state === 'STATE_WAITING').length).toBeGreaterThan(0);

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      // And its answer has to REPLACE what the first one rendered - that is the half the callback
      // guard decides, and only the tag can tell the two responses apart.
      const secondAnswer = sorted((await grid.choicesFor(0)).map(choice => `${choice}-q1`));

      await expect.poll(() => grid.isDropdownShown()).toBe(true);
      await expect.poll(async() => sorted(await grid.dropdownChoices())).toEqual(secondAnswer);

      await grid.settleValidation();
    });

    test('ignores a response from the validation window once the editor finally closes', async() => {
      await grid.openEditor(0, 0);

      await grid.page.keyboard.press('Enter');
      await expect.poll(() => grid.editorState()).toBe('STATE_WAITING');

      await grid.scheduleAnotherQuery();
      await grid.settleValidation();

      // A rejected value under `allowInvalid: false` keeps the editor open, so close it for real.
      await grid.page.keyboard.press('Escape');
      await expect.poll(() => grid.isEditorOpen()).toBe(false);
      await expect.poll(() => grid.isDropdownShown()).toBe(false);

      await grid.clickOutsideInput();

      const listenCountBeforeResponse = await grid.listenCount();

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      await expect.poll(() => grid.isDropdownShown()).toBe(false);
      expect(await grid.listenCount()).toBe(listenCountBeforeResponse);
    });
  });

  /**
   * `queryChoices()` ships in the type declarations, and the changelog now states that it no-ops
   * while no edit is in progress. With deferred queries cancelled on close, no internal caller can
   * reach it outside an edit, so this contract is the entry guard's only remaining job - and
   * removing that guard leaves every other case in this file green.
   */
  test.describe(`${editor} editor asked for choices with no edit in progress`, () => {
    test('does not reach the source', async({ page, theme, bundle }) => {
      const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor });

      await grid.goto();
      await grid.openEditor(0, 0);

      await grid.page.keyboard.press('Escape');

      await expect.poll(() => grid.isEditorOpen()).toBe(false);
      expect(await grid.editorState()).toBe('STATE_VIRGIN');

      expect(await grid.callQueryChoicesDirectly()).toBe(0);
    });
  });

  /**
   * The choices response is not the only thing that outlives a close. `#focusDebounced` is armed by
   * the inner grid's `afterScroll` and runs 100 ms later, outside `hot.timeouts` entirely, and
   * `hideEditableElement()` only sets `opacity: 0` - so its `focus()` puts the caret back into a
   * closed editor. Same symptom as the reported defect, different route, so the changelog's claim
   * depends on this one too.
   */
  test.describe(`${editor} editor closed just after its list scrolled`, () => {
    test('does not refocus itself after the close', async({ page, theme, bundle }) => {
      const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor });

      await grid.goto();
      await grid.openEditor(0, 0);

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);
      await expect.poll(() => grid.isDropdownShown()).toBe(true);

      await grid.armRefocusThenClose();

      expect(await grid.isEditorOpen()).toBe(false);
      expect(await grid.refocusCountAfterClose()).toBe(0);
    });
  });

  /**
   * The guide tells people to answer late, and in a single-page app the usual way that happens is
   * that the grid is gone. `Core#destroy()` never closes the active editor, so neither token moves
   * and only the destroyed check stops the response from reaching a torn-down `htEditor`.
   */
  test.describe(`${editor} editor destroyed with a query in flight`, () => {
    test('swallows a source response that arrives after the grid was destroyed', async({ page, theme, bundle }) => {
      const errors: string[] = [];

      page.on('pageerror', error => errors.push(error.message));

      const grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor });

      await grid.goto();
      await grid.openEditor(0, 0);

      expect(await grid.editorQueryCount(0)).toBe(1);

      await grid.destroyGrid();

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);
      expect(errors).toEqual([]);
    });
  });

  /**
   * `#queryGeneration` exists for two queries inside ONE edit session, where `#editSession` never
   * moves and cannot decide anything. Without a case like this the counter can be deleted and every
   * other test still passes.
   */
  test.describe(`${editor} editor with two overlapping queries in one edit`, () => {
    let grid: AutocompleteAsyncSourcePage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new AutocompleteAsyncSourcePage(page, theme, bundle, { editor, scenario: 'ordering' });
      await grid.goto();
    });

    test('keeps the newest answer when an older one arrives after it', async() => {
      await grid.openEditor(0, 0);
      await grid.scheduleAnotherQuery();

      // Two queries, same edit, neither answered yet.
      expect(await grid.queryStates(0)).toEqual(['STATE_EDITING', 'STATE_EDITING']);
      expect(await grid.pendingQueryCount(0)).toBe(2);

      // Newest first, then the straggler. Each answer is tagged with its query's index, so the
      // rendered list names which one won.
      expect(await grid.resolveQueryAt(1)).toBe(true);
      await expect.poll(async() => sorted(await grid.dropdownChoices()))
        .toEqual(sorted((await grid.choicesFor(0)).map(choice => `${choice}-q1`)));

      expect(await grid.resolveQueryAt(0)).toBe(true);

      expect(sorted(await grid.dropdownChoices()))
        .toEqual(sorted((await grid.choicesFor(0)).map(choice => `${choice}-q1`)));
      expect(sorted(await grid.rawChoices() as string[]))
        .toEqual(sorted((await grid.choicesFor(0)).map(choice => `${choice}-q1`)));
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

      // Hand keyboard control away before reading the baseline. `Core#listen()` runs `afterListen`
      // only on a not-listening to listening transition, and a scroll never unlistens, so without
      // this the count is pinned and the focus half of the assertion could not fail.
      await grid.clickOutsideInput();

      const listenCountBeforeResponse = await grid.listenCount();

      expect(await grid.editorQueryCount(0)).toBe(1);
      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      await expect.poll(() => grid.isDropdownShown()).toBe(false);
      expect(await grid.dropdownChoices()).toEqual([]);
      expect(await grid.listenCount()).toBe(listenCountBeforeResponse);
      expect(await grid.isGridListening()).toBe(false);
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

      expect(await grid.resolveQueries(0)).toBeGreaterThan(0);

      expect(await grid.isDropdownShown()).toBe(false);
      expect(await grid.dropdownChoices()).toEqual([]);
    });
  });
});
