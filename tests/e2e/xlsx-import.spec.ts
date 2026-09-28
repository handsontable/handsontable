import { test, expect } from '../fixtures/test';
import { XlsxImportPage } from '../fixtures/pages/XlsxImportPage';

/**
 * Functional E2E for the importFile plugin on the ExcelJS engine: a configured grid is exported to
 * XLSX and imported into an empty grid in the same page. Asserts the reader-visible outcome (headers,
 * values, hidden column, merge) and the cell types the import inferred.
 */
test.describe('xlsx import (ExcelJS)', () => {
  let grids: XlsxImportPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grids = new XlsxImportPage(page, theme, bundle);
    await grids.goto();
  });

  test('imports headers and data from the exported workbook', async () => {
    await grids.roundTrip();

    // The "Active" header is not asserted here: hiddenColumns hides column 4 entirely
    // (header included), and its presence is covered by the layout test below via
    // `result.hiddenColumns` and the absent `target-0-4` cell.
    await expect(grids.targetHeaders()).toHaveText(['Name', 'Amount', 'Hired', 'Status', 'Bonus']);
    await expect(grids.targetCell(0, 0)).toHaveText('Ana García');
    await expect(grids.targetCell(0, 1)).toHaveText('4,200.50');
    // The grid stores the ISO string and RENDERS it through the derived Intl options. The export
    // derives the number format from the source column's own `dateFormat`, so a four-digit year
    // survives the round trip; a fixed `mm-dd-yy` used to show `01/15/24` here.
    await expect(grids.targetCell(0, 2)).toHaveText('01/15/2024');
    // The dropdown renderer prepends its arrow indicator glyph to the cell text (see
    // tests/AGENTS.md, "cell with a dropdown arrow"), so this checks containment rather than
    // pinning the indicator's exact glyph.
    await expect(grids.targetCell(0, 3)).toContainText('Open');
  });

  test('shifts formula references back out of the header band and recalculates them', async () => {
    await grids.roundTrip();

    // The grid's `=B1*0.2` is written to the sheet as `C2*0.2` (the export prepends a header row
    // and a row-header column and shifts every relative reference by them). The import drops both,
    // so the reference has to come back to `B1` or it reads the row below and the column to the
    // right — 4200.5 * 0.2 = 840.1, against 9046.4 from the unshifted reference.
    await expect(grids.targetCell(0, 5)).toHaveText('840.1');
    expect(await grids.targetSourceCell(0, 5)).toBe('=B1*0.2');
  });

  test('infers cell types from number formats and list validation', async () => {
    await grids.roundTrip();

    expect(await grids.targetCellMeta(0, 1)).toEqual(expect.objectContaining({ type: 'numeric' }));
    // `dateFormat` is Intl.DateTimeFormatOptions, not a pattern string. The export writes the
    // source column's own options as `mm/dd/yyyy` and the import inverts that pattern back, so the
    // target grid ends up with the options the source was configured with.
    expect(await grids.targetCellMeta(0, 2)).toEqual(expect.objectContaining({
      type: 'date',
      dateFormat: { month: '2-digit', day: '2-digit', year: 'numeric' },
    }));
    expect(await grids.targetCellMeta(0, 3)).toEqual(expect.objectContaining({ type: 'dropdown', source: ['Open', 'Closed', 'Blocked'] }));
    expect(await grids.targetCellMeta(0, 4)).toEqual(expect.objectContaining({ type: 'checkbox' }));
  });

  test('carries layout across: hidden column, merge, frozen row, and reports dropped styling', async () => {
    await grids.roundTrip();

    const result = await grids.lastImport();

    expect(result.hiddenColumns).toEqual([4]);
    expect(result.mergeCells).toEqual([{ row: 1, col: 0, rowspan: 2, colspan: 1 }]);
    expect(result.fixedRowsTop).toBe(1);
    expect(result.dropped).toEqual(['cellStyles']);
    await expect(grids.targetCell(0, 4)).toHaveCount(0);

    // The result is only what the mapper produced. These two assert the grid itself: MergeCells
    // validates every merge against the table present when the setting is applied, so a layout
    // setting reaching the grid before the data silently drops the merge (and logs about it) while
    // `result.mergeCells` stays correct.
    expect(await grids.targetMergedCells()).toEqual([{ row: 1, col: 0, rowspan: 2, colspan: 1 }]);
    expect(await grids.targetSetting('fixedRowsTop')).toBe(1);
  });

  test('imports alignment, font, fill and borders with importStyles and re-exports them', async () => {
    await grids.roundTripWithStyles();

    await expect(grids.targetCell(0, 1)).toHaveClass(/htRight/);
    await expect(grids.targetCell(0, 1)).toHaveClass(/htImported-/);
    expect(await grids.targetComputedStyle(0, 1, 'font-weight')).toMatch(/^(700|bold)$/);
    expect(await grids.targetComputedStyle(0, 1, 'color')).toBe('rgb(255, 0, 0)');
    // The generated rule now outranks the theme's own row-banding CSS (see
    // `installImportedStyles` in `importFile/applier.ts`), so the fill is visible on a live cell,
    // not just recoverable on a re-export.
    expect(await grids.targetComputedStyle(0, 2, 'background-color')).toBe('rgb(0, 255, 0)');
    expect(await grids.targetBorders()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        row: 0,
        col: 1,
        top: expect.objectContaining({ width: 2, color: '#0000ff' }),
        start: expect.objectContaining({ width: 1, color: '#0000ff' }),
      }),
    ]));

    const result = await grids.lastImport();
    const styleValues = Object.values(result.styles as Record<string, string>);

    expect(result.dropped).toEqual([]);
    expect(styleValues).toContain('font-weight:bold;color:#ff0000');
    // An exact-element match, not a substring check: the Hired column's only custom class sets
    // background-color, and `getCssStyleFromElement` (exportFile/types/xlsx/cell-style.ts) now
    // baseline-compares font color the same way it already did for background color, so a
    // fill-only class carries no leaked ambient text color ahead of the declaration.
    expect(styleValues).toContain('background-color:#00ff00');

    // The target was re-exported after the import (see the fixture's `round-trip-styles`
    // handler) and read back with ExcelJS, so this proves the generated stylesheet and the
    // imported `customBorders` entry survive a further export, not just the grid's own DOM.
    const reexport = await grids.reexport();
    const amountFont = reexport.amountFont as { bold?: boolean; color?: { argb?: string } };
    const hiredFill = reexport.hiredFill as { fgColor?: { argb?: string } };
    const amountBorder = reexport.amountBorder as { top?: { style?: string }; left?: { style?: string } };

    expect(amountFont.bold).toBe(true);
    expect(amountFont.color?.argb).toBe('FFFF0000');
    expect(hiredFill.fgColor?.argb).toBe('FF00FF00');
    expect(amountBorder.top?.style).toBe('medium');
    // The source's `start` border went out as Excel's `left`, came back in as the plugin's `start`,
    // and leaves again as `left` - the logical/physical mapping closes in both directions.
    expect(amountBorder.left?.style).toBe('thin');
  });

  test('imports a nested header band, conditional formatting and the sheet layout direction', async () => {
    await grids.roundTripNested();

    expect(await grids.targetSetting('nestedHeaders')).toEqual([
      [{ label: 'Team', colspan: 2 }, 'Totals'],
      ['Name', 'Role', 'Revenue'],
    ]);
    // Settings alone would not prove the plugin turned on: `NestedHeaders#isEnabled()` is
    // `!!settings.nestedHeaders`, so this checks the DOM actually grew a second header row and the
    // `Team` group actually spans two columns.
    expect(await grids.targetHeaderLayers()).toHaveLength(2);
    expect(await grids.targetHeaderColspans()).toContain(2);
    await expect(grids.targetCell(0, 0)).toHaveText('Ana García');

    const result = await grids.lastImport();

    expect(result.colHeaders).toBeUndefined();
    expect(result.conditionalFormatting).toEqual([{
      rows: [0, 1],
      cols: [2, 2],
      rules: [expect.objectContaining({ type: 'cellIs', operator: 'greaterThan' })],
    }]);
    expect(result.dropped).not.toContain('conditionalFormatting');
    // The export writes a left-to-right sheet and the target grid is left-to-right, so the two
    // agree and nothing is dropped for the direction. The MISMATCH path is unit-tested instead
    // (`importFile.unit.js`): `layoutDirection` is resolved at construction, so one page cannot
    // flip a grid's direction between tests.
    expect(result.layoutDirection).toBe('ltr');
    expect(result.dropped).not.toContain('layoutDirection');
  });
});
