import { test, expect } from '../fixtures/test';
import { DropdownScrollRoundTripPage } from '../fixtures/pages/DropdownScrollRoundTripPage';

/**
 * DEV-26: with a fixed container `height`, opening a layered editor (dropdown / autocomplete) and
 * scrolling the edited cell out of the rendered range then back left the editor "half open" — the
 * textarea returned but the dropdown list stayed hidden and could no longer populate, while the cell
 * was still in edit mode.
 *
 * Root cause: `TextEditor#refreshDimensions()` reused the destructive `close()` as "hide for now"
 * when `getEditedCell()` returned null, and the scroll-back path restored only the textarea. The fix
 * separates a transient scroll-hide from `close()` and re-shows the list on scroll-back.
 *
 * The scroll-out step waits until the edited cell genuinely leaves the rendered range
 * (`editedCellRendered() === false`); a grid tall enough to keep the cell rendered would fail there
 * rather than pass a vacuous "list still visible" afterwards.
 */
test.describe('layered editor — scroll round-trip (DEV-26)', () => {
  let grid: DropdownScrollRoundTripPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DropdownScrollRoundTripPage(page, theme, bundle);
    await grid.goto();
  });

  test('dropdown list returns, populated and navigable, after a scroll round-trip', async () => {
    await grid.openEditor(2, 1);
    await expect(grid.options().first()).toBeVisible();
    // The list is virtualized, so the rendered option count is a theme-dependent baseline (some
    // options may be scrolled out of the short list). Capture it and require it to return in full.
    const renderedOptions = await grid.options().count();

    expect(renderedOptions).toBeGreaterThan(0);
    expect(await grid.listDisplayed()).toBe(true);

    // Scroll the edited cell out of the rendered range — the reproduction's precondition. The edit
    // stays alive (state EDITING); only the UI is hidden.
    await grid.scrollToBottom();
    expect(await grid.editedCellRendered()).toBe(false);
    expect(await grid.editorState()).toBe('STATE_EDITING');

    // Back into view: before the fix the list stayed hidden here.
    await grid.scrollToTop();
    expect(await grid.listDisplayed()).toBe(true);
    await expect(grid.options()).toHaveCount(renderedOptions);
    await expect(grid.optionByText('Alpha')).toBeVisible();

    // The whole editor layer must be back, not just the list's `display`. `isOpened()` must read true
    // again (a false value there makes the next data change reset the live edit via `applyChanges()`),
    // and the holder must be opaque (a regression that leaves it at `opacity: 0` hides everything while
    // `listDisplayed()` still passes).
    expect(await grid.isEditorOpen()).toBe(true);
    expect(await grid.holderOpacity()).toBe('1');

    // The inner grid and the editor's ArrowDown shortcut group survived the round trip.
    await grid.pressArrowDown();
    await expect.poll(() => grid.innerSelectedRow()).toBe(0);
  });

  test('autocomplete list returns and re-queries on keystroke after a scroll round-trip', async () => {
    await grid.openEditor(2, 2);
    await expect(grid.options().first()).toBeVisible();
    const renderedOptions = await grid.options().count();

    expect(renderedOptions).toBeGreaterThan(0);

    await grid.scrollToBottom();
    expect(await grid.editedCellRendered()).toBe(false);
    expect(await grid.editorState()).toBe('STATE_EDITING');

    await grid.scrollToTop();
    expect(await grid.listDisplayed()).toBe(true);
    await expect(grid.options()).toHaveCount(renderedOptions);

    // Typing must still filter the list, proof the `beforeKeyDown` requery hook survived the round
    // trip (it did not before the fix, because `close()` unhooked it). `Al` matches Alpha / Alfa /
    // Alto only.
    await grid.focusEditor();
    await grid.type('Al');
    await expect(grid.options()).toHaveCount(3);
    await expect(grid.optionByText('Bravo')).toHaveCount(0);
  });

  test('plain text editor round-trip is unchanged (negative control)', async () => {
    await grid.openEditor(2, 0);
    await grid.focusEditor();
    await grid.type('X');
    expect(await grid.editorValue()).toBe('Row 2X');

    await grid.scrollToBottom();
    expect(await grid.editedCellRendered()).toBe(false);

    await grid.scrollToTop();
    // The inline editor already survived a scroll round trip; assert the seam did not regress it.
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.editorValue()).toBe('Row 2X');
  });
});
