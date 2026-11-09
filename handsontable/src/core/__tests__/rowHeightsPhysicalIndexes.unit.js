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

  it('should not read the array for a header or a row outside the grid', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    expect(hot._getRowHeightFromSettings(-1)).toBeUndefined();
    expect(hot._getRowHeightFromSettings(3)).toBeUndefined();
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

    expect(hot.getSettings().rowHeights).toEqual([100, undefined, 50, 40]);
    expect(hot.getRowHeight(0)).toBe(100);
    expect(hot.getRowHeight(1)).toBeUndefined();
    expect(hot.getRowHeight(2)).toBe(50);
    expect(hot.getRowHeight(3)).toBe(40);
  });

  it('should keep the heights with their rows when a row is appended after a move', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.rowIndexMapper.moveIndexes([0], 2);
    // appended after the last visible row, which takes a physical index in the middle
    hot.alter('insert_row_below', 2);

    // visual order is [b, c, a, new]
    expect(hot.getRowHeight(0)).toBe(50);
    expect(hot.getRowHeight(1)).toBe(40);
    expect(hot.getRowHeight(2)).toBe(100);
    expect(hot.getRowHeight(3)).toBeUndefined();
  });

  it('should drop the height of a removed row after a move', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.rowIndexMapper.moveIndexes([0], 2);
    hot.alter('remove_row', 0);

    // visual order was [b, c, a], so b is gone
    expect(hot.getSettings().rowHeights).toEqual([100, 40]);
    expect(hot.getRowHeight(0)).toBe(40);
    expect(hot.getRowHeight(1)).toBe(100);
  });

  it('should drop the height of a removed row while rows above it are trimmed', () => {
    createGrid({ data: [['a'], ['b'], ['c'], ['d']], rowHeights: [100, 50, 40, 30] });

    trimRows([1]);
    // visual order is [a, c, d], so c (physical 2) is removed
    hot.alter('remove_row', 1);

    expect(hot.getSettings().rowHeights).toEqual([100, 50, 30]);
    expect(hot.getRowHeight(1)).toBe(30);
  });

  it('should drop the heights of rows removed from the end', () => {
    createGrid({ rowHeights: [100, 50, 40] });

    hot.alter('remove_row', undefined, 2);

    expect(hot.countRows()).toBe(1);
    expect(hot.getSettings().rowHeights).toEqual([100]);
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
    expect(hot.getSettings().rowHeights).toEqual([50, 30]);
  });

  it('should keep an array `minRowHeights` aligned with its rows', () => {
    createGrid({ minRowHeights: [80, 60, 70] });

    hot.alter('remove_row', 0);

    expect(hot.getSettings().minRowHeights).toEqual([60, 70]);

    hot.alter('insert_row_above', 0);

    expect(hot.getSettings().minRowHeights).toEqual([undefined, 60, 70]);
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
});
