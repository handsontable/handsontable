import { deflateRawSync } from 'node:zlib';
import { test, expect } from '../fixtures/test';
import { XlsxImportPage } from '../fixtures/pages/XlsxImportPage';

/**
 * Functional E2E for the importFile plugin, run on both engines: the ExcelJS module injected
 * through `engines`, and the built-in engine selected by `importFile: true` / `exportFile: true`.
 * A configured grid is exported to XLSX and imported into an empty grid in the same page. Asserts
 * the reader-visible outcome (headers, values, hidden column, merge) and the cell types the
 * import inferred.
 */

/**
 * A one-entry ZIP archive written by hand, so its central record can declare a size the data does
 * not have. The CRC is left at 0: every refusal asserted here lands before the CRC check.
 */
function zipWithEntry(name: string, data: Buffer, method: 0 | 8, declaredSize: number): Buffer {
  const nameBytes = Buffer.from(name, 'utf8');
  const local = Buffer.alloc(30);

  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(method, 8);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(declaredSize, 22);
  local.writeUInt16LE(nameBytes.length, 26);

  const central = Buffer.alloc(46);

  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(method, 10);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(declaredSize, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt32LE(0, 42);

  const centralOffset = local.length + nameBytes.length + data.length;
  const end = Buffer.alloc(22);

  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + nameBytes.length, 12);
  end.writeUInt32LE(centralOffset, 16);

  return Buffer.concat([local, nameBytes, data, central, nameBytes, end]);
}

/**
 * The archive with the CRC-32 of its first central-directory record flipped.
 */
function withFlippedCentralCrc(zip: Buffer): Buffer {
  const copy = Buffer.from(zip);
  let eocd = copy.length - 22;

  while (copy.readUInt32LE(eocd) !== 0x06054b50) {
    eocd -= 1;
  }

  const central = copy.readUInt32LE(eocd + 16);

  copy.writeUInt32LE((copy.readUInt32LE(central + 16) ^ 0xffffffff) >>> 0, central + 16);

  return copy;
}

for (const engine of ['exceljs', 'native'] as const) {
  test.describe(`xlsx import (${engine})`, () => {
    let grids: XlsxImportPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grids = new XlsxImportPage(page, theme, bundle, engine);
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

    test('carries layout across: hidden column, merge, frozen row, and reports dropped styling', async ({ page }) => {
      const warnings: string[] = [];

      page.on('console', (message) => {
        if (message.type() === 'warning' && message.text().includes('dropped features')) {
          warnings.push(message.text());
        }
      });

      await grids.roundTrip();

      const result = await grids.lastImport();

      // The header promises every case runs on both engines; this proves the leg's engine did it.
      expect((result.engine as { kind: string }).kind).toBe(engine);
      // One warning per import call, naming what was dropped - the plugin's documented contract.
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('cellStyles');

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

    test('imports a cell comment into a grid with the Comments plugin', async () => {
      await grids.roundTrip();

      expect(await grids.targetComment(0, 0)).toBe('Team lead');
      await expect(grids.targetCell(0, 0)).toHaveClass(/htCommentCell/);
    });

    test('imports a workbook picked in a file input, the way the guide documents', async () => {
      const buffer = await grids.exportSource();

      await grids.importFile({ name: 'report.xlsx', buffer });

      await expect(grids.targetCell(0, 0)).toHaveText('Ana García');
      await expect(grids.targetCell(0, 1)).toHaveText('4,200.50');
    });

    test('imports a workbook LibreOffice saved, picked in a file input', async () => {
      // Every other case here reads a workbook this engine's own writer produced. This one is the
      // LibreOffice 26.8 dialect as the app wrote it: `\$#,##0.00` for the dollar format, BOOLEAN
      // `t="b"` cells, an `[h]:mm` column, and a `"true"`/`"false"` attribute spelling. The fixture
      // promotes the header row and drops the label column, so the grid's column 0 is the file's B.
      await grids.importFile({ name: 'libreoffice-saved.xlsx', buffer: grids.xlsxFixture('libreoffice-saved') });

      await expect(grids.targetHeaders().first()).toHaveText('USD');
      await expect(grids.targetCell(0, 0)).toHaveText('$1,234.50');
      // `Intl` separates the code from the amount with a no-break space, hence `\s`.
      await expect(grids.targetCell(0, 1)).toHaveText(/^PLN\s99\.99$/);
      await expect(grids.targetCheckbox(0, 9)).toBeChecked();
      await expect(grids.targetCheckbox(1, 9)).not.toBeChecked();
      // 12:00 is a time; 25:30 does not fit a clock, so it stays the number of days it is.
      await expect(grids.targetCell(0, 4)).toHaveText('12:00');
      await expect(grids.targetCell(1, 4)).toHaveText('1.0625');
      // The target's Formulas engine does not define `Sales`, so `=SUM(Sales)` shows its cached value.
      await expect(grids.targetCell(0, 6)).toHaveText('60');

      const result = await grids.lastImport();

      expect((result.engine as { kind: string }).kind).toBe(engine);
      expect(result.dropped).toEqual(expect.arrayContaining(['numFmt:[h]:mm', 'formula:definedName']));
    });

    test('keeps a formula over defined names live when the Formulas engine defines them', async () => {
      const outcome = await grids.importDefinedNamesWorkbook(true);

      await expect(grids.targetCell(1, 3)).toHaveText('60');
      await expect(grids.targetCell(2, 3)).toHaveText('7');
      expect(outcome.sources).toEqual(['=SUM(Sales)', '=Rate*100']);
      expect(outcome.dropped).not.toContain('formula:definedName');
    });

    test('imports the cached value of a formula over defined names the Formulas engine lacks', async () => {
      const outcome = await grids.importDefinedNamesWorkbook(false);

      await expect(grids.targetCell(1, 3)).toHaveText('60');
      await expect(grids.targetCell(2, 3)).toHaveText('7');
      expect(outcome.sources).toEqual([60, 7]);
      expect(outcome.dropped).toContain('formula:definedName');
    });

    test('round-trips a text cell that starts with an apostrophe and "=" the documented way', async ({ page }) => {
      // The import stores `'=quoted` as `''=quoted` (the Formulas plugin's escape does not nest), so a
      // re-export writes the doubled apostrophe. The import guide states this; the test pins it.
      const reexported = await page.evaluate(async() => {
        const w = window as unknown as Record<string, any>;
        // A file whose A1 is the text `'=quoted`, written directly: the source grid runs the
        // Formulas plugin, which would read the apostrophe as its own escape.
        const source = new w.ExcelJS.Workbook();

        source.addWorksheet('S').getCell('A1').value = "'=quoted";

        const bytes = new Uint8Array(await source.xlsx.writeBuffer());

        await w.__target.getPlugin('importFile').importFromArrayBuffer('xlsx', bytes.slice().buffer);

        const again = await w.__target.getPlugin('exportFile').exportAsBlobAsync('xlsx', {});
        const workbook = new w.ExcelJS.Workbook();

        await workbook.xlsx.load(await again.arrayBuffer());

        return { grid: w.__target.getSourceDataAtCell(0, 0), file: workbook.worksheets[0].getCell('A1').value };
      });

      expect(reexported.grid).toBe("''=quoted");
      expect(reexported.file).toBe("''=quoted");
    });

    test.describe('a workbook the reader refuses', () => {
      /**
       * Imports `bytes` and checks the outcome every refusal shares: the promise rejects, the grid keeps
       * every cell of the data it had, and `afterImport` never runs.
       */
      async function expectRefused(bytes: Buffer) {
        await grids.roundTrip();

        const before = await grids.page.evaluate(
          () => (window as unknown as { __target: { getData(): unknown[][] } }).__target.getData(),
        );
        const outcome = await grids.importBytes(bytes);

        expect(outcome.rejection).not.toBeNull();
        expect(outcome.data[0][0]).toBe('Ana García');
        expect(outcome.data).toEqual(before);
        expect(outcome.afterImportRan).toBe(false);

        return outcome.rejection!;
      }

      test('refuses an archive cut in half, and one missing its last byte', async () => {
        const zip = await grids.exportSource();

        const halved = await expectRefused(zip.subarray(0, Math.floor(zip.length / 2)));
        const lastByteMissing = await expectRefused(zip.subarray(0, zip.length - 1));

        // The ExcelJS messages come from JSZip and are not this reader's contract, so only the
        // built-in engine's refusal is pinned: without it, any rejection (a bug included) passed.
        if (engine === 'native') {
          expect(halved.message).toMatch(/end-of-central-directory/);
          expect(lastByteMissing.message).toMatch(/end-of-central-directory/);
        }
      });

      // ExcelJS reads the archive through JSZip without checking the CRC, and reads such a file, so
      // this case exists on the built-in engine's leg only.
      if (engine === 'native') {
        test('refuses an archive whose central directory carries a wrong CRC-32', async () => {
          const rejection = await expectRefused(withFlippedCentralCrc(await grids.exportSource()));

          expect(rejection.message).toMatch(/CRC-32/);
        });
      }

      test('refuses a part that inflates past the size it declares, as a limit', async () => {
        // 64 MiB of zeros deflate to about 64 KiB; the record declares 1 MiB.
        const bomb = zipWithEntry('_rels/.rels', deflateRawSync(Buffer.alloc(64 * 1024 * 1024)), 8, 1024 * 1024);
        const rejection = await expectRefused(bomb);

        if (engine === 'native') {
          expect(rejection.message).toMatch(/inflates above the 1048576-byte limit/);
          expect(rejection.limit).toBe(true);
        }
      });
    });
  });
}
