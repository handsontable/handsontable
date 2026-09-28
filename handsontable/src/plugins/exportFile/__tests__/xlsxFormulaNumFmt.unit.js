import Xlsx from '../types/xlsx';
import DataProvider from '../dataProvider';

const mockProviderState = {
  data: [[null]],
  sourceData: [[null]],
  cellsMeta: [[{}]],
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
      return [];
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
 * Exports a one-cell grid whose cell carries `meta` and holds `sourceValue` in the source data and
 * `cellValue` as its pre-calculated display value, and returns the cells the engine received.
 *
 * @param {object} meta The cell meta of the only cell.
 * @param {*} sourceValue The raw source value (a formula string for a formula cell).
 * @param {*} cellValue The pre-calculated display value.
 * @returns {Promise<Map<string, object>>}
 */
async function exportSingleCell(meta, sourceValue, cellValue) {
  const instance = { rootDocument: document, rootWindow: window };
  const { engine, cells } = createRecordingEngine();

  mockProviderState.data = [[cellValue]];
  mockProviderState.sourceData = [[sourceValue]];
  mockProviderState.cellsMeta = [[meta]];

  const xlsx = new Xlsx(new DataProvider(instance), { engine, exportFormulas: true });

  await xlsx.export();

  return cells;
}

describe('Xlsx formula cell number format', () => {
  it('should give a numeric formula cell the number format its column meta describes', async() => {
    // Without it the cell reaches the file unformatted, the import infers `text`, and a column
    // rendering `840.10` comes back as `840.1`.
    const cells = await exportSingleCell(
      { type: 'numeric', numericFormat: { minimumFractionDigits: 2 }, locale: 'en-US' },
      '=B1*0.2',
      840.1
    );

    expect(cells.get('1:1').numFmt).toBe('#,##0.00');
  });

  it('should cache the pre-calculated value as the formula result for non-Excel readers', async() => {
    const cells = await exportSingleCell(
      { type: 'numeric', numericFormat: { minimumFractionDigits: 2 }, locale: 'en-US' },
      '=B1*0.2',
      840.1
    );

    expect(cells.get('1:1').value).toEqual({ formula: 'B1*0.2', result: 840.1 });
  });

  it('should give a date formula cell the same number format a value cell of that type gets', async() => {
    const cells = await exportSingleCell(
      { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
      '=TODAY()',
      '2025-03-09'
    );

    expect(cells.get('1:1').numFmt).toBe('mm-dd-yyyy');
  });

  it('should leave a formula cell in an unformatted column with no number format', async() => {
    const cells = await exportSingleCell({ type: 'text' }, '=A1&B1', 'ab');

    expect(cells.get('1:1').numFmt).toBeUndefined();
    expect(cells.get('1:1').value).toEqual({ formula: 'A1&B1', result: 'ab' });
  });
});
