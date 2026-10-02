import Handsontable from 'handsontable/base';
import { registerPlugin, TrimRows } from 'handsontable/plugins';

registerPlugin(TrimRows);

/**
 * Builds a square dataset.
 *
 * @param {number} size The number of rows and columns.
 * @returns {Array[]}
 */
function square(size) {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (__, col) => `${row}-${col}`));
}

describe('Core#removeCellMeta', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds an 8x8 grid, writes a `marker` key at the given raw index, then shrinks the data.
   *
   * @param {number} row The raw row index the key is written at.
   * @param {number} column The raw column index the key is written at.
   * @param {number} size The size the grid is shrunk to.
   * @param {string} shrinkWith The name of the Core method that replaces the data.
   * @returns {object} The Handsontable instance.
   */
  function writeThenShrink(row, column, size, shrinkWith) {
    hot = new Handsontable(container, {
      data: square(8),
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.setCellMeta(row, column, 'marker', 'written');

    expect(hot.getCellMeta(row, column).marker).toBe('written');

    hot[shrinkWith](square(size));

    return hot;
  }

  describe('an index outside the current range', () => {
    // `setCellMeta` passes such an index through as the physical one, so `removeCellMeta` has to read
    // it the same way. Translating it unconditionally handed the meta manager a `null` and threw
    // "Assertion failed: Expecting an unsigned number".
    it('should remove a key written at an out-of-range ROW after a shrinking loadData', () => {
      writeThenShrink(6, 1, 3, 'loadData');

      expect(() => hot.removeCellMeta(6, 1, 'marker')).not.toThrow();

      hot.updateData(square(8));

      expect(hot.getCellMeta(6, 1).marker).toBeUndefined();
    });

    it('should remove a key written at an out-of-range COLUMN after a shrinking loadData', () => {
      writeThenShrink(1, 6, 3, 'loadData');

      expect(() => hot.removeCellMeta(1, 6, 'marker')).not.toThrow();

      hot.updateData(square(8));

      expect(hot.getCellMeta(1, 6).marker).toBeUndefined();
    });

    it('should remove a key written at an out-of-range ROW and COLUMN after a shrinking loadData', () => {
      writeThenShrink(6, 6, 3, 'loadData');

      expect(() => hot.removeCellMeta(6, 6, 'marker')).not.toThrow();

      hot.updateData(square(8));

      expect(hot.getCellMeta(6, 6).marker).toBeUndefined();
    });

    it('should remove a key written at the exact boundary (row === countRows())', () => {
      // The boundary is what separates `>=` from `>`: row 7 is out of range on a 7-row grid, and
      // reading it as a visual index throws.
      writeThenShrink(7, 7, 7, 'loadData');

      expect(hot.countRows()).toBe(7);
      expect(hot.countCols()).toBe(7);

      expect(() => hot.removeCellMeta(7, 7, 'marker')).not.toThrow();

      hot.updateData(square(8));

      expect(hot.getCellMeta(7, 7).marker).toBeUndefined();
    });
  });

  describe('an index outside the current range after updateData, which keeps the cell meta', () => {
    // `updateData` does not call `metaManager.clearCellsCache()`, so the key is genuinely still there
    // and skipping the removal would leave it addressing a live cell once the grid grows back.
    it('should remove a key written at an out-of-range ROW', () => {
      writeThenShrink(6, 1, 3, 'updateData');

      hot.removeCellMeta(6, 1, 'marker');
      hot.updateData(square(8));

      expect(hot.getCellMeta(6, 1).marker).toBeUndefined();
    });

    it('should remove a key written at an out-of-range COLUMN', () => {
      writeThenShrink(1, 6, 3, 'updateData');

      hot.removeCellMeta(1, 6, 'marker');
      hot.updateData(square(8));

      expect(hot.getCellMeta(1, 6).marker).toBeUndefined();
    });

    it('should remove a key written at an out-of-range ROW and COLUMN', () => {
      writeThenShrink(6, 6, 3, 'updateData');

      hot.removeCellMeta(6, 6, 'marker');
      hot.updateData(square(8));

      expect(hot.getCellMeta(6, 6).marker).toBeUndefined();
    });

    it('should remove a key written at the exact boundary (row === countRows())', () => {
      writeThenShrink(7, 7, 7, 'updateData');

      expect(hot.countRows()).toBe(7);

      hot.removeCellMeta(7, 7, 'marker');
      hot.updateData(square(8));

      expect(hot.getCellMeta(7, 7).marker).toBeUndefined();
    });
  });

  describe('the hooks', () => {
    it('should report the visual coordinates the caller passed and the cached value', () => {
      const before = jest.fn();
      const after = jest.fn();

      writeThenShrink(6, 6, 3, 'updateData');

      hot.addHook('beforeRemoveCellMeta', before);
      hot.addHook('afterRemoveCellMeta', after);

      hot.removeCellMeta(6, 6, 'marker');

      expect(before).toHaveBeenCalledWith(6, 6, 'marker', 'written');
      expect(after).toHaveBeenCalledWith(6, 6, 'marker', 'written');
    });

    it('should let a beforeRemoveCellMeta listener veto the removal of an out-of-range cell', () => {
      writeThenShrink(6, 6, 3, 'updateData');

      hot.addHook('beforeRemoveCellMeta', () => false);

      hot.removeCellMeta(6, 6, 'marker');
      hot.updateData(square(8));

      expect(hot.getCellMeta(6, 6).marker).toBe('written');
    });
  });

  describe('known limitation: an index outside the current range while rows are trimmed', () => {
    // KNOWN LIMITATION, not a contract. `setCellMeta` and `removeCellMeta` read a visual index at or
    // past `countRows()` as the PHYSICAL index as it is. With rows trimmed, that physical index can be
    // a live record shown at a different visual row, so the call reaches a cell the caller did not
    // name. Both JSDoc blocks document the limit and tell callers to pass the visual index instead.
    //
    // These specs pin today's behavior so a change to it is noticed. A fix that stops the
    // mis-address SHOULD turn them red: then rewrite them to assert the corrected behavior instead
    // of loosening them.
    it('currently removes the key from the visible record the raw index names as a physical one', () => {
      hot = new Handsontable(container, {
        data: square(10),
        trimRows: [0, 1, 2, 3, 4],
        licenseKey: 'non-commercial-and-evaluation',
      });

      expect(hot.countRows()).toBe(5);

      // Visual row 2 is physical row 7.
      hot.setCellMeta(2, 0, 'marker', 'written');

      expect(hot.getCellMeta(2, 0).marker).toBe('written');
      expect(hot.toPhysicalRow(2)).toBe(7);

      // Visual 7 is past `countRows()`, so it is read as physical 7 — the record visual 2 addresses.
      // The caller named visual row 7, which does not exist, yet visual row 2 loses its key.
      expect(() => hot.removeCellMeta(7, 0, 'marker')).not.toThrow();

      expect(hot.getCellMeta(2, 0).marker).toBeUndefined();
    });

    it('currently writes the key onto the visible record the raw index names, symmetrically', () => {
      hot = new Handsontable(container, {
        data: square(10),
        trimRows: [0, 1, 2, 3, 4],
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.setCellMeta(7, 0, 'marker', 'written');

      expect(hot.getCellMeta(2, 0).marker).toBe('written');

      hot.removeCellMeta(2, 0, 'marker');

      expect(hot.getCellMeta(2, 0).marker).toBeUndefined();
    });
  });

  it('should still translate an in-range index through the row index mapper', () => {
    // The control: nothing went out of range, so the visual index must still be translated.
    hot = new Handsontable(container, {
      data: square(4),
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rowIndexMapper.setIndexesSequence([3, 2, 1, 0]);
    hot.setCellMeta(0, 0, 'marker', 'written');

    expect(hot.getCellMeta(0, 0).marker).toBe('written');

    hot.removeCellMeta(0, 0, 'marker');

    expect(hot.getCellMeta(0, 0).marker).toBeUndefined();
  });
});
