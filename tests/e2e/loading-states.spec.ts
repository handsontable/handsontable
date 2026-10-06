import { test, expect } from '../fixtures/test';
import { LoadingStatesPage, type LoadingGeometry } from '../fixtures/pages/LoadingStatesPage';

/**
 * The loading overlay states the visual suite's `/loading-demo` route photographed, asserted from the
 * DOM on every theme and bundle: the default spinner and title, a custom icon, title and description,
 * the focus Tab gives it, a grid with no rows under it, and the RTL mirror. The captures that stay
 * under `visual-tests/tests/js-only/loading/` are of how the overlay looks; whether those states are
 * reached is this spec's.
 */

const EDGE_TOLERANCE_PX = 0.5;

/**
 * Asserts that the overlay lies exactly over the grid's root.
 *
 * @param {LoadingGeometry} geometry The overlay's geometry.
 */
function expectCoveringTheRoot({ overlay, root }: LoadingGeometry) {
  (['left', 'top', 'right', 'bottom'] as const).forEach((edge) => {
    expect(Math.abs(overlay[edge] - root[edge]), `overlay ${edge} vs the grid root`)
      .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
  });
}

test.describe('loading overlay states', () => {
  test('the default overlay covers the grid with the spinner before the translated title, and no description', async({
    page, theme, bundle,
  }) => {
    const loadingPage = new LoadingStatesPage(page, theme, bundle);

    await loadingPage.goto();

    await expect(loadingPage.icon.locator('svg.ht-loading__icon-svg')).toBeVisible();
    await expect(loadingPage.title).toHaveText('Loading...');
    await expect(loadingPage.description).toHaveCount(0);

    const titleId = await loadingPage.overlay.getAttribute('aria-labelledby');

    expect(titleId).not.toBeNull();
    await expect(page.locator(`[id="${titleId}"]`)).toHaveText('Loading...');
    await expect(loadingPage.overlay).not.toHaveAttribute('aria-describedby', /./);

    const geometry = await loadingPage.geometry();

    expectCoveringTheRoot(geometry);
    expect(geometry.dir).toBe('ltr');
    // The spinner sits at the inline start of the text, on the same line.
    expect(geometry.icon.right).toBeLessThanOrEqual(geometry.titleText.left);
    expect(geometry.icon.bottom).toBeGreaterThan(geometry.titleText.top);
    expect(geometry.icon.top).toBeLessThan(geometry.titleText.bottom);
  });

  test('a custom icon, title and description replace the defaults', async({ page, theme, bundle }) => {
    const loadingPage = new LoadingStatesPage(page, theme, bundle);

    await loadingPage.goto({ content: 'custom' });

    await expect(loadingPage.icon.getByTestId('custom-icon')).toHaveText('Custom icon');
    await expect(loadingPage.icon.locator('svg')).toHaveCount(0);
    await expect(loadingPage.title).toHaveText('Loading Title...');
    await expect(loadingPage.description).toHaveText('Loading Description...');

    const descriptionId = await loadingPage.overlay.getAttribute('aria-describedby');

    expect(descriptionId).not.toBeNull();
    await expect(page.locator(`[id="${descriptionId}"]`)).toHaveText('Loading Description...');

    // The description sits under the title.
    const titleBox = await loadingPage.title.boundingBox();
    const descriptionBox = await loadingPage.description.boundingBox();

    expect(descriptionBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height - EDGE_TOLERANCE_PX);
    expectCoveringTheRoot(await loadingPage.geometry());
  });

  test('Tab from the page puts the focus on the overlay itself, not on the grid behind it', async({
    page, theme, bundle,
  }) => {
    const loadingPage = new LoadingStatesPage(page, theme, bundle);

    await loadingPage.goto();

    await page.keyboard.press('Tab');
    await expect(loadingPage.inputBefore).toBeFocused();

    // Nothing inside the overlay can hold the focus, so the loading plugin's `afterDialogFocus`
    // listener puts it on the overlay's container, which is what a screen reader announces.
    await page.keyboard.press('Tab');
    await expect(loadingPage.overlay).toBeFocused();
    expect(await loadingPage.activeShortcutContext()).toBe('plugin:dialog');
  });

  test('over a grid with no rows the overlay still covers the whole root', async({ page, theme, bundle }) => {
    const loadingPage = new LoadingStatesPage(page, theme, bundle);

    await loadingPage.goto({ noData: true });

    expect(await loadingPage.rowCount()).toBe(0);
    await expect(loadingPage.title).toHaveText('Loading...');

    const geometry = await loadingPage.geometry();

    expectCoveringTheRoot(geometry);
    // The root keeps the 400 px the grid was given, rows or none.
    expect(geometry.root.bottom - geometry.root.top).toBeCloseTo(400, 0);
  });

  test('in an RTL grid the overlay mirrors: the spinner moves to the right of the Arabic title', async({
    page, theme, bundle,
  }) => {
    const loadingPage = new LoadingStatesPage(page, theme, bundle);

    await loadingPage.goto({ dir: 'rtl' });

    await expect(loadingPage.title).toHaveText('جاري التحميل...');

    const geometry = await loadingPage.geometry();

    expectCoveringTheRoot(geometry);
    expect(geometry.dir).toBe('rtl');
    expect(geometry.icon.left).toBeGreaterThanOrEqual(geometry.titleText.right);
    expect(geometry.icon.bottom).toBeGreaterThan(geometry.titleText.top);
    expect(geometry.icon.top).toBeLessThan(geometry.titleText.bottom);
  });
});
