import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('rowHeights addressed by physical row index', () => {
  let container;
  let hot;

  /**
   * Builds and initializes a three-row grid in the shared container.
   *
   * @param {object} settings The grid settings.
   * @returns {Core}
   */
  function createGrid(settings) {
    hot = new Core(container, {
      licenseKey: TEST_LICENSE_KEY,
      // A raw `Core` is not a root instance, so no default theme is picked for it; name one.
      themeName: 'ht-theme-main',
      data: [['a'], ['b'], ['c']],
      autoRowSize: false,
      ...settings,
    });
    hot.init();

    return hot;
  }

  /**
   * Trims the given physical rows through a trimming map, the way Filters, TrimRows and a NestedRows
   * collapse do.
   *
   * @param {number[]} physicalRows The physical rows to trim.
   */
  function trimRows(physicalRows) {
    const map = hot.rowIndexMapper.createAndRegisterIndexMap('rowHeightsTest', 'trimming', false);

    hot.batchExecution(() => {
      physicalRows.forEach(physicalRow => map.setValueAtIndex(physicalRow, true));
    }, true);
  }

  /**
   * Reads the height of every row.
   *
   * @returns {Array}
   */
  function heights() {
    return Array.from({ length: hot.countRows() }, (_, row) => hot.getRowHeight(row));
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should keep an array height with its row after the row is moved', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.rowIndexMapper.moveIndexes([0], 2);

    // visual order is now [1, 2, 0]
    expect(hot.getRowHeight(0)).toBe(50);
    expect(hot.getRowHeight(1)).toBe(40);
    expect(hot.getRowHeight(2)).toBe(100);
  });

  it('should not give a trimmed row\'s height to the row that takes its place', () => {
    createGrid({ data: [['a'], ['b'], ['c'], ['d']], rowHeights: [100, 50] });

    trimRows([1]);

    // visual order is now [0, 2, 3]
    expect(hot.getRowHeight(0)).toBe(100);
    expect(hot.getRowHeight(1)).toBeUndefined();
    expect(hot._isRowHeightExact(1)).toBe(false);
  });

  it('should call the `rowHeights` function with the physical index', () => {
    const rowHeights = jasmine.createSpy('rowHeights').and.callFake(physical => (physical + 1) * 30);

    createGrid({ rowHeights });

    hot.rowIndexMapper.moveIndexes([0], 2);

    expect(hot.getRowHeight(0)).toBe(60);
    expect(hot.getRowHeight(2)).toBe(30);
  });

  it('should read an array `minRowHeights` by the physical index', () => {
    createGrid({ data: [['a'], ['b'], ['c'], ['d']], minRowHeights: [80, 60] });

    trimRows([0]);

    expect(hot.getRowHeight(0)).toBe(60);
    expect(hot.getRowHeight(1)).toBeUndefined();
  });

  it('should not read the array or call the function for a header or a row outside the grid', () => {
    // a fourth entry, so a read at the visual index would find a value
    createGrid({ rowHeights: [100, 50, 40, 30] });

    expect(hot._getRowHeightFromSettings(-1)).toBeUndefined();
    expect(hot._getRowHeightFromSettings(3)).toBeUndefined();

    const rowHeights = jasmine.createSpy('rowHeights').and.returnValue(70);

    hot.updateSettings({ rowHeights });
    rowHeights.calls.reset();

    expect(hot._getRowHeightFromSettings(3)).toBeUndefined();
    expect(rowHeights).not.toHaveBeenCalled();
  });

  it('should leave the height untouched when no row is moved or trimmed', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    expect(hot.getRowHeight(0)).toBe(100);
    expect(hot.getRowHeight(1)).toBe(50);
    expect(hot.getRowHeight(2)).toBe(40);
  });

  it('should keep the heights with their rows when a row is inserted in the middle', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.alter('insert_row_above', 1);

    expect(hot.getRowHeight(0)).toBe(100);
    expect(hot.getRowHeight(1)).toBeUndefined();
    expect(hot.getRowHeight(2)).toBe(50);
    expect(hot.getRowHeight(3)).toBe(40);
  });

  it('should give a row inserted below another no height of its own', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.alter('insert_row_below', 0);

    expect(hot.getDataAtCol(0)).toEqual(['a', null, 'b', 'c']);
    expect(hot.getRowHeight(0)).toBe(100);
    expect(hot.getRowHeight(1)).toBeUndefined();
    expect(hot.getRowHeight(2)).toBe(50);
  });

  it('should give a row inserted below the last row on screen, in the middle physically, no height', () => {
    // a fourth entry, so the row taking the next entry would read 30
    createGrid({ rowHeights: [100, 50, 40, 30] });

    hot.rowIndexMapper.moveIndexes([0], 2);
    // appended after the last visible row, which takes a physical index in the middle
    hot.alter('insert_row_below', 2);

    // visual order is [b, c, a, new]
    expect(hot.getRowHeight(0)).toBe(50);
    expect(hot.getRowHeight(1)).toBe(40);
    expect(hot.getRowHeight(2)).toBe(100);
    expect(hot.getRowHeight(3)).toBeUndefined();
  });

  it('should keep the heights on their rows when an `afterCreateRow` listener inserts a row', () => {
    let inserted = false;

    createGrid({
      rowHeights: [10, 20, 30],
      afterCreateRow() {
        if (!inserted) {
          inserted = true;
          this.alter('insert_row_above', 0);
        }
      },
    });

    hot.alter('insert_row_below', 1);

    expect(hot.getDataAtCol(0)).toEqual([null, 'a', 'b', null, 'c']);
    expect(heights()).toEqual([undefined, 10, 20, undefined, 30]);
  });

  it('should keep the other row index maps on their rows for an insert below a row', () => {
    createGrid({ rowHeights: [10, 20, 30] });

    const map = hot.rowIndexMapper.createAndRegisterIndexMap('insertBelowProbe', 'physicalIndexToValue', null);

    map.setValueAtIndex(1, 'b');
    hot.alter('insert_row_below', 1);

    expect(hot.getDataAtCol(0)).toEqual(['a', 'b', null, 'c']);
    expect(map.getValues()).toEqual([null, 'b', null, null]);
    expect(heights()).toEqual([10, 20, undefined, 30]);
  });

  it('should give the rows appended at the end the next entries, whichever way they are created', () => {
    createGrid({ data: [['a']], rowHeights: [40, 60, 70, 80] });

    hot.alter('insert_row_below');
    hot.setDataAtCell(2, 0, 'c');
    // below the last row is an append too
    hot.alter('insert_row_below', 2);

    expect(hot.countRows()).toBe(4);
    expect([0, 1, 2, 3].map(row => hot.getRowHeight(row))).toEqual([40, 60, 70, 80]);
  });

  it('should apply the declared heights to the rows added to a grid created empty', () => {
    createGrid({ data: [], columns: [{}], rowHeights: [40, 60] });

    hot.alter('insert_row_below', undefined, 2);

    expect([0, 1].map(row => hot.getRowHeight(row))).toEqual([40, 60]);
  });

  it('should give an appended row the entry after the highest one in use', () => {
    createGrid({ data: [['a'], ['b'], ['c'], ['d']], rowHeights: [100, 50, 40, 30, 20] });

    hot.alter('remove_row', 1);
    hot.alter('insert_row_below');

    // a, c and d keep entries 0, 2 and 3, and the appended row takes entry 4
    expect([0, 1, 2, 3].map(row => hot.getRowHeight(row))).toEqual([100, 40, 30, 20]);
  });

  it('should drop the height of a removed row after a move', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.rowIndexMapper.moveIndexes([0], 2);
    hot.alter('remove_row', 0);

    // visual order was [b, c, a], so b is gone
    expect(hot.getRowHeight(0)).toBe(40);
    expect(hot.getRowHeight(1)).toBe(100);
  });

  it('should drop the height of a removed row while rows above it are trimmed', () => {
    createGrid({ data: [['a'], ['b'], ['c'], ['d']], rowHeights: [100, 50, 40, 30] });

    trimRows([1]);
    // visual order is [a, c, d], so c (physical 2) is removed
    hot.alter('remove_row', 1);

    expect(hot.getRowHeight(0)).toBe(100);
    expect(hot.getRowHeight(1)).toBe(30);
  });

  it('should drop the heights of rows removed from the end', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.alter('remove_row', undefined, 2);

    expect(hot.countRows()).toBe(1);
    expect(hot.getRowHeight(0)).toBe(100);
  });

  it('should keep the heights of a sparse array with their rows when a row is removed', () => {
    const rowHeights = new Array(6);

    rowHeights[2] = 30;
    rowHeights[5] = 80;
    createGrid({ data: [['a'], ['b'], ['c'], ['d'], ['e'], ['f']], rowHeights });

    hot.alter('remove_row', 0);

    // c and f, now at visual 1 and 4
    expect(hot.getRowHeight(1)).toBe(30);
    expect(hot.getRowHeight(4)).toBe(80);
    expect(hot.getRowHeight(0)).toBeUndefined();
  });

  it('should drop the heights of every row a `beforeRemoveRow` listener adds to the removal', () => {
    createGrid({ data: [['a'], ['b'], ['c'], ['d']], rowHeights: [100, 50, 40, 30] });

    hot.addHook('beforeRemoveRow', (index, amount, physicalRows) => {
      physicalRows.push(2);
    });
    hot.alter('remove_row', 0, 1);

    expect(hot.getDataAtCol(0)).toEqual(['b', 'd']);
    expect(hot.getRowHeight(0)).toBe(50);
    expect(hot.getRowHeight(1)).toBe(30);
  });

  it('should keep an array `minRowHeights` with its rows', () => {
    createGrid({ minRowHeights: [80, 60, 70] });

    hot.alter('remove_row', 0);

    expect(hot.getRowHeight(0)).toBe(60);
    expect(hot.getRowHeight(1)).toBe(70);

    hot.alter('insert_row_above', 0);

    expect(hot.getRowHeight(1)).toBe(60);
    expect(hot.getRowHeight(2)).toBe(70);
  });

  it('should never change the array the user passed', () => {
    const rowHeights = [100, 50, 40];

    createGrid({ rowHeights });

    hot.alter('insert_row_above', 1);
    hot.alter('remove_row', 0);

    expect(hot.getSettings().rowHeights).toBe(rowHeights);
    expect(rowHeights).toEqual([100, 50, 40]);
  });

  it('should apply a new array passed to `updateSettings()` after rows were inserted and removed', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.alter('insert_row_above', 1);
    hot.updateSettings({ rowHeights: [30, 31, 32, 33] });

    expect([0, 1, 2, 3].map(row => hot.getRowHeight(row))).toEqual([30, 31, 32, 33]);

    hot.alter('remove_row', 0);
    hot.updateSettings({ minRowHeights: [70, 71, 72] });

    expect(hot.getSettings().rowHeights).toEqual([30, 31, 32, 33]);
    expect([0, 1, 2].map(row => hot.getRowHeight(row))).toEqual([31, 32, 33]);

    hot.updateSettings({ rowHeights: undefined });

    expect([0, 1, 2].map(row => hot.getRowHeight(row))).toEqual([70, 71, 72]);
  });

  it('should keep the declaration when `updateSettings()` passes the same array again', () => {
    const rowHeights = [100, 50, 40];

    createGrid({ rowHeights });

    hot.alter('insert_row_above', 0);
    hot.updateSettings({ rowHeights });

    expect([0, 1, 2, 3].map(row => hot.getRowHeight(row))).toEqual([undefined, 100, 50, 40]);
  });

  it('should apply an entry the user changes in place to the row it belongs to', () => {
    const rowHeights = [100, 50, 40];

    createGrid({ rowHeights });

    hot.alter('insert_row_above', 0);
    rowHeights[1] = 77;

    // b, declared at entry 1, is now at visual 2
    expect(hot.getRowHeight(2)).toBe(77);
  });

  it('should leave a `rowHeights` function untouched when rows are inserted', () => {
    const rowHeights = physical => (physical + 1) * 30;

    createGrid({ rowHeights });

    hot.alter('insert_row_above', 0);

    expect(hot.getSettings().rowHeights).toBe(rowHeights);
  });

  it('should still apply a number and a string height to every row', () => {
    createGrid({ rowHeights: 80 });

    hot.rowIndexMapper.moveIndexes([0], 2);

    expect(hot.getRowHeight(1)).toBe(80);

    hot.updateSettings({ rowHeights: '90px' });

    expect(hot.getRowHeight(1)).toBe(90);
  });

  it('should drop the row height cache when the origins of the rows change', () => {
    createGrid({ rowHeights: [10, 20, 30] });

    const invalidate = spyOn(hot.view, 'invalidateRowHeightCache').and.callThrough();
    const origins = hot._readRowSizeOrigins();

    origins.set('rowHeights', [2, 1, 0]);
    hot._writeRowSizeOrigins(origins);

    expect(invalidate).toHaveBeenCalled();
    expect(heights()).toEqual([30, 20, 10]);
  });

  it('should give no height to a row appended at the physical end that sits between others on screen', () => {
    createGrid({ rowHeights: [10, 20, 30, 40] });

    hot.rowIndexMapper.setIndexesSequence([2, 0, 1]);
    // below the row at visual 0 (physical 2, the last physical row), so above `a` on screen
    hot.alter('insert_row_below', 0);

    expect(hot.getDataAtCol(0)).toEqual(['c', null, 'a', 'b']);
    expect(heights()).toEqual([30, undefined, 10, 20]);
  });

  it('should not bring back origins kept before the rows changed, when the data is loaded again', () => {
    const data = [['a'], ['b'], ['c']];
    const rowHeights = [10, 20, 30];

    createGrid({ data, rowHeights });

    hot.alter('insert_row_above', 1);
    hot.updateSettings({ rowHeights: 50 });
    // as many rows as before, on other rows, while the array is not followed
    hot.alter('remove_row', 1);
    hot.alter('insert_row_above', 3);
    hot.updateSettings({ rowHeights });

    expect(heights()).toEqual([10, 20, 30, undefined]);

    hot.loadData(data);

    expect(heights()).toEqual([10, 20, 30, undefined]);
  });

  it('should give a data array shown earlier back the alignment it had, when it is loaded again', () => {
    const first = [['a'], ['b'], ['c']];
    const second = [['x'], ['y'], ['z']];

    createGrid({ data: first, rowHeights: [10, 20, 30] });

    hot.alter('insert_row_above', 1);
    hot.loadData(second);

    expect(heights()).toEqual([10, 20, 30]);

    // `first` holds the inserted row, so its heights stay on their rows
    hot.loadData(first);

    expect(hot.getDataAtCol(0)).toEqual(['a', null, 'b', 'c']);
    expect(heights()).toEqual([10, undefined, 20, 30]);
  });

  it('should keep only the alignment of the last array replaced while the data stays', () => {
    const first = [['a'], ['b'], ['c']];
    const declared = [10, 20, 30, 40];

    createGrid({ data: first, rowHeights: declared });

    hot.alter('insert_row_above', 1);
    // each new array replaces what the previous one kept
    hot.updateSettings({ rowHeights: [1, 2, 3, 4] });
    hot.updateSettings({ rowHeights: [5, 6, 7, 8] });
    hot.loadData([['x'], ['y'], ['z'], ['w']]);
    hot.updateSettings({ rowHeights: declared });
    hot.loadData(first);

    expect(heights()).toEqual([10, 20, 30, 40]);
  });
});
