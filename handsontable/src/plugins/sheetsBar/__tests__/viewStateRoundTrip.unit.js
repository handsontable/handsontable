import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * A sheet left and visited again comes back with the row and column order, the sort, the merged areas and
 * the headers it had, and a switch fires only the hooks of what it really changes.
 */
describe('SheetsBar -> view state round trip', () => {
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
   * Builds a grid with two sheets.
   *
   * @param {object} settings Grid settings.
   * @param {Array[]} alphaData The first sheet's data.
   * @param {Array[]} [betaData] The second sheet's data.
   * @returns {object} The SheetsBar plugin.
   */
  function build(settings, alphaData, betaData = [[0, 0, 0, 0]]) {
    hot = new Handsontable(container, {
      ...settings,
      sheetsBar: {
        sheets: [
          { name: 'Alpha', data: alphaData },
          { name: 'Beta', data: betaData },
        ],
      },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  /**
   * Leaves the first sheet and comes back to it.
   *
   * @param {object} bar The SheetsBar plugin.
   */
  function roundTrip(bar) {
    bar.setActiveSheet('Beta');
    bar.setActiveSheet('Alpha');
  }

  /**
   * Returns four rows whose third column sorts them in another order than the first one.
   *
   * @returns {Array[]}
   */
  function createData() {
    return [
      [1, 'd', 30, 'x'],
      [2, 'a', 10, 'y'],
      [3, 'c', 40, 'z'],
      [4, 'b', 20, 'w'],
    ];
  }

  describe('sort and row order', () => {
    it('brings back a row moved before the sort when the sort is cleared after a switch', () => {
      const bar = build({ manualRowMove: true, columnSorting: true }, createData());

      hot.getPlugin('manualRowMove').moveRow(3, 0);
      hot.render();

      const unsorted = hot.getDataAtCol(0);

      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });
      roundTrip(bar);

      expect(hot.getDataAtCol(0)).toEqual([2, 4, 1, 3]);

      hot.getPlugin('columnSorting').clearSort();

      expect(hot.getDataAtCol(0)).toEqual(unsorted);
    });

    it('brings back the unsorted order after a switch whose sort a listener canceled', () => {
      const bar = build({ manualRowMove: true, columnSorting: true }, createData());

      hot.getPlugin('manualRowMove').moveRow(3, 0);
      hot.render();

      const unsorted = hot.getDataAtCol(0);

      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });

      const sorted = hot.getDataAtCol(0);
      const veto = () => false;

      bar.setActiveSheet('Beta');
      hot.addHook('beforeColumnSort', veto);
      bar.setActiveSheet('Alpha');
      hot.removeHook('beforeColumnSort', veto);

      expect(hot.getDataAtCol(0)).toEqual(sorted);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);

      hot.getPlugin('columnSorting').clearSort();

      expect(hot.getDataAtCol(0)).toEqual(unsorted);
    });

    it('fires no sort hooks on a switch when no sheet is sorted', () => {
      const bar = build({ columnSorting: true }, createData());
      const before = jest.fn();
      const after = jest.fn();

      hot.addHook('beforeColumnSort', before);
      hot.addHook('afterColumnSort', after);
      roundTrip(bar);

      expect(before).not.toHaveBeenCalled();
      expect(after).not.toHaveBeenCalled();
    });

    it('fires no sort hooks on a switch to a never-visited sheet when nothing is sorted', () => {
      const bar = build({ columnSorting: true }, createData());
      const before = jest.fn();

      hot.addHook('beforeColumnSort', before);
      bar.setActiveSheet('Beta');

      expect(before).not.toHaveBeenCalled();
    });

    it('re-applies the sort of a sorted sheet through the sort hooks', () => {
      const bar = build({ columnSorting: true }, createData());
      const after = jest.fn();

      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });
      bar.setActiveSheet('Beta');
      hot.addHook('afterColumnSort', after);
      bar.setActiveSheet('Alpha');

      expect(after).toHaveBeenCalledWith([], [{ column: 2, sortOrder: 'asc' }], true);
    });

    it('fires no row or column move hooks while it puts the order back', () => {
      const bar = build({ manualRowMove: true, manualColumnMove: true }, createData());
      const moveHooks = jest.fn();

      hot.getPlugin('manualRowMove').moveRow(3, 0);
      hot.getPlugin('manualColumnMove').moveColumn(3, 0);
      hot.render();

      ['beforeRowMove', 'afterRowMove', 'beforeColumnMove', 'afterColumnMove']
        .forEach(name => hot.addHook(name, moveHooks));
      roundTrip(bar);

      expect(moveHooks).not.toHaveBeenCalled();
    });
  });

  describe('row headers', () => {
    it('keeps the strict numbers of a moved and an inserted row after a round trip', () => {
      const bar = build({ rowHeaders: true, manualRowMove: true, bindRowsWithHeaders: 'strict' }, createData());

      hot.getPlugin('manualRowMove').moveRow(3, 0);
      hot.render();
      hot.alter('insert_row_above', 0, 1);

      const headersBefore = [0, 1, 2, 3, 4].map(row => hot.getRowHeader(row));

      expect(headersBefore).toEqual([5, 4, 1, 2, 3]);

      roundTrip(bar);

      expect([0, 1, 2, 3, 4].map(row => hot.getRowHeader(row))).toEqual(headersBefore);
    });

    it('numbers a sheet that never used the strict strategy by its physical rows', () => {
      const bar = build({ rowHeaders: true, manualRowMove: true, bindRowsWithHeaders: true }, createData());

      hot.alter('insert_row_above', 0, 1);
      roundTrip(bar);

      expect([0, 1, 2, 3, 4].map(row => hot.getRowHeader(row))).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('nested headers', () => {
    it('labels a moved column with its own header after a round trip', () => {
      const bar = build({
        manualColumnMove: true,
        nestedHeaders: [
          [{ label: 'G1', colspan: 2 }, { label: 'G2', colspan: 2 }],
          ['ID', 'Name', 'Qty', 'Done'],
        ],
      }, [[1, 'alpha', 5, true], [2, 'beta', 6, false]]);

      hot.getPlugin('manualColumnMove').moveColumn(2, 0);
      hot.render();

      roundTrip(bar);

      expect(hot.getDataAtRow(0)).toEqual([5, 1, 'alpha', true]);
      expect([0, 1, 2, 3].map(column => hot.getColHeader(column, 1))).toEqual(['Qty', 'ID', 'Name', 'Done']);
      expect([0, 1, 2, 3].map(column => hot.getColHeader(column, 0))).toEqual(['G2', 'G1', 'G1', 'G2']);
    });
  });
});
