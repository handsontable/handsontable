import { test, expect } from '../fixtures/test';
import { CssTransformGridPage } from '../fixtures/pages/CssTransformGridPage';

test.describe('a grid rotated by its host element', () => {
  test('keeps the frozen columns above a promoted master scroll layer',
    async ({ page, theme, bundle }) => {
      const grid = new CssTransformGridPage(page, theme, bundle);

      await grid.goto();
      await grid.promoteMasterScrollLayer();
      await grid.scrollHorizontally(300);

      await expect.poll(() => grid.elementAtFrozenPaneCenter()).toBe('frozenOverlay');
    });
});
