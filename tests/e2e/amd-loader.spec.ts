import { test, expect } from '../fixtures/test';
import { AmdLoaderGridPage } from '../fixtures/pages/AmdLoaderGridPage';

/**
 * Regression guard for hosting the UMD bundles on a page that already ships a
 * RequireJS-style AMD loader (SharePoint, Dojo, RequireJS-based CMSes).
 *
 * The webpack→rspack migration (DEV-1418) silently flipped AMD dependency
 * parsing off (rspack defaults `amd` to false, webpack enabled it), so the
 * vendored regexp-to-ast UMD wrapper inside handsontable.full.min.js reached
 * the page's global `define` at load time, left its `module.exports` empty,
 * and the whole bundle threw `RegExpParser is not a constructor` (DEV-2502).
 * The `amd: {}` entry in handsontable/.config/base.js is the fix this spec
 * pins down; the `-min` legs of the matrix cover the full bundle where the
 * vendored dependency lives.
 */
test.describe('bundle on a page with an AMD loader', () => {
  test('loads and renders while a global define.amd is present', async ({ page, theme, bundle }) => {
    const pageErrors: Error[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    const grid = new AmdLoaderGridPage(page, theme, bundle);

    await grid.goto();

    // Load-time failure (the DEV-2502 regression) surfaces here with the
    // exact thrown error, not as an opaque missing-cell timeout below.
    expect(pageErrors).toEqual([]);

    // The bundle must have registered through the page's AMD loader — proves
    // the collision scenario was actually exercised, not silently skipped.
    expect(await grid.amdRegistrationCount()).toBeGreaterThan(0);

    await grid.expectCell(0, 0, 'A1');
    await grid.expectCell(2, 2, 'C3');
  });
});
