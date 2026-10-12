import { test, expect } from '../fixtures/test';
import { EditorFactoryPortalPage } from '../fixtures/pages/EditorFactoryPortalPage';

/**
 * An `editorFactory` editor with `position: 'portal'` lives in the grid's portal root on `body`, so
 * its container is positioned against a containing block that is not the viewport. The container
 * must sit on the edited cell, on the cell's inline-start edge: the left edge under LTR, the right
 * edge under RTL.
 *
 * The regression these cases pin (DEV-3208): under RTL the factory wrote the cell's viewport
 * `right` into the CSS `right` property, which is measured from the containing block's right edge,
 * so the editor opened mirrored across the viewport, far from its cell. A positioned `body` with a
 * margin moves the containing block off the viewport origin, which is why the `inset` page is
 * covered in both directions.
 */
test.describe('An editorFactory editor with position "portal"', () => {
  const layouts = [
    { name: 'LTR', dir: 'ltr', pageDir: 'ltr', edge: 'left' },
    { name: 'RTL', dir: 'rtl', pageDir: 'rtl', edge: 'right' },
    { name: 'RTL grid on an LTR page', dir: 'rtl', pageDir: 'ltr', edge: 'right' },
  ] as const;

  for (const { name, dir, pageDir, edge } of layouts) {
    for (const pageLayout of ['plain', 'inset'] as const) {
      const description = pageLayout === 'plain' ?
        `opens on the cell under ${name}` :
        `opens on the cell under ${name} on a scrolled page that is offset from the viewport origin`;

      test(description, async({ page, theme, bundle }) => {
        const grid = new EditorFactoryPortalPage(page, theme, bundle, { dir, pageDir, page: pageLayout });

        await grid.goto();

        if (pageLayout === 'inset') {
          await grid.scrollPageTowardsInlineEnd(400);
        }

        for (const col of [1, 3]) {
          await grid.openEditor(0, col);

          const { cell, editor } = await grid.edges(0, col);

          expect(editor[edge]).toBeCloseTo(cell[edge], 0);
          expect(editor.top).toBeCloseTo(cell.top, 0);

          await page.keyboard.press('Escape');
        }
      });
    }
  }
});
