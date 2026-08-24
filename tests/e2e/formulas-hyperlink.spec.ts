import { test, expect } from '../fixtures/test';
import { FormulasHyperlinkPage } from '../fixtures/pages/FormulasHyperlinkPage';

/**
 * `formulas.hyperlinks`: a cell whose root expression is `HYPERLINK()` renders
 * its value inside an anchor (PRO-1051). The feature decorates the cell after
 * its own renderer has run and never writes cell meta, so the cases below also
 * pin the two regressions that sank the original proposal (#10314): a swapped
 * renderer and an unsanitized `href`.
 */
test.describe('formulas: HYPERLINK rendering', () => {
  test('renders an anchor with the label as text and the URL as href', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.link(0, 0)).toHaveText('Example one');
    await expect(grid.link(0, 0)).toHaveAttribute('href', 'https://example.com/one');
    await expect(grid.link(0, 0)).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(grid.link(0, 0)).toHaveAttribute('target', '_blank');
  });

  test('uses the URL as the label when the second argument is omitted', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.link(1, 0)).toHaveText('https://example.com/two');
    await expect(grid.link(1, 0)).toHaveAttribute('href', 'https://example.com/two');
  });

  test('renders no anchor when HYPERLINK is not the root expression', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(2, 0)).toHaveText('see three');
    await expect(grid.link(2, 0)).toHaveCount(0);
  });

  test('renders no anchor for a plain, non-formula value', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(6, 0)).toHaveText('plain');
    await expect(grid.link(6, 0)).toHaveCount(0);
  });

  test('refuses a `javascript:` URL, keeps the label as text, and warns once', async({ page, theme, bundle }) => {
    const warnings: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'warning') {
        warnings.push(message.text());
      }
    });

    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(3, 0)).toHaveText('Danger');
    await expect(grid.link(3, 0)).toHaveCount(0);

    const refusals = warnings.filter(text => text.includes('refuses to link to'));

    expect(refusals).toHaveLength(1);
  });

  test('renders a label containing markup as text', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.link(4, 0)).toHaveText('<img src=x onerror=\'window.__xss = true\'>');
    await expect(grid.cell(4, 0).locator('img')).toHaveCount(0);
    await expect(page.evaluate(() => (window as any).__xss)).resolves.toBeUndefined();
  });

  test('keeps a column\'s custom renderer and wraps its output', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    // The custom renderer's element still exists, and it sits inside the anchor.
    await expect(grid.customMark(0)).toHaveText('B one');
    await expect(grid.link(0, 1).locator('span.custom-mark')).toHaveCount(1);
    // A non-hyperlink cell in the same column keeps the renderer and gains no anchor.
    await expect(grid.customMark(1)).toHaveText('b2');
    await expect(grid.link(1, 1)).toHaveCount(0);
  });

  test('leaves a `checkbox` cell type untouched', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(0, 2).locator('input[type="checkbox"]')).toHaveCount(1);
    await expect(grid.link(0, 2)).toHaveCount(0);
  });

  test('keeps a cell type\'s renderer on a hyperlink cell', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    // The `password` renderer masks the label, and the mask is what the anchor
    // wraps. A swapped renderer would leak the plain label instead.
    await expect(grid.link(0, 3)).toHaveText('******');
    await expect(grid.link(0, 3)).toHaveAttribute('href', 'https://example.com/pw');
    // A non-hyperlink cell in the same column is still masked and gains no anchor.
    await expect(grid.cell(1, 3)).toHaveText('***********');
    await expect(grid.link(1, 3)).toHaveCount(0);
  });

  test('drops the anchor when the formula is replaced by a plain value', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();
    await expect(grid.link(0, 1)).toHaveCount(1);

    await grid.setCellValue(0, 1, 'no longer a formula');

    await expect(grid.link(0, 1)).toHaveCount(0);
    // The column's own renderer survived the change.
    await expect(grid.customMark(0)).toHaveText('no longer a formula');
  });

  test('drops the anchor when the plugin is disabled, keeping the renderer', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();
    await expect(grid.link(0, 1)).toHaveCount(1);

    await grid.disableFormulasPlugin();

    await expect(grid.link(0, 1)).toHaveCount(0);
    await expect(grid.customMark(0)).toHaveCount(1);
  });

  test('renders no anchor while the option is off, and again once it is on', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await grid.setHyperlinks(false);
    await expect(grid.link(0, 0)).toHaveCount(0);
    await expect(grid.cell(0, 0)).toHaveText('Example one');

    await grid.setHyperlinks(true);
    await expect(grid.link(0, 0)).toHaveCount(1);
  });

  test('drops a memoizing renderer\'s anchor when the option is turned off', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();
    await expect(grid.link(0, 4)).toHaveCount(1);

    // Column E renders through a memoizing renderer, so nothing else would remove the anchor: the
    // cell would stay clickable after the feature was switched off.
    await grid.setHyperlinks(false);

    await expect(grid.link(0, 4)).toHaveCount(0);
    await expect(grid.cell(0, 4)).toHaveText('Steady');
  });

  test('drops a memoizing renderer\'s anchor when the plugin is disabled', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();
    await expect(grid.link(0, 4)).toHaveCount(1);

    // Disabling the plugin removes the `afterRenderer` hook, and without a redraw there is no
    // render pass left to rewrite the cell, so the cleanup has to happen on disable itself.
    await grid.disableFormulasPluginWithoutRender();

    await expect(grid.link(0, 4)).toHaveCount(0);
  });

  test('survives a renderer that wraps the anchor it produced', async({ page, theme, bundle }) => {
    const pageErrors: string[] = [];

    page.on('pageerror', error => pageErrors.push(error.message));

    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    // Column F's renderer boxes whatever the cell already holds, so from the second draw on the
    // anchor is `TD > div.wrap-box > a` rather than a direct child. Unwrapping relative to the cell
    // would throw NotFoundError inside `afterRenderer` and take the whole draw down.
    await grid.render(2);

    await expect(grid.link(0, 5)).toHaveCount(1);
    await expect(grid.link(0, 5)).toHaveAttribute('href', 'https://example.com/boxed');
    await expect(grid.cell(0, 5)).toHaveText('Boxed');
    // A draw killed mid-flight leaves later cells unrendered, so check one that comes after it.
    await expect(grid.cell(6, 0)).toHaveText('plain');
    expect(pageErrors).toEqual([]);
  });

  test('follows a link on click and still selects the cell', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      grid.link(5, 0).click(),
    ]);

    await expect(popup).toHaveURL(/\/tests\/fixtures\/demo\/grid\.html$/);
    await popup.close();

    await expect(grid.selectedCoords()).resolves.toEqual([5, 0]);
  });

  test('opens the editor with the raw formula on double click', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();

    await grid.cell(0, 0).dblclick({ position: { x: 2, y: 2 } });

    await expect(grid.editorValue()).resolves.toBe('=HYPERLINK("https://example.com/one","Example one")');
  });

  test('opens the selected cell\'s link with Alt+Enter', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();
    await grid.recordWindowOpen();

    await grid.selectCell(0, 0);
    await grid.pressOpenLinkShortcut();

    await expect(grid.openedUrls()).resolves.toEqual(['https://example.com/one']);
  });

  test('leaves Alt+Enter to the host application on a cell with no link', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();
    await grid.recordHostAltEnter();

    // A cell holding no link must not have the chord taken from it: the event has to reach the
    // document undefeated, or a host application's own Alt+Enter handler stops firing grid-wide.
    await grid.selectCell(6, 0);
    await grid.pressOpenLinkShortcut();

    await expect(grid.hostAltEnterEvents()).resolves.toEqual([false]);

    // On a link cell the plugin claims the chord, so the event is stopped before the document.
    await grid.selectCell(0, 0);
    await grid.pressOpenLinkShortcut();

    await expect(grid.hostAltEnterEvents()).resolves.toEqual([false]);
  });

  test('rebuilds a stale href when only the URL behind the formula changes',
    async({ page, theme, bundle }) => {
      const grid = new FormulasHyperlinkPage(page, theme, bundle);

      await grid.goto();

      // Column E holds `=HYPERLINK(E2,"Steady")` and renders through a memoizing renderer that
      // leaves the cell's DOM alone when the value is unchanged. Changing E2 changes the URL while
      // the label stays "Steady", so nothing about the cell's content signals the change.
      await expect(grid.link(0, 4)).toHaveText('Steady');
      await expect(grid.link(0, 4)).toHaveAttribute('href', 'https://example.com/first');

      await grid.setCellValue(1, 4, 'https://example.com/second');

      await expect(grid.link(0, 4)).toHaveText('Steady');
      await expect(grid.link(0, 4)).toHaveAttribute('href', 'https://example.com/second');
      // Exactly one anchor: unwrapping before wrapping must not nest or duplicate.
      await expect(grid.link(0, 4)).toHaveCount(1);
    });

  test('does nothing on Alt+Enter when the selected cell holds no link', async({ page, theme, bundle }) => {
    const grid = new FormulasHyperlinkPage(page, theme, bundle);

    await grid.goto();
    await grid.recordWindowOpen();

    await grid.selectCell(6, 0);
    await grid.pressOpenLinkShortcut();

    await expect(grid.openedUrls()).resolves.toEqual([]);
  });
});
