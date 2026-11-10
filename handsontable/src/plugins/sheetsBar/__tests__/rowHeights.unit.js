import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * An array `rowHeights` or `minRowHeights` is read through a row index map that a data load resets. The sheets
 * bar loads a sheet's own data array again when the sheet is shown, so the map keeps its values per data array,
 * and a height stays on the row a user saw it on after a row insert and a round trip through another sheet.
 */
describe('SheetsBar with an array rowHeights or minRowHeights', () => {
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
   * Reads the height of every row.
   *
   * @returns {Array}
   */
  function heights() {
    return Array.from({ length: hot.countRows() }, (_, row) => hot.getRowHeight(row));
  }

  describe.each(['rowHeights', 'minRowHeights'])('%s', (option) => {
    it.each([
      ['the grid', true],
      ['the sheet', false],
    ])('should keep the heights %s declares on their rows after showing another sheet', (_name, gridLevel) => {
      const declared = [40, 60, 80];
      const sheetA = { name: 'A', data: [['a'], ['b'], ['c']], settings: gridLevel ? {} : { [option]: declared } };
      const sheetB = { name: 'B', data: [['x'], ['y'], ['z']] };

      hot = new Handsontable(container, {
        ...(gridLevel ? { [option]: declared } : {}),
        autoRowSize: false,
        sheetsBar: { sheets: [sheetA, sheetB] },
        licenseKey: TEST_LICENSE_KEY,
      });

      hot.alter('insert_row_above', 1);

      const shownBefore = heights();

      expect(shownBefore[0]).toBe(40);
      expect(shownBefore.slice(2)).toEqual([60, 80]);

      hot.getPlugin('sheetsBar').setActiveSheet('B');

      // the other sheet starts from the array, not from the rows of sheet A
      if (gridLevel) {
        expect(heights()).toEqual([40, 60, 80]);
      }

      hot.getPlugin('sheetsBar').setActiveSheet('A');

      expect(heights()).toEqual(shownBefore);
      expect(declared).toEqual([40, 60, 80]);
    });
  });

  describe.each(['rowHeights', 'minRowHeights'])('%s, with a different array on each side', (option) => {
    it.each([
      ['both sheets declare their own array', false],
      ['the grid declares one array and sheet A overrides it', true],
    ])('should keep the heights on their rows after a round trip when %s', (_name, gridLevel) => {
      const sheetA = { name: 'A', data: [['a'], ['b'], ['c']], settings: { [option]: [100, 50, 40] } };
      const sheetB = { name: 'B', data: [['x'], ['y'], ['z']], settings: gridLevel ? {} : { [option]: [7, 8, 9] } };

      hot = new Handsontable(container, {
        ...(gridLevel ? { [option]: [10, 20, 30] } : {}),
        autoRowSize: false,
        sheetsBar: { sheets: [sheetA, sheetB] },
        licenseKey: TEST_LICENSE_KEY,
      });

      hot.alter('remove_row', 0);

      expect(heights()).toEqual([50, 40]);

      hot.getPlugin('sheetsBar').setActiveSheet('B');

      expect(heights()).toEqual(gridLevel ? [10, 20, 30] : [7, 8, 9]);

      hot.getPlugin('sheetsBar').setActiveSheet('A');

      expect(heights()).toEqual([50, 40]);

      hot.alter('insert_row_above', 1);
      hot.getPlugin('sheetsBar').setActiveSheet('B');
      hot.getPlugin('sheetsBar').setActiveSheet('A');

      expect(heights()).toEqual([50, undefined, 40]);
    });
  });

  it('should not bring back the alignment of an earlier visit on a later settings update', () => {
    hot = new Handsontable(container, {
      rowHeights: [100, 50, 40],
      autoRowSize: false,
      sheetsBar: { sheets: [{ name: 'A', data: [['a'], ['b'], ['c']] }, { name: 'B', data: [['x']] }] },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.getPlugin('sheetsBar').setActiveSheet('B');
    hot.getPlugin('sheetsBar').setActiveSheet('A');
    // as many rows as when the sheet was left, on other rows
    hot.alter('insert_row_above', 0);
    hot.alter('remove_row', 3);

    expect(heights()).toEqual([undefined, 100, 50]);

    hot.updateSettings({ readOnly: false });

    expect(heights()).toEqual([undefined, 100, 50]);
  });
});
