import { mapWorkbook, registerStyleRule, resolveImportOptions, selectSheet } from '../mapper';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { createCellSnapshot, createSheetSnapshot, createWorkbookSnapshot } from '../../../utils/xlsxEngine/model';

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
      { formulasEnabled: true, commentsEnabled: false }
    );

    expect(result.data[0][2]).toBe('=B1*Rates!A1');
    expect(result.formulas).toBeUndefined();
    expect(dropped.list()).not.toContain('formula:outOfRange');
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
