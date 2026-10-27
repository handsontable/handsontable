import Handsontable from 'handsontable';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const SUMMARY = [{ sourceColumn: 0, destinationRow: 3, destinationColumn: 0, type: 'sum', forceNumeric: true }];

/**
 * ColumnSummary writes its totals into the data array it summarizes. When the grid replaces that
 * array, the destination cells of the outgoing array get back the value they held before the first
 * total was written there, so loading the same array again sums the same input.
 */
describe('ColumnSummary destinations of a replaced data array', () => {
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
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with a sum of column 0 written into row 3.
   *
   * @param {Array[]} data The data array.
   * @param {object} [settings] Extra settings.
   * @returns {Handsontable} The grid.
   */
  function createGrid(data, settings = {}) {
    hot = new Handsontable(container, {
      data,
      columnSummary: SUMMARY,
      licenseKey: LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  describe('on a plain grid', () => {
    it('writes the original destination value back into the array `loadData()` replaces', () => {
      const first = [[1], [1], [1], [null]];

      createGrid(first);

      expect(hot.getDataAtCell(3, 0)).toBe(3);

      hot.loadData([[5], [5], [5], [null]]);

      expect(first[3][0]).toBe(null);
      expect(first.slice(0, 3)).toEqual([[1], [1], [1]]);
    });

    it('writes the original destination value back into the array `updateData()` replaces', () => {
      const first = [[1], [1], [1], [null]];

      createGrid(first);
      hot.updateData([[5], [5], [5], [null]]);

      expect(first[3][0]).toBe(null);
    });

    it('keeps the total and writes nothing back when `updateData()` gets the array the grid holds', () => {
      const first = [[1], [1], [1], [null]];
      const writes = [];
      let stored = null;

      Object.defineProperty(first[3], 0, {
        configurable: true,
        enumerable: true,
        get: () => stored,
        set: (value) => {
          writes.push(value);
          stored = value;
        },
      });

      createGrid(first);

      const writesAtInit = writes.length;
      const totals = [];

      for (let round = 0; round < 3; round++) {
        hot.updateData(first);
        totals.push(hot.getDataAtCell(3, 0));
      }

      expect(totals).toEqual([3, 3, 3]);
      expect(writes.slice(writesAtInit).every(value => value === 3)).toBe(true);
    });

    it('keeps the total the same when the same array is loaded again', () => {
      const first = [[1], [1], [1], [null]];
      const second = [[5], [5], [5], [null]];
      const totals = [];

      createGrid(first);
      totals.push(hot.getDataAtCell(3, 0));

      for (let round = 0; round < 3; round++) {
        hot.loadData(second);
        totals.push(hot.getDataAtCell(3, 0));
        hot.loadData(first);
        totals.push(hot.getDataAtCell(3, 0));
      }

      expect(totals).toEqual([3, 15, 3, 15, 3, 15, 3]);
    });

    it('gives a destination its own non-empty value back, so a reload sums what the first load summed', () => {
      const first = [[1], [1], [1], [10]];

      createGrid(first);

      const firstTotal = hot.getDataAtCell(3, 0);

      hot.loadData([[5], [5], [5], [null]]);

      expect(first[3][0]).toBe(10);

      hot.loadData(first);

      expect(hot.getDataAtCell(3, 0)).toBe(firstTotal);
    });

    it('keeps a value the host wrote over the total', () => {
      const first = [[1], [1], [1], [null]];

      createGrid(first);
      first[3][0] = 'host value';
      hot.loadData([[5], [5], [5], [null]]);

      expect(first[3][0]).toBe('host value');
    });

    it('keeps a value the user wrote over the total', () => {
      const first = [[1, null], [1, null], [1, null], [null, null]];

      createGrid(first, {
        columnSummary: [{ ...SUMMARY[0], destinationColumn: 1, readOnly: false }],
      });

      expect(first[3][1]).toBe(3);

      hot.setDataAtCell(3, 1, 42);
      hot.loadData([[5, null], [5, null], [5, null], [null, null]]);

      expect(first[3][1]).toBe(42);
    });

    it('adds no row to the replaced array when the host shortened it past the destination', () => {
      const first = [[1], [1], [1], [null]];

      createGrid(first);
      first.length = 3;
      hot.loadData([[5], [5], [5], [null]]);

      expect(first).toEqual([[1], [1], [1]]);
    });

    it('still computes the total of the loaded data', () => {
      const first = [[1], [1], [1], [null]];

      createGrid(first);
      hot.loadData([[5], [5], [5], [null]]);

      expect(hot.getDataAtCell(3, 0)).toBe(15);
    });
  });

  describe('under the sheets bar, with a grid-level summary', () => {
    /**
     * Builds a two-sheet workbook.
     *
     * @param {Array[]} dataA The first sheet's data.
     * @param {Array[]} dataB The second sheet's data.
     * @returns {object} The SheetsBar plugin.
     */
    function createWorkbook(dataA, dataB) {
      hot = new Handsontable(container, {
        columnSummary: SUMMARY,
        licenseKey: LICENSE_KEY,
        sheetsBar: { sheets: [{ name: 'A', data: dataA }, { name: 'B', data: dataB }] },
      });

      return hot.getPlugin('sheetsBar');
    }

    it('keeps each sheet\'s total over round trips', () => {
      const plugin = createWorkbook([[1], [1], [1], [null]], [[5], [5], [5], [null]]);
      const totals = [hot.getDataAtCell(3, 0)];

      for (let round = 0; round < 3; round++) {
        plugin.setActiveSheet('B');
        totals.push(hot.getDataAtCell(3, 0));
        plugin.setActiveSheet('A');
        totals.push(hot.getDataAtCell(3, 0));
      }

      expect(totals).toEqual([3, 15, 3, 15, 3, 15, 3]);
    });

    it('leaves the original destination value in a sheet\'s data while the sheet is away', () => {
      const dataA = [[1], [1], [1], [null]];
      const plugin = createWorkbook(dataA, [[5], [5], [5], [null]]);

      plugin.setActiveSheet('B');

      expect(dataA[3][0]).toBe(null);

      plugin.setActiveSheet('A');
      plugin.setActiveSheet('B');

      expect(dataA[3][0]).toBe(null);
    });
  });
});
