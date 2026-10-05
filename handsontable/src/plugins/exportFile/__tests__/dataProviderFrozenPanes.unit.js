import DataProvider from '../dataProvider';
import BaseType from '../types/_base';

/**
 * Builds a minimal Handsontable stand-in with identity index mapping.
 *
 * @param {object} config The grid shape.
 * @param {number} config.rows Number of rows.
 * @param {number} config.cols Number of columns.
 * @param {number} [config.fixedRowsTop] The `fixedRowsTop` setting.
 * @param {number} [config.fixedColumnsStart] The `fixedColumnsStart` setting.
 * @param {number[]} [config.hiddenRows] Hidden row indexes.
 * @param {number[]} [config.hiddenColumns] Hidden column indexes.
 * @returns {object}
 */
function createHot({ rows, cols, fixedRowsTop = 0, fixedColumnsStart = 0, hiddenRows = [], hiddenColumns = [] }) {
  return {
    countRows: () => rows,
    countCols: () => cols,
    getSettings: () => ({ fixedRowsTop, fixedColumnsStart }),
    toPhysicalRow: row => row,
    toPhysicalColumn: column => column,
    rowIndexMapper: { isHidden: row => hiddenRows.includes(row) },
    columnIndexMapper: { isHidden: column => hiddenColumns.includes(column) },
  };
}

/**
 * Creates a data provider for the given grid shape and export options.
 *
 * @param {object} hotConfig See {@link createHot}.
 * @param {object} [options] Export options.
 * @returns {DataProvider}
 */
function createProvider(hotConfig, options = {}) {
  const dataProvider = new DataProvider(createHot(hotConfig));

  // The export types always merge their defaults (`range: []`, `exportHiddenRows: false`, ...)
  // before handing the options to the data provider.
  dataProvider.setOptions({ ...BaseType.DEFAULT_OPTIONS, ...options });

  return dataProvider;
}

describe('DataProvider#getFrozenColumns', () => {
  it('should return `fixedColumnsStart` when no column is hidden and no range is set', () => {
    const dataProvider = createProvider({ rows: 3, cols: 5, fixedColumnsStart: 2 });

    expect(dataProvider.getFrozenColumns()).toBe(2);
  });

  it('should not count a hidden column inside the frozen band that the export excludes', () => {
    const dataProvider = createProvider({ rows: 3, cols: 5, fixedColumnsStart: 2, hiddenColumns: [0] });

    expect(dataProvider.getFrozenColumns()).toBe(1);
  });

  it('should ignore a hidden column outside the frozen band', () => {
    const dataProvider = createProvider({ rows: 3, cols: 5, fixedColumnsStart: 2, hiddenColumns: [3] });

    expect(dataProvider.getFrozenColumns()).toBe(2);
  });

  it('should count a hidden column when `exportHiddenColumns` is `true`', () => {
    const dataProvider = createProvider(
      { rows: 3, cols: 5, fixedColumnsStart: 2, hiddenColumns: [0] },
      { exportHiddenColumns: true },
    );

    expect(dataProvider.getFrozenColumns()).toBe(2);
  });

  it('should count a hidden column when `exportHiddenColumns` is `\'hide\'`', () => {
    const dataProvider = createProvider(
      { rows: 3, cols: 5, fixedColumnsStart: 2, hiddenColumns: [0] },
      { exportHiddenColumns: 'hide' },
    );

    expect(dataProvider.getFrozenColumns()).toBe(2);
  });

  it('should not count frozen columns before the start of the export range', () => {
    const dataProvider = createProvider(
      { rows: 3, cols: 6, fixedColumnsStart: 3 },
      { range: [0, 1, 2, 5] },
    );

    expect(dataProvider.getFrozenColumns()).toBe(2);
  });

  it('should return 0 when the export range starts after the frozen band', () => {
    const dataProvider = createProvider(
      { rows: 3, cols: 6, fixedColumnsStart: 2 },
      { range: [0, 3, 2, 5] },
    );

    expect(dataProvider.getFrozenColumns()).toBe(0);
  });

  it('should not count frozen columns after the end of the export range', () => {
    const dataProvider = createProvider(
      { rows: 3, cols: 6, fixedColumnsStart: 4 },
      { range: [0, 0, 2, 1] },
    );

    expect(dataProvider.getFrozenColumns()).toBe(2);
  });

  it('should combine the range start and an excluded hidden column', () => {
    const dataProvider = createProvider(
      { rows: 3, cols: 6, fixedColumnsStart: 4, hiddenColumns: [0, 2] },
      { range: [0, 1, 2, 5] },
    );

    // Frozen band 0-3, range from 1: columns 1, 2, 3 are in range, 2 is hidden and excluded.
    expect(dataProvider.getFrozenColumns()).toBe(2);
  });
});

describe('DataProvider#getFrozenRows', () => {
  it('should return `fixedRowsTop` when no row is hidden and no range is set', () => {
    const dataProvider = createProvider({ rows: 5, cols: 3, fixedRowsTop: 2 });

    expect(dataProvider.getFrozenRows()).toBe(2);
  });

  it('should not count a hidden row inside the frozen band that the export excludes', () => {
    const dataProvider = createProvider({ rows: 5, cols: 3, fixedRowsTop: 3, hiddenRows: [1] });

    expect(dataProvider.getFrozenRows()).toBe(2);
  });

  it('should count a hidden row when `exportHiddenRows` is `true`', () => {
    const dataProvider = createProvider(
      { rows: 5, cols: 3, fixedRowsTop: 3, hiddenRows: [1] },
      { exportHiddenRows: true },
    );

    expect(dataProvider.getFrozenRows()).toBe(3);
  });

  it('should count a hidden row when `exportHiddenRows` is `\'hide\'`', () => {
    const dataProvider = createProvider(
      { rows: 5, cols: 3, fixedRowsTop: 3, hiddenRows: [1] },
      { exportHiddenRows: 'hide' },
    );

    expect(dataProvider.getFrozenRows()).toBe(3);
  });

  it('should not count frozen rows before the start of the export range', () => {
    const dataProvider = createProvider(
      { rows: 6, cols: 3, fixedRowsTop: 2 },
      { range: [1, 0, 5, 2] },
    );

    expect(dataProvider.getFrozenRows()).toBe(1);
  });

  it('should return 0 when the export range starts after the frozen band', () => {
    const dataProvider = createProvider(
      { rows: 6, cols: 3, fixedRowsTop: 2 },
      { range: [4, 0, 5, 2] },
    );

    expect(dataProvider.getFrozenRows()).toBe(0);
  });

  it('should not count frozen rows after the end of the export range', () => {
    // Export > To Excel with rows 0-1 selected passes this range: the sheet holds two data rows, so
    // a pane frozen below row 4 would sit past the end of it.
    const dataProvider = createProvider(
      { rows: 6, cols: 3, fixedRowsTop: 4 },
      { range: [0, 0, 1, 2] },
    );

    expect(dataProvider.getFrozenRows()).toBe(2);
  });
});
