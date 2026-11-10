import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('colWidths addressed by physical column index', () => {
  let container;
  let hot;

  /**
   * Builds and initializes a three-column grid in the shared container.
   *
   * @param {object} settings The grid settings.
   * @returns {Core}
   */
  function createGrid(settings) {
    hot = new Core(container, {
      licenseKey: TEST_LICENSE_KEY,
      // A raw `Core` is not a root instance, so no default theme is picked for it; name one.
      themeName: 'ht-theme-main',
      data: [['a', 'b', 'c']],
      autoColumnSize: false,
      ...settings,
    });
    hot.init();

    return hot;
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

  it('should keep an array width with its column after the column is moved', () => {
    createGrid({ colWidths: [100, 120, 140] });

    hot.columnIndexMapper.moveIndexes([0], 2);

    // visual order is now [1, 2, 0]
    expect(hot.getColWidth(0)).toBe(120);
    expect(hot.getColWidth(1)).toBe(140);
    expect(hot.getColWidth(2)).toBe(100);
  });

  it('should call the `colWidths` function with the physical index', () => {
    const colWidths = jasmine.createSpy('colWidths').and.callFake(physical => (physical + 1) * 10);

    createGrid({ colWidths });

    hot.columnIndexMapper.moveIndexes([0], 2);

    expect(hot.getColWidth(0)).toBe(20);
    expect(hot.getColWidth(2)).toBe(10);
  });

  it('should keep a `columns[].width` with its column after the column is moved', () => {
    createGrid({ columns: [{ width: 100 }, { width: 120 }, { width: 140 }] });

    hot.columnIndexMapper.moveIndexes([0], 2);

    expect(hot.getColWidth(0)).toBe(120);
    expect(hot.getColWidth(2)).toBe(100);
  });

  it('should not read the array or call the function for a header or a column outside the grid', () => {
    // a fourth entry, so a read at the visual index would find a value
    createGrid({ colWidths: [100, 120, 140, 160] });

    expect(hot._getColWidthFromSettings(-1)).toBeUndefined();
    expect(hot._getColWidthFromSettings(3)).toBeUndefined();

    const colWidths = jasmine.createSpy('colWidths').and.returnValue(70);

    hot.updateSettings({ colWidths });
    colWidths.calls.reset();

    expect(hot._getColWidthFromSettings(3)).toBeUndefined();
    expect(colWidths).not.toHaveBeenCalled();
  });

  it('should keep the widths with their columns when a column is appended after a move', () => {
    createGrid({ colWidths: [100, 120, 140] });

    hot.columnIndexMapper.moveIndexes([0], 2);
    // appended after the last visible column, which takes a physical index in the middle
    hot.alter('insert_col_end', 2);

    // visual order is [B, C, A, new]
    expect(hot.getColWidth(0)).toBe(120);
    expect(hot.getColWidth(1)).toBe(140);
    expect(hot.getColWidth(2)).toBe(100);
    expect(hot.getColWidth(3)).toBe(50);
  });

  it('should keep the widths with their columns when a column is inserted in the middle', () => {
    createGrid({ colWidths: [100, 120, 140] });

    hot.alter('insert_col_start', 1);

    expect(hot.getColWidth(0)).toBe(100);
    expect(hot.getColWidth(1)).toBe(50);
    expect(hot.getColWidth(2)).toBe(120);
    expect(hot.getColWidth(3)).toBe(140);
  });

  it('should drop the width of a removed column after a move', () => {
    createGrid({ colWidths: [100, 120, 140] });

    hot.columnIndexMapper.moveIndexes([0], 2);
    hot.alter('remove_col', 0);

    // visual order was [B, C, A], so B is gone
    expect(hot.getColWidth(0)).toBe(140);
    expect(hot.getColWidth(1)).toBe(100);
  });

  it('should drop the widths of columns removed from the end', () => {
    createGrid({ colWidths: [100, 120, 140] });

    hot.alter('remove_col', undefined, 2);

    expect(hot.countCols()).toBe(1);
    expect(hot.getColWidth(0)).toBe(100);
  });

  it('should leave the width untouched when no column is moved', () => {
    createGrid({ colWidths: [100, 120, 140] });

    expect(hot.getColWidth(0)).toBe(100);
    expect(hot.getColWidth(1)).toBe(120);
    expect(hot.getColWidth(2)).toBe(140);
  });

  it('should still apply a number and a string width to every column', () => {
    createGrid({ colWidths: 80 });

    expect(hot.getColWidth(1)).toBe(80);

    hot.updateSettings({ colWidths: '90px' });

    expect(hot.getColWidth(1)).toBe(90);
  });
  /**
   * Reads the width of every column.
   *
   * @returns {Array}
   */
  function widths() {
    return Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column));
  }

  it('should apply a new array passed to updateSettings() after columns were inserted and removed', () => {
    createGrid({ colWidths: [100, 150, 200] });

    hot.alter('insert_col_start', 1);
    hot.updateSettings({ colWidths: [30, 31, 32, 33] });

    expect(widths()).toEqual([30, 31, 32, 33]);

    hot.alter('remove_col', 0);
    hot.updateSettings({ colWidths: [40, 41, 42] });

    expect(widths()).toEqual([40, 41, 42]);
  });

  it('should never change the array the user passed', () => {
    const colWidths = [100, 150, 200];

    createGrid({ colWidths });

    hot.alter('insert_col_start', 1);
    hot.alter('remove_col', 0);

    expect(hot.getSettings().colWidths).toBe(colWidths);
    expect(colWidths).toEqual([100, 150, 200]);
    expect(widths()).toEqual([50, 150, 200]);
  });

  it('should keep the same array declared when updateSettings() passes it again', () => {
    const colWidths = [100, 150, 200];

    createGrid({ colWidths });

    hot.alter('insert_col_start', 0);
    hot.updateSettings({ colWidths });

    expect(widths()).toEqual([50, 100, 150, 200]);
  });

  it('should apply an entry the user changes in place to the column it belongs to', () => {
    const colWidths = [100, 150, 200];

    createGrid({ colWidths });

    hot.alter('insert_col_start', 0);
    colWidths[1] = 99;
    hot.view.invalidateColumnWidthCache();

    expect(widths()).toEqual([50, 100, 99, 200]);
  });

  it('should give the columns appended at the end the next entries, whichever way they are created', () => {
    createGrid({ colWidths: [100, 150, 200, 250, 300, 350] });

    hot.alter('insert_col_end', 2); // to the right of the last column
    hot.alter('insert_col_end'); // with no index, after the last column
    hot.setDataAtCell(0, 5, 'x'); // a write past the last column

    expect(widths()).toEqual([100, 150, 200, 250, 300, 350]);
  });

  it('should give a column appended after a removal the entry after the highest one in use', () => {
    createGrid({ colWidths: [100, 150, 200, 250] });

    hot.alter('remove_col', 1);
    hot.alter('insert_col_end', 1);

    // the entry after the highest one in use, so the removed entry (150) is not handed out again
    expect(widths()).toEqual([100, 200, 250]);
  });

  it('should give a column appended after the last column was removed the entry after the highest one in use', () => {
    createGrid({ colWidths: [100, 150, 200] });

    hot.alter('remove_col', 2);
    hot.alter('insert_col_end', 1);

    // no column holds entry 2 any more, so the appended column takes it, as a row does with `rowHeights`
    expect(widths()).toEqual([100, 150, 200]);
  });

  it('should give a column inserted to the right of another no width of its own', () => {
    createGrid({ colWidths: [100, 150, 200] });

    hot.alter('insert_col_end', 0);

    expect(widths()).toEqual([100, 50, 150, 200]);
  });

  it('should apply the declared widths to the columns added to a grid created narrower', () => {
    createGrid({ data: [['a']], colWidths: [40, 60, 80], minSpareCols: 2 });

    expect(widths()).toEqual([40, 60, 80]);
  });

  it('should keep the widths after an insert and a removal on a data array the grid came back to', () => {
    const colWidths = [100, 150, 200];
    const first = [['a', 'b', 'c']];
    const second = [['d', 'e', 'f']];

    createGrid({ data: first, colWidths });

    hot.loadData(second);
    hot.loadData(first);

    hot.alter('insert_col_start', 0);
    hot.alter('remove_col', 3);

    expect(widths()).toEqual([50, 100, 150]);

    // A settings update that does not mention `colWidths`, as a React or Vue re-render sends it.
    hot.updateSettings({});

    expect(widths()).toEqual([50, 100, 150]);
  });

  it('should declare the widths again when the same array is set after a non-array value', () => {
    const colWidths = [100, 150, 200];

    createGrid({ colWidths });

    hot.alter('insert_col_start', 0);
    hot.updateSettings({ colWidths: 70 });
    // the columns change while the array is not followed
    hot.alter('remove_col', 3);
    hot.alter('insert_col_end', 2);
    hot.updateSettings({ colWidths });

    // declared again from the first column, never with the origins from before the changes
    expect(widths()).toEqual([100, 150, 200, 50]);
  });

  it('should keep the widths on their columns when `updateData()` brings back a data array with as many columns', () => {
    const first = [['a', 'b', 'c']];

    createGrid({ data: first, colWidths: [100, 150, 200] });
    hot.alter('insert_col_start', 1);
    hot.loadData([['d', 'e', 'f', 'g']]);

    expect(widths()).toEqual([100, 150, 200, 50]);

    const invalidate = spyOn(hot.view, 'invalidateColumnWidthCache').and.callThrough();

    hot.updateData(first);

    expect(widths()).toEqual([100, 50, 150, 200]);
    expect(invalidate).toHaveBeenCalled();
  });

  it('should stop reading through the map once colWidths is no longer an array', () => {
    createGrid({ colWidths: [100, 150, 200] });

    hot.alter('insert_col_start', 0);
    hot.updateSettings({ colWidths: 70 });

    expect(widths()).toEqual([70, 70, 70, 70]);

    hot.updateSettings({ colWidths: [10, 20, 30, 40] });

    expect(widths()).toEqual([10, 20, 30, 40]);
  });

  it('should give no width to a column appended at the physical end that sits between others on screen', () => {
    createGrid({ colWidths: [10, 20, 30, 40] });

    hot.columnIndexMapper.setIndexesSequence([2, 0, 1]);
    // to the right of the column at visual 0 (physical 2, the last physical column), so before `a` on screen
    hot.alter('insert_col_end', 0);

    expect(hot.getDataAtRow(0)).toEqual(['c', null, 'a', 'b']);
    expect(widths()).toEqual([30, 50, 10, 20]);
  });

  it('should not bring back origins kept before the columns changed, when the data is loaded again', () => {
    const data = [['a', 'b', 'c']];
    const colWidths = [10, 20, 30];

    createGrid({ data, colWidths });

    hot.alter('insert_col_start', 1);
    hot.updateSettings({ colWidths: 50 });
    // as many columns as before, on other columns, while the array is not followed
    hot.alter('remove_col', 1);
    hot.alter('insert_col_start', 3);
    hot.updateSettings({ colWidths });

    expect(widths()).toEqual([10, 20, 30, 50]);

    hot.loadData(data);

    expect(widths()).toEqual([10, 20, 30, 50]);
  });
});
