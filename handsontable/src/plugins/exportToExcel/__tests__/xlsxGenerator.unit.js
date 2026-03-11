import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';
import { XlsxGenerator, cellRef, pixelsToExcelWidth, dateToSerial } from '../xlsxGenerator';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = NodeTextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = NodeTextDecoder;
}

describe('XlsxGenerator', () => {
  function createMinimalData(overrides = {}) {
    return {
      rows: [[
        { value: 'A1', type: 'text', excelType: 'string', style: {}, numberFormat: null },
        { value: 'B1', type: 'text', excelType: 'string', style: {}, numberFormat: null },
      ], [
        { value: 'A2', type: 'text', excelType: 'string', style: {}, numberFormat: null },
        { value: 'B2', type: 'text', excelType: 'string', style: {}, numberFormat: null },
      ]],
      columnHeaders: [],
      rowHeaders: [],
      mergedCells: [],
      columnWidths: [80, 80],
      rowHeights: [null, null],
      frozenPanes: null,
      ...overrides,
    };
  }

  describe('generate', () => {
    it('should return a Uint8Array', () => {
      const generator = new XlsxGenerator(createMinimalData(), { sheetName: 'Sheet1' });
      const result = generator.generate();

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should produce a valid ZIP (starts with PK signature)', () => {
      const generator = new XlsxGenerator(createMinimalData(), { sheetName: 'Sheet1' });
      const result = generator.generate();
      const view = new DataView(result.buffer, result.byteOffset, result.byteLength);

      expect(view.getUint32(0, true)).toBe(0x04034B50);
    });

    it('should include all required OOXML files', () => {
      const generator = new XlsxGenerator(createMinimalData(), { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('[Content_Types].xml');
      expect(text).toContain('_rels/.rels');
      expect(text).toContain('xl/workbook.xml');
      expect(text).toContain('xl/_rels/workbook.xml.rels');
      expect(text).toContain('xl/worksheets/sheet1.xml');
      expect(text).toContain('xl/styles.xml');
      expect(text).toContain('xl/sharedStrings.xml');
    });

    it('should contain shared string entries for string cells', () => {
      const generator = new XlsxGenerator(createMinimalData(), { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('<si><t>A1</t></si>');
      expect(text).toContain('<si><t>B1</t></si>');
    });

    it('should use the custom sheet name', () => {
      const generator = new XlsxGenerator(createMinimalData(), { sheetName: 'MyData' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('name="MyData"');
    });
  });

  describe('with column headers', () => {
    it('should include header row', () => {
      const data = createMinimalData({ columnHeaders: ['Col A', 'Col B'] });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('<si><t>Col A</t></si>');
      expect(text).toContain('<si><t>Col B</t></si>');
    });
  });

  describe('with row headers', () => {
    it('should include row header cells', () => {
      const data = createMinimalData({ rowHeaders: ['1', '2'] });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('<si><t>1</t></si>');
      expect(text).toContain('<si><t>2</t></si>');
    });
  });

  describe('with merged cells', () => {
    it('should include mergeCells element', () => {
      const data = createMinimalData({
        mergedCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('<mergeCells count="1">');
      expect(text).toContain('ref="A1:B2"');
    });
  });

  describe('with frozen panes', () => {
    it('should include pane element for frozen rows', () => {
      const data = createMinimalData({ frozenPanes: { frozenRows: 1, frozenCols: 0 } });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('ySplit="1"');
      expect(text).toContain('state="frozen"');
    });

    it('should include pane element for frozen columns', () => {
      const data = createMinimalData({ frozenPanes: { frozenRows: 0, frozenCols: 2 } });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('xSplit="2"');
      expect(text).toContain('state="frozen"');
    });
  });

  describe('with numeric cells', () => {
    it('should output numeric values directly', () => {
      const data = createMinimalData({
        rows: [[
          { value: 42, type: 'numeric', excelType: 'number', style: {}, numberFormat: '#,##0.00' },
        ]],
      });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('<v>42</v>');
    });
  });

  describe('with boolean cells', () => {
    it('should output boolean values with t="b"', () => {
      const data = createMinimalData({
        rows: [[
          { value: true, type: 'checkbox', excelType: 'boolean', style: {}, numberFormat: null },
        ]],
      });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('t="b"');
      expect(text).toContain('<v>1</v>');
    });
  });

  describe('with styled cells', () => {
    it('should apply style index to cells with formatting', () => {
      const data = createMinimalData({
        rows: [[
          {
            value: 'Bold',
            type: 'text',
            excelType: 'string',
            style: { font: { bold: true } },
            numberFormat: null,
          },
        ]],
      });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('s="');
    });
  });

  describe('with data validations', () => {
    it('should include dataValidations for dropdown cells', () => {
      const data = createMinimalData({
        rows: [[
          {
            value: 'Yes',
            type: 'dropdown',
            excelType: 'string',
            style: {},
            numberFormat: null,
            validation: { type: 'list', values: ['Yes', 'No', 'Maybe'] },
          },
        ]],
      });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('<dataValidations count="1">');
      expect(text).toContain('type="list"');
      expect(text).toContain('Yes,No,Maybe');
    });
  });

  describe('with column widths', () => {
    it('should include col elements with custom widths', () => {
      const data = createMinimalData({ columnWidths: [100, 200] });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('<cols>');
      expect(text).toContain('customWidth="1"');
    });
  });

  describe('with row heights', () => {
    it('should include row height attribute when specified', () => {
      const data = createMinimalData({ rowHeights: [30, null] });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('ht="30"');
      expect(text).toContain('customHeight="1"');
    });
  });

  describe('with empty cells', () => {
    it('should handle null values', () => {
      const data = createMinimalData({
        rows: [[
          { value: null, type: 'text', excelType: 'string', style: {}, numberFormat: null },
        ]],
      });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle empty string values', () => {
      const data = createMinimalData({
        rows: [[
          { value: '', type: 'text', excelType: 'string', style: {}, numberFormat: null },
        ]],
      });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('with special characters', () => {
    it('should escape XML special characters in string values', () => {
      const data = createMinimalData({
        rows: [[
          { value: 'A & B < C', type: 'text', excelType: 'string', style: {}, numberFormat: null },
        ]],
      });
      const generator = new XlsxGenerator(data, { sheetName: 'Sheet1' });
      const result = generator.generate();
      const text = new TextDecoder().decode(result);

      expect(text).toContain('A &amp; B &lt; C');
    });
  });
});

describe('cellRef', () => {
  it('should convert (0, 0) to "A1"', () => {
    expect(cellRef(0, 0)).toBe('A1');
  });

  it('should convert (0, 25) to "Z1"', () => {
    expect(cellRef(0, 25)).toBe('Z1');
  });

  it('should convert (0, 26) to "AA1"', () => {
    expect(cellRef(0, 26)).toBe('AA1');
  });

  it('should convert (0, 27) to "AB1"', () => {
    expect(cellRef(0, 27)).toBe('AB1');
  });

  it('should convert (99, 2) to "C100"', () => {
    expect(cellRef(99, 2)).toBe('C100');
  });

  it('should convert (0, 701) to "ZZ1"', () => {
    expect(cellRef(0, 701)).toBe('ZZ1');
  });
});

describe('pixelsToExcelWidth', () => {
  it('should convert 80 pixels to approximately 10.71', () => {
    const width = pixelsToExcelWidth(80);

    expect(width).toBeGreaterThan(10);
    expect(width).toBeLessThan(11);
  });

  it('should return at least 1', () => {
    expect(pixelsToExcelWidth(0)).toBe(1);
    expect(pixelsToExcelWidth(-10)).toBe(1);
  });

  it('should return a positive number for standard column widths', () => {
    expect(pixelsToExcelWidth(50)).toBeGreaterThan(0);
    expect(pixelsToExcelWidth(100)).toBeGreaterThan(0);
    expect(pixelsToExcelWidth(200)).toBeGreaterThan(0);
  });
});

describe('dateToSerial', () => {
  it('should convert 2024-01-01 to a serial number', () => {
    const serial = dateToSerial('2024-01-01');

    expect(serial).toBeGreaterThan(45000);
  });

  it('should convert a Date object', () => {
    const serial = dateToSerial(new Date(2024, 0, 1));

    expect(serial).toBeGreaterThan(45000);
  });

  it('should return null for invalid dates', () => {
    expect(dateToSerial('not-a-date')).toBeNull();
  });

  it('should return null for empty strings', () => {
    expect(dateToSerial('')).toBeNull();
  });

  it('should convert 1970-01-01 (Unix epoch) correctly', () => {
    const serial = dateToSerial('1970-01-01T00:00:00.000Z');

    expect(serial).toBe(25569);
  });
});
