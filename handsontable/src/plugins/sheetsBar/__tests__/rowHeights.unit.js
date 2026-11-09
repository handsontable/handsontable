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
});
