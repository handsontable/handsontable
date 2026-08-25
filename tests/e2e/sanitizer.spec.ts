import { test, expect } from '../fixtures/test';
import { SanitizerPage } from '../fixtures/pages/SanitizerPage';

/**
 * The `sanitizer` option (GH-13229). Three things only a real browser can settle:
 * that a paste carrying Handsontable's private clipboard type cannot execute the
 * markup it brings, that a `nestedHeaders` label goes through the sanitizer under
 * the `'header'` source, and that the `html` cell type stays raw on purpose.
 */
test.describe('sanitizer', () => {
  test('neutralizes a nested header label under the header source', async({ page, theme, bundle }) => {
    const grid = new SanitizerPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.nestedHeader()).toHaveText('label');
    // The fixture's sanitizer strips event handlers rather than whole tags, so the
    // element survives and the handler does not - which is what a rich-content
    // sanitizer is for, and a stronger assertion than the tag simply being gone.
    await expect(grid.nestedHeader().locator('img')).not.toHaveAttribute('onerror');
    expect(await grid.sanitizerContexts()).toContain('header');
    // The ghost table measures the same label. Sanitizing it under a second source
    // would give a context-aware sanitizer two different rule sets for one value.
    expect(await grid.sanitizerContexts()).not.toContain('innerHTML');
    expect(await grid.xssFired()).toBe(false);
  });

  test('does not run markup pasted through the private clipboard type', async({ page, theme, bundle }) => {
    const grid = new SanitizerPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell(0, 0);

    // Handsontable writes this type from its own copy handler, but any page can set
    // it from theirs. It used to reach the HTML parser before the sanitizer did.
    await grid.paste({
      'application/ht-source-data-json-html':
        '<table><tbody><tr><td>pasted</td></tr></tbody></table>' +
        '<img src="x" onerror="window.__xssProbe()">',
      'text/plain': 'pasted',
    });

    await expect.poll(() => grid.cellValue(0, 0)).toBe('pasted');
    expect(await grid.xssFired()).toBe(false);
  });

  test('leaves the html cell type raw even with a sanitizer configured', async({ page, theme, bundle }) => {
    const grid = new SanitizerPage(page, theme, bundle);

    await grid.goto();

    // PR #7368 disabled sanitizing for the `html` cell type on purpose, and the
    // documentation says so. Covering it later is a behavior change, not a bug fix,
    // so this asserts the exclusion rather than assuming nobody will touch it.
    await expect(page.getByTestId('html-cell-marker')).toBeVisible();
    // Match on the cell's own content, not on a context name: several surfaces share
    // context strings, so a name-based check would survive the regression it guards.
    const sanitized = await grid.sanitizerContents();

    expect(sanitized.some(content => content.includes('html-cell-marker'))).toBe(false);
  });
});
