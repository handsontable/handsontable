import { test, expect } from '../fixtures/test';
import { CssTransformGridPage } from '../fixtures/pages/CssTransformGridPage';

test.describe('a grid rotated by its host element', () => {
  test('uses the untransformed layout box for the scroll viewport', async ({ page, theme, bundle }) => {
    const grid = new CssTransformGridPage(page, theme, bundle);

    await grid.goto();

    const { width, height } = await grid.viewportSize();

    expect(width).toBeGreaterThan(height);
    expect(width).toBeGreaterThan(450);
  });

  test('keeps the frozen columns above a promoted master scroll layer',
    async ({ page, theme, bundle }) => {
      const grid = new CssTransformGridPage(page, theme, bundle);

      await grid.goto();
      await grid.promoteMasterScrollLayer();
      await grid.scrollHorizontally(300);

      await expect.poll(() => grid.elementAtFrozenPaneCenter()).toBe('frozenOverlay');
    });
});
