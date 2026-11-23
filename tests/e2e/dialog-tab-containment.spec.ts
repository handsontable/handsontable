// leg-declarations: ignore computed-style -- the spec never calls the page objects' geometry reads, only focus and hook logs
// leg-declarations: ignore css-token -- the spec never calls the page objects' geometry reads, only focus and hook logs
// leg-declarations: ignore hit-test -- the spec never calls the page objects' geometry reads, only focus and hook logs
import { type Page } from '@playwright/test';
import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { DialogStatesPage } from '../fixtures/pages/DialogStatesPage';
import { LoadingStatesPage } from '../fixtures/pages/LoadingStatesPage';

/**
 * An open modal dialog keeps Tab and Shift+Tab inside it (WCAG 2.4.3, DEV-4009): a press that would leave the
 * dialog wraps to its other end, a press from a non-focusable spot inside it goes to the end the key points at,
 * and a closable dialog with no tab stop keeps the focus on itself. A dialog that offers the keyboard no exit
 * (no tab stop and not closable, such as the loading screen) lets the focus leave, or it would trap it
 * (WCAG 2.1.2). The containment holds only while the dialog holds
 * the keyboard: a page element the user clicked Tabs on natively, and Tab from the page still enters the
 * dialog at its first stop.
 *
 * Safari skips buttons on Tab unless the user turned that on (DEV-1118), and Playwright's WebKit does the same,
 * so the steps that rely on the browser's own move between two buttons leave WebKit out; the wraps are
 * programmatic and run on every engine.
 */

/**
 * Waits two animation frames, so a focus move queued by the last key press has landed.
 *
 * @param {Page} page The page.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test.describe('dialog Tab containment', { tag: CROSS_BROWSER_TAG }, () => {
  test('Tab and Shift+Tab wrap between the two buttons of a confirm dialog', async({ page, theme, bundle }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);
    const cancel = dialogPage.button('Cancel');
    const ok = dialogPage.button('OK');

    await dialogPage.goto();
    await dialogPage.showConfirm();
    // A click on the title gives the grid the keyboard without pressing a button; Shift+Tab from there goes
    // to the last stop.
    await dialogPage.title.click();
    await expect.poll(() => dialogPage.activeShortcutContext()).toBe('plugin:dialog');
    await page.keyboard.press('Shift+Tab');
    await expect(ok).toBeFocused();

    // OK is the last stop, so Tab wraps to Cancel, and Cancel is the first, so Shift+Tab wraps to OK.
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(ok).toBeFocused();
    await settle(page);
    await expect(ok).toBeFocused();
    await expect(dialogPage.inputAfter).not.toBeFocused();
    await expect(dialogPage.inputBefore).not.toBeFocused();
  });

  test('a dialog holding two inputs wraps between them, and each press runs its hook once', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);
    const input1 = dialogPage.dialogControl('dialog-input-1');
    const input2 = dialogPage.dialogControl('dialog-input-2');

    await dialogPage.goto();
    await dialogPage.showControls([
      { tag: 'input', testId: 'dialog-input-1' },
      { tag: 'input', testId: 'dialog-input-2' },
    ]);
    await input2.click();
    await expect(input2).toBeFocused();
    await expect.poll(() => dialogPage.activeShortcutContext()).toBe('plugin:dialog');
    await dialogPage.recordFocusHooks();

    await page.keyboard.press('Tab');
    await expect(input1).toBeFocused();
    await expect.poll(() => dialogPage.focusHookLog()).toEqual(['next:dialog-input-1:0 args']);

    await page.keyboard.press('Shift+Tab');
    await expect(input2).toBeFocused();
    await expect.poll(() => dialogPage.focusHookLog()).toEqual([
      'next:dialog-input-1:0 args',
      'previous:dialog-input-2:0 args',
    ]);

    expect(await dialogPage.settledFocusHookLog()).toEqual([
      'next:dialog-input-1:0 args',
      'previous:dialog-input-2:0 args',
    ]);
  });

  test('the loading screen, with nothing to focus and no Escape exit, lets Shift+Tab leave it', async({
    page, theme, bundle,
  }) => {
    const loadingPage = new LoadingStatesPage(page, theme, bundle);

    await loadingPage.goto();

    await page.keyboard.press('Tab');
    await expect(loadingPage.inputBefore).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(loadingPage.overlay).toBeFocused();
    expect(await loadingPage.activeShortcutContext()).toBe('plugin:dialog');

    // Holding the focus here would trap the keyboard away from the whole page (WCAG 2.1.2), so the press
    // stays native and leaves the overlay.
    await page.keyboard.press('Shift+Tab');
    await expect(loadingPage.inputBefore).toBeFocused();
  });

  test('a closable dialog with nothing to focus keeps the focus on itself, and Escape is its exit', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    await dialogPage.goto();
    await dialogPage.showControls([], { closable: true });
    await dialogPage.dialog.click();
    await expect.poll(() => dialogPage.activeShortcutContext()).toBe('plugin:dialog');
    expect(await dialogPage.settledFocusIsInsideDialog()).toBe(true);

    await page.keyboard.press('Tab');
    await expect(dialogPage.dialog).toBeFocused();
    expect(await dialogPage.settledFocusIsInsideDialog()).toBe(true);

    await page.keyboard.press('Shift+Tab');
    await expect(dialogPage.dialog).toBeFocused();
    expect(await dialogPage.settledFocusIsInsideDialog()).toBe(true);
    await expect(dialogPage.inputBefore).not.toBeFocused();
    await expect(dialogPage.inputAfter).not.toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialogPage.dialog).toBeHidden();
  });

  test('Tab after a click on the dialog title goes to the first tab stop', async({ page, theme, bundle }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    await dialogPage.goto({ template: 'confirm' });
    await dialogPage.title.click();
    await expect.poll(() => dialogPage.activeShortcutContext()).toBe('plugin:dialog');

    await page.keyboard.press('Tab');
    await expect(dialogPage.button('Cancel')).toBeFocused();
  });

  test('Tab from a page input the user clicked while the dialog is open moves natively', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    await dialogPage.goto({ template: 'confirm' });
    await dialogPage.title.click();
    await expect.poll(() => dialogPage.activeShortcutContext()).toBe('plugin:dialog');

    await dialogPage.inputAfter.click();
    await expect(dialogPage.inputAfter).toBeFocused();

    // The input is the page's last element, so the browser moves past it (Chromium and WebKit leave the
    // document, headless Firefox keeps the focus there), never into the dialog.
    await page.keyboard.press('Tab');
    expect(await dialogPage.settledFocusIsInsideDialog()).toBe(false);
  });

  test('Tab from the page still enters the dialog at its first stop', async({ page, theme, bundle }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    await dialogPage.goto({ focus: true });
    await dialogPage.showControls([
      { tag: 'input', testId: 'dialog-input-1' },
      { tag: 'input', testId: 'dialog-input-2' },
    ]);

    await page.keyboard.press('Tab');
    await expect(dialogPage.inputBefore).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialogPage.dialogControl('dialog-input-1')).toBeFocused();
    expect(await dialogPage.activeShortcutContext()).toBe('plugin:dialog');
  });

  test('a native Tab that would leave the dialog past a button the engine skips is put back inside', async({
    page, theme, bundle, browserName,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);
    const input = dialogPage.dialogControl('dialog-input-1');
    const button = dialogPage.dialogControl('dialog-button');

    await dialogPage.goto();
    await dialogPage.showControls([
      { tag: 'input', testId: 'dialog-input-1' },
      { tag: 'button', testId: 'dialog-button' },
    ]);
    await input.click();
    await expect(input).toBeFocused();

    // The input is not the last stop the dialog counts, so the press is native. Chromium and Firefox move to
    // the button. WebKit skips buttons (DEV-1118), so its move leaves the dialog, and the safety net puts the
    // focus back on the first stop, the input.
    await page.keyboard.press('Tab');
    await expect(browserName === 'webkit' ? input : button).toBeFocused();
    expect(await dialogPage.settledFocusIsInsideDialog()).toBe(true);
    await expect.poll(() => dialogPage.activeShortcutContext()).toBe('plugin:dialog');
  });
});

/**
 * The browser's own move from Cancel to OK does not exist where Tab skips buttons (DEV-1118), so the full
 * cycle runs on the Chromium legs only; the wraps alone run on every engine above.
 */
test.describe('dialog Tab containment between buttons', () => {
  test('a confirm dialog cycles OK, Cancel, OK, Cancel and never reaches the page inputs', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);
    const cancel = dialogPage.button('Cancel');
    const ok = dialogPage.button('OK');

    await dialogPage.goto();
    await dialogPage.showConfirm();
    await dialogPage.title.click();
    await page.keyboard.press('Shift+Tab');
    await expect(ok).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(ok).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(cancel).toBeFocused();
    await settle(page);
    await expect(cancel).toBeFocused();
    await expect(dialogPage.inputAfter).not.toBeFocused();
    await expect(dialogPage.inputBefore).not.toBeFocused();
  });
});
