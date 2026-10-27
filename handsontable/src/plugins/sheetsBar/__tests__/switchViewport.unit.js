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

  describe('turning the bar off on a grid that names the start freeze `fixedColumnsLeft`', () => {
    /**
     * Turns the bar off and reports what it left.
     *
     * @returns {object}
     */
    function turnOff() {
      let thrown = null;

      try {
        hot.updateSettings({ sheetsBar: false });
      } catch (error) {
        thrown = error.message;
      }

      return {
        thrown,
        enabled: hot.getPlugin('sheetsBar').enabled,
        barInDom: hot.rootWrapperElement.querySelector('.ht-sheets-bar') !== null,
        fixedColumnsStart: hot.getSettings().fixedColumnsStart,
      };
    }

    it('puts the grid-level count back after a runtime freeze', () => {
      hot = new Handsontable(container, {
        fixedColumnsLeft: 1,
        manualColumnFreeze: true,
        sheetsBar: { sheets: [{ name: 'A', data: [[1, 2, 3, 4]] }, { name: 'B', data: [[5, 6, 7, 8]] }] },
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualColumnFreeze').freezeColumn(2);

      expect(hot.getSettings().fixedColumnsStart).toBe(2);
      expect(turnOff()).toEqual({ thrown: null, enabled: false, barInDom: false, fixedColumnsStart: 1 });
    });

    it('puts the grid-level count back on a sheet that declares its own `fixedColumnsLeft`', () => {
      hot = new Handsontable(container, {
        fixedColumnsLeft: 1,
        manualColumnFreeze: true,
        sheetsBar: {
          sheets: [
            { name: 'A', data: [[1, 2, 3, 4]], settings: { fixedColumnsLeft: 2 } },
            { name: 'B', data: [[5, 6, 7, 8]] },
          ],
        },
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualColumnFreeze').freezeColumn(2);

      expect(hot.getSettings().fixedColumnsStart).toBe(3);
      expect(turnOff()).toEqual({ thrown: null, enabled: false, barInDom: false, fixedColumnsStart: 1 });
    });

    it('puts the grid-level `fixedColumnsStart` back after a runtime freeze', () => {
      hot = new Handsontable(container, {
        fixedColumnsStart: 1,
        manualColumnFreeze: true,
        sheetsBar: { sheets: [{ name: 'A', data: [[1, 2, 3, 4]] }, { name: 'B', data: [[5, 6, 7, 8]] }] },
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualColumnFreeze').freezeColumn(2);

      expect(turnOff()).toEqual({ thrown: null, enabled: false, barInDom: false, fixedColumnsStart: 1 });
    });
  });

});
