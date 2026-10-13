/**
 * @jest-environment node
 *
 * Reads workbooks that real spreadsheet apps saved, with both engines, and maps them the way the
 * importFile plugin does. Every other fixture in this directory is written by ExcelJS, so a
 * fixture-based test elsewhere proves the readers against ONE writer's dialect. These three files
 * carry the dialects of LibreOffice and Excel as the apps wrote them (`fixtures/README.md` says how
 * they were produced):
 *
 * - `libreoffice-saved.xlsx` – LibreOffice 26.8.0.3: `\$#,##0.00` for `"$"#,##0.00`, booleans as
 *   `t="b"` cells carrying a `TRUE()`/`FALSE()` formula or the BOOLEAN format
 *   `"TRUE";"TRUE";"FALSE"`, `"true"`/`"false"` attribute spelling, `<formula2>0</formula2>` on a
 *   list validation, and an `xf` with `horizontal="general" vertical="bottom"` on every cell.
 * - `libreoffice-saved-1904.xlsx` – the same content in the 1904 date system, written by
 *   LibreOffice as `date1904="true"`.
 * - `excel-saved.xlsx` – Excel for Mac 16.113: `"$"#,##0.00` kept quoted, `t="b"` booleans with no
 *   format, the BOOLEAN-format column stored as the NUMBERS 1 and 0, and a `calcChain.xml`.
 *
 * The sheet `Data` holds a header row and, per data row, a label (column A, the row headers here),
 * USD and PLN currencies, a boolean, a date-time, an `[h]:mm` duration, the `Sales` range
 * (`Data!$G$2:$G$4`, 10/20/30) and `=SUM(Sales)` (cached 60), a merge `I2:I3`, a list validation
 * on `J2:J5`, a BOOLEAN-format column, a note on `B2`, a hidden row 5 and a frozen first row.
 */
import ExcelJS from 'exceljs';
import { nativeAdapter } from '../adapters/native';
import { excelJsAdapter } from '../adapters/exceljs';
import { DroppedFeatures } from '../capabilities';
import { mapWorkbook, resolveImportOptions } from '../../../plugins/importFile/mapper';
import { loadFixture } from './helpers/fixtures';

const ENGINES = [['native', nativeAdapter, undefined], ['exceljs', excelJsAdapter, ExcelJS]];

/**
 * Reads one fixture with one engine and maps it the way the plugin does.
 *
 * @param {string} name The fixture name.
 * @param {object} adapter The engine adapter.
 * @param {object} engine The engine module, or `undefined` for the built-in one.
 * @param {object} [options] The import options.
 * @param {object} [context] Overrides of the mapper context.
 * @returns {Promise<{read: object, result: object, dropped: string[]}>}
 */
async function readAndMap(name, adapter, engine, options = {}, context = {}) {
  const dropped = new DroppedFeatures();
  const read = await adapter.read(loadFixture(name), engine, dropped);
  const result = mapWorkbook(read, resolveImportOptions(options), {
    formulasEnabled: false, commentsEnabled: true, customBordersEnabled: false, ...context,
  }, dropped);

  return { read, result, dropped: dropped.list() };
}

/**
 * Reads one fixture with both engines.
 *
 * @param {string} name The fixture name.
 * @param {object} [options] The import options.
 * @param {object} [context] Overrides of the mapper context.
 * @returns {Promise<{native: object, exceljs: object}>}
 */
async function readWithBothEngines(name, options, context) {
  const legs = {};

  for (const [kind, adapter, engine] of ENGINES) {
    // eslint-disable-next-line no-await-in-loop -- one engine at a time.
    legs[kind] = await readAndMap(name, adapter, engine, options, context);
  }

  return legs;
}

const HEADER_OPTIONS = { colHeaders: 'firstRow', rowHeaders: true };
const HEADERS = ['USD', 'PLN', 'Flag', 'Stamp', 'Duration', 'Sales', 'Total', 'Note', 'Status', 'Active'];
const USD = {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
};
const PLN = { ...USD, currency: 'PLN' };
const DATE_TIME = {
  type: 'intl-datetime',
  dateTimeFormat: {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  },
};
const DURATION = { type: 'time', timeFormat: { hour: 'numeric', minute: '2-digit', hour12: false } };
// The first nine imported columns, `USD` to `Status`. The tenth (`Active`, the BOOLEAN-format
// column) is asserted per app, because Excel and LibreOffice store it differently.
const COLUMNS = [
  { type: 'numeric', numericFormat: USD },
  { type: 'numeric', numericFormat: PLN },
  { type: 'checkbox' },
  DATE_TIME,
  DURATION,
  { type: 'numeric' },
  { type: 'numeric' },
  { type: 'text' },
  { type: 'dropdown', source: ['Open', 'Closed', 'Blocked'] },
];
// The first nine imported values of each data row. Row 3 is the hidden one.
const DATA = [
  [1234.5, 99.99, true, '2024-01-15 12:00:00', '12:00:00', 10, 60, 'merged', 'Open'],
  [18700, 1500, false, '2023-11-01 18:00:00', 1.0625, 20, null, null, 'Closed'],
  [950.25, 0.5, true, '2025-03-09 06:00:00', '06:00:00', 30, null, 'below', 'Open'],
  [1, 2, false, '2024-01-15 00:00:00', '03:00:00', null, null, null, null],
];

describe('workbooks a spreadsheet app saved', () => {
  describe.each([
    ['libreoffice-saved', 'LibreOffice'],
    ['libreoffice-saved-1904', 'LibreOffice in the 1904 date system'],
    ['excel-saved', 'Excel'],
  ])('%s.xlsx (%s), shared intent', (name) => {
    // The ExcelJS engine misreads the 1904 file's dates, which the 1904 block below pins, so the
    // date-time column is left out of the shared comparison for that leg only.
    const skipsDates = kind => name === 'libreoffice-saved-1904' && kind === 'exceljs';
    const withoutDates = rows => rows.map(row => row.filter((_, col) => col !== 3));

    it('imports the same values on both engines: currencies, booleans, date-times and durations', async() => {
      const legs = await readWithBothEngines(name, HEADER_OPTIONS);

      ['native', 'exceljs'].forEach((kind) => {
        const { result } = legs[kind];
        const data = result.data.map(row => row.slice(0, 9));

        expect(result.colHeaders).toEqual(HEADERS);

        if (skipsDates(kind)) {
          expect(withoutDates(data)).toEqual(withoutDates(DATA));
        } else {
          expect(data).toEqual(DATA);
        }
      });
    });

    it('infers a currency per currency column, a checkbox, a date-time and a duration on both engines', async() => {
      const legs = await readWithBothEngines(name, HEADER_OPTIONS);

      ['native', 'exceljs'].forEach((kind) => {
        expect(legs[kind].result.columns.slice(0, 9)).toEqual(COLUMNS);
      });
    });

    it('keeps 25:30 as the number 1.0625 and reports the [h]:mm format it cannot show', async() => {
      // `Intl` has no elapsed hours, so a duration past a day stays a number on its own cell, while
      // 12:00, 06:00 and 03:00 in the same column import as times.
      const legs = await readWithBothEngines(name, HEADER_OPTIONS);

      ['native', 'exceljs'].forEach((kind) => {
        const { result, dropped } = legs[kind];

        expect(result.data.map(row => row[4])).toEqual(['12:00:00', 1.0625, '06:00:00', '03:00:00']);
        expect(result.cellsMeta).toEqual([{ row: 1, col: 4, meta: { type: 'numeric' } }]);
        expect(dropped).toContain('numFmt:[h]:mm');
      });
    });

    it('carries the merge, the hidden row, the note and the list validation on both engines', async() => {
      const legs = await readWithBothEngines(name, HEADER_OPTIONS);

      ['native', 'exceljs'].forEach((kind) => {
        const { result } = legs[kind];

        expect(result.mergeCells).toEqual([{ row: 0, col: 7, rowspan: 2, colspan: 1 }]);
        expect(result.hiddenRows).toEqual([3]);
        expect(result.comments).toEqual([{ row: 0, col: 0, value: 'Checked by finance' }]);
        expect(result.columns[8]).toEqual({ type: 'dropdown', source: ['Open', 'Closed', 'Blocked'] });
      });
    });

    it('freezes the first row on both engines when no header row is promoted', async() => {
      // With `colHeaders: 'firstRow'` the frozen row IS the header row, so nothing is left frozen.
      const plain = await readWithBothEngines(name, {});
      const promoted = await readWithBothEngines(name, HEADER_OPTIONS);

      ['native', 'exceljs'].forEach((kind) => {
        expect(plain[kind].result.fixedRowsTop).toBe(1);
        expect(promoted[kind].result.fixedRowsTop).toBeUndefined();
      });
    });

    it('reads the Sales name and keeps =SUM(Sales) live only where the Formulas engine defines it', async() => {
      const unknown = await readWithBothEngines(name, HEADER_OPTIONS, {
        formulasEnabled: true, formulaNamedExpressions: new Set(),
      });
      const known = await readWithBothEngines(name, HEADER_OPTIONS, {
        formulasEnabled: true, formulaNamedExpressions: new Set(['sales']),
      });

      ['native', 'exceljs'].forEach((kind) => {
        expect(unknown[kind].read.definedNames).toEqual(['Sales']);
        expect(unknown[kind].result.data[0][6]).toBe(60);
        expect(unknown[kind].result.formulas).toEqual(expect.arrayContaining([
          { row: 0, col: 6, formula: 'SUM(Sales)' },
        ]));
        expect(unknown[kind].dropped).toContain('formula:definedName');

        expect(known[kind].result.data[0][6]).toBe('=SUM(Sales)');
        expect(known[kind].dropped).not.toContain('formula:definedName');
      });
    });
  });

  describe('libreoffice-saved.xlsx, the LibreOffice dialect', () => {
    it('reads the escaped `\\$` currency code verbatim on the built-in engine and unescaped on ExcelJS', async() => {
      // ExcelJS 4.4's `numfmt-xform.js` strips every backslash on read; the native reader keeps the
      // code verbatim (xlsxEngine/AGENTS.md, "A number-format code is VERBATIM in both directions").
      // The import's inference reads both as USD (asserted above).
      const legs = await readWithBothEngines('libreoffice-saved');

      expect(legs.native.read.sheets[0].rows[1][1].numFmt).toBe('\\$#,##0.00');
      expect(legs.exceljs.read.sheets[0].rows[1][1].numFmt).toBe('$#,##0.00');
    });

    it('imports the BOOLEAN-format `t="b"` column and the TRUE() formula column as checkboxes', async() => {
      const legs = await readWithBothEngines('libreoffice-saved', HEADER_OPTIONS, {
        formulasEnabled: true, formulaNamedExpressions: new Set(),
      });

      ['native', 'exceljs'].forEach((kind) => {
        const { read, result } = legs[kind];

        expect(read.sheets[0].rows[1][10].numFmt).toBe('"TRUE";"TRUE";"FALSE"');
        expect(result.columns[9]).toEqual({ type: 'checkbox' });
        expect(result.data.map(row => row[9])).toEqual([true, false, true, false]);
        // LibreOffice stores a typed TRUE as the formula `TRUE()` with a cached boolean. With the
        // Formulas plugin it stays a live formula; the column is still typed from the cached value.
        expect(read.sheets[0].rows[1][3].formula).toEqual({ text: 'TRUE()', result: true });
        expect(result.data.map(row => row[2])).toEqual(['=TRUE()', '=FALSE()', '=TRUE()', '=FALSE()']);
        expect(result.columns[2]).toEqual({ type: 'checkbox' });
      });
    });

    it('reports cellStyles on the ExcelJS engine only, for the default `xf` LibreOffice puts on every cell', async() => {
      // xlsxEngine/AGENTS.md: "The native reader reports `cellStyles` on fewer workbooks than ExcelJS".
      const legs = await readWithBothEngines('libreoffice-saved', HEADER_OPTIONS);

      expect(legs.native.dropped).toEqual(['numFmt:[h]:mm']);
      expect(legs.exceljs.dropped).toEqual(['numFmt:[h]:mm', 'cellStyles']);
    });
  });

  describe('libreoffice-saved-1904.xlsx, the 1904 date system', () => {
    it('imports the dates of the 1900 file on the built-in engine, and leaves the durations alone', async() => {
      const legs = await readWithBothEngines('libreoffice-saved-1904', HEADER_OPTIONS);
      const reference = await readWithBothEngines('libreoffice-saved', HEADER_OPTIONS);

      expect(legs.native.result.data).toEqual(reference.native.result.data);
      // A duration is not a date serial: 12:00 is 0.5 in either system. Shifted by 1462 days it
      // imported as the number 1462.5.
      expect(legs.native.read.sheets[0].rows[1][5].value).toBe(0.5);
      expect(legs.native.read.sheets[0].rows[2][5].value).toBe(1.0625);
    });

    it('pins the ExcelJS engine reading LibreOffice\'s `date1904="true"` as the 1900 system', async() => {
      // ExcelJS 4.4 maps only `date1904="1"` to `true`, so every date of a LibreOffice 1904 file
      // lands 1462 days early (xlsxEngine/AGENTS.md, the `<sheetProtection>` bullet: "It also misses
      // LibreOffice's ... `date1904="true"`"). The durations are not affected, because ExcelJS never
      // shifts them. A documented engine difference, pinned with both values.
      const legs = await readWithBothEngines('libreoffice-saved-1904', HEADER_OPTIONS);

      expect(legs.native.result.data.map(row => row[3])).toEqual([
        '2024-01-15 12:00:00', '2023-11-01 18:00:00', '2025-03-09 06:00:00', '2024-01-15 00:00:00',
      ]);
      expect(legs.exceljs.result.data.map(row => row[3])).toEqual([
        '2020-01-14 12:00:00', '2019-10-31 18:00:00', '2021-03-08 06:00:00', '2020-01-14 00:00:00',
      ]);
      expect(legs.exceljs.result.data.map(row => row[4])).toEqual(['12:00:00', 1.0625, '06:00:00', '03:00:00']);
    });
  });

  describe('excel-saved.xlsx, the Excel dialect', () => {
    it('keeps the quoted `"$"` currency code verbatim on both engines', async() => {
      const legs = await readWithBothEngines('excel-saved');

      ['native', 'exceljs'].forEach((kind) => {
        expect(legs[kind].read.sheets[0].rows[1][1].numFmt).toBe('"$"#,##0.00');
      });
    });

    it('reads a typed TRUE as a plain boolean cell, not a formula', async() => {
      const legs = await readWithBothEngines('excel-saved', HEADER_OPTIONS, {
        formulasEnabled: true, formulaNamedExpressions: new Set(),
      });

      ['native', 'exceljs'].forEach((kind) => {
        expect(legs[kind].read.sheets[0].rows[1][3].value).toBe(true);
        expect(legs[kind].result.data.map(row => row[2])).toEqual([true, false, true, false]);
        expect(legs[kind].result.columns[2]).toEqual({ type: 'checkbox' });
      });
    });

    it('imports the BOOLEAN-format column Excel stores as 1 and 0 as checkboxes', async() => {
      // Excel writes a BOOLEAN-format cell as a NUMBER under `"TRUE";"TRUE";"FALSE"` (LibreOffice
      // writes `t="b"`), and shows TRUE for any non-zero value. Read as a number, the column used to
      // import as 1 and 0 with the format reported as dropped.
      const legs = await readWithBothEngines('excel-saved', HEADER_OPTIONS);

      ['native', 'exceljs'].forEach((kind) => {
        const { read, result } = legs[kind];

        expect(read.sheets[0].rows[1][10].numFmt).toBe('"TRUE";"TRUE";"FALSE"');
        expect(typeof read.sheets[0].rows[1][10].value).toBe('number');
        expect(result.columns[9]).toEqual({ type: 'checkbox' });
        expect(result.data.map(row => row[9])).toEqual([true, false, true, false]);
        expect(result.dropped.filter(name => name.includes('TRUE'))).toEqual([]);
      });
    });
  });
});
