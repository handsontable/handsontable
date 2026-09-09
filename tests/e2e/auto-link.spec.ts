import { test, expect } from '../fixtures/test';
import { AutoLinkPage } from '../fixtures/pages/AutoLinkPage';

/**
 * `autoLink` (DEV-2804): URLs found in the rendered text of a cell are wrapped in anchors after the
 * cell's own renderer ran. The value is never changed, the cell meta is never written, and the
 * anchors are rebuilt on every render pass.
 */
test.describe('autoLink', () => {
  test('wraps a whole-cell URL in an anchor with the shared classes and safe attributes', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    const link = grid.links(0, 0);

    await expect(link).toHaveCount(1);
    await expect(link).toHaveText('https://example.com/one');
    await expect(link).toHaveAttribute('href', 'https://example.com/one');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('tabindex', '-1');
    await expect(grid.anyLinks(0, 0)).toHaveClass('ht-link ht-auto-link');
  });

  test('links a URL inside prose and keeps the surrounding text', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.links(1, 0)).toHaveCount(1);
    await expect(grid.links(1, 0)).toHaveText('https://example.com/two');
    await expect(grid.cell(1, 0)).toHaveText('Visit https://example.com/two for details.');
  });

  test('links `mailto:` and `tel:` values', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.links(2, 0)).toHaveAttribute('href', 'mailto:someone@example.com');
    await expect(grid.links(3, 0)).toHaveAttribute('href', 'tel:+48123456789');
  });

  test('trims the punctuation that wraps a URL in prose', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.links(4, 0)).toHaveText('https://example.com/paren');
    await expect(grid.cell(4, 0)).toHaveText('(see https://example.com/paren).');
  });

  test('never links a `javascript:` value or plain text', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(7, 0)).toHaveText('javascript:alert(1)');
    await expect(grid.anyLinks(7, 0)).toHaveCount(0);
    await expect(grid.anyLinks(8, 0)).toHaveCount(0);
  });

  test('leaves the cell value untouched', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    const value = await page.evaluate(() => (window as any).hot.getDataAtCell(1, 0));

    expect(value).toBe('Visit https://example.com/two for details.');
  });

  test('respects a column-level and a cell-level opt-out', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(0, 1)).toHaveText('https://example.com/optout');
    await expect(grid.anyLinks(0, 1)).toHaveCount(0);
    await expect(grid.cell(5, 0)).toHaveText('https://example.com/cell-optout');
    await expect(grid.anyLinks(5, 0)).toHaveCount(0);
  });

  test('links inside a custom renderer\'s own element', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(0, 2).locator('span.custom-mark a.ht-auto-link')).toHaveAttribute('href', 'https://example.com/marked');
    await expect(grid.cell(0, 2)).toHaveText('go https://example.com/marked');
  });

  test('skips an `html` cell that already holds a user anchor', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.anyLinks(0, 3)).toHaveCount(1);
    await expect(grid.links(0, 3)).toHaveCount(0);
    await expect(grid.anyLinks(0, 3)).toHaveAttribute('href', 'https://example.com/user');
  });

  test('renders exactly one anchor on a HYPERLINK cell with both features on', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    // A HYPERLINK whose label is the URL itself is the case both features would match.
    await expect(grid.anyLinks(1, 5)).toHaveCount(1);
    await expect(grid.anyLinks(1, 5)).toHaveClass('ht-link ht-hyperlink');
    await expect(grid.anyLinks(1, 5)).toHaveAttribute('href', 'https://example.com/raw');
    await expect(grid.anyLinks(0, 5)).toHaveCount(1);
    await expect(grid.anyLinks(0, 5)).toHaveClass('ht-link ht-hyperlink');
  });

  test('converges on one anchor when Formulas is re-enabled after AutoLink', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    // With Formulas off the URL-shaped HYPERLINK label is plain text, so AutoLink links it.
    await grid.setFormulasEnabled(false);
    await expect(grid.links(1, 5)).toHaveCount(1);

    // Turning Formulas back on registers its afterRenderer AFTER AutoLink's: the reversed order.
    await grid.setFormulasEnabled(true);
    await expect(grid.cell(0, 5)).toHaveText('HF label');
    await grid.render(2);

    await expect(grid.anyLinks(1, 5)).toHaveCount(1);
    await expect(grid.anyLinks(1, 5)).toHaveClass('ht-link ht-hyperlink');
    await expect(grid.cell(1, 5).locator('a a')).toHaveCount(0);
    await expect(grid.links(0, 0)).toHaveCount(1);
  });

  test('links only a whole-cell URL when `inline` is `false`', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.links(0, 6)).toHaveCount(1);
    await expect(grid.links(0, 6)).toHaveAttribute('href', 'https://example.com/whole');
    await expect(grid.anyLinks(1, 6)).toHaveCount(0);
    await expect(grid.cell(1, 6)).toHaveText('see https://example.com/inline-off');
    await expect(grid.links(2, 6)).toHaveAttribute('href', 'https://example.com/padded');
  });

  test('applies `target`, `schemes` and `className` from the object form', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();
    await grid.setAutoLink({ target: '_self', schemes: ['http', 'https'], className: 'company-link' });

    await expect(grid.links(0, 0)).toHaveAttribute('target', '_self');
    await expect(grid.anyLinks(0, 0)).toHaveClass('ht-link ht-auto-link company-link');
    await expect(grid.anyLinks(2, 0)).toHaveCount(0);
    await expect(grid.anyLinks(3, 0)).toHaveCount(0);
  });

  test('survives repeated renders and rebuilds from the current value', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();
    await grid.render(3);

    await expect(grid.anyLinks(0, 0)).toHaveCount(1);
    await expect(grid.anyLinks(1, 0)).toHaveCount(1);

    await grid.setCellValue(0, 0, 'now plain');

    await expect(grid.cell(0, 0)).toHaveText('now plain');
    await expect(grid.anyLinks(0, 0)).toHaveCount(0);
  });

  test('drops the anchors when the option is turned off, even under a memoizing renderer', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();
    await expect(grid.links(0, 4)).toHaveCount(1);

    await grid.setAutoLink(false);

    await expect(grid.anyLinks(0, 0)).toHaveCount(0);
    await expect(grid.anyLinks(0, 4)).toHaveCount(0);
    await expect(grid.cell(0, 4)).toHaveText('https://example.com/memo');

    await grid.setAutoLink(true);

    await expect(grid.links(0, 0)).toHaveCount(1);
  });

  test('drops the anchors when the plugin is disabled without a redraw', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();
    await expect(grid.links(0, 0)).toHaveCount(1);

    await grid.disablePluginWithoutRender();

    await expect(grid.anyLinks(0, 0)).toHaveCount(0);
    await expect(grid.anyLinks(0, 4)).toHaveCount(0);
  });

  test('removes and re-adds anchors under `renderMode: "onChange"`', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();
    await grid.setRenderMode('onChange');
    await grid.render(2);
    await expect(grid.links(0, 0)).toHaveCount(1);

    await grid.setAutoLink(false);
    await expect(grid.anyLinks(0, 0)).toHaveCount(0);

    await grid.setAutoLink(true);
    await expect(grid.links(0, 0)).toHaveCount(1);
  });

  test('follows a link on click and still selects the cell', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      grid.links(6, 0).click(),
    ]);

    await expect(popup).toHaveURL(/\/tests\/fixtures\/demo\/grid\.html$/);
    await popup.close();

    await expect(grid.selectedCoords()).resolves.toEqual([6, 0]);
  });

  test('opens the editor with the raw value on double click', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();

    // x:2 sits in the sub-pixel zone where the frozen row-header clone pane's holder overlaps the
    // first data column (measured on all three themes), which intercepts the click instead of the
    // cell; x:10 clears it while still landing on plain text, left of the link.
    await grid.cell(1, 0).dblclick({ position: { x: 10, y: 10 } });

    await expect(grid.editorValue()).resolves.toBe('Visit https://example.com/two for details.');
  });

  test('opens the first link of the selected cell with Alt+Enter, honouring `target`', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();
    await grid.recordWindowOpen();

    await grid.selectCell(1, 0);
    await grid.pressOpenLinkShortcut();

    await expect(grid.openedUrls()).resolves.toEqual([['https://example.com/two', '_blank']]);

    await grid.setAutoLink({ target: '_self' });
    await grid.selectCell(0, 0);
    await grid.pressOpenLinkShortcut();

    await expect(grid.openedUrls()).resolves.toEqual([
      ['https://example.com/two', '_blank'],
      ['https://example.com/one', '_self'],
    ]);
  });

  test('leaves Alt+Enter to the host application on a cell with no link', async({ page, theme, bundle }) => {
    const grid = new AutoLinkPage(page, theme, bundle);

    await grid.goto();
    await grid.recordWindowOpen();
    await grid.recordHostAltEnter();

    await grid.selectCell(8, 0);
    await grid.pressOpenLinkShortcut();

    await expect(grid.openedUrls()).resolves.toEqual([]);
    await expect(grid.hostAltEnterEvents()).resolves.toEqual([false]);
  });
});
