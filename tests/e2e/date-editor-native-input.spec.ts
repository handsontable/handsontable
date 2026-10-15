import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * The date editor on the shared `/` grid's short `en-US` date column: Enter opens a native
 * `<input type="date">` on the cell's ISO date, a double-click also asks the browser for its picker, a date
 * entered into the input is committed and rendered in the column's format, and a date left incomplete keeps
 * the cell's date. The input reports an empty value for an incomplete date, which the editor committed and erased the
 * cell with until #13794.
 *
 * The `editors/dateEditor/manually-value-edit` visual spec was meant to check a value edited by hand.
 * It pressed Backspace in the open editor and captured, on every js variant and the three wrappers; but
 * the editor opened with the picker shown, the picker took the keys, and the capture showed the picker
 * over the unchanged value. The picker's look is `js-only/complex-demo/rtl/open-date-editor`'s (the
 * color scheme is what themes it), so DEV-3351 retired that spec and asserts the editor here.
 *
 * Chromium only (no `@cross-browser` tag): the picker's `:open` state is read there.
 */
test.describe('the native date editor', { tag: THEMES_TAG }, () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('opens a native date input on the cell\'s ISO date, without the picker', async() => {
    const iso = await grid.sourceAt(1, 2);

    await grid.openEditor(1, 2);

    await expect(grid.editorInput).toHaveAttribute('type', 'date');
    await expect(grid.editorInput).toBeFocused();
    expect((await grid.editorState()).value).toBe(iso);
    // `:open` holds while the browser shows the input's picker. A keyboard open leaves it closed.
    expect(await grid.editorInput.evaluate(input => input.matches(':open'))).toBe(false);
  });

  test('asks the browser for its picker when a double-click opens the editor', async() => {
    await grid.cell(1, 2).dblclick();

    await expect(grid.editorInput).toBeFocused();
    await expect.poll(() => grid.editorInput.evaluate(input => input.matches(':open'))).toBe(true);
  });

  test('commits a date entered into the input and renders it in the column\'s format', async({ page }) => {
    await grid.openEditor(1, 2);

    await grid.editorInput.fill('2021-06-15');
    await page.keyboard.press('Enter');

    expect((await grid.editorState()).opened).toBe(false);
    expect(await grid.sourceAt(1, 2)).toBe('2021-06-15');
    // The rendered text is read from the DOM, which the commit's render may reach a frame later.
    await expect.poll(() => grid.shownAt(1, 2)).toBe('6/15/21');
  });

  test('keeps the cell\'s date when Enter commits a date left incomplete', async({ page }) => {
    const iso = await grid.sourceAt(1, 2);

    await grid.openEditor(1, 2);

    // Backspace clears one segment of the date, so the input reports an empty value.
    await page.keyboard.press('Backspace');

    expect((await grid.editorState()).value).toBe('');

    await page.keyboard.press('Enter');

    expect((await grid.editorState()).opened).toBe(false);
    expect(await grid.sourceAt(1, 2)).toBe(iso);
  });
});
