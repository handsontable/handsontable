import Handsontable from 'handsontable/base';
import { registerPlugin, HiddenColumns } from 'handsontable/plugins';

registerPlugin(HiddenColumns);

/**
 * Builds a grid of four columns, `A` to `D`, over two rows.
 *
 * @param {Array} data The source data.
 * @param {object} [settings] Extra settings.
 * @returns {Handsontable} The instance.
 */
function buildGrid(data, settings = {}) {
  return new Handsontable(document.createElement('div'), {
    data,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
}

const arrayData = () => [
  ['A1', 'B1', 'C1', 'D1'],
  ['A2', 'B2', 'C2', 'D2'],
];
const objectData = () => [
  { a: 'A1', b: 'B1', c: 'C1', d: 'D1' },
  { a: 'A2', b: 'B2', c: 'C2', d: 'D2' },
];
const objectColumns = [{ data: 'a' }, { data: 'b' }, { data: 'c' }, { data: 'd' }];

describe('Core source data getters and the column index', () => {
  describe.each([
    ['an array of arrays', arrayData, {}],
    ['an array of objects', objectData, { columns: objectColumns }],
  ])('with %s', (_name, data, settings) => {
    it('should read the column by its visual index after the columns were moved', () => {
      const hot = buildGrid(data(), settings);

      // Visual order after the move: B, C, A, D.
      hot.columnIndexMapper.moveIndexes([0], 2);

      expect(hot.toPhysicalColumn(0)).toBe(1);
      expect(hot.getSourceDataAtCell(0, 0)).toBe('B1');
      expect(hot.getSourceDataAtCell(1, 2)).toBe('A2');
      expect(hot.getSourceDataAtCol(0)).toEqual(['B1', 'B2']);
      expect(hot.getSourceDataAtCol(2)).toEqual(['A1', 'A2']);

      hot.destroy();
    });

    it('should read the column by its visual index after a column was trimmed', () => {
      const hot = buildGrid(data(), settings);
      const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('test-trim', 'trimming');

      // Visual order after trimming the first column: B, C, D.
      trimmingMap.setValueAtIndex(0, true);

      expect(hot.getSourceDataAtCell(0, 0)).toBe('B1');
      expect(hot.getSourceDataAtCell(1, 2)).toBe('D2');
      expect(hot.getSourceDataAtCol(0)).toEqual(['B1', 'B2']);
      expect(hot.getSourceDataAtCol(2)).toEqual(['D1', 'D2']);

      hot.destroy();
    });

    it('should read a hidden column by its visual index after the columns were moved', () => {
      const hot = buildGrid(data(), { ...settings, hiddenColumns: { columns: [1] } });

      // Visual order after the move: B (hidden), C, A, D. A hidden column keeps its visual slot.
      hot.columnIndexMapper.moveIndexes([0], 2);

      expect(hot.getSourceDataAtCell(0, 0)).toBe('B1');
      expect(hot.getSourceDataAtCell(0, 2)).toBe('A1');
      expect(hot.getSourceDataAtCol(0)).toEqual(['B1', 'B2']);

      hot.destroy();
    });

    it('should take the row as a physical index after the rows were moved', () => {
      const hot = buildGrid(data(), settings);

      // Visual order of the rows after the move: second, first.
      hot.rowIndexMapper.moveIndexes([0], 1);

      expect(hot.getDataAtCell(0, 0)).toBe('A2');
      expect(hot.getSourceDataAtCell(0, 0)).toBe('A1');
      expect(hot.getSourceDataAtCell(1, 1)).toBe('B2');

      hot.destroy();
    });
  });

  it('should address a column by its property name regardless of the column order', () => {
    const hot = buildGrid(objectData(), { columns: objectColumns });

    hot.columnIndexMapper.moveIndexes([0], 3);

    expect(hot.getSourceDataAtCell(0, 'a')).toBe('A1');
    expect(hot.getSourceDataAtCell(1, 'd')).toBe('D2');

    hot.destroy();
  });

  it('should read the trimmed column of an array of arrays by a physical range, not by a number', () => {
    const hot = buildGrid(arrayData());
    const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('test-trim', 'trimming');

    trimmingMap.setValueAtIndex(0, true);

    // The number 0 names the first visible column, which is B.
    expect(hot.getSourceDataAtCell(0, 0)).toBe('B1');
    expect(hot.getSourceDataAtCol(0)).toEqual(['B1', 'B2']);
    // The trimmed column A is reachable only by a physical range.
    expect(hot.getSourceData(0, 0, 1, 0)).toEqual([['A1'], ['A2']]);

    hot.destroy();
  });

  it('should read an index past the last visible column of an array of arrays as a physical index', () => {
    const hot = buildGrid(arrayData());
    const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('test-trim', 'trimming');

    trimmingMap.setValueAtIndex(0, true);

    // Three columns stay visible (B, C, D), so the visual index 3 names no column and falls back to the
    // physical column 3, which is D.
    expect(hot.countCols()).toBe(3);
    expect(hot.getSourceDataAtCell(0, 3)).toBe('D1');

    hot.destroy();
  });

  it('should read a range of an array of arrays by physical column indexes', () => {
    const hot = buildGrid(arrayData());

    hot.columnIndexMapper.moveIndexes([0], 2);

    // `getSourceData()` does not follow the column order, unlike `getSourceDataAtCell()`.
    expect(hot.getSourceData(0, 0, 0, 1)).toEqual([['A1', 'B1']]);
    expect(hot.getSourceDataAtCell(0, 0)).toBe('B1');

    hot.destroy();
  });
});
