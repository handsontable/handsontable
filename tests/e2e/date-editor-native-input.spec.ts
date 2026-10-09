import { test, expect } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * The date editor on the shared `/` grid's short `en-US` date column: Enter opens a native
 * `<input type="date">` on the cell's ISO date and asks the browser for its picker, and a date entered
 * into the input is committed and rendered in the column's format.
 *
 * The `editors/dateEditor/manually-value-edit` visual spec was meant to check a value edited by hand.
 * It pressed Backspace in the open editor and captured, on every js variant and the three wrappers; but
 * the editor opens with the picker shown, the picker takes the keys, and the capture showed the picker
 * over the unchanged value. The picker's look is `js-only/complex-demo/rtl/open-date-editor`'s (the
 * color scheme is what themes it), so DEV-3351 retired that spec and asserts the editor here.
 *
 * Chromium only (no `@cross-browser` tag): the picker's keyboard is the engine's own. In Chromium,
 * Escape closes the picker and leaves the editor open; in Firefox and WebKit it closes the editor.
 */
test.describe('the native date editor', () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('opens a native date input on the cell\'s ISO date and asks the browser for its picker', async() => {
    const iso = await grid.sourceAt(1, 2);

    await grid.openEditor(1, 2);

    await expect(grid.editorInput).toHaveAttribute('type', 'date');
    await expect(grid.editorInput).toBeFocused();
    expect((await grid.editorState()).value).toBe(iso);
    // `:open` holds while the browser shows the input's picker (Chromium 151, as the RTL date capture
    // relies on), so this is the `showPicker()` call the editor makes when it opens.
    expect(await grid.editorInput.evaluate(input => input.matches(':open'))).toBe(true);
  });

  test('commits a date entered into the input and renders it in the column\'s format', async({ page }) => {
    await grid.openEditor(1, 2);

    // The picker holds the keyboard while it is shown; Escape closes it and leaves the editor open.
    await page.keyboard.press('Escape');

    expect(await grid.editorInput.evaluate(input => input.matches(':open'))).toBe(false);
    expect((await grid.editorState()).opened).toBe(true);

    await grid.editorInput.fill('2021-06-15');
    await page.keyboard.press('Enter');

    expect((await grid.editorState()).opened).toBe(false);
    expect(await grid.sourceAt(1, 2)).toBe('2021-06-15');
    expect(await grid.shownAt(1, 2)).toBe('6/15/21');
  });

  // eslint-disable-next-line no-restricted-syntax -- DEV-3355: the editor commits the empty value a native date input reports for an incomplete date, erasing the cell
  test.fixme('keeps the cell\'s date when Enter commits a date left incomplete', async({ page }) => {
    const iso = await grid.sourceAt(1, 2);

    await grid.openEditor(1, 2);
    await page.keyboard.press('Escape');

    // Backspace clears one segment of the date, so the input reports an empty value.
    await page.keyboard.press('Backspace');

    expect((await grid.editorState()).value).toBe('');

    await page.keyboard.press('Enter');

    expect(await grid.sourceAt(1, 2)).toBe(iso);
  });
});
