import Xlsx from '../types/xlsx';
import DataProvider from '../dataProvider';

const mockProviderState = {
  data: [[null]],
  sourceData: [[null]],
  cellsMeta: [[{}]],
  summaries: [],
};

jest.mock('../dataProvider', () => ({
  __esModule: true,
  default: class DataProviderMock {
    constructor(hot) {
      this.hot = hot;
    }

    setOptions() {}

    getData() {
      return mockProviderState.data;
    }

    getCellsMeta() {
      return mockProviderState.cellsMeta;
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
      return mockProviderState.summaries;
    }

    getSourceData() {
      return mockProviderState.sourceData;
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
 * Builds a minimal engine that satisfies the ExcelJS duck-type and records every cell object the
 * adapter writes into, keyed by `"row:col"`.
 *
 * @returns {{ engine: object, cells: Map<string, object> }}
 */
function createRecordingEngine() {
  const cells = new Map();

  class FakeWorkbook {
    constructor() {
      this.worksheets = [];
      this.calcProperties = {};
      this.xlsx = {
        writeBuffer: async() => new Uint8Array(),
      };
    }

    addWorksheet(name) {
      const worksheet = {
        name,
        state: 'visible',
        views: [],
        getColumn: () => ({}),
        getRow: rowNumber => ({
          getCell: (colNumber) => {
            const key = `${rowNumber}:${colNumber}`;

            if (!cells.has(key)) {
              cells.set(key, {});
            }

            return cells.get(key);
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

  return { engine: { Workbook: FakeWorkbook }, cells };
}

/**
 * Exports a one-row grid and returns the cells the engine received.
 *
 * @param {Array[]} data The display values of the only row.
 * @param {Array[]} sourceData The source values of the only row.
 * @param {Array[]} cellsMeta The cell meta of the only row.
 * @param {object} options Extra export options.
 * @returns {Promise<Map<string, object>>}
 */
async function exportRow(data, sourceData, cellsMeta, options = {}) {
  const instance = { rootDocument: document, rootWindow: window };
  const { engine, cells } = createRecordingEngine();

  mockProviderState.data = data;
  mockProviderState.sourceData = sourceData;
  mockProviderState.cellsMeta = cellsMeta;

  const xlsx = new Xlsx(new DataProvider(instance), { engine, ...options });

  await xlsx.export();

  return cells;
}

describe('Xlsx non-finite numbers', () => {
  afterEach(() => {
    mockProviderState.summaries = [];
  });

  it('should export a numeric cell holding Infinity as text', async() => {
    // `<v>Infinity</v>` is not a legal cell value and Excel refuses to open such a file.
    const cells = await exportRow([[Infinity]], [[Infinity]], [[{ type: 'numeric' }]]);

    expect(cells.get('1:1').value).toBe('Infinity');
  });

  it('should export a numeric cell holding -Infinity as text', async() => {
    const cells = await exportRow([[-Infinity]], [[-Infinity]], [[{ type: 'numeric' }]]);

    expect(cells.get('1:1').value).toBe('-Infinity');
  });

  it('should export a numeric cell holding NaN as text', async() => {
    const cells = await exportRow([[NaN]], [[NaN]], [[{ type: 'numeric' }]]);

    expect(cells.get('1:1').value).toBe('NaN');
  });

  it('should export a numeric cell whose string value parses to Infinity as text', async() => {
    const cells = await exportRow([['Infinity']], [['Infinity']], [[{ type: 'numeric' }]]);

    expect(cells.get('1:1').value).toBe('Infinity');
  });

  it('should keep a finite numeric cell a number', async() => {
    const cells = await exportRow([[42.5]], [[42.5]], [[{ type: 'numeric' }]]);

    expect(cells.get('1:1').value).toBe(42.5);
  });

  it('should cache a non-finite column-summary result as text instead of a number', async() => {
    mockProviderState.summaries = [{
      destRow: 0, destCol: 0, type: 'average', sourceCol: 0, sourceRanges: [[0, 0]],
    }];

    const cells = await exportRow([[NaN]], [[null]], [[{ type: 'numeric' }]], { exportFormulas: true });

    expect(cells.get('1:1').value.result).toBe('NaN');
  });
});
