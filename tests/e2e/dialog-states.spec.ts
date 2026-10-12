import { test, expect } from '../fixtures/test';
import { DialogStatesPage, type Box } from '../fixtures/pages/DialogStatesPage';

/**
 * The dialog states the visual suite's `/dialog-demo` route photographed, asserted from the DOM on every
 * theme and bundle: the solid and the semi-transparent backdrop, the content box with and without its own
 * background, the confirm template's slots and its OK button handing the keyboard back to the selected cell,
 * the accent border a focused dialog draws, the focus moves around a dialog whose content holds inputs, and
 * the RTL layout. The captures that stay under `visual-tests/tests/js-only/dialog/` are
 * of how those states look; whether the states are reached is this spec's.
 */

const EDGE_TOLERANCE_PX = 0.5;
const CENTER_TOLERANCE_PX = 1;

/**
 * The box's horizontal and vertical center.
 *
 * @param {Box} box A box in viewport coordinates.
 * @returns {{x: number, y: number}}
 */
function centerOf(box: Box) {
  return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
}

/**
 * Asserts that the dialog lies exactly over the grid's root and centers its content box on it.
 *
 * @param {DialogStatesPage} dialogPage The page object.
 */
async function expectCoveringTheRoot(dialogPage: DialogStatesPage) {
  const { dialog, root, content, hitInsideDialog } = await dialogPage.geometry();

  (['left', 'top', 'right', 'bottom'] as const).forEach((edge) => {
    expect(Math.abs(dialog[edge] - root[edge]), `dialog ${edge} vs the grid root`).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
  });
  expect(Math.abs(centerOf(content).x - centerOf(dialog).x)).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
  expect(Math.abs(centerOf(content).y - centerOf(dialog).y)).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
  // The modal swallows pointer input meant for the grid behind it.
  expect(hitInsideDialog).toBe(true);
}

test.describe('dialog states', () => {
  test('a solid backdrop covers the grid opaquely, with the content box centered and unfilled', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    await dialogPage.goto();

    await expect(dialogPage.dialog).toHaveClass(/\bht-dialog--background-solid\b/);
    await expect(dialogPage.dialog).toHaveAttribute('role', 'dialog');
    await expectCoveringTheRoot(dialogPage);

    const { backdropAlpha, contentAlpha, contentHasBackgroundClass } = await dialogPage.geometry();

    expect(backdropAlpha).toBe(1);
    expect(contentHasBackgroundClass).toBe(false);
    expect(contentAlpha).toBe(0);
    expect(await dialogPage.activeShortcutContext()).toBe('plugin:dialog');
  });

  test('a semi-transparent backdrop lets the grid show through, under a filled content box', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    await dialogPage.goto({ background: 'semi-transparent', contentBackground: true });

    await expect(dialogPage.dialog).toHaveClass(/\bht-dialog--background-semi-transparent\b/);
    await expectCoveringTheRoot(dialogPage);

    const {
      backdropAlpha, semiTransparentOpacity, contentAlpha, contentHasBackgroundClass,
    } = await dialogPage.geometry();

    // The backdrop's alpha is the theme's own opacity token, and that token leaves the grid showing.
    expect(semiTransparentOpacity).toBeGreaterThan(0);
    expect(semiTransparentOpacity).toBeLessThan(1);
    expect(backdropAlpha).toBeCloseTo(semiTransparentOpacity, 2);
    expect(contentHasBackgroundClass).toBe(true);
    expect(contentAlpha).toBe(1);
  });

  test('the confirm template fills its title, description and buttons, and Enter on OK hides it', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    await dialogPage.goto({ template: 'confirm' });

    await expect(dialogPage.dialog).toHaveClass(/\bht-dialog--confirm\b/);
    await expect(dialogPage.dialog).toHaveAttribute('role', 'alertdialog');
    await expect(dialogPage.dialog.locator('.ht-dialog__title')).toHaveText('Confirm');
    await expect(dialogPage.dialog.locator('.ht-dialog__description')).toHaveText('This is a confirm');

    // The title and the description name the dialog for assistive technology.
    const titleId = await dialogPage.dialog.getAttribute('aria-labelledby');
    const descriptionId = await dialogPage.dialog.getAttribute('aria-describedby');

    expect(titleId).not.toBeNull();
    expect(descriptionId).not.toBeNull();
    await expect(page.locator(`[id="${titleId}"]`)).toHaveText('Confirm');
    await expect(page.locator(`[id="${descriptionId}"]`)).toHaveText('This is a confirm');

    const cancel = dialogPage.button('Cancel');
    const ok = dialogPage.button('OK');

    await expect(cancel).toHaveClass(/\bht-button--secondary\b/);
    await expect(ok).toHaveClass(/\bht-button--primary\b/);

    const cancelBox = await cancel.boundingBox();
    const okBox = await ok.boundingBox();

    expect(cancelBox!.x + cancelBox!.width).toBeLessThanOrEqual(okBox!.x);
    await expectCoveringTheRoot(dialogPage);

    // The page's own input, the two buttons, the page's other input; then back onto OK.
    await page.keyboard.press('Tab');
    await expect(dialogPage.inputBefore).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(ok).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialogPage.inputAfter).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(ok).toBeFocused();

    // OK's callback hides the dialog and switches the shortcut context back to the grid.
    await page.keyboard.press('Enter');
    await expect(dialogPage.dialog).not.toHaveClass(/\bht-dialog--show\b/);
    await expect(dialogPage.dialog).toBeHidden();
    expect(await dialogPage.isVisible()).toBe(false);
    expect(await dialogPage.activeShortcutContext()).toBe('grid');

    // The same dialog opened over a selected cell: OK hands the keyboard back to that cell, and the
    // arrow keys move the selection again.
    const cell = dialogPage.cell(2, 1);

    await cell.click({ position: { x: 5, y: 5 } });
    await expect.poll(() => dialogPage.selected()).toEqual([[2, 1, 2, 1]]);
    await dialogPage.show();
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(ok).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialogPage.dialog).toBeHidden();
    await expect(cell).toBeFocused();
    expect(await dialogPage.selected()).toEqual([[2, 1, 2, 1]]);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => dialogPage.selected()).toEqual([[3, 1, 3, 1]]);
  });

  test('Tab onto a dialog draws its border in the accent color while its focus catcher holds the focus', async({
    page, theme, bundle,
  }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    await dialogPage.goto();

    const resting = await dialogPage.geometry();

    expect(resting.borderColor).not.toBe(resting.accentColor);

    await page.keyboard.press('Tab');
    await expect(dialogPage.inputBefore).toBeFocused();
    await page.keyboard.press('Tab');
    await expect.poll(async() => (await dialogPage.geometry()).focusOnCatcher).toBe(true);

    const focused = await dialogPage.geometry();

    expect(focused.borderColor).toBe(focused.accentColor);

    // Once the focus moves on to the content's own button, the border is back at rest.
    await page.keyboard.press('Tab');
    await expect(dialogPage.button('Close modal')).toBeFocused();
    expect((await dialogPage.geometry()).borderColor).toBe(resting.borderColor);
  });

  test('Tab and Shift+Tab move around a dialog that holds inputs, and its afterDialogFocus listener takes the '
    + 'focus to "Input 1"', async({ page, theme, bundle }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);
    const input1 = dialogPage.dialogControl('dialog-input-1');

    await dialogPage.goto({ background: 'semi-transparent', contentBackground: true, focus: true });

    // A grid nobody has clicked does not take the focus when its dialog opens.
    expect(await dialogPage.focusIsOnBody()).toBe(true);

    await page.keyboard.press('Tab');
    await expect(dialogPage.inputBefore).toBeFocused();

    // Tabbing into the dialog activates it, and the listener moves the focus to "Input 1".
    await page.keyboard.press('Tab');
    await expect(input1).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(dialogPage.button('Close modal')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialogPage.inputBefore).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect.poll(() => dialogPage.focusIsOnBody()).toBe(true);

    // Wrapping around the page from its end, the dialog is entered from below and the listener
    // still lands on "Input 1", not on the last control.
    await page.keyboard.press('Shift+Tab');
    await expect(dialogPage.inputAfter).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(input1).toBeFocused();
    expect(await dialogPage.activeShortcutContext()).toBe('plugin:dialog');
  });

  test('in an RTL grid the dialog is laid out right to left over the root', async({ page, theme, bundle }) => {
    const dialogPage = new DialogStatesPage(page, theme, bundle);

    // The LTR control first: the heading's text starts at the block's left edge.
    await dialogPage.goto();

    const ltr = await dialogPage.geometry();

    expect(ltr.dir).toBe('ltr');
    expect(Math.abs(ltr.headingText!.left - ltr.headingBlock!.left)).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
    expect(ltr.headingText!.right).toBeLessThan(ltr.headingBlock!.right - CENTER_TOLERANCE_PX);

    await dialogPage.goto({ dir: 'rtl' });
    await expectCoveringTheRoot(dialogPage);

    const rtl = await dialogPage.geometry();

    expect(rtl.dir).toBe('rtl');
    expect(rtl.direction).toBe('rtl');
    // The same text now ends at the block's right edge, its inline start.
    expect(Math.abs(rtl.headingText!.right - rtl.headingBlock!.right)).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
    expect(rtl.headingText!.left).toBeGreaterThan(rtl.headingBlock!.left + CENTER_TOLERANCE_PX);
  });
});
