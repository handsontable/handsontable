import { test, expect } from '../fixtures/test';
import { IconElementsMiscPage } from '../fixtures/pages/IconElementsMiscPage';

test.describe('icon elements - collapsible indicator with an external icon', () => {
  test('an inline renderer glyph stays centered on the indicator', async({ page, theme, bundle }) => {
    const grid = new IconElementsMiscPage(page, theme, bundle);

    await grid.goto({ icons: 'tabler', nestedHeaders: true });
    await grid.mapCollapseOffToInlineRenderer();

    const glyph = grid.collapsibleRendererGlyph();

    await expect(glyph).toHaveCount(1);
    await expect(glyph).toBeVisible();

    // `.collapsibleIndicator` hides its legacy text with `text-indent: -100px`. An external
    // icon's inline content inherited it and painted far to the left of the button, while a
    // mask icon (no inline content) did not care. The glyph sits centered in its `<i>` box
    // (`text-align: center` on `--external`), and that box is centered on the indicator.
    const glyphCenter = await grid.centerX(glyph);
    const indicatorCenter = await grid.centerX(grid.collapsibleIndicator());

    expect(Math.abs(glyphCenter - indicatorCenter)).toBeLessThan(1);
  });
});

test.describe('icon elements - pagination under forced colors', () => {
  test('re-enabled first/prev buttons paint the enabled border, not the disabled one', async({
    page, theme, bundle,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });

    const grid = new IconElementsMiscPage(page, theme, bundle);

    // The fixture has 5 rows at `pageSize: 2`, so page 1 of 3 starts with first/prev disabled.
    await grid.goto();

    const first = grid.paginationButton('first');
    const prev = grid.paginationButton('prev');
    const next = grid.paginationButton('next');

    await expect(prev).toBeDisabled();

    const disabledBorder = await grid.borderColor(prev);

    await grid.setPage(2);

    await expect(first).toBeEnabled();
    await expect(prev).toBeEnabled();

    // The computed contract: an enabled button carries the enabled border, and it differs from
    // the disabled one (otherwise the comparison below would be vacuous).
    const enabledBorder = await grid.borderColor(next);

    expect(enabledBorder).not.toBe(disabledBorder);
    expect(await grid.borderColor(first)).toBe(enabledBorder);
    expect(await grid.borderColor(prev)).toBe(enabledBorder);

    // The reported defect was a stale PAINT, not a wrong computed value: with the button as an
    // `inline-flex` box, Chromium kept painting the disabled `GrayText` border after the state
    // flip. Computed style cannot see that, so compare what is painted now with what a fresh
    // paint of the same button in the same state looks like.
    const painted = await prev.screenshot();

    await grid.forceFreshPaint(prev);

    expect(await prev.screenshot()).toEqual(painted);
  });
});

test.describe('icon elements - sheets-bar all-sheets menu', () => {
  test('the active-sheet mark stays on the menu inline end for a right-to-left sheet name', async({
    page, theme, bundle,
  }) => {
    const grid = new IconElementsMiscPage(page, theme, bundle);

    await grid.goto({ sheetsBar: true });
    await grid.renameActiveSheet('גיליון');
    await grid.openAllSheetsMenu();

    const wrapper = grid.activeSheetMenuWrapper();
    const mark = wrapper.locator('.selected .ht-icon');

    await expect(wrapper).toHaveCount(1);
    await expect(mark).toBeVisible();

    // The grid is LTR, so the mark belongs on the right. With `dir="auto"` on the wrapper the
    // Hebrew name turned the wrapper RTL and `inset-inline-end` put the mark on the left.
    expect(await grid.centerX(mark)).toBeGreaterThan(await grid.centerX(wrapper));
  });

  test('the sheet name ellipsizes in its own span, so a right-to-left name is cut at its own end', async({
    page, theme, bundle,
  }) => {
    const grid = new IconElementsMiscPage(page, theme, bundle);

    await grid.goto({ sheetsBar: true });
    await grid.renameActiveSheet('גיליון');
    await grid.openAllSheetsMenu();

    const name = grid.activeSheetMenuWrapper().locator('.ht-sheets-bar__menu-item-name');

    await expect(name).toHaveAttribute('dir', 'auto');
    // Only an inline-block with its own overflow can ellipsize the name at the name's end; as a
    // plain inline span the wrapper's ellipsis would cut a right-to-left name at its start.
    await expect(name).toHaveCSS('display', 'inline-block');
    await expect(name).toHaveCSS('overflow', 'hidden');
    await expect(name).toHaveCSS('text-overflow', 'ellipsis');
  });
});
