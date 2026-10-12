import { test, expect } from '../fixtures/test';
import { EditorFactoryPortalPage } from '../fixtures/pages/EditorFactoryPortalPage';

/**
 * An `editorFactory` editor with `position: 'portal'` lives in the grid's portal root on `body`, so
 * it is placed against the viewport. Its container must sit on the edited cell on the cell's
 * inline-start edge: the left edge under LTR, the right edge under RTL.
 *
 * The regression these cases pin (DEV-3208): under RTL the factory wrote the cell's viewport
 * `right` into the CSS `right` property, which is measured from the containing block's right edge,
 * so the editor opened mirrored across the viewport, far from its cell.
 */
test.describe('An editorFactory editor with position "portal"', () => {
  test('opens on the cell under LTR', async({ page, theme, bundle }) => {
    const grid = new EditorFactoryPortalPage(page, theme, bundle, { dir: 'ltr' });

    await grid.goto();

    for (const col of [1, 3]) {
      await grid.openEditor(0, col);

      const { cell, editor } = await grid.edges(0, col);

      expect(editor.left).toBeCloseTo(cell.left, 0);

      await page.keyboard.press('Escape');
    }
  });

  test('opens on the cell under RTL', async({ page, theme, bundle }) => {
    const grid = new EditorFactoryPortalPage(page, theme, bundle, { dir: 'rtl' });

    await grid.goto();

    for (const col of [1, 3]) {
      await grid.openEditor(0, col);

      const { cell, editor } = await grid.edges(0, col);

      expect(editor.right).toBeCloseTo(cell.right, 0);

      await page.keyboard.press('Escape');
    }
  });

  test('opens on the cell under RTL on a page that is scrolled and offset from the viewport origin', async({
    page, theme, bundle,
  }) => {
    const grid = new EditorFactoryPortalPage(page, theme, bundle, { dir: 'rtl', page: 'inset' });

    await grid.goto();
    await grid.scrollPageTowardsInlineEnd(400);

    for (const col of [1, 3]) {
      await grid.openEditor(0, col);

      const { cell, editor } = await grid.edges(0, col);

      expect(editor.right).toBeCloseTo(cell.right, 0);

      await page.keyboard.press('Escape');
    }
  });
});
