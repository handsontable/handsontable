import Handsontable from 'handsontable';
import { mapWorkbook, registerStyleRule, resolveImportOptions, selectSheet } from '../mapper';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { isLimitError, MAX_TRANSLATED_FORMULA_CHARS } from '../../../utils/xlsxEngine/limits';
import { createCellSnapshot, createSheetSnapshot, createWorkbookSnapshot } from '../../../utils/xlsxEngine/model';
import { EMPTY_STYLES } from '../../../utils/xlsxEngine/adapters/native/parts/styles';
import { parseWorksheet } from '../../../utils/xlsxEngine/adapters/native/parts/worksheetReader';

function cell(overrides) {
  return { ...createCellSnapshot(), ...overrides };
}

function text(value) {
  return cell({ value });
}

function workbook(...sheets) {
  const wb = createWorkbookSnapshot();

  wb.sheets.push(...sheets);

  return wb;
}

function map(
  wb, options = {}, context = { formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false }
) {
  const dropped = new DroppedFeatures();
  const result = mapWorkbook(wb, resolveImportOptions(options), context, dropped);

  return { result, dropped };
}

describe('resolveImportOptions', () => {
  it('should apply the documented defaults', () => {
    expect(resolveImportOptions(undefined)).toEqual({
      sheet: 0,
      colHeaders: false,
      rowHeaders: false,
      headerRows: 1,
      range: null,
      inferCellTypes: true,
      importFormulas: true,
      importLayout: true,
      apply: true,
      importStyles: false,
    });
  });

  it('should reject a headerRows that is not an integer of at least 1', () => {
    expect(() => resolveImportOptions({ headerRows: 0 })).toThrow(/"headerRows".*integer.*1/);
    expect(() => resolveImportOptions({ headerRows: -2 })).toThrow(/"headerRows"/);
    expect(() => resolveImportOptions({ headerRows: 1.5 })).toThrow(/"headerRows"/);
    expect(() => resolveImportOptions({ headerRows: 'two' })).toThrow(/"headerRows"/);
    expect(() => resolveImportOptions({ headerRows: 3 })).not.toThrow();
  });
});

describe('selectSheet', () => {
  it('should pick by index among sheets that are not very hidden, and by name among all', () => {
    const helper = createSheetSnapshot('_HotValidation');

    helper.state = 'veryHidden';

    const wb = workbook(helper, createSheetSnapshot('Data'), createSheetSnapshot('Other'));

    expect(selectSheet(wb, 0).name).toBe('Data');
    expect(selectSheet(wb, 1).name).toBe('Other');
    expect(selectSheet(wb, '_HotValidation').name).toBe('_HotValidation');
  });

  it('should throw a Handsontable error listing the sheet names', () => {
    const wb = workbook(createSheetSnapshot('Data'));

    expect(() => selectSheet(wb, 'Missing')).toThrow(/Missing.*Data/);
    expect(() => selectSheet(wb, 3)).toThrow(/Data/);
  });

  it('should say the workbook has no worksheets instead of listing none', () => {
    // An empty `<sheets>` used to be refused with "Available sheets: ." and no reason.
    expect(() => map(workbook())).toThrow('The workbook has no worksheets.');
    expect(() => map(workbook())).not.toThrow(/Available sheets/);
    expect(() => map(workbook(), { sheet: 'Chart1' })).toThrow('The workbook has no worksheets.');
  });

  it('should say a chart-only workbook holds only chart sheets, which the import skips', () => {
    // The built-in reader skips every chart sheet and records `chartSheets`, so the workbook it
    // hands over is empty.
    const dropped = new DroppedFeatures();

    dropped.record('chartSheets');

    expect(() => mapWorkbook(workbook(), resolveImportOptions({}), {
      formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false,
    }, dropped)).toThrow('The workbook has no worksheets. It holds only chart sheets, which the import skips.');
  });
});

describe('mapWorkbook', () => {
  it('should map values row by row, converting date and time serials to strings', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('Ana'), cell({ value: 4200.5, numFmt: '#,##0.00' }), cell({ value: 45292, numFmt: 'mm-dd-yy' }),
        cell({ value: 0.5, numFmt: 'h:mm:ss' }), cell({ value: true }), null],
      [text('Li'), null, cell({ value: 45658, numFmt: 'mm-dd-yy' }), cell({ value: 0.25, numFmt: 'h:mm:ss' }),
        cell({ value: false }), null],
    ];

    const { result, dropped } = map(workbook(sheet));

    expect(result.data).toEqual([
      ['Ana', 4200.5, '2024-01-01', '12:00:00', true, null],
      ['Li', null, '2025-01-01', '06:00:00', false, null],
    ]);
    expect(result.columns).toEqual([
      { type: 'text' },
      { type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true } },
      { type: 'date', dateFormat: { month: '2-digit', day: '2-digit', year: '2-digit' } },
      { type: 'time', timeFormat: { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false } },
      { type: 'checkbox' },
      {},
    ]);
    expect(result.cellsMeta).toBeUndefined();
    expect(result.sheetNames).toEqual(['Data']);
    expect(dropped.list()).toEqual([]);
  });

  it('should lift the dominant meta and keep per-cell meta only for the cells that differ', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [cell({ value: 1, numFmt: '0' })],
      [cell({ value: 45292, numFmt: 'mm-dd-yy' })],
    ];

    const { result } = map(workbook(sheet));

    // The first-seen meta wins a tie and becomes the column's; only the cell that differs gets its
    // own entry. One stray cell used to send every cell of the column through `setCellMetaObject`.
    expect(result.columns).toEqual([{
      type: 'numeric',
      numericFormat: { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: false },
    }]);
    // The outlier resets the column keys it does not set, so the cell does not inherit a stale
    // `numericFormat` through the cascade.
    expect(result.cellsMeta).toEqual([
      {
        row: 1,
        col: 0,
        meta: {
          numericFormat: undefined,
          type: 'date',
          dateFormat: { month: '2-digit', day: '2-digit', year: '2-digit' },
        },
      },
    ]);
  });

  it('should promote the first row to headers and drop the first column for row headers', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [null, text('Name'), text('Amount')],
      [text('1'), text('Ana'), cell({ value: 5 })],
      [text('2'), text('Li'), cell({ value: 7 })],
    ];
    sheet.merges = [{ row: 1, col: 1, rowspan: 2, colspan: 1 }, { row: 0, col: 1, rowspan: 1, colspan: 2 }];
    sheet.hiddenRows = [2];
    sheet.hiddenCols = [0, 2];
    sheet.freeze = { rows: 1, cols: 1 };
    sheet.colWidths = [5, 20, null];
    sheet.rowHeights = [null, 30, null];

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow', rowHeaders: true });

    expect(result.colHeaders).toEqual(['Name', 'Amount']);
    expect(result.rowHeaders).toBe(true);
    expect(result.data).toEqual([['Ana', 5], ['Li', 7]]);
    expect(result.mergeCells).toEqual([{ row: 0, col: 0, rowspan: 2, colspan: 1 }]);
    expect(result.hiddenRows).toEqual([1]);
    expect(result.hiddenColumns).toEqual([1]);
    expect(result.fixedRowsTop).toBeUndefined();
    expect(result.fixedColumnsStart).toBeUndefined();
    expect(result.colWidths).toEqual([140, undefined]);
    expect(result.rowHeights).toEqual([40, undefined]);
  });

  it('should promote a header from a formula cell\'s cached result and a date cell\'s ISO string', () => {
    const sheet = createSheetSnapshot('Data');

    // A formula cell keeps its display text in `formula.result` with `value` null, and a date cell
    // is a serial under a date format - both read as data through `toGridValue`, so a header has to
    // read the same way or come out as `''` and `44927`.
    sheet.rows = [
      [cell({ value: null, formula: { text: 'CONCAT("Q",1)', result: 'Q1' } }),
        cell({ value: 44927, numFmt: 'yyyy-mm-dd' }), text('Plain')],
      [text('a'), text('b'), text('c')],
    ];

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow' });

    expect(result.colHeaders).toEqual(['Q1', '2023-01-01', 'Plain']);
  });

  it('should escape a promoted header, which the grid renders as HTML', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('<img src=x onerror=alert(1)>'), text('R&D "core" \'team\''), text('5 < 10')],
      [text('a'), text('b'), text('c')],
    ];

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow' });

    expect(result.colHeaders).toEqual([
      '&lt;img src=x onerror=alert(1)&gt;',
      'R&amp;D &quot;core&quot; &#39;team&#39;',
      // Escaping keeps the whole text; stripping would have cut everything from the `<` onward.
      '5 &lt; 10',
    ]);
    // Cell values are rendered as text, so they stay exactly as the workbook wrote them.
    expect(result.data).toEqual([['a', 'b', 'c']]);
  });

  it('should read a sheet whose rows are empty arrays rather than padded holes', () => {
    const sheet = createSheetSnapshot('Data');

    // What the adapter produces for a sparse sheet: a row that carries no cell at all is `[]`,
    // never a full width of `null`s and never a hole in the array.
    sheet.rows = [[text('a'), text('b')], [], [], [text('c')]];
    sheet.rowHeights = [null, null, 42, null];

    const { result } = map(workbook(sheet), {});

    expect(result.data).toEqual([['a', 'b'], [null, null], [null, null], ['c', null]]);
    expect(result.rowHeights).toEqual([undefined, undefined, 56, undefined]);
  });

  it('should crop a merge that starts in the header row down to the data window', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('h1')], [text('a')], [text('b')]];
    sheet.merges = [{ row: 0, col: 0, rowspan: 3, colspan: 1 }];

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow' });

    expect(result.mergeCells).toEqual([{ row: 0, col: 0, rowspan: 2, colspan: 1 }]);
  });

  it('should crop a merge past a range\'s end, and drop one clamped to a single cell', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('a'), text('b'), text('c'), text('d')],
      [text('e'), text('f'), text('g'), text('h')],
    ];
    sheet.merges = [
      { row: 0, col: 0, rowspan: 1, colspan: 4 },
      { row: 1, col: 1, rowspan: 1, colspan: 3 },
    ];

    const { result } = map(workbook(sheet), { range: [0, 0, 1, 1] });

    expect(result.mergeCells).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 2 }]);
  });

  it('should keep frozen panes beyond the promoted header row and column', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('h1'), text('h2')], [text('a'), text('b')], [text('c'), text('d')]];
    sheet.freeze = { rows: 2, cols: 2 };

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow' });

    expect(result.fixedRowsTop).toBe(1);
    expect(result.fixedColumnsStart).toBe(2);
  });

  it('should clamp frozen panes to the window like every other layout value', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('a'), text('b'), text('c')], [text('d'), text('e'), text('f')], [text('g'), text('h'), text('i')],
    ];
    sheet.freeze = { rows: 20, cols: 10 };

    const { result } = map(workbook(sheet), { range: [0, 0, 1, 1] });

    expect(result.fixedRowsTop).toBe(2);
    expect(result.fixedColumnsStart).toBe(2);
  });

  it('should reject a malformed range and clamp an oversized one to the sheet', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('a'), text('b')], [text('c'), text('d')]];

    expect(() => resolveImportOptions({ range: [0, 0, 1] })).toThrow(/"range" import option/);
    expect(() => resolveImportOptions({ range: [2, 0, 1, 1] })).toThrow(/"range" import option/);
    expect(() => resolveImportOptions({ range: [0, -1, 1, 1] })).toThrow(/"range" import option/);
    expect(() => resolveImportOptions({ range: [0, 0.5, 1, 1] })).toThrow(/"range" import option/);

    // `range: [0, 0, 999, 999]` on a 2x2 sheet used to invent a thousand empty rows.
    const { result } = map(workbook(sheet), { range: [0, 0, 999, 999] });

    expect(result.data).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('should reject a range that starts outside the sheet instead of importing nothing', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('a'), text('b')], [text('c'), text('d')], [text('e'), text('f')]];

    // `[100, 0, 200, 0]` is well-formed and used to yield `data: []`, which wiped the target grid.
    expect(() => map(workbook(sheet), { range: [100, 0, 200, 0] }))
      .toThrow(/"range" import option starts outside the sheet "Data", which holds 3 rows and 2 columns/);
    expect(() => map(workbook(sheet), { range: [0, 5, 0, 9] })).toThrow(/starts outside the sheet/);
    // A start inside and an end beyond is still clamped, not rejected.
    expect(map(workbook(sheet), { range: [2, 1, 200, 9] }).result.data).toEqual([['f']]);
  });

  it('should cap headerRows at the rows the sheet holds instead of looping past them', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('Group'), text('')], [text('a'), text('b')], [text('c'), text('d')]];
    sheet.merges = [{ row: 0, col: 0, rowspan: 1, colspan: 2 }];

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow', headerRows: 1e9 });

    // Every row became a header band row; there is no data left, and it finished.
    expect(result.data).toEqual([]);
    expect(result.nestedHeaders).toHaveLength(3);
  });

  it('should honor a range in sheet coordinates before header promotion', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('skip'), text('skip'), text('skip')],
      [text('skip'), text('H1'), text('H2')],
      [text('skip'), text('a'), text('b')],
    ];

    const { result } = map(workbook(sheet), { range: [1, 1, 2, 2], colHeaders: 'firstRow' });

    expect(result.colHeaders).toEqual(['H1', 'H2']);
    expect(result.data).toEqual([['a', 'b']]);
  });

  it('should put formulas into the data only when the formulas plugin is enabled', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: 2 }), cell({ value: 3 }),
      cell({ value: null, formula: { text: 'SUM(A1:B1)', result: 5 } })]];

    const withFormulas = map(workbook(sheet), {}, { formulasEnabled: true, commentsEnabled: false }).result;
    const withoutFormulas = map(workbook(sheet)).result;

    expect(withFormulas.data[0][2]).toBe('=SUM(A1:B1)');
    expect(withFormulas.formulas).toBeUndefined();
    expect(withoutFormulas.data[0][2]).toBe(5);
    expect(withoutFormulas.formulas).toEqual([{ row: 0, col: 2, formula: 'SUM(A1:B1)' }]);
  });

  it('should shift a live formula back out of the promoted header row and dropped row-header column', () => {
    const sheet = createSheetSnapshot('Data');

    // Sheet row 0 is the promoted header row and sheet column 0 the row-header column, so the
    // window origin is (1, 1). The export wrote the grid's `=B1*0.2` as `C2*0.2`; the import has to
    // put it back.
    sheet.rows = [
      [text('#'), text('Name'), text('Bonus')],
      [text('1'), text('Ana'), cell({ value: null, formula: { text: 'C2*0.2', result: 840.1 } })],
    ];

    const { result, dropped } = map(
      workbook(sheet),
      { colHeaders: 'firstRow', rowHeaders: true },
      { formulasEnabled: true, commentsEnabled: false }
    );

    expect(result.data[0][1]).toBe('=B1*0.2');
    expect(result.formulas).toBeUndefined();
    expect(dropped.list()).not.toContain('formula:outOfRange');
  });

  it('should shift an absolute reference with the window too, keeping its $ markers', () => {
    const sheet = createSheetSnapshot('Data');

    // The export wrote the grid's `=$B$1*0.2` as `$C$2*0.2`: a header band is a translation of the
    // whole coordinate space, so `$` does not pin a reference against it.
    sheet.rows = [
      [text('#'), text('Name'), text('Bonus')],
      [text('1'), text('Ana'), cell({ value: null, formula: { text: '$C$2*0.2', result: 840.1 } })],
    ];

    const { result, dropped } = map(
      workbook(sheet),
      { colHeaders: 'firstRow', rowHeaders: true },
      { formulasEnabled: true, commentsEnabled: false }
    );

    expect(result.data[0][1]).toBe('=$B$1*0.2');
    expect(result.formulas).toBeUndefined();
    expect(dropped.list()).not.toContain('formula:outOfRange');
  });

  it('should keep a cross-sheet reference where it is while shifting the same-sheet ones', () => {
    const sheet = createSheetSnapshot('Data');
    const rates = createSheetSnapshot('Rates');

    // The header band is dropped from THIS sheet only. `Rates!A1` still means the first cell of
    // `Rates`, so shifting it would point the formula one row too high - or, for row 1, drop it.
    sheet.rows = [
      [text('Name'), text('Salary'), text('Bonus')],
      [text('Ana'), text('4200'), cell({ value: null, formula: { text: 'B2*Rates!A1', result: 840 } })],
    ];

    const { result, dropped } = map(
      workbook(sheet, rates),
      { colHeaders: 'firstRow' },
      { formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['rates']) }
    );

    expect(result.data[0][2]).toBe('=B1*Rates!A1');
    expect(result.formulas).toBeUndefined();
    expect(dropped.list()).not.toContain('formula:outOfRange');
  });

  it('should import the cached value of a formula naming a sheet the Formulas engine does not hold', () => {
    // HyperFormula has no `Rates` sheet, so the live formula showed `#REF!` - and so did every
    // formula depending on it - while the file carried the value it evaluated to.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [cell({ value: null, formula: { text: 'Rates!A1*2', result: 10 } }),
        cell({ value: null, formula: { text: 'A1+1', result: 11 } }),
        cell({ value: null, formula: { text: '\'My Rates\'!$A$1+1', result: 6 } }),
        cell({ value: null, formula: { text: 'LEN("Rates!A1")', result: 8 } })],
    ];

    const { result, dropped } = map(
      workbook(sheet),
      {},
      { formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['sheet1']) }
    );

    expect(result.data[0]).toEqual([10, '=A1+1', 6, '=LEN("Rates!A1")']);
    expect(result.formulas).toEqual([
      { row: 0, col: 0, formula: 'Rates!A1*2' },
      { row: 0, col: 2, formula: '\'My Rates\'!$A$1+1' },
    ]);
    expect(dropped.list()).toContain('formula:otherSheet');
    expect(dropped.list()).not.toContain('formula:outOfRange');
  });

  it('should keep a formula live when the Formulas engine holds the sheet it names, in any case', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: null, formula: { text: '\'My Rates\'!A1*2', result: 10 } })]];

    const { result, dropped } = map(
      workbook(sheet),
      {},
      { formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['my rates']) }
    );

    expect(result.data[0][0]).toBe('=\'My Rates\'!A1*2');
    expect(dropped.list()).toEqual([]);
  });

  it('should drop the qualifier naming the imported sheet and shift it with the header row', () => {
    // `Sheet1!B2` in `Sheet1` is a reference into this very sheet, so the dropped header moves it
    // like `B2`. Kept qualified and unshifted, it read the formula cell below instead of the 10.
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [
      [text('A'), text('B')],
      [cell({ value: 1 }), cell({ value: 10 })],
      [cell({ value: null, formula: { text: 'Sheet1!B2*2', result: 20 } }),
        cell({ value: null, formula: { text: 'B2*2', result: 20 } })],
    ];

    const { result, dropped } = map(
      workbook(sheet),
      { colHeaders: 'firstRow' },
      { formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['sheet1']) }
    );

    expect(result.data[1]).toEqual(['=B1*2', '=B1*2']);
    expect(dropped.list()).toEqual([]);
  });

  it('should keep a formula naming the imported sheet live when the engine calls its sheet otherwise', () => {
    // The grid holds the imported sheet as the engine's `Sheet1`, so `Data!A1` in `Data` is `A1`,
    // not a reference to a sheet the engine lacks.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: 5 })], [cell({ value: null, formula: { text: 'Data!A1*2', result: 10 } })]];

    const { result, dropped } = map(
      workbook(sheet),
      {},
      { formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['sheet1']) }
    );

    expect(result.data[1][0]).toBe('=A1*2');
    expect(result.formulas).toBeUndefined();
    expect(dropped.list()).not.toContain('formula:otherSheet');
  });

  describe('a qualifier spelled like the grid\'s own engine sheet', () => {
    /**
     * Maps the second sheet of a workbook whose first sheet is `firstName`, into a grid whose
     * Formulas engine holds `engineSheets` and calls the grid's own sheet `ownSheet`.
     *
     * @param {string} firstName The name of the workbook's first sheet.
     * @param {string} formula The formula on the imported sheet's B1.
     * @param {object} engine What the Formulas engine holds.
     * @param {string[]} engine.engineSheets The engine's sheet names, lower-cased.
     * @param {string} engine.ownSheet The engine's name for the grid's own sheet.
     * @returns {object}
     */
    function mapSecondSheet(firstName, formula, { engineSheets, ownSheet }) {
      const first = createSheetSnapshot(firstName);
      const second = createSheetSnapshot('Sheet2');

      first.rows = [[cell({ value: 100 })]];
      second.rows = [[cell({ value: 7 }), cell({ value: null, formula: { text: formula, result: 200 } })]];

      return map(workbook(first, second), { sheet: 'Sheet2' }, {
        formulasEnabled: true,
        commentsEnabled: false,
        formulaSheetNames: new Set(engineSheets),
        formulaSheetName: ownSheet,
      });
    }

    it('should import the cached value when it names another sheet of the workbook (default Sheet1)', () => {
      // The import replaces the engine's `Sheet1` with `Sheet2`'s cells, so a live `Sheet1!A1*2`
      // read the grid's own A1 (7) and showed 14 where the file says 200.
      const { result, dropped } = mapSecondSheet('Sheet1', 'Sheet1!A1*2', {
        engineSheets: ['sheet1'], ownSheet: 'Sheet1',
      });

      expect(result.data[0]).toEqual([7, 200]);
      expect(result.formulas).toEqual([{ row: 0, col: 1, formula: 'Sheet1!A1*2' }]);
      expect(dropped.list()).toContain('formula:otherSheet');
    });

    it('should import the cached value when it names another sheet of the workbook (custom sheetName)', () => {
      const { result, dropped } = mapSecondSheet('Data', 'data!A1*2', {
        engineSheets: ['data'], ownSheet: 'Data',
      });

      expect(result.data[0]).toEqual([7, 200]);
      expect(dropped.list()).toContain('formula:otherSheet');
    });

    it('should keep live a sheet another grid holds in a shared engine', () => {
      // This grid is the engine's `Sheet2`; `Data` belongs to another grid, so it really is the
      // sheet the formula reads.
      const { result, dropped } = mapSecondSheet('Data', 'Data!A1*2', {
        engineSheets: ['data', 'sheet2'], ownSheet: 'Sheet2',
      });

      expect(result.data[0]).toEqual([7, '=Data!A1*2']);
      expect(dropped.list()).not.toContain('formula:otherSheet');
    });

    it('should keep live a reference to the grid\'s own sheet the workbook does not hold', () => {
      // No sheet of the workbook carries the name, so it cannot mean one of them.
      const { result, dropped } = mapSecondSheet('Rates', 'Sheet1!A1*2', {
        engineSheets: ['sheet1'], ownSheet: 'Sheet1',
      });

      expect(result.data[0]).toEqual([7, '=Sheet1!A1*2']);
      expect(dropped.list()).not.toContain('formula:otherSheet');
    });
  });

  it('should import the cached value of an external-workbook or unquoted 3D reference', () => {
    // The match for the qualifier starts after `[1]` and after `Sheet1:`, so `Sheet1` and `Sheet3`
    // read as sheets the engine holds; live, HyperFormula showed `#ERROR!` and `#NAME?`.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[
      cell({ value: null, formula: { text: '[1]Sheet1!A1', result: 42 } }),
      cell({ value: null, formula: { text: 'SUM(Sheet1:Sheet3!A1)', result: 8 } }),
    ]];

    const { result, dropped } = map(
      workbook(sheet),
      {},
      { formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['sheet1', 'sheet2', 'sheet3']) }
    );

    expect(result.data[0]).toEqual([42, 8]);
    expect(result.formulas).toEqual([
      { row: 0, col: 0, formula: '[1]Sheet1!A1' },
      { row: 0, col: 1, formula: 'SUM(Sheet1:Sheet3!A1)' },
    ]);
    expect(dropped.list()).toContain('formula:otherSheet');
  });

  describe('defined-name and unknown-sheet guards', () => {
    const context = {
      formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['calc', 'data']),
    };

    /**
     * Maps one row of cells on a sheet named `Calc`, in a workbook that defines `names`.
     *
     * @param {object[]} row The cells.
     * @param {object} [settings] The workbook's names and the import options.
     * @param {string[]} [settings.names] The names the workbook defines.
     * @param {object} [settings.options] The import options.
     * @returns {object}
     */
    function mapRow(row, { names = [], options = {} } = {}) {
      const sheet = createSheetSnapshot('Calc');
      const wb = workbook(sheet);

      sheet.rows = [row];
      wb.definedNames = names.map(name => ({ name, formula: '1', sheetName: null }));

      return map(wb, options, context);
    }

    it('should keep a function call live when the workbook defines a name spelled like it', () => {
      const { result, dropped } = mapRow([cell({ formula: { text: 'RATE(12,-100,1000)', result: 1 } })], {
        names: ['Rate'],
      });

      expect(result.data[0][0]).toBe('=RATE(12,-100,1000)');
      expect(dropped.list()).not.toContain('formula:definedName');
    });

    it('should keep a sheet reference live when the workbook defines a name spelled like the sheet', () => {
      const { result } = mapRow([cell({ formula: { text: 'SUM(Data!A1:A3)', result: 6 } })], { names: ['Data'] });

      expect(result.data[0][0]).toBe('=SUM(Data!A1:A3)');
    });

    it('should not report another-sheet loss when live formulas are off', () => {
      const { dropped } = mapRow([cell({ formula: { text: 'Rates!A1', result: 1 } })], {
        options: { importFormulas: false },
      });

      expect(dropped.list()).not.toContain('formula:otherSheet');
    });
  });

  it('should report a formula imported as a value that carries no cached value', () => {
    // openpyxl writes formulas without `<v>`. With the Formulas plugin off the cell imports empty,
    // so the warning has to say why.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [cell({ value: 5 }), cell({ value: null, formula: { text: 'A1>3' } })],
      [cell({ value: null, formula: { text: 'A1+1', result: 6 } }), null],
    ];

    const off = map(workbook(sheet));

    expect(off.result.data).toEqual([[5, null], [6, null]]);
    expect(off.result.formulas).toEqual([{ row: 0, col: 1, formula: 'A1>3' }, { row: 1, col: 0, formula: 'A1+1' }]);
    expect(off.dropped.list()).toEqual(['formula:noCachedValue']);

    const values = map(workbook(sheet), { importFormulas: false }, { formulasEnabled: true, commentsEnabled: false });

    expect(values.dropped.list()).toEqual(['formula:noCachedValue']);

    const live = map(workbook(sheet), {}, { formulasEnabled: true, commentsEnabled: false });

    expect(live.result.data[0][1]).toBe('=A1>3');
    expect(live.dropped.list()).toEqual([]);
  });

  it('should not report a formula with a cached value imported as a value', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: null, formula: { text: 'A1+1', result: 0 } })]];

    expect(map(workbook(sheet)).dropped.list()).toEqual([]);
  });

  it('should strip the _xlfn., _xlws. and _xlpm. prefixes Excel stores, from live and recorded formulas', () => {
    // Excel stores every post-2007 function with a prefix the formula bar never shows; handed to
    // HyperFormula verbatim, `_xlfn.STDEV.S(...)` is an unknown name and the cell shows `#NAME?`.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('Value'), text('Spread')],
      [cell({ value: 1 }), cell({ value: null, formula: { text: '_xlfn.STDEV.S(A2:A4)', result: 1 } })],
      [cell({ value: 2 }), cell({ value: null, formula: { text: '_xlfn._xlws.SORT(A2:A4)', result: 1 } })],
      [cell({ value: 3 }), cell({ value: null, formula: { text: '_xlfn.LET(_xlpm.x,A4,_xlpm.x*2)', result: 6 } })],
    ];

    const live = map(workbook(sheet), { colHeaders: 'firstRow' }, { formulasEnabled: true, commentsEnabled: false });

    expect(live.result.data.map(row => row[1])).toEqual(['=STDEV.S(A1:A3)', '=SORT(A1:A3)', '=LET(x,A3,x*2)']);

    const recorded = map(workbook(sheet), { colHeaders: 'firstRow' }).result;

    expect(recorded.formulas.map(entry => entry.formula))
      .toEqual(['STDEV.S(A2:A4)', 'SORT(A2:A4)', 'LET(x,A4,x*2)']);
  });

  describe('bare TRUE and FALSE', () => {
    /**
     * Imports one formula live into a one-cell sheet and answers the grid's text.
     *
     * @param {string} formulaText The formula as the file stores it, without `=`.
     * @returns {string}
     */
    function importedFormula(formulaText) {
      const sheet = createSheetSnapshot('Data');

      sheet.rows = [[cell({ value: 1 }), cell({ value: null, formula: { text: formulaText, result: 1 } })]];

      // The engine holds a sheet named `TRUE`, so a qualifier spelled like it stays live.
      return map(workbook(sheet), {}, {
        formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['true', 'sheet1']),
      }).result.data[0][1];
    }

    it('should rewrite a bare boolean literal to a call, whatever its case', () => {
      expect(importedFormula('IF(TRUE,1,2)')).toBe('=IF(TRUE(),1,2)');
      expect(importedFormula('IFS(A1>1,"a",true,"b")')).toBe('=IFS(A1>1,"a",TRUE(),"b")');
      expect(importedFormula('AND(A1,False)')).toBe('=AND(A1,FALSE())');
      expect(importedFormula('IF(TRUE,FALSE,TRUE)')).toBe('=IF(TRUE(),FALSE(),TRUE())');
    });

    it('should leave a call, a string, a longer name, a sheet and a qualified name alone', () => {
      expect(importedFormula('TRUE()')).toBe('=TRUE()');
      expect(importedFormula('"TRUE"&A1')).toBe('="TRUE"&A1');
      expect(importedFormula('"say ""true"""&A1')).toBe('="say ""true"""&A1');
      expect(importedFormula('TRUEVALUE')).toBe('=TRUEVALUE');
      expect(importedFormula('MYTRUE+A1')).toBe('=MYTRUE+A1');
      expect(importedFormula('TRUE!A1')).toBe('=TRUE!A1');
      expect(importedFormula('\'TRUE\'!A1')).toBe('=\'TRUE\'!A1');
      expect(importedFormula('Sheet1!TRUE')).toBe('=Sheet1!TRUE');
      expect(importedFormula('Tbl[TRUE]')).toBe('=Tbl[TRUE]');
      expect(importedFormula('Tbl[@TRUE]')).toBe('=Tbl[@TRUE]');
      expect(importedFormula('A.TRUE+1')).toBe('=A.TRUE+1');
    });

    it('should rewrite after the prefix strip and record the formula as the file holds it', () => {
      expect(importedFormula('_xlfn.IFS(TRUE,1)')).toBe('=IFS(TRUE(),1)');

      const sheet = createSheetSnapshot('Data');

      sheet.rows = [[cell({ value: 1 }), cell({ value: null, formula: { text: 'IF(TRUE,A1,2)', result: 1 } })]];

      const { result } = map(workbook(sheet), {});

      expect(result.formulas.map(entry => entry.formula)).toEqual(['IF(TRUE,A1,2)']);
      expect(result.data[0][1]).toBe(1);
    });

    it('should rewrite a defined name\'s definition', () => {
      const sheet = createSheetSnapshot('Data');

      sheet.rows = [[cell({ value: 1 }), cell({ value: null, formula: { text: 'IF(Flag,1,2)', result: 1 } })]];

      const wb = workbook(sheet);

      wb.definedNames = [{ name: 'Flag', formula: 'TRUE', sheetName: null }];

      const { result } = map(wb, {}, {
        formulasEnabled: true,
        commentsEnabled: false,
        formulaSheetName: 'Data',
        formulaSheetNames: new Set(['data']),
        formulaNamedExpressions: new Set(),
        canAddNamedExpression: () => true,
      });

      expect(result.namedExpressions).toEqual([{ name: 'Flag', formula: 'TRUE()' }]);
    });
  });

  it('should strip the prefixes on a formula that needs no shift', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: 1 }), cell({ value: null, formula: { text: '_xlfn.IFS(A1>0,"y")', result: 'y' } })]];

    const { result } = map(workbook(sheet), {}, { formulasEnabled: true, commentsEnabled: false });

    expect(result.data[0][1]).toBe('=IFS(A1>0,"y")');
  });

  it('should refuse a workbook whose formulas would cost more shift work than the reader\'s budget', () => {
    // A shift runs a regex over every formula's whole text once the window origin is not (0, 0), so
    // N cells at the 32 768-character formula cap cost N x 32 768 characters of regex work with no
    // other bound. The import charges the same budget the native reader charges a shared formula's
    // translation and refuses past it, before the work it bounds.
    const formula = '1+'.repeat(16384);
    const formulas = Math.floor(MAX_TRANSLATED_FORMULA_CHARS / formula.length) + 1;
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('Header')]];

    for (let row = 0; row < formulas; row++) {
      sheet.rows.push([cell({ value: null, formula: { text: formula, result: 1 } })]);
    }

    let refusal = null;

    try {
      map(workbook(sheet), { colHeaders: 'firstRow' }, { formulasEnabled: true, commentsEnabled: false });
    } catch (error) {
      refusal = error;
    }

    expect(refusal?.message).toMatch(/above the limit this reader accepts/);
    expect(isLimitError(refusal)).toBe(true);
  });

  it('should refuse a workbook whose prefixed formulas would cost more strip work than the budget', () => {
    // With no shift, the `_xlfn.` strip still walks each formula's whole text, so it is charged
    // against the same budget as the shift.
    const formula = `_xlfn.ABS(${'1+'.repeat(16378)}1)`;
    const formulas = Math.floor(MAX_TRANSLATED_FORMULA_CHARS / formula.length) + 1;
    const sheet = createSheetSnapshot('Data');

    sheet.rows = Array.from({ length: formulas }, () => [cell({ value: null, formula: { text: formula, result: 1 } })]);

    let refusal = null;

    try {
      map(workbook(sheet), {}, { formulasEnabled: true, commentsEnabled: false });
    } catch (error) {
      refusal = error;
    }

    expect(refusal?.message).toMatch(/above the limit this reader accepts/);
    expect(isLimitError(refusal)).toBe(true);
  });

  it('should not charge the shift budget for formulas that need no shift', () => {
    const formula = '1+'.repeat(16384);
    const formulas = Math.floor(MAX_TRANSLATED_FORMULA_CHARS / formula.length) + 1;
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [];

    for (let row = 0; row < formulas; row++) {
      sheet.rows.push([cell({ value: null, formula: { text: formula, result: 1 } })]);
    }

    const { result } = map(workbook(sheet), {}, { formulasEnabled: true, commentsEnabled: false });

    expect(result.data).toHaveLength(formulas);
  });

  it('should fall back to the cached value for a formula pointing into the removed header band', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('Name'), text('Rate')],
      [text('Ana'), cell({ value: null, formula: { text: 'B1&" rate"', result: 'Rate rate' } })],
    ];

    const { result, dropped } = map(
      workbook(sheet),
      { colHeaders: 'firstRow' },
      { formulasEnabled: true, commentsEnabled: false }
    );

    expect(result.data[0][1]).toBe('Rate rate');
    expect(result.formulas).toEqual([{ row: 0, col: 1, formula: 'B1&" rate"' }]);
    expect(dropped.list()).toContain('formula:outOfRange');
  });

  it('should escape a text value that starts with = when the formulas plugin is enabled', () => {
    // The cell is a STRING in the file, inert in Excel. The grid hands every `=`-leading string to
    // HyperFormula, so importing it verbatim turns the file's text into a formula it never had.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('=HYPERLINK("http://evil","x")')], [text('plain')]];

    const withFormulas = map(workbook(sheet), {}, { formulasEnabled: true, commentsEnabled: false }).result;
    const withoutFormulas = map(workbook(sheet)).result;

    // The leading apostrophe is the Formulas plugin's own text escape and is unescaped on read, so
    // the cell renders the text the file carried.
    expect(withFormulas.data[0][0]).toBe('\'=HYPERLINK("http://evil","x")');
    expect(withFormulas.data[1][0]).toBe('plain');
    // Without the plugin nothing evaluates the string, and an apostrophe would be part of the value.
    expect(withoutFormulas.data[0][0]).toBe('=HYPERLINK("http://evil","x")');
  });

  it('should escape a text value the grid would read as its own escape marker', () => {
    // The other half of the escape. `'=1+1` is the FILE's text — the apostrophe is a character of
    // the cell, not a marker — and `isEscapedFormulaExpression` (an apostrophe followed by `=`) is
    // exactly the shape the Formulas plugin strips on read, so importing it verbatim hands the
    // grid the file's own apostrophe to eat. A value whose apostrophe is NOT followed by `=` is
    // left alone, because the plugin leaves it alone too: the marker is `'=`, never a bare `'`.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('\'=1+1')], [text('\'hello')], [text('it\'s fine')]];

    const withFormulas = map(workbook(sheet), {}, { formulasEnabled: true, commentsEnabled: false }).result;
    const withoutFormulas = map(workbook(sheet)).result;

    expect(withFormulas.data[0][0]).toBe('\'\'=1+1');
    expect(withFormulas.data[1][0]).toBe('\'hello');
    expect(withFormulas.data[2][0]).toBe('it\'s fine');
    // With no plugin to unescape anything, every value keeps exactly what the file carried.
    expect(withoutFormulas.data[0][0]).toBe('\'=1+1');
    expect(withoutFormulas.data[1][0]).toBe('\'hello');
  });

  it('should keep cached values when importFormulas is false', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: null, formula: { text: 'A2', result: 'x' } })]];

    const { result } = map(
      workbook(sheet), { importFormulas: false }, { formulasEnabled: true, commentsEnabled: false }
    );

    expect(result.data).toEqual([['x']]);
    expect(result.formulas).toEqual([{ row: 0, col: 0, formula: 'A2' }]);
  });

  it('should turn list validations into dropdown columns and drop unresolvable ones', () => {
    const data = createSheetSnapshot('Data');
    const helper = createSheetSnapshot('_HotValidation');

    helper.state = 'veryHidden';
    helper.rows = [[text('Open')], [text('Closed')]];
    const listValidation = { type: 'list', allowBlank: true, formulae: ['\'_HotValidation\'!$A$1:$A$2'] };

    data.rows = [
      [cell({ value: 'Open', validation: listValidation }),
        cell({ value: 'a', validation: { type: 'list', allowBlank: true, formulae: ['INDIRECT("x")'] } })],
      [cell({ value: 'Closed', validation: listValidation }), text('b')],
    ];

    const { result, dropped } = map(workbook(data, helper));

    expect(result.columns[0]).toEqual({ type: 'dropdown', source: ['Open', 'Closed'] });
    expect(result.columns[1]).toEqual({ type: 'text' });
    expect(dropped.list()).toEqual(['dataValidation:unresolvedList']);
    expect(result.sheetNames).toEqual(['Data', '_HotValidation']);
  });

  it('should keep a validation over a sparse sheet to the columns the sheet uses', () => {
    // A ~1 kB part: values in A1 and A1000 under a five-column dimension, and one list validation
    // over the whole rectangle. Clamped to the dimension, the reader filled every slot of it and
    // the mapper kept one meta entry per slot, which at A1:E1000000 is a GB-class heap.
    const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
    const sheet = parseWorksheet(`<worksheet ${ns}><dimension ref="A1:E1000"/><sheetData>`
      + '<row r="1"><c r="A1"><v>1</v></c></row><row r="1000"><c r="A1000"><v>2</v></c></row></sheetData>'
      + '<dataValidations count="1"><dataValidation type="list" sqref="A1:E1000">'
      + '<formula1>"a,b"</formula1></dataValidation></dataValidations></worksheet>', {
      name: 'Data',
      state: 'visible',
      styles: EMPTY_STYLES,
      sharedStrings: { strings: [], rich: [] },
      comments: new Map(),
      date1904: false,
      dropped: new DroppedFeatures(),
      budget: { declaredCells: 0 },
    });

    const { result } = map(workbook(sheet));

    expect(result.data.length).toBe(1000);
    expect(result.data.every(row => row.length === 1)).toBe(true);
    expect(result.columns.length).toBe(1);
    expect(result.columns[0]).toEqual(expect.objectContaining({ type: 'dropdown', source: ['a', 'b'] }));
    expect(result.cellsMeta ?? []).toEqual([]);
  });

  it('should keep a function or a name that starts like a cell intact in a shared formula read by the built-in engine', () => {
    // `HEX2` is a cell, so the copies of a shared `HEX2DEC(A2)` read `HEX3DEC(A3)` and
    // `HEX4DEC(A4)`, and the header shift turned the master into `HEX1DEC(A1)`.
    const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
    const shared = (formula, cached) => `<c r="B2"><f t="shared" ref="B2:B4" si="0">${formula}</f><v>${cached}</v></c>`;
    const copy = (ref, cached) => `<c r="${ref}"><f t="shared" si="0"/><v>${cached}</v></c>`;
    const label = (ref, value) => `<c r="${ref}" t="inlineStr"><is><t>${value}</t></is></c>`;
    const read = master => parseWorksheet(`<worksheet ${ns}><sheetData>`
      + `<row r="1">${label('A1', 'Hex')}${label('B1', 'Dec')}</row>`
      + `<row r="2"><c r="A2"><v>12</v></c>${shared(master, 18)}</row>`
      + `<row r="3"><c r="A3"><v>13</v></c>${copy('B3', 19)}</row>`
      + `<row r="4"><c r="A4"><v>14</v></c>${copy('B4', 20)}</row>`
      + '</sheetData></worksheet>', {
      name: 'Sheet1',
      state: 'visible',
      styles: EMPTY_STYLES,
      sharedStrings: { strings: [], rich: [] },
      comments: new Map(),
      date1904: false,
      dropped: new DroppedFeatures(),
      budget: { declaredCells: 0 },
    });
    const context = { formulasEnabled: true, commentsEnabled: false, formulaSheetNames: new Set(['sheet1']) };

    const hex = map(workbook(read('HEX2DEC(A2)')), { colHeaders: 'firstRow' }, context);

    expect(hex.result.data.map(row => row[1])).toEqual(['=HEX2DEC(A1)', '=HEX2DEC(A2)', '=HEX2DEC(A3)']);

    const namedWorkbook = workbook(read('Q1Sales*A2'));

    namedWorkbook.definedNames = [{ name: 'Q1Sales', formula: 'Data!$A$1', sheetName: null }];

    const named = map(namedWorkbook, { colHeaders: 'firstRow' }, context);

    expect(named.result.data.map(row => row[1])).toEqual([18, 19, 20]);
    expect(named.result.formulas.map(({ formula }) => formula)).toEqual(['Q1Sales*A2', 'Q1Sales*A3', 'Q1Sales*A4']);
    expect(named.dropped.list()).toContain('formula:definedName');
  });

  it('should resolve one list formula once per pass and share the dropdown meta across its cells', () => {
    const data = createSheetSnapshot('Data');
    const helper = createSheetSnapshot('_HotValidation');
    const validation = { type: 'list', allowBlank: true, formulae: ['\'_HotValidation\'!$A$1:$A$2'] };

    helper.rows = [[text('Open')], [text('Closed')]];
    // Two columns, three rows each, all pointing at the same range: six validated cells.
    data.rows = [
      [cell({ value: 'Open', validation }), cell({ value: 'Closed', validation })],
      [cell({ value: 'Open', validation }), cell({ value: 'Open', validation })],
      [cell({ value: 'Closed', validation }), cell({ value: 'Closed', validation })],
    ];

    const { result } = map(workbook(data, helper));

    expect(result.columns[0]).toEqual({ type: 'dropdown', source: ['Open', 'Closed'] });
    // The same object, not an equal copy: the range was read once and the meta reused, so a
    // 100k-row dropdown column costs one range walk rather than one per cell.
    expect(result.columns[1]).toBe(result.columns[0]);
  });

  it('should turn a same-sheet list range into a dropdown column', () => {
    const data = createSheetSnapshot('Data');

    // How Excel stores a list validation whose source range is on the same sheet: no sheet name.
    // The options live in a column outside the list's own, as a real workbook lays them out.
    data.rows = [
      [cell({ value: 'Yes', validation: { type: 'list', allowBlank: true, formulae: ['$C$1:$C$2'] } }),
        text('x'), text('Yes')],
      [cell({ value: 'No', validation: { type: 'list', allowBlank: true, formulae: ['$C$1:$C$2'] } }),
        text('y'), text('No')],
    ];

    const { result, dropped } = map(workbook(data));

    expect(result.columns[0]).toEqual({ type: 'dropdown', source: ['Yes', 'No'] });
    expect(dropped.list()).not.toContain('dataValidation:unresolvedList');
  });

  it('should report styling as dropped and map conditional formatting into grid coordinates', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: 'x', style: { alignment: null, font: { bold: true }, fill: null, border: null } })]];
    sheet.conditionalFormatting = [{ ref: 'A1:A1', rules: [] }];

    const { result, dropped } = map(workbook(sheet));

    expect(dropped.list()).toEqual(['cellStyles']);
    expect(result.cellsMeta).toBeUndefined();
    expect(result.conditionalFormatting).toEqual([{ rows: [0, 0], cols: [0, 0], rules: [] }]);
  });

  describe('a note on the promoted header band', () => {
    const commentsOn = { formulasEnabled: false, commentsEnabled: true, customBordersEnabled: false };

    it('should report a note on a promoted header cell, which a column header cannot hold', () => {
      const sheet = createSheetSnapshot('Data');

      sheet.rows = [
        [cell({ value: 'Name', comment: 'header note' }), text('Qty')],
        [text('x'), cell({ value: 1, comment: 'data note' })],
      ];

      const { result, dropped } = map(workbook(sheet), { colHeaders: 'firstRow' }, commentsOn);

      expect(result.colHeaders).toEqual(['Name', 'Qty']);
      expect(result.comments).toEqual([{ row: 0, col: 1, value: 'data note' }]);
      expect(dropped.list()).toEqual(['comment:header']);
    });

    it('should report a note on any row of a nested header band, with the Comments plugin off too', () => {
      const sheet = createSheetSnapshot('Data');

      sheet.rows = [
        [text('Group'), text('')],
        [text('Name'), cell({ value: 'Qty', comment: 'second header row' })],
        [text('x'), cell({ value: 1 })],
      ];

      const on = map(workbook(sheet), { colHeaders: 'firstRow', headerRows: 2 }, commentsOn);
      const off = map(workbook(sheet), { colHeaders: 'firstRow', headerRows: 2 });

      expect(on.dropped.list()).toEqual(['comment:header']);
      expect(off.dropped.list()).toEqual(['comment:header']);
    });

    it('should not report a note outside the band: on the first data row, or on row 0 without promotion', () => {
      const sheet = createSheetSnapshot('Data');

      sheet.rows = [
        [text('Name'), text('Qty')],
        [cell({ value: 'x', comment: 'data note' }), cell({ value: 1 })],
      ];

      const promoted = map(workbook(sheet), { colHeaders: 'firstRow' }, commentsOn);

      expect(promoted.result.comments).toEqual([{ row: 0, col: 0, value: 'data note' }]);
      expect(promoted.dropped.list()).toEqual([]);

      const headerNote = createSheetSnapshot('Data');

      headerNote.rows = [[cell({ value: 'Name', comment: 'row 0 note' })], [text('x')]];

      const plain = map(workbook(headerNote), {}, commentsOn);

      expect(plain.result.comments).toEqual([{ row: 0, col: 0, value: 'row 0 note' }]);
      expect(plain.dropped.list()).toEqual([]);
    });

    it('should not report a header note outside the imported columns', () => {
      const sheet = createSheetSnapshot('Data');

      sheet.rows = [
        [cell({ value: '#', comment: 'row-header column' }), text('Name')],
        [text('1'), text('x')],
      ];

      const { dropped } = map(workbook(sheet), { colHeaders: 'firstRow', rowHeaders: true }, commentsOn);

      expect(dropped.list()).toEqual([]);
    });
  });

  it('should map locked cells to readOnly only under sheet protection, and comments when the plugin is on', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[
      cell({ value: 'a', locked: true, comment: 'note' }),
      cell({ value: 'b', locked: false }),
      cell({ value: 'c' }),
    ]];

    const unprotected = map(workbook(sheet), {}, { formulasEnabled: false, commentsEnabled: true }).result;

    expect(unprotected.cellsMeta).toBeUndefined();
    expect(unprotected.comments).toEqual([{ row: 0, col: 0, value: 'note' }]);

    sheet.protection = { enabled: true, password: null, options: {} };

    const protectedResult = map(workbook(sheet)).result;

    // One row, so a locked cell is a locked column: `readOnly` follows the cell → column cascade.
    expect(protectedResult.columns).toEqual([
      { type: 'text', readOnly: true }, { type: 'text' }, { type: 'text', readOnly: true },
    ]);
    expect(protectedResult.cellsMeta).toBeUndefined();
    expect(protectedResult.comments).toBeUndefined();
  });

  it('should import a blank cell on a protected sheet as read-only, like its filled neighbours', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.protection = { enabled: true, password: null, options: {} };
    sheet.rows = [[text('a'), null], [text('b'), text('c')]];

    const { result } = map(workbook(sheet));

    expect(result.columns).toEqual([{ type: 'text', readOnly: true }, { type: 'text', readOnly: true }]);
    expect(result.cellsMeta).toBeUndefined();
  });

  it('should omit columns entirely when no column has anything to say', () => {
    // An array `columns` pins the grid's column count and replaces any `columns` the grid had, so
    // it is only worth sending when it carries something.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: null }), cell({ value: null })]];

    expect(map(workbook(sheet)).result.columns).toBeUndefined();
    expect(map(workbook(sheet), { inferCellTypes: false }).result.columns).toBeUndefined();
  });

  it('should still lift readOnly to columns when cell types are not inferred', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.protection = { enabled: true, password: null, options: {} };
    sheet.rows = [[text('a')]];

    expect(map(workbook(sheet), { inferCellTypes: false }).result.columns).toEqual([{ readOnly: true }]);
  });

  it('should report a number format it could not invert, and still type the column numeric', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: 42, numFmt: '0.00E+00' })], [cell({ value: 7, numFmt: '0.00E+00' })]];

    const { result, dropped } = map(workbook(sheet));

    expect(result.columns).toEqual([{ type: 'numeric' }]);
    expect(dropped.list()).toEqual(['numFmt:0.00E+00']);
  });

  it('should report an unsupported number format once per distinct format, not once per cell', () => {
    // `recordUnsupported` bounds and copies the whole format string on every call, so calling it
    // per cell made a long format on many cells cost one string walk per cell.
    const sheet = createSheetSnapshot('Data');

    sheet.rows = Array.from({ length: 500 }, (_, row) => [cell({ value: row, numFmt: '0.00E+00' })]);

    const dropped = new DroppedFeatures();
    const recordUnsupported = jest.spyOn(dropped, 'recordUnsupported');

    mapWorkbook(workbook(sheet), resolveImportOptions({}), { formulasEnabled: false, commentsEnabled: false }, dropped);

    expect(recordUnsupported).toHaveBeenCalledTimes(1);
    expect(dropped.list()).toEqual(['numFmt:0.00E+00']);
  });

  it('should skip layout when importLayout is false and types when inferCellTypes is false', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: 1, numFmt: '0' })]];
    sheet.merges = [{ row: 0, col: 0, rowspan: 1, colspan: 1 }];
    sheet.colWidths = [10];

    const { result } = map(workbook(sheet), { importLayout: false, inferCellTypes: false });

    expect(result.columns).toBeUndefined();
    expect(result.mergeCells).toBeUndefined();
    expect(result.colWidths).toBeUndefined();
    expect(result.data).toEqual([[1]]);
  });

  it('should report the sheet layout direction, and only under importLayout', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('a')]];

    expect(map(workbook(sheet)).result.layoutDirection).toBe('ltr');

    sheet.rtl = true;

    expect(map(workbook(sheet)).result.layoutDirection).toBe('rtl');
    expect(map(workbook(sheet), { importLayout: false }).result.layoutDirection).toBeUndefined();
  });
});

describe('mapWorkbook – importStyles', () => {
  const styled = () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[
      cell({
        value: 'bold red',
        style: {
          alignment: { horizontal: 'center' },
          font: { bold: true, color: { argb: 'FFFF0000' } },
          fill: null,
          border: null,
        },
      }),
      cell({
        value: 'filled',
        style: {
          alignment: null,
          font: null,
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } },
          border: null,
        },
      }),
      cell({
        value: 'bordered',
        style: {
          alignment: null,
          font: null,
          fill: null,
          border: { top: { style: 'thin', color: { argb: 'FF0000FF' } } },
        },
      }),
      cell({
        value: 'bold red too',
        style: {
          alignment: null, font: { bold: true, color: { argb: 'FFFF0000' } }, fill: null, border: null,
        },
      }),
    ]];

    return workbook(sheet);
  };
  const ctx = { formulasEnabled: false, commentsEnabled: false, customBordersEnabled: true };

  it('should keep reporting cellStyles as dropped when importStyles is false', () => {
    const { result, dropped } = map(styled(), {}, ctx);

    expect(dropped.list()).toEqual(['cellStyles']);
    expect(result.styles).toBeUndefined();
    expect(result.customBorders).toBeUndefined();
    expect(result.cellsMeta).toBeUndefined();
  });

  it('should emit class names, one rule per distinct style, and border entries when importStyles is true', () => {
    const { result, dropped } = map(styled(), { importStyles: true }, ctx);
    const ruleNames = Object.keys(result.styles);

    expect(ruleNames).toHaveLength(2);
    expect(result.styles[ruleNames[0]]).toBe('font-weight:bold;color:#ff0000');
    expect(result.styles[ruleNames[1]]).toBe('background-color:#00ff00');
    // A one-row sheet: every class is column-wide, so it lands on `columns`, not `cellsMeta`.
    expect(result.columns.map(column => column.className)).toEqual([
      `htCenter ${ruleNames[0]}`, ruleNames[1], undefined, ruleNames[0],
    ]);
    expect(result.cellsMeta).toBeUndefined();
    expect(result.customBorders).toEqual([{ row: 0, col: 2, top: { width: 1, color: '#0000ff' } }]);
    expect(dropped.list()).toEqual([]);
  });

  it('should merge className into an existing per-cell meta entry', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.protection = { enabled: true, password: null, options: {} };
    sheet.rows = [[
      cell({
        value: 'x',
        locked: true,
        style: { alignment: { horizontal: 'right' }, font: null, fill: null, border: null },
      }),
    ]];

    const { result } = map(workbook(sheet), { importStyles: true }, ctx);

    expect(result.columns).toEqual([{ type: 'text', readOnly: true, className: 'htRight' }]);
    expect(result.cellsMeta).toBeUndefined();
  });

  it('should keep per-cell readOnly and className when a column does not agree', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.protection = { enabled: true, password: null, options: {} };
    sheet.rows = [
      [cell({
        value: 'x', locked: true, style: { alignment: { horizontal: 'right' }, font: null, fill: null, border: null },
      })],
      [cell({ value: 'y', locked: false })],
    ];

    const { result } = map(workbook(sheet), { importStyles: true }, ctx);

    expect(result.columns).toEqual([{ type: 'text' }]);
    expect(result.cellsMeta).toEqual([{ row: 0, col: 0, meta: { readOnly: true, className: 'htRight' } }]);
  });

  it('should report comments as dropped when the comments plugin is off', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: 'a', comment: 'note' }), cell({ value: 'b' })]];

    const { result, dropped } = map(workbook(sheet), {}, { ...ctx, commentsEnabled: false });

    expect(result.comments).toBeUndefined();
    expect(dropped.list()).toEqual(['comments']);
  });

  it('should report borders as dropped when the customBorders plugin is off', () => {
    const { result, dropped } = map(styled(), { importStyles: true }, { ...ctx, customBordersEnabled: false });

    expect(result.customBorders).toBeUndefined();
    expect(dropped.list()).toEqual(['cellStyles:borders']);
  });

  it('should skip the read-only sentinel colors on protected locked cells', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.protection = { enabled: true, password: null, options: {} };
    sheet.rows = [[
      cell({
        value: 'ro',
        locked: true,
        style: {
          alignment: null,
          font: { color: { argb: 'FF808080' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } },
          border: null,
        },
      }),
    ]];

    const { result } = map(workbook(sheet), { importStyles: true }, ctx);

    expect(result.styles).toBeUndefined();
    expect(result.columns).toEqual([{ type: 'text', readOnly: true }]);
    expect(result.cellsMeta).toBeUndefined();
  });
});

describe('mapWorkbook – headerRows', () => {
  function nestedSheet() {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('Team'), null, text('Totals')],
      [text('Name'), text('Role'), text('Revenue')],
      [text('Ana García'), text('Analyst'), cell({ value: 4200.5 })],
      [text('Li Wei'), text('Engineer'), cell({ value: 950.25 })],
    ];
    // Exactly what the export writes for `nestedHeaders`: a colspan group merged across one header
    // row, and a single-column header merged DOWN through both header rows.
    sheet.merges = [
      { row: 0, col: 0, rowspan: 1, colspan: 2 },
      { row: 0, col: 2, rowspan: 2, colspan: 1 },
    ];

    return sheet;
  }

  it('should build nested headers from the header band and start the data after it', () => {
    const { result } = map(workbook(nestedSheet()), { colHeaders: 'firstRow', headerRows: 2 });

    expect(result.nestedHeaders).toEqual([
      [{ label: 'Team', colspan: 2 }, 'Totals'],
      ['Name', 'Role', ''],
    ]);
    expect(result.colHeaders).toBeUndefined();
    expect(result.data).toEqual([
      ['Ana García', 'Analyst', 4200.5],
      ['Li Wei', 'Engineer', 950.25],
    ]);
  });

  it('should read a nested header label from a formula cell\'s cached result', () => {
    const sheet = nestedSheet();

    sheet.rows[0][0] = cell({ value: null, formula: { text: 'UPPER("group")', result: 'GROUP' } });

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow', headerRows: 2 });

    expect(result.nestedHeaders[0][0]).toEqual(expect.objectContaining({ label: 'GROUP' }));
  });

  it('should keep header-band merges out of mergeCells', () => {
    const { result } = map(workbook(nestedSheet()), { colHeaders: 'firstRow', headerRows: 2 });

    expect(result.mergeCells).toBeUndefined();
  });

  it('should carry a merge that starts in the band but reaches into the data', () => {
    const sheet = nestedSheet();

    sheet.merges.push({ row: 1, col: 0, rowspan: 3, colspan: 1 });

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow', headerRows: 2 });

    expect(result.mergeCells).toEqual([{ row: 0, col: 0, rowspan: 2, colspan: 1 }]);
  });

  it('should escape a nested header label, which the grid renders as HTML', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('<img src=x onerror=alert(1)>')], [text('5 < 10')], [text('a')]];

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow', headerRows: 2 });

    expect(result.nestedHeaders).toEqual([
      ['&lt;img src=x onerror=alert(1)&gt;'],
      ['5 &lt; 10'],
    ]);
  });

  it('should keep the single promoted header row with the default headerRows', () => {
    const { result } = map(workbook(nestedSheet()), { colHeaders: 'firstRow' });

    expect(result.nestedHeaders).toBeUndefined();
    expect(result.colHeaders).toEqual(['Team', '', 'Totals']);
    expect(result.data).toHaveLength(3);
  });

  it('should ignore headerRows without colHeaders: firstRow', () => {
    const { result } = map(workbook(nestedSheet()), { headerRows: 3 });

    expect(result.nestedHeaders).toBeUndefined();
    expect(result.colHeaders).toBeUndefined();
    expect(result.data).toHaveLength(4);
  });

  it('should take the band from the range start and clamp a group at the window edge', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('skip'), text('skip'), text('skip'), text('skip')],
      [text('skip'), text('Group'), null, null],
      [text('skip'), text('Q1'), text('Q2'), text('Q3')],
      [text('skip'), cell({ value: 1 }), cell({ value: 2 }), cell({ value: 3 })],
    ];
    sheet.merges = [{ row: 1, col: 1, rowspan: 1, colspan: 3 }];

    const { result } = map(workbook(sheet), { range: [1, 1, 3, 2], colHeaders: 'firstRow', headerRows: 2 });

    expect(result.nestedHeaders).toEqual([[{ label: 'Group', colspan: 2 }], ['Q1', 'Q2']]);
    expect(result.data).toEqual([[1, 2]]);
  });

  it('should read a band merge\'s label from its origin left of the window, and clamp its colspan to it', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [], // row 0: outside the range, never read.
      [null, text('<img src=x onerror=alert(1)>'), null, null], // band row 0: the merge's origin sits
      // one column left of the window (col 1 < firstCol 2) and reaches through col 3.
      [null, text('skip'), text('Q1'), text('Q2')], // band row 1: no merge, plain labels.
      [null, text('skip'), cell({ value: 1 }), cell({ value: 2 })], // first data row.
    ];
    sheet.merges = [{ row: 1, col: 1, rowspan: 1, colspan: 3 }];

    const { result } = map(workbook(sheet), { range: [1, 2, 3, 3], colHeaders: 'firstRow', headerRows: 2 });

    // The label is read from the merge's own origin cell (column 1), even though it sits outside
    // the imported window - documented in `mapNestedHeaders`'s JSDoc - and it is escaped like any
    // other header. The colspan is clamped down to the 2 columns (2 and 3) the window actually has.
    expect(result.nestedHeaders).toEqual([
      [{ label: '&lt;img src=x onerror=alert(1)&gt;', colspan: 2 }],
      ['Q1', 'Q2'],
    ]);
    expect(result.data).toEqual([[1, 2]]);
  });
});

describe('registerStyleRule', () => {
  it('should reuse the class name when the same declarations come back', () => {
    const styles = new Map();
    const rule = { className: 'htImported-a', declarations: 'font-weight:bold' };

    expect(registerStyleRule(styles, rule)).toBe('htImported-a');
    expect(registerStyleRule(styles, { ...rule })).toBe('htImported-a');
    expect([...styles]).toEqual([['htImported-a', 'font-weight:bold']]);
  });

  it('should suffix a hash collision instead of painting one style with another', () => {
    const styles = new Map();

    expect(registerStyleRule(styles, { className: 'htImported-a', declarations: 'font-weight:bold' }))
      .toBe('htImported-a');
    expect(registerStyleRule(styles, { className: 'htImported-a', declarations: 'color:#ff0000' }))
      .toBe('htImported-a-2');
    expect(registerStyleRule(styles, { className: 'htImported-a', declarations: 'color:#00ff00' }))
      .toBe('htImported-a-3');
    expect(registerStyleRule(styles, { className: 'htImported-a', declarations: 'color:#ff0000' }))
      .toBe('htImported-a-2');
    expect([...styles]).toEqual([
      ['htImported-a', 'font-weight:bold'],
      ['htImported-a-2', 'color:#ff0000'],
      ['htImported-a-3', 'color:#00ff00'],
    ]);
  });
});

describe('mapWorkbook – conditionalFormatting', () => {
  it('should cover the window for a whole-column ref and report a part it cannot parse', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[text('a'), text('b')], [text('c'), text('d')], [text('e'), text('f')]];
    sheet.conditionalFormatting = [
      { ref: 'A:A', rules: [] },
      { ref: 'B1 nonsense', rules: [] },
    ];

    const { result, dropped } = map(workbook(sheet));

    expect(result.conditionalFormatting).toEqual([
      { rows: [0, 2], cols: [0, 0], rules: [] },
      { rows: [0, 0], cols: [1, 1], rules: [] },
    ]);
    expect(dropped.list()).toContain('conditionalFormatting:unparsedRef');

    // Every token parsed: nothing is reported, whatever the parser did with the rectangles.
    sheet.conditionalFormatting = [{ ref: 'A1 A1', rules: [] }];
    expect(map(workbook(sheet)).dropped.list()).not.toContain('conditionalFormatting:unparsedRef');
  });

  const rule = { type: 'cellIs', operator: 'greaterThan', formulae: ['100'] };

  function cfSheet() {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('Name'), text('Q1'), text('Q2')],
      [text('Ana García'), cell({ value: 120 }), cell({ value: 80 })],
      [text('Li Wei'), cell({ value: 40 }), cell({ value: 210 })],
    ];

    return sheet;
  }

  it('should shift a range into grid coordinates across the promoted header row', () => {
    const sheet = cfSheet();

    sheet.conditionalFormatting = [{ ref: 'B2:C3', rules: [rule] }];

    const { result, dropped } = map(workbook(sheet), { colHeaders: 'firstRow' });

    expect(result.conditionalFormatting).toEqual([{ rows: [0, 1], cols: [1, 2], rules: [rule] }]);
    // No longer reported as dropped: the rules are handed back on the result, the same way a
    // formula is when the grid cannot evaluate it.
    expect(dropped.list()).toEqual([]);
  });

  it('should split a multi-range ref, clamp a range to the window and skip one outside it', () => {
    const sheet = cfSheet();

    sheet.conditionalFormatting = [
      { ref: 'B1:B10 C1:C2', rules: [rule] },
      { ref: 'A20:B30', rules: [rule] },
      { ref: 'C3', rules: [rule] },
    ];

    const { result } = map(workbook(sheet));

    expect(result.conditionalFormatting).toEqual([
      { rows: [0, 2], cols: [1, 1], rules: [rule] },
      { rows: [0, 1], cols: [2, 2], rules: [rule] },
      { rows: [2, 2], cols: [2, 2], rules: [rule] },
    ]);
  });

  it('should produce conditional formatting even with importLayout off, and no key without any', () => {
    const sheet = cfSheet();

    sheet.conditionalFormatting = [{ ref: 'B2:B3', rules: [rule] }];

    expect(map(workbook(sheet), { importLayout: false }).result.conditionalFormatting)
      .toEqual([{ rows: [1, 2], cols: [1, 1], rules: [rule] }]);
    expect(map(workbook(cfSheet())).result.conditionalFormatting).toBeUndefined();
  });
});

describe('mapWorkbook - date-time cells', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  it('should map a date-time format to an intl-datetime column carrying dateTimeFormat and an ISO value', () => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [cell({ value: 45292.5, numFmt: 'yyyy-mm-dd hh:mm:ss' }), cell({ value: 45292.25, numFmt: 'm/d/yy h:mm' })],
    ];

    const { result } = map(workbook(sheet));

    expect(result.data).toEqual([['2024-01-01 12:00:00', '2024-01-01 06:00:00']]);
    expect(result.columns).toEqual([
      {
        type: 'intl-datetime',
        dateTimeFormat: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        },
      },
      {
        type: 'intl-datetime',
        dateTimeFormat: {
          month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: false,
        },
      },
    ]);
  });

  it('should render and validate an imported date-time cell instead of showing #bad-value#', async() => {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [[cell({ value: 45292.5, numFmt: 'yyyy-mm-dd hh:mm:ss' })]];

    const { result } = map(workbook(sheet));

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: result.data,
      columns: result.columns,
      locale: 'en-US',
    });

    expect(hot.getCell(0, 0).textContent).toBe('01/01/2024, 12:00:00');

    const valid = await new Promise(resolve => hot.validateCells(resolve));

    expect(valid).toBe(true);
  });
});

describe('mapLayout - file-controlled layout values', () => {
  // The layout comes straight from the file, through whichever engine read it. Whatever the
  // reader lets through, the grid must only ever be handed finite, positive sizes and
  // non-negative integer counts and indexes.
  function layoutSheet() {
    const sheet = createSheetSnapshot('Data');

    sheet.rows = [
      [text('a'), text('b'), text('c'), text('d')],
      [text('e'), text('f'), text('g'), text('h')],
      [text('i'), text('j'), text('k'), text('l')],
      [text('m'), text('n'), text('o'), text('p')],
    ];

    return sheet;
  }

  it('should omit a column width that is not finite and positive, or wider than Excel allows', () => {
    const sheet = layoutSheet();

    // A 255-character column, Excel's UI maximum, is stored with its 5 px of cell padding added
    // (255.7109375 at a 7 px digit width); the cap is 260 width units.
    // `0.05` passes the size check but rounds to 0 px, which the grid must not be handed either.
    sheet.colWidths = [-50, 7e300, Infinity, 255.7109375, 260.5, NaN, 0, 10, 0.05];
    sheet.rows.forEach(row => row.push(text('x'), text('y'), text('z'), text('w'), text('v')));

    const { result } = map(workbook(sheet));

    expect(result.colWidths).toEqual([
      undefined, undefined, undefined, Math.round(255.7109375 * 7), undefined, undefined, undefined, 70, undefined,
    ]);
  });

  it('should omit a row height that is not finite and positive, or taller than Excel allows', () => {
    const sheet = layoutSheet();

    // 409.5 points is Excel's maximum row height.
    sheet.rowHeights = [1.33e300, -15, 409.5, 410];

    expect(map(workbook(sheet)).result.rowHeights).toEqual([undefined, undefined, 546, undefined]);

    sheet.rowHeights = [NaN, Infinity, 0, -1];

    expect(map(workbook(sheet)).result.rowHeights).toBeUndefined();
  });

  it('should hand the grid whole, non-negative freeze counts', () => {
    const sheet = layoutSheet();

    sheet.freeze = { rows: 2.7, cols: 1.5 };

    let { result } = map(workbook(sheet));

    expect(result.fixedRowsTop).toBe(2);
    expect(result.fixedColumnsStart).toBe(1);

    sheet.freeze = { rows: -3, cols: NaN };
    ({ result } = map(workbook(sheet)));

    expect(result.fixedRowsTop).toBeUndefined();
    expect(result.fixedColumnsStart).toBeUndefined();

    // A fractional freeze is floored before the promoted header row is taken off it.
    sheet.freeze = { rows: 1.5, cols: Infinity };
    ({ result } = map(workbook(sheet), { colHeaders: 'firstRow' }));

    expect(result.fixedRowsTop).toBeUndefined();
    expect(result.fixedColumnsStart).toBe(4);
  });

  it('should drop each hidden index that is not a whole number on its own, keeping the valid ones', () => {
    const sheet = layoutSheet();

    // HiddenRows rejects a whole list that holds one bad index, so one stray `0.5` used to make the
    // legitimately hidden row 1 visible.
    sheet.hiddenRows = [0.5, 1, -1, NaN, Infinity, 3];
    sheet.hiddenCols = [2, 1.25, 0, '1'];

    const { result } = map(workbook(sheet));

    expect(result.hiddenRows).toEqual([1, 3]);
    expect(result.hiddenColumns).toEqual([2, 0]);
  });

  it('should drop a hidden index just past the window end, keeping the ones inside', () => {
    const sheet = createSheetSnapshot('Data');

    // Row 3 sits one past the end of a 3-row window. `HiddenRows` rejects the whole list over that
    // one index, which would make row 1, hidden by the file, visible again.
    sheet.rows = Array.from({ length: 5 }, (_, r) => [text(`r${r}`), text('x')]);
    sheet.hiddenRows = [1, 3];

    expect(map(workbook(sheet), { range: [0, 0, 2, 1] }).result.hiddenRows).toEqual([1]);
  });
});

describe('mapWorkbook on the slots one list validation covers', () => {
  /**
   * A sheet of `rowCount` rows by `colCount` columns where every slot is ONE shared cell carrying
   * the same list validation, the shape the native reader hands over for a validation over empty
   * rows, with real text cells in the first and last rows.
   *
   * @param {number} rowCount The number of rows.
   * @param {number} colCount The number of columns.
   * @returns {object} The workbook snapshot.
   */
  function validatedSheet(rowCount, colCount) {
    const validation = { type: 'list', formulae: ['"a,b"'], allowBlank: true };
    const shared = cell({ value: null, validation });
    const sheet = createSheetSnapshot('S');

    sheet.rows = Array.from({ length: rowCount }, (_, row) => Array.from({ length: colCount }, () => (
      row === 0 || row === rowCount - 1 ? cell({ value: 'x', validation }) : shared
    )));

    return workbook(sheet);
  }

  it('should keep the meta of a covered column as runs, not one entry per cell', () => {
    // Every slot between the first and last real row shares one dropdown meta. Keyed per cell it cost
    // one `Map` entry per covered slot: a validation over `A1:E1000000` in a 2 kB file allocated five
    // million entries, +1.2 GB and 11 s in `mapWorkbook`. Counting the writes keeps this
    // deterministic where a wall-clock or a heap bound would flake.
    const wb = validatedSheet(200000, 5);
    const sets = jest.spyOn(Map.prototype, 'set');

    try {
      const { result } = map(wb);

      expect(result.columns.map(column => column.type)).toEqual(Array(5).fill('dropdown'));
      expect(result.cellsMeta).toBeUndefined();
      expect(sets.mock.calls.length).toBeLessThan(1000);
    } finally {
      sets.mockRestore();
    }
  });

  it('should still give every outlier row of a run its own cellsMeta entry', () => {
    const sheet = createSheetSnapshot('S');

    sheet.rows = [
      [cell({ value: 1 })], [cell({ value: 2 })], [text('a')], [text('b')], [cell({ value: 3 })],
    ];

    const { result } = map(workbook(sheet));

    expect(result.columns[0].type).toBe('numeric');
    expect(result.cellsMeta.map(({ row, meta }) => [row, meta.type])).toEqual([[2, 'text'], [3, 'text']]);
  });

  it('should mark a protected sheet\'s blank column read-only as a whole', () => {
    // Under sheet protection every blank is locked. The mapper keeps those cells as runs per column
    // (one `{ row, col }` per slot cost +1.3 GB on a protected sheet with cells in `A1:E1` and
    // `A1000000:E1000000`); this pins the result that shape must still produce.
    const sheet = createSheetSnapshot('S');

    sheet.protection = { enabled: true, password: null, options: {} };
    sheet.rows = Array.from({ length: 200000 }, (_, row) => (row === 0 || row === 199999 ? [text('x')] : []));

    const { result } = map(workbook(sheet));

    expect(result.columns[0].readOnly).toBe(true);
    expect(result.cellsMeta).toBeUndefined();
  });

  it('should mark only the unlocked rows of a mostly locked column, as readOnly: false', () => {
    // One unlocked cell used to send every OTHER cell of its column through `cellsMeta`.
    const sheet = createSheetSnapshot('S');

    sheet.protection = { enabled: true, password: null, options: {} };
    sheet.rows = [[text('a')], [cell({ value: 'b', locked: false })], [text('c')], [text('d')]];

    const { result } = map(workbook(sheet));

    expect(result.columns[0].readOnly).toBe(true);
    expect(result.cellsMeta).toEqual([{ row: 1, col: 0, meta: { readOnly: false } }]);
  });

  it('should mark only the locked rows of a mostly unlocked column, as readOnly: true', () => {
    const sheet = createSheetSnapshot('S');

    sheet.protection = { enabled: true, password: null, options: {} };
    sheet.rows = [[cell({ value: 'a', locked: false })], [text('b')], [cell({ value: 'c', locked: false })]];

    const { result } = map(workbook(sheet));

    expect(result.columns[0].readOnly).toBeUndefined();
    expect(result.cellsMeta).toEqual([{ row: 1, col: 0, meta: { readOnly: true } }]);
  });
});

describe('mapWorkbook – array formulas', () => {
  const FORMULAS_ON = { formulasEnabled: true, commentsEnabled: false, customBordersEnabled: false };

  /**
   * A1:A3 hold 1, 2, 3. D1 is a dynamic array master `SEQUENCE(3)` spilling over D1:D3, E1 a legacy
   * CSE master `A1:A2*2` over E1:E2. The covered cells carry their cached values with no formula,
   * the way both readers hand them over.
   *
   * @param {string} [masterText] The formula text of the D1 master.
   * @returns {object} The sheet snapshot.
   */
  function arraySheet(masterText = 'SEQUENCE(3)') {
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [
      [cell({ value: 1 }), null, null,
        cell({ formula: { text: masterText, result: 1, array: { ref: 'D1:D3', dynamic: true } } }),
        cell({ formula: { text: 'A1:A2*2', result: 2, array: { ref: 'E1:E2', dynamic: false } } })],
      [cell({ value: 2 }), null, null, cell({ value: 2 }), cell({ value: 4 })],
      [cell({ value: 3 }), null, null, cell({ value: 3 }), null],
    ];

    return sheet;
  }

  it('should import a dynamic master bare, a CSE master wrapped in ARRAYFORMULA, and their spilled cells empty', () => {
    // The spilled cells used to import their cached values, so HyperFormula's spill collided with
    // those constants and D1 showed `#SPILL!`.
    const { result } = map(workbook(arraySheet()), {}, FORMULAS_ON);

    expect(result.data[0][3]).toBe('=SEQUENCE(3)');
    expect(result.data[1][3]).toBe(null);
    expect(result.data[2][3]).toBe(null);
    expect(result.data[0][4]).toBe('=ARRAYFORMULA(A1:A2*2)');
    expect(result.data[1][4]).toBe(null);
    expect(result.data.map(row => row[0])).toEqual([1, 2, 3]);
    expect(result.formulas).toBeUndefined();
  });

  it('should keep the column typed from the cached values a spilled cell no longer carries', () => {
    const { result } = map(workbook(arraySheet()), {}, FORMULAS_ON);

    expect(result.columns[3].type).toBe('numeric');
    expect(result.columns[4].type).toBe('numeric');
    expect(result.cellsMeta).toBeUndefined();
  });

  it('should import the cached values of the master and its spilled cells with the Formulas plugin off', () => {
    const { result } = map(workbook(arraySheet()));

    expect(result.data.map(row => row[3])).toEqual([1, 2, 3]);
    expect(result.data.map(row => row[4])).toEqual([2, 4, null]);
    expect(result.formulas).toEqual([
      { row: 0, col: 3, formula: 'SEQUENCE(3)' },
      { row: 0, col: 4, formula: 'A1:A2*2' },
    ]);
  });

  it('should keep the spilled cells\' cached values when the master imports its cached value', () => {
    // `Rates!A1` names a sheet the engine does not hold, so the master imports its cached 1, and
    // nothing spills over D2:D3.
    const { result, dropped } = map(workbook(arraySheet('SEQUENCE(Rates!A1)')), {}, FORMULAS_ON);

    expect(result.data.map(row => row[3])).toEqual([1, 2, 3]);
    expect(result.formulas).toEqual([{ row: 0, col: 3, formula: 'SEQUENCE(Rates!A1)' }]);
    expect(dropped.list()).toContain('formula:otherSheet');
    expect(result.data[1][4]).toBe(null);
  });

  it('should keep the spilled cells\' cached values when the engine lacks a function the master calls', () => {
    // HyperFormula 3.3 has no UNIQUE: the live master shows `#NAME?` and spills nothing, so blanking
    // B2 lost the value the file holds.
    const sheet = createSheetSnapshot('Sheet1');
    const registered = new Set(['SEQUENCE', 'SUM', 'ARRAYFORMULA']);
    const asked = [];
    const context = {
      ...FORMULAS_ON,
      registersFunction: (name) => {
        asked.push(name);

        return registered.has(name);
      },
    };

    sheet.rows = [
      [cell({ value: 1 }),
        cell({ formula: { text: '_xlfn.UNIQUE(A1:A3)', result: 1, array: { ref: 'B1:B2', dynamic: true } } }),
        cell({ formula: { text: 'SEQUENCE(2)', result: 1, array: { ref: 'C1:C2', dynamic: true } } }),
        cell({ formula: { text: 'sum(_xlfn.UNIQUE(A1:A3))', result: 3, array: { ref: 'D1:D2', dynamic: false } } })],
      [cell({ value: 1 }), cell({ value: 2 }), cell({ value: 2 }), cell({ value: 9 })],
      [cell({ value: 2 }), null, null, null],
    ];

    const { result } = map(workbook(sheet), {}, context);

    expect(result.data).toEqual([
      [1, '=UNIQUE(A1:A3)', '=SEQUENCE(2)', '=ARRAYFORMULA(sum(UNIQUE(A1:A3)))'],
      [1, 2, null, 9],
      [2, null, null, null],
    ]);
    // Names are asked upper-cased; a reference or a name is never asked.
    expect(asked).toEqual(expect.arrayContaining(['UNIQUE', 'SEQUENCE', 'SUM']));
    expect(asked).not.toContain('A1');
  });

  it('should keep the spilled cells\' cached values when the window starts below the master', () => {
    const { result } = map(workbook(arraySheet()), { range: [1, 0, 2, 5] }, FORMULAS_ON);

    expect(result.data.map(row => row[3])).toEqual([2, 3]);
    expect(result.data.map(row => row[4])).toEqual([4, null]);
  });

  it('should clip the spilled range to the window', () => {
    // The window ends at row 2 and column D, so E1's array and D3 fall outside it; D2 stays empty.
    const { result } = map(workbook(arraySheet()), { range: [0, 0, 1, 3] }, FORMULAS_ON);

    expect(result.data).toEqual([[1, null, null, '=SEQUENCE(3)'], [2, null, null, null]]);
  });

  it('should rebase the spilled range by the window origin', () => {
    // The promoted header row and the dropped row-header column move the master to the window's
    // (0, 2); its spilled rows follow it.
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [
      [text('id'), text('a'), text('b'), text('c')],
      [text('r1'), cell({ value: 5 }), null,
        cell({ formula: { text: 'SEQUENCE(2,2)', result: 1, array: { ref: 'D2:E3', dynamic: true } } }),
        cell({ value: 2 })],
      [text('r2'), cell({ value: 6 }), null, cell({ value: 3 }), cell({ value: 4 })],
      [text('r3'), cell({ value: 7 }), null, cell({ value: 9 }), cell({ value: 9 })],
    ];

    const { result } = map(workbook(sheet), { colHeaders: 'firstRow', rowHeaders: true }, FORMULAS_ON);

    expect(result.data).toEqual([
      [5, null, '=SEQUENCE(2,2)', null],
      [6, null, null, null],
      [7, null, 9, 9],
    ]);
  });

  it('should keep cells the ref names but the master does not start', () => {
    // Excel always writes the master as the top-left corner of its ref. A ref that starts elsewhere
    // is not trusted to empty any cell.
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [
      [cell({ formula: { text: 'SEQUENCE(2)', result: 1, array: { ref: 'B2:B3', dynamic: true } } }), null],
      [null, cell({ value: 7 })],
      [null, cell({ value: 8 })],
    ];

    const { result } = map(workbook(sheet), {}, FORMULAS_ON);

    expect(result.data).toEqual([['=SEQUENCE(2)', null], [null, 7], [null, 8]]);
  });

  it('should import a single-cell CSE master wrapped in ARRAYFORMULA', () => {
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [[cell({ value: 2 }), cell({ value: 3 }),
      cell({ formula: { text: 'SUM(A1:B1*2)', result: 10, array: { ref: 'C1', dynamic: false } } })]];

    const { result } = map(workbook(sheet), {}, FORMULAS_ON);

    expect(result.data).toEqual([[2, 3, '=ARRAYFORMULA(SUM(A1:B1*2))']]);
  });

  it('should keep the spilled cells\' cached values with importFormulas off and the Formulas plugin on', () => {
    const { result } = map(workbook(arraySheet()), { importFormulas: false }, FORMULAS_ON);

    expect(result.data.map(row => row[3])).toEqual([1, 2, 3]);
    expect(result.data.map(row => row[4])).toEqual([2, 4, null]);
  });

  it('should not wrap a CSE master the file already wraps in ARRAYFORMULA', () => {
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [
      [cell({ value: 1 }),
        cell({ formula: { text: 'ARRAYFORMULA(A1:A2*2)', result: 2, array: { ref: 'B1:B2', dynamic: false } } })],
      [cell({ value: 2 }), cell({ value: 4 })],
    ];

    const { result } = map(workbook(sheet), {}, FORMULAS_ON);

    expect(result.data).toEqual([[1, '=ARRAYFORMULA(A1:A2*2)'], [2, null]]);
  });

  it('should empty the spilled cells of many single-column masters on one row', () => {
    // One span per master per row, scanned linearly per cell, cost W^2/2 comparisons per row:
    // about a minute at W = 16384. The sweep looks each cell up in O(1) amortized.
    const width = 2000;
    const sheet = createSheetSnapshot('Sheet1');
    const letters = (index) => {
      let label = '';

      for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
        label = String.fromCharCode(65 + ((n - 1) % 26)) + label;
      }

      return label;
    };

    sheet.rows = [
      Array.from({ length: width }, (_, col) => cell({
        formula: { text: 'SEQUENCE(3)', result: 1, array: { ref: `${letters(col)}1:${letters(col)}3`, dynamic: true } },
      })),
      Array.from({ length: width }, () => cell({ value: 2 })),
      Array.from({ length: width }, () => cell({ value: 3 })),
      Array.from({ length: width }, () => cell({ value: 4 })),
    ];

    const startedAt = Date.now();
    const { result } = map(workbook(sheet), {}, FORMULAS_ON);
    const elapsed = Date.now() - startedAt;

    expect(result.data[0].every(value => value === '=SEQUENCE(3)')).toBe(true);
    expect(result.data[1].every(value => value === null)).toBe(true);
    expect(result.data[2].every(value => value === null)).toBe(true);
    expect(result.data[3].every(value => value === 4)).toBe(true);
    expect(elapsed).toBeLessThan(5000);
  });

  it('should charge every rectangle the sweep looks at on every row it crosses', () => {
    // Ten single-column masters in row 1, each spilling down the whole 100-row sheet: one charge per
    // rectangle recorded plus one per rectangle per later row swept, 10 + 10 x 99 = 1000.
    const masters = 10;
    const rowCount = 100;
    const build = () => {
      const sheet = createSheetSnapshot('Sheet1');

      sheet.rows = Array.from({ length: rowCount }, () => Array.from({ length: masters }, () => cell({ value: 0 })));
      sheet.rows[0] = Array.from({ length: masters }, (_, col) => {
        const letter = String.fromCharCode(65 + col);

        return cell({
          formula: {
            text: 'SEQUENCE(100)', result: 1, array: { ref: `${letter}1:${letter}${rowCount}`, dynamic: true },
          },
        });
      });

      return workbook(sheet);
    };
    const charge = masters * rowCount;
    const fits = build();
    const refused = build();

    fits.translatedFormulaChars = MAX_TRANSLATED_FORMULA_CHARS - charge;
    refused.translatedFormulaChars = MAX_TRANSLATED_FORMULA_CHARS - charge + 1;

    expect(map(fits, {}, FORMULAS_ON).result.data[rowCount - 1]).toEqual(Array(masters).fill(null));

    let thrown = null;

    try {
      map(refused, {}, FORMULAS_ON);
    } catch (error) {
      thrown = error;
    }

    expect(isLimitError(thrown)).toBe(true);
  });

  it('should charge the spilled rows to the formula budget, so a whole-sheet ref is refused', () => {
    // `A1:XFD1048576` records one entry per row of the window it covers, so the rows it spills
    // over are charged against the same budget as the formula walks.
    const rowCount = 2000;
    const build = () => {
      const sheet = createSheetSnapshot('Sheet1');

      sheet.rows = Array.from({ length: rowCount }, (_, row) => [cell({ value: row })]);
      sheet.rows[0] = [
        cell({ formula: { text: 'SEQUENCE(9)', result: 1, array: { ref: 'A1:XFD1048576', dynamic: true } } }),
      ];

      return workbook(sheet);
    };
    const fits = build();
    const refused = build();

    fits.translatedFormulaChars = MAX_TRANSLATED_FORMULA_CHARS - rowCount;
    refused.translatedFormulaChars = MAX_TRANSLATED_FORMULA_CHARS - rowCount + 1;

    const { result } = map(fits, {}, FORMULAS_ON);

    expect(result.data[0][0]).toBe('=SEQUENCE(9)');
    expect(result.data[rowCount - 1][0]).toBe(null);

    let thrown = null;

    try {
      map(refused, {}, FORMULAS_ON);
    } catch (error) {
      thrown = error;
    }

    expect(isLimitError(thrown)).toBe(true);
  });
});

describe('mapWorkbook – the workbook\'s defined names as named expressions', () => {
  /**
   * A `Data` sheet with a header row and a row-header column, so the window starts at sheet `B2`:
   * `G2:G4` holds 10, 20, 30 (the grid's `F1:F3`), `C2` sums `Sales` and `C3` sums `Other`.
   *
   * @param {object[]} names The workbook's defined names.
   * @param {object[]} [extraRow] Cells appended as one more data row.
   * @returns {object} The workbook snapshot.
   */
  function salesWorkbook(names, extraRow = []) {
    const data = createSheetSnapshot('Data');
    const rates = createSheetSnapshot('Rates');
    const row = (label, formula, amount) => [
      text(label), text('x'), formula ? cell({ formula }) : null, null, null, null, cell({ value: amount }),
    ];

    data.rows = [
      [null, text('Name'), text('Total'), null, null, null, text('Amount')],
      row('r1', { text: 'SUM(Sales)', result: 60 }, 10),
      row('r2', { text: 'SUM(Other)', result: 60 }, 20),
      row('r3', null, 30),
    ];

    if (extraRow.length > 0) {
      data.rows.push(extraRow);
    }

    rates.rows = [[cell({ value: 1 })]];

    const wb = workbook(data, rates);

    wb.definedNames = names;

    return wb;
  }

  const NAMES = [
    { name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null },
    { name: 'TaxRate', formula: '0.07', sheetName: null },
    { name: 'Other', formula: 'Rates!$A$1', sheetName: null },
    { name: 'Bad', formula: 'B2:', sheetName: null },
    { name: 'Local', formula: 'Rates!$A$1', sheetName: 'Rates' },
  ];
  const OPTIONS = { colHeaders: 'firstRow', rowHeaders: true };

  /**
   * The Formulas plugin's state, with an engine that refuses `Bad` and records every question.
   *
   * @param {object} [overrides] Context keys to replace.
   * @returns {object}
   */
  function contextOf(overrides = {}) {
    const asked = [];

    return {
      asked,
      context: {
        formulasEnabled: true,
        commentsEnabled: false,
        customBordersEnabled: false,
        formulaSheetNames: new Set(['sheet1']),
        formulaSheetName: 'Sheet1',
        formulaNamedExpressions: new Set(),
        canAddNamedExpression: (name, expression) => {
          asked.push([name, expression]);

          return name !== 'Bad';
        },
        ...overrides,
      },
    };
  }

  it('should register the names over the imported sheet and constants, shifted and qualified with the grid\'s sheet', () => {
    const { context, asked } = contextOf();
    const { result } = map(salesWorkbook(NAMES), OPTIONS, context);

    // HyperFormula reads an unqualified `$F$1:$F$3` as relative and refuses it in a named expression,
    // so the own-sheet reference is qualified with the engine's name for the grid's sheet.
    expect(result.namedExpressions).toEqual([
      { name: 'Sales', formula: 'Sheet1!$F$1:$F$3' },
      { name: 'TaxRate', formula: '0.07' },
    ]);
    expect(asked).toEqual([['Sales', '=Sheet1!$F$1:$F$3'], ['TaxRate', '=0.07'], ['Bad', '=A1:']]);
    expect(result.dropped).toContain('definedNames:unsupported');
    expect(result.dropped.filter(name => name === 'definedNames:unsupported')).toHaveLength(1);
  });

  it('should import a formula over a registered name live and one over a left-out name as its cached value', () => {
    const { context } = contextOf();
    const { result } = map(salesWorkbook(NAMES), OPTIONS, context);

    expect(result.data[0][1]).toBe('=SUM(Sales)');
    expect(result.data[1][1]).toBe(60);
    expect(result.formulas).toEqual([{ row: 1, col: 1, formula: 'SUM(Other)' }]);
    expect(result.dropped).toContain('formula:definedName');
  });

  it('should leave out a name the engine already defines and keep the formulas over it live', () => {
    const { context, asked } = contextOf({ formulaNamedExpressions: new Set(['sales']) });
    const { result } = map(salesWorkbook(NAMES), OPTIONS, context);

    expect(result.namedExpressions).toEqual([{ name: 'TaxRate', formula: '0.07' }]);
    expect(asked.map(([name]) => name)).not.toContain('Sales');
    expect(result.data[0][1]).toBe('=SUM(Sales)');
  });

  it('should register a name scoped to the imported sheet, ahead of a workbook name spelled like it', () => {
    const { context } = contextOf();
    const { result } = map(salesWorkbook([
      { name: 'Sales', formula: 'Data!$G$3', sheetName: null },
      { name: 'SALES', formula: 'data!$G$2:$G$4', sheetName: 'DATA' },
    ]), OPTIONS, context);

    expect(result.namedExpressions).toEqual([{ name: 'SALES', formula: 'Sheet1!$F$1:$F$3' }]);
    expect(result.dropped).not.toContain('definedNames:unsupported');
  });

  it('should ignore a name scoped to another sheet without reporting it', () => {
    const { context, asked } = contextOf();
    const names = [{ name: 'Local', formula: 'Data!$G$2', sheetName: 'Rates' }];
    const { result } = map(salesWorkbook(names), OPTIONS, context);

    expect(result.namedExpressions).toBeUndefined();
    expect(asked).toEqual([]);
    expect(result.dropped).not.toContain('definedNames:unsupported');
  });

  it('should leave out a name the window shift pushes into the dropped header band', () => {
    const { context } = contextOf();
    const names = [{ name: 'Header', formula: 'Data!$A$1', sheetName: null }];
    const { result } = map(salesWorkbook(names), OPTIONS, context);

    expect(result.namedExpressions).toBeUndefined();
    expect(result.dropped).toContain('definedNames:unsupported');
  });

  it('should leave out a name defined over a name that was left out, and import the formulas over it cached', () => {
    const { context } = contextOf();
    const { result } = map(salesWorkbook([
      { name: 'Doubled', formula: 'Total*2', sheetName: null },
      { name: 'Total', formula: 'SUM(Bad)', sheetName: null },
      { name: 'Bad', formula: 'B2:', sheetName: null },
      { name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null },
    ], [text('r4'), text('x'), cell({ formula: { text: 'Doubled+1', result: 5 } })]), OPTIONS, context);

    expect(result.namedExpressions).toEqual([{ name: 'Sales', formula: 'Sheet1!$F$1:$F$3' }]);
    expect(result.data[3][1]).toBe(5);
    expect(result.dropped).toContain('formula:definedName');
  });

  it('should strip the stored function prefixes from a definition', () => {
    const { context } = contextOf();
    const { result } = map(salesWorkbook([
      { name: 'Spread', formula: '_xlfn.STDEV.S(Data!$G$2:$G$4)', sheetName: null },
    ]), OPTIONS, context);

    expect(result.namedExpressions).toEqual([{ name: 'Spread', formula: 'STDEV.S(Sheet1!$F$1:$F$3)' }]);
  });

  it('should keep a formula live over a name the engine defines the same way, and import it cached when it differs', () => {
    // A re-import of an updated file: the engine still holds the previous import's `Sales`.
    const compared = [];
    const engineHas = formula => contextOf({
      formulaNamedExpressions: new Set(['sales']),
      definesNamedExpression: (name, expression) => {
        compared.push([name, expression]);

        return expression === formula;
      },
    }).context;

    const same = map(salesWorkbook(NAMES.slice(0, 2)), OPTIONS, engineHas('=Sheet1!$F$1:$F$3'));

    expect(compared).toEqual([['Sales', '=Sheet1!$F$1:$F$3']]);
    expect(same.result.namedExpressions).toEqual([{ name: 'TaxRate', formula: '0.07' }]);
    expect(same.result.data[0][1]).toBe('=SUM(Sales)');
    expect(same.result.dropped).not.toContain('definedNames:unsupported');

    const changed = map(salesWorkbook(NAMES.slice(0, 2)), OPTIONS, engineHas('=Sheet1!$F$1:$F$2'));

    expect(changed.result.namedExpressions).toEqual([{ name: 'TaxRate', formula: '0.07' }]);
    expect(changed.result.data[0][1]).toBe(60);
    expect(changed.result.dropped).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should treat a name the engine defines as changed when the file\'s definition cannot be expressed', () => {
    const { context } = contextOf({
      formulaNamedExpressions: new Set(['sales']),
      definesNamedExpression: () => true,
    });
    const { result } = map(salesWorkbook([{ name: 'Sales', formula: 'Data!$A$1', sheetName: null }]), OPTIONS, context);

    expect(result.data[0][1]).toBe(60);
    expect(result.dropped).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should register both names of a cycle, and stop', () => {
    const { context } = contextOf();
    const { result } = map(salesWorkbook([
      { name: 'Ping', formula: 'Pong+1', sheetName: null },
      { name: 'Pong', formula: 'Ping+1', sheetName: null },
    ]), OPTIONS, context);

    expect(result.namedExpressions).toEqual([{ name: 'Ping', formula: 'Pong+1' }, { name: 'Pong', formula: 'Ping+1' }]);
  });

  it('should leave out a name defined over a name scoped to another sheet', () => {
    const { context } = contextOf();
    const { result } = map(salesWorkbook([
      { name: 'Local', formula: 'Rates!$A$1', sheetName: 'Rates' },
      { name: 'Twice', formula: 'Local*2', sheetName: null },
    ]), OPTIONS, context);

    expect(result.namedExpressions).toBeUndefined();
    expect(result.dropped).toContain('definedNames:unsupported');
  });

  it('should register nothing without the engine check, with the Formulas plugin off, or with importFormulas off', () => {
    const noCheck = map(salesWorkbook(NAMES), OPTIONS, contextOf({ canAddNamedExpression: undefined }).context);

    expect(noCheck.result.namedExpressions).toBeUndefined();
    expect(noCheck.result.data[0][1]).toBe(60);
    expect(noCheck.result.dropped).toContain('formula:definedName');

    const { context, asked } = contextOf({ formulasEnabled: false });
    const off = map(salesWorkbook(NAMES), OPTIONS, context);

    expect(off.result.namedExpressions).toBeUndefined();
    expect(asked).toEqual([]);

    const cached = map(salesWorkbook(NAMES), { ...OPTIONS, importFormulas: false }, contextOf().context);

    expect(cached.result.namedExpressions).toBeUndefined();
    expect(cached.result.dropped).not.toContain('definedNames:unsupported');
  });
});
