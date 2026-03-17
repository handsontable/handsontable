import ExcelJS from 'exceljs';

describe('exportFile XLSX type — cell types', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('cell data', () => {
    it('should export string cell values', async() => {
      handsontable({
        data: [['Hello', 'World']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('Hello');
      expect(ws.getRow(1).getCell(2).value).toBe('World');
    });

    it('should export null and undefined cells as null', async() => {
      handsontable({
        data: [[null, undefined]],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBeNull();
      expect(ws.getRow(1).getCell(2).value).toBeNull();
    });

    it('should export a multi-row, multi-column table', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('A1');
      expect(ws.getRow(1).getCell(3).value).toBe('C1');
      expect(ws.getRow(3).getCell(1).value).toBe('A3');
      expect(ws.getRow(3).getCell(3).value).toBe('C3');
    });

    it('should export numeric type cells as JavaScript numbers', async() => {
      handsontable({
        data: [[42, '3.14']],
        columns: [
          { type: 'numeric' },
          { type: 'numeric' },
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe(42);
      expect(ws.getRow(1).getCell(2).value).toBe(3.14);
    });

    it('should apply the numericFormat pattern as an Excel numFmt', async() => {
      handsontable({
        data: [[142000, 3.14, 0.75]],
        columns: [
          { type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
          { type: 'numeric', numericFormat: { pattern: '0,0.00' } },
          { type: 'numeric', numericFormat: { pattern: '0.00%' } },
        ],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).numFmt).toBe('$#,##0.00');
      expect(ws.getRow(1).getCell(2).numFmt).toBe('#,##0.00');
      expect(ws.getRow(1).getCell(3).numFmt).toBe('0.00%');
    });

    it('should not set numFmt on numeric cells without a numericFormat pattern', async() => {
      handsontable({
        data: [[42]],
        columns: [{ type: 'numeric' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      // ExcelJS returns undefined for cells with no explicit numFmt (default "General" format).
      expect(ws.getRow(1).getCell(1).numFmt).toBeUndefined();
    });

    // Known issue: ExcelJS omits OOXML built-in format IDs 5–8 (the dollar-currency
    // built-ins) from its internal format table, so any `$`-currency format code is
    // assigned a custom numFmtId ≥ 164.  Excel for Mac shows the "Custom" category for
    // all custom IDs; Excel for Windows analyses the format string and shows "Currency".
    // The fix requires post-processing the generated OOXML ZIP to replace the custom ID
    // with the correct built-in ID (e.g. 7 for `$#,##0.00`) before the file is saved.
    // The test is disabled until the post-processing step is implemented.
    //
    // To reproduce manually: export any Handsontable with a `numeric`-type column using
    // `numericFormat: { pattern: '$0,0.00' }`, open the XLSX in Excel for Mac, select a
    // numeric cell, press ⌘1 — Category shows "Custom" instead of "Currency".
    xit('should render currency cells in the "Currency" format category (not "Custom") in Excel', async() => {
      // OOXML built-in format IDs that Excel maps to the "Currency" category:
      // 5 → $#,##0_);($#,##0)    6 → $#,##0_);[Red]($#,##0)
      // 7 → $#,##0.00_);($#,##0.00)   8 → $#,##0.00_);[Red]($#,##0.00)
      const BUILT_IN_CURRENCY_FORMAT_CODES = new Set([
        '$#,##0_);($#,##0)', '$#,##0_);[Red]($#,##0)',
        '$#,##0.00_);($#,##0.00)', '$#,##0.00_);[Red]($#,##0.00)',
      ]);

      handsontable({
        data: [[142000]],
        columns: [{ type: 'numeric', numericFormat: { pattern: '$0,0.00' } }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      // Until the fix is in place, ExcelJS reads back a custom format string
      // (`$#,##0.00`) rather than one of the built-in OOXML currency strings above.
      // Once OOXML numFmtId=7 is written, ExcelJS will report `$#,##0.00_);($#,##0.00)`.
      expect(BUILT_IN_CURRENCY_FORMAT_CODES.has(cell.numFmt)).toBe(true);
    });

    it('should export non-parseable values in numeric type cells as strings', async() => {
      handsontable({
        data: [['not-a-number']],
        columns: [{ type: 'numeric' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('not-a-number');
    });

    it('should export non-numeric type cells as strings', async() => {
      handsontable({
        data: [[123]],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('123');
    });
  });

  describe('date type cells', () => {
    it('should export a `date` type cell as an Excel date serial (recognized as Date category in Excel)', async() => {
      handsontable({
        data: [['2016-02-28']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      // ExcelJS reads a serial + date numFmt back as a JavaScript Date object.
      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCFullYear()).toBe(2016);
      expect(cell.value.getUTCMonth()).toBe(1);
      expect(cell.value.getUTCDate()).toBe(28);
    });

    it('should apply the mm-dd-yy numFmt to date cells', async() => {
      handsontable({
        data: [['2020-01-15']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).numFmt).toBe('mm-dd-yy');
    });

    it('should export an `intl-date` type cell as an Excel date', async() => {
      handsontable({
        data: [['2023-07-04']],
        columns: [{ type: 'intl-date' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCFullYear()).toBe(2023);
      expect(cell.value.getUTCMonth()).toBe(6);
      expect(cell.value.getUTCDate()).toBe(4);
    });

    it('should export an empty date cell as null', async() => {
      handsontable({
        data: [[null]],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBeNull();
    });

    it('should fall back to a plain string when the value is not a valid ISO 8601 date', async() => {
      handsontable({
        data: [['not-a-date']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('not-a-date');
    });
  });

  describe('time type cells', () => {
    it('should export a `time` type cell as an Excel time serial with h:mm:ss numFmt', async() => {
      handsontable({
        data: [['12:30:00']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      // 12:30:00 = (12*3600 + 30*60) / 86400 = 45000/86400 ≈ 0.520833…
      // ExcelJS reads a fractional-day serial + time numFmt back as a Date object.
      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCHours()).toBe(12);
      expect(cell.value.getUTCMinutes()).toBe(30);
      expect(cell.value.getUTCSeconds()).toBe(0);
    });

    it('should apply the h:mm:ss numFmt to time cells so Excel categorizes it as Time not Custom', async() => {
      handsontable({
        data: [['08:05:30']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).numFmt).toBe('h:mm:ss');
    });

    it('should export midnight (00:00:00) correctly', async() => {
      handsontable({
        data: [['00:00:00']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCHours()).toBe(0);
      expect(cell.value.getUTCMinutes()).toBe(0);
      expect(cell.value.getUTCSeconds()).toBe(0);
    });

    it('should export a 12-hour time string with AM/PM', async() => {
      handsontable({
        data: [['3:45:00 PM']],
        columns: [{ type: 'time', timeFormat: 'h:mm:ss A' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      expect(cell.value instanceof Date).toBe(true);
      expect(cell.value.getUTCHours()).toBe(15);
      expect(cell.value.getUTCMinutes()).toBe(45);
    });

    it('should fall back to a plain string when the value is not a valid time', async() => {
      handsontable({
        data: [['not-a-time']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('not-a-time');
    });

    // Known issue: Excel for Mac shows time cells in the "Custom" format category
    // instead of "Time", even though ExcelJS correctly writes the built-in OOXML
    // numFmtId=21 (`h:mm:ss`).  All evidence points to a Mac Excel quirk — the
    // generated OOXML is spec-compliant and Excel for Windows categorizes it correctly.
    // The test is disabled until either:
    //   (a) a workaround is found (e.g. a different numFmt code that Mac Excel reliably
    //       places in the "Time" category), or
    //   (b) we establish a programmatic way to assert Excel's UI category from OOXML.
    // To reproduce manually: export any Handsontable with a `time`-type column, open
    // the XLSX in Excel for Mac, select a time cell, press ⌘1 — Category shows "Custom"
    // instead of "Time".
    xit('should render time cells in the "Time" format category (not "Custom") in Excel', async() => {
      // The OOXML built-in format IDs that Excel maps to the "Time" category:
      // 18 → h:mm AM/PM   19 → h:mm:ss AM/PM   20 → h:mm   21 → h:mm:ss
      // 45 → mm:ss        46 → [h]:mm:ss        47 → mmss.0
      const BUILT_IN_TIME_FORMAT_CODES = new Set([
        'h:mm AM/PM', 'h:mm:ss AM/PM', 'h:mm', 'h:mm:ss', 'mm:ss', '[h]:mm:ss', 'mmss.0',
      ]);

      handsontable({
        data: [['09:30:00']],
        columns: [{ type: 'time', timeFormat: 'HH:mm:ss' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const cell = ws.getRow(1).getCell(1);

      // The numFmt read back by ExcelJS must be one of the built-in OOXML Time format
      // codes.  If it is, the cell uses a built-in numFmtId (<164) and Excel should
      // place it in the "Time" category.  Currently this assertion passes (ExcelJS
      // writes numFmtId=21, `h:mm:ss`), yet Excel for Mac still shows "Custom".
      // Replace / extend this assertion once a real fix is found.
      expect(BUILT_IN_TIME_FORMAT_CODES.has(cell.numFmt)).toBe(true);
    });
  });

  describe('checkbox type cells', () => {
    it('should export a checked checkbox as boolean true', async() => {
      handsontable({
        data: [[true]],
        columns: [{ type: 'checkbox' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe(true);
    });

    it('should export an unchecked checkbox as boolean false', async() => {
      handsontable({
        data: [[false]],
        columns: [{ type: 'checkbox' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe(false);
    });

    it('should use a custom checkedTemplate to determine the boolean value', async() => {
      handsontable({
        data: [['yes'], ['no']],
        columns: [{ type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no' }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe(true);
      expect(ws.getRow(2).getCell(1).value).toBe(false);
    });
  });

  describe('dropdown / autocomplete cells', () => {
    it('should add an Excel list data validation for a `dropdown` type cell', async() => {
      handsontable({
        data: [['Option A']],
        columns: [{ type: 'dropdown', source: ['Option A', 'Option B', 'Option C'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const validation = ws.getRow(1).getCell(1).dataValidation;

      expect(validation.type).toBe('list');
      expect(validation.formulae).toEqual(['"Option A,Option B,Option C"']);
      expect(validation.allowBlank).toBe(true);
    });

    it('should add a list validation for an `autocomplete` type cell', async() => {
      handsontable({
        data: [['red']],
        columns: [{ type: 'autocomplete', source: ['red', 'green', 'blue'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();
      const validation = ws.getRow(1).getCell(1).dataValidation;

      expect(validation.type).toBe('list');
      expect(validation.formulae).toEqual(['"red,green,blue"']);
    });

    it('should not add data validation when source is a function', async() => {
      handsontable({
        data: [['dynamic']],
        columns: [{ type: 'dropdown', source: () => ['a', 'b'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).dataValidation).toBeUndefined();
    });

    it('should not add data validation for a plain text cell', async() => {
      handsontable({
        data: [['plain']],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).dataValidation).toBeUndefined();
    });
  });

  describe('multiselect type cells', () => {
    it('should export a multiselect cell as a comma-separated string of selected values', async() => {
      handsontable({
        data: [[['red', 'green']]],
        columns: [{ type: 'multiselect', source: ['red', 'green', 'blue'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('red, green');
    });

    it('should export key-value object selections using their display value', async() => {
      handsontable({
        data: [[
          [{ key: 'r', value: 'red' }, { key: 'b', value: 'blue' }],
        ]],
        columns: [{
          type: 'multiselect',
          source: [{ key: 'r', value: 'red' }, { key: 'g', value: 'green' }, { key: 'b', value: 'blue' }],
        }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBe('red, blue');
    });

    it('should export an empty multiselect cell as null', async() => {
      handsontable({
        data: [[null]],
        columns: [{ type: 'multiselect', source: ['a', 'b'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).value).toBeNull();
    });

    it('should not add data validation for multiselect cells', async() => {
      // Excel has no native multi-select type. Adding a single-value list
      // validation would flag every multi-selected cell as invalid because the
      // comma-separated string ('red, green') is not in the source list.
      handsontable({
        data: [[['red', 'green']]],
        columns: [{ type: 'multiselect', source: ['red', 'green', 'blue'] }],
        exportFile: { engine: ExcelJS },
      });

      const ws = await parseXlsx();

      expect(ws.getRow(1).getCell(1).dataValidation).toBeUndefined();
    });
  });
});
