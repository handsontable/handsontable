// leg-declarations: ignore computed-style -- the spec never calls the page object's geometry reads, only focus and hook logs
// leg-declarations: ignore css-token -- the spec never calls the page object's geometry reads, only focus and hook logs
// leg-declarations: ignore hit-test -- the spec never calls the page object's geometry reads, only focus and hook logs
import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { DialogStatesPage } from '../fixtures/pages/DialogStatesPage';

/**
 * The `dialogFocusNextElement` and `dialogFocusPreviousElement` hooks run once per Tab and Shift+Tab press,
 * after the browser handled the key, so a handler that reads `document.activeElement` sees the element the
 * press went to. They receive no arguments. They also run for the Tab that leaves the dialog. Asserted on
 * every engine, because the hooks ride on the browser's own Tab move.
 *
 * The dialog's content holds two inputs and a button. Only the inputs are used: Safari does not Tab to a
 * button unless the user turned that on, so a button in the walk would measure the browser's setting, not
 * Handsontable.
 */
test.describe('dialog focus hooks', { tag: CROSS_BROWSER_TAG }, () => {
  test('Tab and Shift+Tab around the dialog run one hook each, with the focus already moved', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);
    const input1 = dialogPage.dialogControl('dialog-input-1');
    const input2 = dialogPage.dialogControl('dialog-input-2');

    await dialogPage.goto({ focus: true });
    await dialogPage.recordFocusHooks();

    await input1.click();
    await expect(input1).toBeFocused();
    await expect.poll(() => dialogPage.activeShortcutContext()).toBe('plugin:dialog');

    await page.keyboard.press('Tab');
    await expect(input2).toBeFocused();
    await expect.poll(() => dialogPage.focusHookLog()).toEqual(['next:dialog-input-2:0 args']);

    await page.keyboard.press('Shift+Tab');
    await expect(input1).toBeFocused();
    await expect.poll(() => dialogPage.focusHookLog()).toEqual([
      'next:dialog-input-2:0 args',
      'previous:dialog-input-1:0 args',
    ]);

    await page.keyboard.press('Tab');
    await expect(input2).toBeFocused();
    await expect.poll(() => dialogPage.focusHookLog()).toEqual([
      'next:dialog-input-2:0 args',
      'previous:dialog-input-1:0 args',
      'next:dialog-input-2:0 args',
    ]);

    // The Tab that leaves the dialog still runs the hook, with the focus on the page's input after the grid.
    await page.keyboard.press('Tab');
    await expect(dialogPage.inputAfter).toBeFocused();
    await expect.poll(() => dialogPage.focusHookLog()).toEqual([
      'next:dialog-input-2:0 args',
      'previous:dialog-input-1:0 args',
      'next:dialog-input-2:0 args',
      'next:input-after:0 args',
    ]);

    // The polled reads above are the positive control: nothing ran twice for the last press either.
    expect(await dialogPage.settledFocusHookLog()).toEqual([
      'next:dialog-input-2:0 args',
      'previous:dialog-input-1:0 args',
      'next:dialog-input-2:0 args',
      'next:input-after:0 args',
    ]);
  });
});
