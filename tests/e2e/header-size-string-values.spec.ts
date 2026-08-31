import { test, expect } from '../fixtures/test';
import { HeaderSizeStringValuesPage } from '../fixtures/pages/HeaderSizeStringValuesPage';

/**
 * Issue #6154. `rowHeaderWidth` and `columnHeaderHeight` are documented as pixel numbers, but a
 * value can easily arrive as a string - from an attribute, a JSON config, or a framework template.
 * Both now resolve `'100'` and `'100px'`, and both ignore a value that states no pixel count.
 *
 * All of this is geometry, so none of it can be checked in jsdom, where every size reads as zero.
 *
 * The two options used to disagree for reasons that were pure accident, and the accident is a
 * different one on each side. Read from the 18.0.0 tag:
 *
 * `rowHeaderWidth` ran through a `typeof width === 'number'` guard in `baseTable`'s
 * `_correctRowHeaderWidth`, which replaced any string with the default column width. A string never
 * applied at all, whatever it said.
 *
 * `columnHeaderHeight` was gated on `!isNaN(setting)` in `table.ts` instead. `'100'` passes that and
 * is stored raw in `oversizedColumnHeaders`, where two consumers then coerce it: the style write
 * builds `` `${value}px` ``, and `columnUtils.getHeaderHeight` runs `Math.max(height, value)`. So a
 * bare numeric string worked. `'100px'` fails the `isNaN` gate and is dropped before either of them.
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

  test('applies a per-level width that mixes a number and a pixel string', async () => {
    // The guides and both JSDoc blocks promise the two forms can be mixed. Until now only
    // `settings.types.ts` said so, and that is compile-time - it never reaches the resolver's
    // `.map` path, which is the code that actually has to handle a mixed array.
    const [numberLevel, stringLevel] = await grid.rowHeaderWidths('row-mixed');

    expect(numberLevel).toBeCloseTo(60, 0);
    expect(stringLevel).toBeCloseTo(90, 0);
  });

  test('applies the default to an unreadable entry that is not the last one', async () => {
    // `baseTable._modifyRowHeaderWidth` only runs its correction on the last array entry, so an
    // earlier rejected entry reaches the viewport as empty and `getRowHeaderWidth` measures the
    // header block from the DOM instead of summing. That path still lands on the right number,
    // because `ColumnUtils.calculateWidths` has already substituted the default into the `col`
    // element it then measures. Asserted here so the fallback stays true at every level, not just
    // the last one.
    const [rejectedLevel, readableLevel] = await grid.rowHeaderWidths('row-invalid-first');

    expect(readableLevel).toBeCloseTo(90, 0);
    expect(rejectedLevel).toBeCloseTo(await grid.rowHeaderWidth('defaults'), 0);
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

    // Two grids configure an unreadable `rowHeaderWidth` (`row-invalid` and `row-invalid-first`),
    // and the scope is per grid, so each one warns for itself: two in total, not one and not ten.
    expect(sizeWarnings.filter(text => text.includes('`rowHeaderWidth`'))).toHaveLength(2);
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

    // Only the three deliberately invalid grids may warn. A number, `'100'`, `'100px'` and an array
    // of those must not - a warning on a supported form would train readers to ignore the channel.
    // Re-rendering a valid grid must not add one either, which is what the extra draws above check.
    const sizeWarnings = readWarnings().filter(text => text.includes('cannot be read as a pixel size'));

    expect(sizeWarnings).toHaveLength(3);
  });
});
