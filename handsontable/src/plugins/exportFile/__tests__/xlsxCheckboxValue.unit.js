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

/**
 * Exports a single checkbox cell and returns the cell object the engine received.
 *
 * @param {*} value The cell value.
 * @param {object} meta Extra checkbox cell meta (templates).
 * @returns {Promise<object>}
 */
async function exportCheckbox(value, meta = {}) {
  const cells = await exportRow([[value]], [[value]], [[{ type: 'checkbox', ...meta }]]);

  return cells.get('1:1');
}

describe('Xlsx checkbox values', () => {
  it('should export a `null` checkbox value as an empty cell', async() => {
    const cell = await exportCheckbox(null);

    expect(cell.value).toBeNull();
  });

  it('should export an `undefined` checkbox value as an empty cell', async() => {
    const cell = await exportCheckbox(undefined);

    expect(cell.value).toBeNull();
  });

  it('should export an empty-string checkbox value as an empty cell', async() => {
    const cell = await exportCheckbox('');

    expect(cell.value).toBeNull();
  });

  it('should export the default checked and unchecked values as booleans', async() => {
    expect((await exportCheckbox(true)).value).toBe(true);
    expect((await exportCheckbox(false)).value).toBe(false);
  });

  it('should export a value matching `checkedTemplate` as `true`', async() => {
    const cell = await exportCheckbox('yes', { checkedTemplate: 'yes', uncheckedTemplate: 'no' });

    expect(cell.value).toBe(true);
  });

  it('should export a value matching `uncheckedTemplate` as `false`', async() => {
    const cell = await exportCheckbox('no', { checkedTemplate: 'yes', uncheckedTemplate: 'no' });

    expect(cell.value).toBe(false);
  });

  it('should export an empty string as `false` when `uncheckedTemplate` is an empty string', async() => {
    // The empty string is the configured "unchecked" value, so it is not the "no value" state.
    const cell = await exportCheckbox('', { checkedTemplate: 'yes', uncheckedTemplate: '' });

    expect(cell.value).toBe(false);
  });

  it('should export `null` as an empty cell when `uncheckedTemplate` is an empty string', async() => {
    const cell = await exportCheckbox(null, { checkedTemplate: 'yes', uncheckedTemplate: '' });

    expect(cell.value).toBeNull();
  });

  it('should export a non-empty value matching neither template as `false`', async() => {
    const cell = await exportCheckbox('maybe', { checkedTemplate: 'yes', uncheckedTemplate: 'no' });

    expect(cell.value).toBe(false);
  });
});
