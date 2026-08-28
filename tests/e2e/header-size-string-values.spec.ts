import { test, expect } from '../fixtures/test';
import { HeaderSizeStringValuesPage } from '../fixtures/pages/HeaderSizeStringValuesPage';

/**
 * Issue #6154. `rowHeaderWidth` and `columnHeaderHeight` are documented as pixel numbers, but a
 * value can easily arrive as a string - from an attribute, a JSON config, or a framework template.
 * Both now resolve `'100'` and `'100px'`, and both ignore a value that states no pixel count.
 *
 * All of this is geometry, so none of it can be checked in jsdom, where every size reads as zero.
 *
 * The two options used to disagree for reasons that were pure accident. `rowHeaderWidth` ran
 * through a `typeof width === 'number'` guard that replaced any string with the default column
 * width, so a string never applied at all. `columnHeaderHeight` had no guard and reached a
 * `Math.max(height, providedHeight)`, which coerces `'100'` to `100` - so a bare numeric string
 * worked there while `'100px'` became `NaN`.
 */
test.describe('Header size options given as strings', () => {
  let grid: HeaderSizeStringValuesPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new HeaderSizeStringValuesPage(page, theme, bundle);
    await grid.goto();
  });

  test('applies a row header width written as a bare numeric string', async () => {
    // The whole of issue #6154: this used to render at the default column width instead.
    expect(await grid.rowHeaderWidth('row-string'))
      .toBeCloseTo(HeaderSizeStringValuesPage.SIZE, 0);
  });

  test('applies a row header width written with the px unit', async () => {
    expect(await grid.rowHeaderWidth('row-px'))
      .toBeCloseTo(HeaderSizeStringValuesPage.SIZE, 0);
  });

  test('applies a per-level row header width given as strings', async () => {
    expect(await grid.rowHeaderWidth('row-array'))
      .toBeCloseTo(HeaderSizeStringValuesPage.SIZE, 0);
  });

  test('leaves a row header width given as a number exactly as it was', async () => {
    // The control. Numbers are the documented form and must not move by so much as a pixel.
    expect(await grid.rowHeaderWidth('row-number'))
      .toBeCloseTo(HeaderSizeStringValuesPage.SIZE, 0);
  });

  test('applies a column header height written with the px unit', async () => {
    // The one column-header case that was genuinely broken rather than accidentally working:
    // `Math.max` coerced `'100'` to `100`, but turned `'100px'` into `NaN`.
    expect(await grid.columnHeaderHeight('col-px'))
      .toBeCloseTo(HeaderSizeStringValuesPage.SIZE, 0);
  });

  test('applies a per-level column header height given as strings', async () => {
    // A per-level array of strings worked before the single-pass layout landed and then stopped:
    // the merge that reads the option only accepts numbers, so every entry was skipped.
    expect(await grid.columnHeaderHeight('col-array'))
      .toBeCloseTo(HeaderSizeStringValuesPage.SIZE, 0);
  });

  test('holds a column header height given as a string across repeated draws', async () => {
    // The regression this guards is a feedback loop, not a wrong first paint. The string was
    // dropped by the merge, leaving the render-size probe as the only source of the height - and
    // the probe came back a pixel short each time, so the header shrank on every single draw with
    // no floor. One draw looks almost right; ten do not.
    const afterFirstDraw = await grid.columnHeaderHeight('col-string');

    expect(afterFirstDraw).toBeCloseTo(HeaderSizeStringValuesPage.SIZE, 0);

    await grid.renderRepeatedly('colString', 10);

    expect(await grid.columnHeaderHeight('col-string')).toBeCloseTo(afterFirstDraw, 0);
  });

  test('ignores sizes that state no pixel count and keeps the default instead', async () => {
    // `'20em'` and `'50%'` depend on a layout context these settings have no access to. The grid
    // uses its default size rather than letting the value through to the sizing code, where it
    // would render as `NaN` and collapse the header.
    //
    // Compared against the reference grid, not a hardcoded number: both defaults differ per theme,
    // and this spec runs across all three.
    expect(await grid.rowHeaderWidth('row-invalid'))
      .toBeCloseTo(await grid.rowHeaderWidth('defaults'), 0);
    expect(await grid.columnHeaderHeight('col-invalid'))
      .toBeCloseTo(await grid.columnHeaderHeight('defaults'), 0);
  });
});

/**
 * The warning has to be watched from before the page loads, because the grids - and the warning -
 * are built during load. That is why these do not reuse the suite above's `beforeEach`.
 */
test.describe('Warning for a size that states no pixel count', () => {
  test('names the option and the value, once per grid', async ({ page, theme, bundle }) => {
    const grid = new HeaderSizeStringValuesPage(page, theme, bundle);
    const readWarnings = grid.collectWarnings();

    await grid.goto();
    // The fixture draws each grid more than once, so a plain `warn` would repeat. Only the
    // `warnOnce` keying makes this hold at exactly one per option.
    await grid.renderRepeatedly('rowInvalid', 5);
    await grid.renderRepeatedly('colInvalid', 5);

    const sizeWarnings = readWarnings().filter(text => text.includes('cannot be read as a pixel size'));

    expect(sizeWarnings.filter(text => text.includes('`rowHeaderWidth`'))).toHaveLength(1);
    expect(sizeWarnings.filter(text => text.includes('`columnHeaderHeight`'))).toHaveLength(1);
    // The rejected value is quoted back, so the reader can find it in their own config.
    expect(sizeWarnings.join('\n')).toContain('"20em"');
    expect(sizeWarnings.join('\n')).toContain('"50%"');
  });

  test('stays silent for sizes it can read', async ({ page, theme, bundle }) => {
    const grid = new HeaderSizeStringValuesPage(page, theme, bundle);
    const readWarnings = grid.collectWarnings();

    await grid.goto();
    await grid.renderRepeatedly('colString', 5);
    await grid.renderRepeatedly('rowPx', 5);

    // Only the two deliberately invalid grids may warn. A number, `'100'`, `'100px'` and an array
    // of those must not - a warning on a supported form would train readers to ignore the channel.
    const sizeWarnings = readWarnings().filter(text => text.includes('cannot be read as a pixel size'));

    expect(sizeWarnings).toHaveLength(2);
  });
});
