import Xlsx from '../types/xlsx';
import DataProvider from '../dataProvider';

const mockProviderState = {
  data: [[null]],
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
      return [[{}]];
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
 * Exports a one-cell grid whose only cell is a ColumnSummary destination carrying `cellValue` as its
 * pre-calculated display value, and returns the cells the engine received.
 *
 * @param {*} cellValue The pre-calculated display value of the summary cell.
 * @returns {Promise<Map<string, object>>}
 */
async function exportSummaryCell(cellValue) {
  const instance = { rootDocument: document, rootWindow: window };
  const { engine, cells } = createRecordingEngine();

  mockProviderState.data = [[cellValue]];
  mockProviderState.summaries = [{
    destRow: 0, destCol: 0, type: 'sum', sourceCol: 0, sourceRanges: [[0, 0]],
  }];

  const xlsx = new Xlsx(new DataProvider(instance), { engine, exportFormulas: true });

  await xlsx.export();

  return cells;
}

describe('Xlsx summary formula result', () => {
  it('should carry a primitive pre-calculated result through unchanged', async() => {
    const cells = await exportSummaryCell(42);

    expect(cells.get('1:1').value).toEqual({ formula: 'SUM(A1)', result: 42 });
  });

  it('should drop a non-primitive pre-calculated result rather than hand it to the engine', async() => {
    // ExcelJS answers anything but a string, number, boolean, date, formula, rich text, hyperlink or
    // error with `I could not understand type of value`, which would abandon the whole export. A
    // custom renderer leaving an object or an array in a cell is all it takes.
    expect((await exportSummaryCell({ total: 42 })).get('1:1').value).toEqual({
      formula: 'SUM(A1)', result: null,
    });
    expect((await exportSummaryCell([1, 2])).get('1:1').value).toEqual({
      formula: 'SUM(A1)', result: null,
    });
    expect((await exportSummaryCell(undefined)).get('1:1').value).toEqual({
      formula: 'SUM(A1)', result: null,
    });
  });
});
