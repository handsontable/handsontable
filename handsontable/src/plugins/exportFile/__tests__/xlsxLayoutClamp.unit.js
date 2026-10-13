import Xlsx from '../types/xlsx';
import DataProvider from '../dataProvider';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import * as consoleHelpers from '../../../helpers/console';

const mockProviderState = {
  data: [['a']],
  sourceData: [['a']],
  cellsMeta: [[{}]],
  widths: [],
  heights: [],
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
      return mockProviderState.widths;
    }

    getRowsHeights() {
      return mockProviderState.heights;
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
 * Exports a one-cell grid through the built-in engine with the given column width and row height
 * (CSS pixels), and reads the file back with the built-in reader.
 *
 * @param {number} width The column width in pixels.
 * @param {number} height The row height in pixels.
 * @returns {Promise<object>} The first sheet read back.
 */
async function roundTrip(width, height) {
  const instance = { rootDocument: document, rootWindow: window };

  mockProviderState.widths = [width];
  mockProviderState.heights = [height];

  const xlsx = new Xlsx(new DataProvider(instance), {});
  const bytes = await xlsx.export();
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const snapshot = await nativeAdapter.read(copy, undefined, new DroppedFeatures());

  return snapshot.sheets[0];
}

describe('Xlsx column widths and row heights past what Excel stores', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should write a very wide column and a very tall row at Excel\'s maximum, so both survive a re-import', async() => {
    // 2100 px is 300 width units and 600 px is 450 pt. Written as-is, the built-in reader DISCARDED
    // both (above 260 units / 409.5 pt) and the column came back at the default width.
    const sheet = await roundTrip(2100, 600);

    expect(sheet.colWidths[0]).toBe(260);
    expect(sheet.rowHeights[0]).toBe(409.5);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toBe(
      'The "native" xlsx engine dropped features it cannot write or read: columnWidth:clamped, rowHeight:clamped.'
    );
  });

  it('should keep a width and a height inside the limits as they are, and warn about nothing', async() => {
    const sheet = await roundTrip(1820, 546);

    expect(sheet.colWidths[0]).toBe(260);
    expect(sheet.rowHeights[0]).toBe(409.5);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
