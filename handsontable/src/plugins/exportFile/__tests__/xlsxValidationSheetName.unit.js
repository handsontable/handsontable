import Xlsx from '../types/xlsx';
import DataProvider from '../dataProvider';

// Read lazily by the mock below (jest hoists the factory above these, so they must be `mock`-prefixed).
let mockData = [[null]];
let mockCellsMeta = [[{ type: 'dropdown', source: ['a', 'b'] }]];

jest.mock('../dataProvider', () => ({
  __esModule: true,
  default: class DataProviderMock {
    constructor(hot) {
      this.hot = hot;
    }

    setOptions() {}

    getData() {
      return mockData;
    }

    getCellsMeta() {
      return mockCellsMeta;
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
  const cells = [];
  const recorded = { writeOptions: undefined };

  class FakeWorkbook {
    constructor() {
      this.worksheets = [];
      this.xlsx = {
        writeBuffer: async(options) => {
          recorded.writeOptions = options;

          return new Uint8Array();
        },
      };
    }

    addWorksheet(name) {
      sheetNames.push(name);

      const worksheet = {
        name,
        state: 'visible',
        views: [],
        getColumn: () => ({}),
        // Cells are memoized per address so a test can read back what the adapter wrote on them.
        getRow: rowNumber => ({
          getCell: (colNumber) => {
            const key = `${name}!${rowNumber}:${colNumber}`;
            const existing = cells.find(entry => entry.key === key);

            if (existing) {
              return existing.cell;
            }

            const cell = {};

            cells.push({ key, cell });

            return cell;
          },
          commit: () => {},
        }),
        mergeCells: () => {},
        addConditionalFormatting: () => {},
        protect: () => {},
      };

      this.worksheets.push(worksheet);

      return worksheet;
    }
  }

  return { engine: { Workbook: FakeWorkbook }, sheetNames, cells, recorded };
}

/**
 * Exports one single-cell sheet with the given type options and cell meta, and returns what the
 * engine received: the `writeBuffer` options and every cell the adapter wrote on.
 *
 * @param {object} typeOptions Extra options for the XLSX type (e.g. `compression`).
 * @param {object} [meta] The one cell's meta.
 * @param {*} [value] The one cell's value.
 * @returns {Promise<{ writeOptions: object, cells: object[] }>}
 */
async function exportOneCell(typeOptions, meta = { type: 'text' }, value = 'x') {
  const instance = { rootDocument: document, rootWindow: window };
  const { engine, cells, recorded } = createRecordingEngine();

  mockData = [[value]];
  mockCellsMeta = [[meta]];

  try {
    const xlsx = new Xlsx(new DataProvider(instance), { engine, sheets: [{ instance, name: 'Data' }], ...typeOptions });

    await xlsx.export();
  } finally {
    mockData = [[null]];
    mockCellsMeta = [[{ type: 'dropdown', source: ['a', 'b'] }]];
  }

  return { writeOptions: recorded.writeOptions, cells: cells.map(entry => entry.cell) };
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

describe('Xlsx compression default', () => {
  it('should DEFLATE at level 6 when compression is not set, as every 18.x export did', async() => {
    // `null` used to pass no `zip` options, and JSZip's own default is DEFLATE. Mapping the default
    // to STORE made every default export several times larger.
    const { writeOptions } = await exportOneCell({});

    expect(writeOptions).toEqual({ zip: { compression: 'DEFLATE', compressionOptions: { level: 6 } } });
  });

  it('should store the entries only for an explicit false, and honor a numeric level', async() => {
    expect((await exportOneCell({ compression: false })).writeOptions).toEqual({ zip: { compression: 'STORE' } });
    expect((await exportOneCell({ compression: 3 })).writeOptions)
      .toEqual({ zip: { compression: 'DEFLATE', compressionOptions: { level: 3 } } });
  });
});

describe('Xlsx default date and time formats', () => {
  it('should write a default-options date cell as mm/dd/yyyy and a default time cell as hh:mm AM/PM', async() => {
    // The grid's defaults (`metaSchema.ts`): `dateFormat: { year: 'numeric', month: '2-digit',
    // day: '2-digit' }`, `timeFormat: { hour: '2-digit', minute: '2-digit' }`, `locale: 'en-US'`.
    // A time format that sets no `hour12` takes the locale's clock, which is 12-hour for en-US.
    const dateFormat = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateMeta = { type: 'date', dateFormat, locale: 'en-US' };
    const timeMeta = { type: 'time', timeFormat: { hour: '2-digit', minute: '2-digit' }, locale: 'en-US' };
    const numFmts = cells => cells.map(cell => cell.numFmt).filter(Boolean);

    expect(numFmts((await exportOneCell({}, dateMeta, '2024-01-15')).cells)).toEqual(['mm/dd/yyyy']);
    expect(numFmts((await exportOneCell({}, timeMeta, '08:30')).cells)).toEqual(['hh:mm AM/PM']);
  });
});
