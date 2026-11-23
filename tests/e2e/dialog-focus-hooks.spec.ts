// leg-declarations: ignore computed-style -- the spec never calls the page object's geometry reads, only focus and hook logs
// leg-declarations: ignore css-token -- the spec never calls the page object's geometry reads, only focus and hook logs
// leg-declarations: ignore hit-test -- the spec never calls the page object's geometry reads, only focus and hook logs
import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { DialogStatesPage } from '../fixtures/pages/DialogStatesPage';

/**
 * The `dialogFocusNextElement` and `dialogFocusPreviousElement` hooks run once per Tab and Shift+Tab press,
 * after the browser handled the key, so a handler that reads `document.activeElement` sees the element the
 * press went to. They receive no arguments. They also run for the Tab that wraps from the dialog's last
 * tab stop back to its first (an open modal keeps the focus inside it, DEV-4009). Asserted on every engine,
 * because the hooks ride on the browser's own Tab move.
 *
 * The dialog's content holds a button and then two inputs. The walk presses only between the inputs:
 * Safari does not Tab to a button unless the user turned that on, so a native move onto the button would
 * measure the browser's setting, not Handsontable. The wrap from the last input goes to the first tab stop,
 * the button, which Handsontable focuses itself on every engine.
 */
test.describe('dialog focus hooks', { tag: CROSS_BROWSER_TAG }, () => {
  test('Tab and Shift+Tab inside the dialog run one hook each, with the focus already moved', async({
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

    // The Tab from the last stop wraps to the dialog's first stop, the "Close modal" button, and still runs
    // the hook, with the focus already there.
    await page.keyboard.press('Tab');
    await expect(dialogPage.button('Close modal')).toBeFocused();
    await expect.poll(() => dialogPage.focusHookLog()).toEqual([
      'next:dialog-input-2:0 args',
      'previous:dialog-input-1:0 args',
      'next:dialog-input-2:0 args',
      'next:BUTTON:0 args',
    ]);

    // The polled reads above are the positive control: nothing ran twice for the last press either.
    expect(await dialogPage.settledFocusHookLog()).toEqual([
      'next:dialog-input-2:0 args',
      'previous:dialog-input-1:0 args',
      'next:dialog-input-2:0 args',
      'next:BUTTON:0 args',
    ]);
  });
});
