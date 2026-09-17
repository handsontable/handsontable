import Xlsx from '../types/xlsx';
import DataProvider from '../dataProvider';

jest.mock('../dataProvider', () => ({
  __esModule: true,
  default: class DataProviderMock {
    constructor(hot) {
      this.hot = hot;
    }

    setOptions() {}

    getData() {
      return [[null]];
    }

    getCellsMeta() {
      return [[{ type: 'dropdown', source: ['a', 'b'] }]];
    }

    getCellElements() {
      return [[null]];
    }

    getColumnHeaders() {
      return [];
    }

    getColumnHeadersClassNames() {
      return [];
    }

    getRowHeaders() {
      return [];
    }

    getColumnsWidths() {
      return [];
    }

    getRowsHeights() {
      return [];
    }

    getMergeCells() {
      return [];
    }

    getFrozenRows() {
      return 0;
    }

    getFrozenColumns() {
      return 0;
    }

    getNestedColumnHeaders() {
      return null;
    }

    getLayoutDirection() {
      return 'ltr';
    }

    getColumnSummaries() {
      return [];
    }

    getSourceData() {
      return [[null]];
    }

    getFormulasSeparator() {
      return ',';
    }

    getExcludedHiddenRows() {
      return null;
    }

    getExcludedHiddenColumns() {
      return null;
    }

    getHiddenRowDataIndices() {
      return [];
    }

    getHiddenColumnDataIndices() {
      return [];
    }
  },
}));

/**
 * Builds a minimal engine that satisfies the ExcelJS duck-type and records the worksheet names
 * the adapter asks it to create, in order.
 *
 * @returns {{ engine: object, sheetNames: string[] }}
 */
function createRecordingEngine() {
  const sheetNames = [];

  class FakeWorkbook {
    constructor() {
      this.worksheets = [];
      this.xlsx = {
        writeBuffer: async() => new Uint8Array(),
      };
    }

    addWorksheet(name) {
      sheetNames.push(name);

      const worksheet = {
        name,
        state: 'visible',
        views: [],
        getColumn: () => ({}),
        getRow: () => ({ getCell: () => ({}), commit: () => {} }),
        mergeCells: () => {},
        addConditionalFormatting: () => {},
        protect: () => {},
      };

      this.worksheets.push(worksheet);

      return worksheet;
    }
  }

  return { engine: { Workbook: FakeWorkbook }, sheetNames };
}

/**
 * Exports one sheet per given name, each carrying a dropdown cell, and returns the worksheet names
 * the engine received.
 *
 * @param {...string} names The exported sheet names.
 * @returns {Promise<string[]>}
 */
async function exportSheetsNamed(...names) {
  const instance = { rootDocument: document, rootWindow: window };
  const { engine, sheetNames } = createRecordingEngine();
  const xlsx = new Xlsx(new DataProvider(instance), {
    engine,
    sheets: names.map(name => ({ instance, name })),
  });

  await xlsx.export();

  return sheetNames;
}

describe('Xlsx validation helper sheet name', () => {
  it('should suffix the helper sheet when the exported sheet already carries its name', async() => {
    expect(await exportSheetsNamed('_HotValidation')).toEqual(['_HotValidation', '_HotValidation1']);
  });

  it('should leave the helper sheet name unsuffixed when it does not collide', async() => {
    expect(await exportSheetsNamed('Data')).toEqual(['Data', '_HotValidation']);
  });

  it('should give every sheet of a multi-sheet export its own helper sheet', async() => {
    expect(await exportSheetsNamed('Data', 'More')).toEqual(
      ['Data', '_HotValidation', 'More', '_HotValidation1'],
    );
  });
});

describe('Xlsx sheet-name sanitization', () => {
  it('should strip the characters the format forbids', async() => {
    // ExcelJS throws `Worksheet name … cannot include any of the following characters` for each of
    // these, which used to abandon the whole export.
    const [name] = await exportSheetsNamed('Q1: Sales / EMEA [draft]?');

    expect(name).toBe('Q1 Sales  EMEA draft');
  });

  it('should strip leading and trailing single quotes and fall back on an empty result', async() => {
    expect(await exportSheetsNamed('\'Quoted\'')).toEqual(['Quoted', '_HotValidation']);
    // Trimming only AFTER the quote strip leaves `'Q1'` intact, which ExcelJS rejects — the name it
    // tests is the one it is handed, whitespace and all.
    expect(await exportSheetsNamed(' \'Q1\' ')).toEqual(['Q1', '_HotValidation']);
    expect(await exportSheetsNamed('[*]')).toEqual(['Sheet', '_HotValidation']);
    expect(await exportSheetsNamed('   ')).toEqual(['Sheet', '_HotValidation']);
  });

  it('should rename the reserved History sheet whatever its case', async() => {
    // ExcelJS rejects the exact `History` only; Excel reserves the name case-insensitively, and the
    // duplicate check above already compares names that way.
    expect(await exportSheetsNamed('History')).toEqual(['History_', '_HotValidation']);
    expect(await exportSheetsNamed('history')).toEqual(['history_', '_HotValidation']);
    expect(await exportSheetsNamed('HISTORY')).toEqual(['HISTORY_', '_HotValidation']);
  });

  it('should truncate to 31 characters before de-duplicating, not after', async() => {
    // Two 35-character names that differ only at character 33. Truncating after the duplicate check
    // lets both arrive at the same 31 characters, which ExcelJS answers by throwing.
    const base = 'A'.repeat(32);
    const [first, , second] = await exportSheetsNamed(`${base}XYZ`, `${base}PQR`);

    expect(first).toBe('A'.repeat(31));
    expect(second).toBe(`${'A'.repeat(30)}1`);
    expect(second.length).toBeLessThanOrEqual(31);
  });

  it('should de-duplicate case-insensitively, the way ExcelJS compares names', async() => {
    expect(await exportSheetsNamed('Data', 'data')).toEqual(
      ['Data', '_HotValidation', 'data1', '_HotValidation1'],
    );
  });
});
