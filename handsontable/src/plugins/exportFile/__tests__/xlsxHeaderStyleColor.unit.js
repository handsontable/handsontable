import Xlsx from '../types/xlsx';
import ExportDataProvider from '../dataProvider';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import { resetTierKeys, tierKeyWithout } from '../../../utils/entitlementLicenseKey/__tests__/tierKeys';

// A two-column sheet with one header row. Read lazily by the mock below (jest hoists the factory, so
// the name must be `mock`-prefixed).
const mockState = {
  data: [
    ['a', 1],
    ['b', 2],
  ],
  cellsMeta: [
    [{}, {}],
    [{}, {}],
  ],
  columnHeaders: ['Name', 'Qty'],
  columnSummaries: [],
};

jest.mock('../dataProvider', () => ({
  __esModule: true,
  default: class DataProviderMock {
    constructor(hot) {
      this.hot = hot;
    }

    setOptions() {}

    getData() {
      return mockState.data;
    }

    getCellsMeta() {
      return mockState.cellsMeta;
    }

    getCellElements() {
      return mockState.cellsMeta.map(row => row.map(() => null));
    }

    getColumnHeaders() {
      return mockState.columnHeaders;
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
      return mockState.columnSummaries;
    }

    getSourceData() {
      return mockState.data;
    }

    getEngineCellFacts() {
      return mockState.data.map(row => row.map(() => null));
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
 * A stand-in for a Handsontable instance carrying a license key with every xlsx token.
 *
 * @returns {object}
 */
function createInstance() {
  const licenseKey = tierKeyWithout([]);

  return { rootDocument: document, rootWindow: window, getSettings: () => ({ licenseKey }) };
}

describe('Xlsx export `headerStyle` colors', () => {
  let writeSpy;

  beforeEach(() => {
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    writeSpy.mockRestore();
    resetTierKeys();
  });

  /**
   * Exports the mock sheet with `headerStyle` and returns the header cells of the workbook snapshot.
   *
   * @param {object} headerStyle The `headerStyle` option value.
   * @returns {Promise<object[]>}
   */
  async function exportHeaderCells(headerStyle) {
    const xlsx = new Xlsx(new ExportDataProvider(createInstance()), { headerStyle });

    await xlsx.export();

    return writeSpy.mock.calls[0][0].sheets[0].rows[0].filter(Boolean);
  }

  it.each([
    ['a 3-letter named color', 'red', 'FFFF0000'],
    ['a 6-letter named color', 'tomato', 'FFFF6347'],
    ['a named color', 'cornflowerblue', 'FF6495ED'],
    ['an rgb() color', 'rgb(68, 114, 196)', 'FF4472C4'],
    ['an hsl() color', 'hsl(120, 100%, 25%)', 'FF008000'],
    ['a hex color', '#4472C4', 'FF4472C4'],
  ])('writes %s as the matching header fill and border color', async(_, color, argb) => {
    const cells = await exportHeaderCells({ backgroundColor: color, border: { style: 'thin', color } });

    expect(cells.length).toBe(2);

    cells.forEach((cell) => {
      expect(cell.style.fill.fgColor).toEqual({ argb });
      expect(cell.style.border.top.color).toEqual({ argb });
      expect(cell.style.border.left.color).toEqual({ argb });
    });
  });
});
