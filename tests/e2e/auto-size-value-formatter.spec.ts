import { test, expect } from '../fixtures/test';
import { AutoSizeValueFormatterPage } from '../fixtures/pages/AutoSizeValueFormatterPage';

/**
 * DEV-2126 follow-up. The auto-size samplers must apply the same formatter precedence as the
 * render path: the cell-level `valueFormatter` option first, then the renderer's own
 * `valueFormatter` static (numericRenderer's Intl formatting, dateRenderer's, or a custom one).
 * When the static is missed, AutoColumnSize measures the raw value against a longer rendered
 * string, and AutoRowSize records a one-line height for a cell the renderer draws on several
 * lines — desyncing the row-header overlay from the master.
 */
test.describe('renderer valueFormatter static and the auto-size plugins', () => {
  let grid: AutoSizeValueFormatterPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new AutoSizeValueFormatterPage(page, theme, bundle);
    await grid.goto();
  });

  test('measures the currency-formatted column against its formatted string', async () => {
    // Sanity-tie the assertion to what the user sees: the column really renders the currency
    // string, which is strictly longer than the raw number the reference column renders.
    expect(await grid.cellText(0, AutoSizeValueFormatterPage.CURRENCY_COLUMN))
      .toBe('$123,456,789.55');
    expect(await grid.cellText(0, AutoSizeValueFormatterPage.RAW_NUMERIC_COLUMN))
      .toBe('123456789.55');

    const currency = await grid.columnWidth(AutoSizeValueFormatterPage.CURRENCY_COLUMN);
    const raw = await grid.columnWidth(AutoSizeValueFormatterPage.RAW_NUMERIC_COLUMN);

    // Both columns hold the SAME numbers; the currency string carries three extra characters, so
    // the formatted column must come out wider. Asserted as a floor, not an equality: the exact
    // pixel growth depends on each theme's font. When the sampler misses the renderer static,
    // both columns are measured against the identical raw value and the widths are equal.
    expect(currency).toBeGreaterThan(raw + 10);
  });

  test('measures the row against the multiline string the renderer static produces', async () => {
    const multiline = await grid.rowHeightSetting(AutoSizeValueFormatterPage.MULTILINE_ROW);
    const normal = await grid.rowHeightSetting(AutoSizeValueFormatterPage.NORMAL_ROW);

    // The static expands the marker cell to three lines, so the measured height must grow by at
    // least two extra line boxes (each far above 10px in every theme). When the sampler misses
    // the static, the row is measured one line tall and the two heights are equal.
    expect(multiline).toBeGreaterThan(normal + 20);
  });

  test('keeps the row header the same height as the multiline data cell', async () => {
    const masterHeight = await grid.rowHeight(
      grid.master, AutoSizeValueFormatterPage.MULTILINE_ROW
    );
    const overlayHeight = await grid.rowHeight(
      grid.inlineStartOverlay, AutoSizeValueFormatterPage.MULTILINE_ROW
    );

    // The master `<tr>` grows to its real content even when the cached measurement is wrong; the
    // row-header overlay obeys the cached value exactly. They agree only when the sampler measured
    // the formatted, multiline string.
    expect(overlayHeight).toBeCloseTo(masterHeight, 0);
  });
});
