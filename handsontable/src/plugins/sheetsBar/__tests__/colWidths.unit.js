import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * An array `colWidths` is read through a column index map that a data load resets. The sheets bar loads a
 * sheet's own data array again when the sheet is shown, so the map keeps its values per data array, and a
 * width stays on the column a user saw it on after a column insert and a round trip through another sheet.
 */
describe('SheetsBar with an array colWidths', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

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
   * Reads the width of every column.
   *
   * @returns {Array}
   */
  function widths() {
    return Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column));
  }

  it.each([
    ['the grid', true],
    ['the sheet', false],
  ])('should keep the widths %s declares on their columns after showing another sheet', (_name, gridLevel) => {
    const colWidths = [100, 150, 200];
    const sheetA = { name: 'A', data: [['a', 'b', 'c']], settings: gridLevel ? {} : { colWidths } };
    const sheetB = { name: 'B', data: [['x', 'y', 'z']] };

    hot = new Handsontable(container, {
      ...(gridLevel ? { colWidths } : {}),
      autoColumnSize: false,
      sheetsBar: { sheets: [sheetA, sheetB] },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.alter('insert_col_start', 1);

    expect(widths()).toEqual([100, 50, 150, 200]);

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    // the other sheet starts from the array, not from the columns of sheet A
    expect(widths()).toEqual(gridLevel ? [100, 150, 200] : [50, 50, 50]);

    hot.getPlugin('sheetsBar').setActiveSheet('A');

    expect(widths()).toEqual([100, 50, 150, 200]);
    expect(colWidths).toEqual([100, 150, 200]);
  });

  it.each([
    ['both sheets declare their own array', false],
    ['the grid declares one array and sheet A overrides it', true],
  ])('should keep the widths on their columns after a round trip when %s', (_name, gridLevel) => {
    const sheetA = { name: 'A', data: [['a', 'b', 'c']], settings: { colWidths: [100, 150, 200] } };
    const sheetB = { name: 'B', data: [['x', 'y', 'z']], settings: gridLevel ? {} : { colWidths: [7, 8, 9] } };

    hot = new Handsontable(container, {
      ...(gridLevel ? { colWidths: [10, 20, 30] } : {}),
      autoColumnSize: false,
      sheetsBar: { sheets: [sheetA, sheetB] },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.alter('remove_col', 0);

    expect(widths()).toEqual([150, 200]);

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(widths()).toEqual(gridLevel ? [10, 20, 30] : [7, 8, 9]);

    hot.getPlugin('sheetsBar').setActiveSheet('A');

    expect(widths()).toEqual([150, 200]);

    hot.alter('insert_col_start', 1);
    hot.getPlugin('sheetsBar').setActiveSheet('B');
    hot.getPlugin('sheetsBar').setActiveSheet('A');

    expect(widths()).toEqual([150, 50, 200]);
  });

  it('should not bring back the alignment of an earlier visit on a later settings update', () => {
    hot = new Handsontable(container, {
      colWidths: [100, 150, 200],
      autoColumnSize: false,
      sheetsBar: { sheets: [{ name: 'A', data: [['a', 'b', 'c']] }, { name: 'B', data: [['x']] }] },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.getPlugin('sheetsBar').setActiveSheet('B');
    hot.getPlugin('sheetsBar').setActiveSheet('A');
    // as many columns as when the sheet was left, on other columns
    hot.alter('insert_col_start', 0);
    hot.alter('remove_col', 3);

    expect(widths()).toEqual([50, 100, 150]);

    hot.updateSettings({ readOnly: false });

    expect(widths()).toEqual([50, 100, 150]);
  });
});
