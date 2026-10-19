import { test, expect, THEMES_TAG } from '../fixtures/test';
import { CssTransformGridPage } from '../fixtures/pages/CssTransformGridPage';

test.describe('a grid rotated by its host element', { tag: THEMES_TAG }, () => {
  test('keeps the frozen columns above a promoted master scroll layer',
    async ({ page, theme, bundle }) => {
      const grid = new CssTransformGridPage(page, theme, bundle);

      await grid.goto();
      await grid.promoteMasterScrollLayer();
      await grid.scrollHorizontally(300);

      await expect.poll(() => grid.elementAtFrozenPaneCenter()).toBe('frozenOverlay');
    });
});
