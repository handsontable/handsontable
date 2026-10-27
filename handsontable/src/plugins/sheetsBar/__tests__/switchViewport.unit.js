import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * Builds rows of two cells each.
 *
 * @param {number} rows The row count.
 * @param {string} prefix The text the first cell starts with.
 * @returns {Array[]}
 */
function rowsOf(rows, prefix) {
  return Array.from({ length: rows }, (_, row) => [`${prefix}${row}`, row]);
}

describe('SheetsBar: the viewport and the frozen counts a switch or a teardown leaves', () => {
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
    jest.restoreAllMocks();
  });

  describe('a sheet with no view state', () => {
    it('opens a never-visited sheet scrolled to its first row and column', () => {
      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'A', data: rowsOf(200, 'a') }, { name: 'B', data: rowsOf(200, 'b') }] },
        licenseKey: LICENSE_KEY,
      });
      const scrollViewportTo = jest.spyOn(hot, 'scrollViewportTo');

      hot.getPlugin('sheetsBar').setActiveSheet('B');

      expect(scrollViewportTo).toHaveBeenCalledWith(expect.objectContaining({
        row: 0,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      }));
    });

    it('opens a newly added sheet scrolled to its first row and column', () => {
      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'A', data: rowsOf(200, 'a') }] },
        licenseKey: LICENSE_KEY,
      });
      const sheetsBar = hot.getPlugin('sheetsBar');
      const added = sheetsBar.addSheet('New', rowsOf(200, 'n'));
      const scrollViewportTo = jest.spyOn(hot, 'scrollViewportTo');

      sheetsBar.setActiveSheet(added.id);

      expect(scrollViewportTo).toHaveBeenCalledWith(expect.objectContaining({ row: 0, col: 0 }));
    });
  });

});
