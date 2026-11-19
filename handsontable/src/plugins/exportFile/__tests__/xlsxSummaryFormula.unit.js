import Xlsx from '../types/xlsx';
import ExportDataProvider from '../dataProvider';

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

    getEngineCellFacts() {
      return this.getData().map(row => row.map(() => null));
    }

    getFormulasSeparator() {
      return ',';
    }

    getFormulasDecimalSeparator() {
      return '.';
    }

    getNamedExpressions() {
      return [];
    }

    getFormulasBinding() {
      return null;
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
 * @param {object} [descriptor] Keys to add to the summary descriptor.
 * @returns {Promise<Map<string, object>>}
 */
async function exportSummaryCell(cellValue, descriptor = {}) {
  const instance = { rootDocument: document, rootWindow: window, getSettings: () => ({}) };
  const { engine, cells } = createRecordingEngine();

  mockProviderState.data = [[cellValue]];
  mockProviderState.summaries = [{
    destRow: 0, destCol: 0, type: 'sum', sourceCol: 0, sourceRanges: [[0, 0]], ...descriptor,
  }];

  const xlsx = new Xlsx(new ExportDataProvider(instance), { engine, exportFormulas: true });

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

  it('should write a summary that includes other summary results as its value, not as a formula', async() => {
    // The source ranges leave every summary destination out, so `SUM(A1)` would recalculate to the
    // direct rows only (11 in place of 35 for the nested subtotal case).
    const cells = await exportSummaryCell(35, { includesSummaryResults: true });

    // The mocked cell meta has no type, so the value goes out the way a text cell does.
    expect(cells.get('1:1').value).toBe('35');
  });

  it('should keep the formula of a summary that does not include other summary results', async() => {
    const cells = await exportSummaryCell(11, { includesSummaryResults: false });

    expect(cells.get('1:1').value).toEqual({ formula: 'SUM(A1)', result: 11 });
  });
});
