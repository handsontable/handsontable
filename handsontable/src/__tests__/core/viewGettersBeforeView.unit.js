import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

const CORE_GETTERS = [
  'getFirstRenderedVisibleRow',
  'getLastRenderedVisibleRow',
  'getFirstRenderedVisibleColumn',
  'getLastRenderedVisibleColumn',
  'getFirstFullyVisibleRow',
  'getLastFullyVisibleRow',
  'getFirstFullyVisibleColumn',
  'getLastFullyVisibleColumn',
  'getFirstPartiallyVisibleRow',
  'getLastPartiallyVisibleRow',
  'getFirstPartiallyVisibleColumn',
  'getLastPartiallyVisibleColumn',
];

/**
 * The getters answer before the grid has a view, which is the case inside a hook that fires while the
 * instance is still being built (`afterHideColumns` with `hiddenColumns` enabled, `afterLoadData` of the
 * initial load).
 */
describe('Getters before the view exists', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  function createGrid(settings) {
    return new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']],
      width: 400,
      height: 200,
      ...settings,
    });
  }

  describe('viewport getters', () => {
    it.each([
      ['afterHideColumns', 'hiddenColumns: true', { hiddenColumns: true }],
      ['afterHideColumns', 'hiddenColumns: { columns: [1] }', { hiddenColumns: { columns: [1] } }],
      ['afterHideRows', 'hiddenRows: { rows: [1] }', { hiddenRows: { rows: [1] } }],
    ])('should not throw from the core getters inside `%s` fired at init (%s)', (hookName, _, settings) => {
      const results = [];
      const hook = jest.fn(function() {
        results.push(CORE_GETTERS.map(name => this[name]()));
      });

      hot = createGrid({ ...settings, [hookName]: hook });

      expect(hook).toHaveBeenCalledTimes(1);
      expect(results).toEqual([CORE_GETTERS.map(() => null)]);
    });

    it('should fire `afterHideRows` once at init for `hiddenRows: true`, with an empty configuration', () => {
      const afterHideRows = jest.fn();

      hot = createGrid({ hiddenRows: true, afterHideRows });

      expect(afterHideRows).toHaveBeenCalledTimes(1);
      expect(afterHideRows.mock.calls[0].slice(0, 2)).toEqual([[], []]);
    });

    it('should return -1 from the AutoColumnSize getters inside `afterHideColumns` fired at init', () => {
      const results = [];

      hot = createGrid({
        autoColumnSize: true,
        hiddenColumns: true,
        afterHideColumns() {
          const plugin = this.getPlugin('autoColumnSize');

          results.push([plugin.getFirstVisibleColumn(), plugin.getLastVisibleColumn()]);
        },
      });

      expect(results).toEqual([[-1, -1]]);
    });

    it('should return -1 from the AutoRowSize getters inside `afterHideColumns` fired at init', () => {
      const results = [];

      hot = createGrid({
        autoRowSize: true,
        hiddenColumns: true,
        afterHideColumns() {
          const plugin = this.getPlugin('autoRowSize');

          results.push([plugin.getFirstVisibleRow(), plugin.getLastVisibleRow()]);
        },
      });

      expect(results).toEqual([[-1, -1]]);
    });
  });

  describe('selection methods', () => {
    it.each([
      ['selectCell', instance => instance.selectCell(0, 0)],
      ['selectCells', instance => instance.selectCells([[0, 0, 1, 1]])],
      ['selectRows', instance => instance.selectRows(0)],
      ['selectColumns', instance => instance.selectColumns(0)],
      ['selectAll', instance => instance.selectAll()],
    ])('should select nothing and not throw from `%s` inside the initial `afterLoadData`', (_, select) => {
      const afterSelection = jest.fn();
      const results = [];

      hot = createGrid({
        afterSelection,
        afterLoadData(sourceData, initialLoad) {
          if (initialLoad === true) {
            results.push(select(this));
          }
        },
      });

      expect(results).toHaveLength(1);
      expect(afterSelection).not.toHaveBeenCalled();
      expect(hot.getSelected()).toBeUndefined();
    });

    it('should answer `null` from `getCell` and `false` from `scrollViewportTo` inside the initial `afterLoadData`', () => {
      const results = [];

      hot = createGrid({
        afterLoadData(sourceData, initialLoad) {
          if (initialLoad === true) {
            results.push([this.getCell(0, 0), this.scrollViewportTo({ row: 0, col: 0 })]);
          }
        },
      });

      expect(results).toEqual([[null, false]]);
    });

    it('should select as before once the grid is built', () => {
      hot = createGrid();

      expect(hot.selectCell(1, 1)).toBe(true);
      expect(hot.getSelected()).toEqual([[1, 1, 1, 1]]);
    });
  });

  describe('writes', () => {
    it('should apply `setDataAtCell` called inside the initial `afterLoadData`', () => {
      const afterChange = jest.fn();

      hot = createGrid({
        afterChange,
        afterLoadData(sourceData, initialLoad) {
          if (initialLoad === true) {
            this.setDataAtCell(0, 0, 'x');
          }
        },
      });

      expect(hot.getSourceData()).toEqual([['x', 'B1', 'C1'], ['A2', 'B2', 'C2']]);
      // `afterChange` also fires once for the initial load, with `changes` set to `null`.
      expect(afterChange.mock.calls.filter(([changes]) => changes !== null)).toEqual([[[[0, 0, 'A1', 'x']], 'edit']]);
    });

    it.each([
      ['setDataAtCell', instance => instance.setDataAtCell(0, 0, 'x')],
      ['setDataAtRowProp', instance => instance.setDataAtRowProp(0, 0, 'x')],
    ])('should write nothing and warn from `%s` inside `afterHideColumns` fired at init', (_, write) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        hot = createGrid({
          hiddenColumns: { columns: [1] },
          afterHideColumns() {
            write(this);
          },
        });

        expect(warn).toHaveBeenCalledTimes(1);
        expect(hot.getSourceData()).toEqual([['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']]);
      } finally {
        warn.mockRestore();
      }
    });

    it('should apply `updateData` called inside the initial `afterLoadData`', () => {
      hot = createGrid({
        afterLoadData(sourceData, initialLoad) {
          if (initialLoad === true) {
            this.updateData([['x', 'y']]);
          }
        },
      });

      expect(hot.getData()).toEqual([['x', 'y']]);
    });
  });

  describe('data getters and coordinates', () => {
    it('should answer inside `afterHideColumns` fired at init: the source reads see the data, the grid reads see no rows yet', () => {
      const results = [];

      hot = createGrid({
        hiddenColumns: true,
        afterHideColumns() {
          results.push([
            this.getDataAtCol(1),
            this.getDataAtRow(1),
            this.getDataAtProp(0),
            this.getSourceData(0, 0, 1, 1),
            this.getSourceDataArray(0, 0, 1, 1),
            this.getData(0, 0, 1, 1),
            this.getCoords(null),
          ]);
        },
      });

      expect(results).toEqual([[
        [], // getDataAtCol
        [], // getDataAtRow
        [], // getDataAtProp
        [['A1', 'B1'], ['A2', 'B2']], // getSourceData
        [['A1', 'B1'], ['A2', 'B2']], // getSourceDataArray
        [], // getData
        null, // getCoords
      ]]);
    });

    it('should answer inside the `afterLoadData` of the initial load', () => {
      const results = [];

      hot = createGrid({
        afterLoadData(sourceData, initialLoad) {
          if (initialLoad !== true) {
            return;
          }

          results.push({
            dataAtCol: this.getDataAtCol(1),
            dataAtRow: this.getDataAtRow(1),
            dataAtProp: this.getDataAtProp(0),
            sourceData: this.getSourceData(0, 0, 1, 1),
            sourceDataArray: this.getSourceDataArray(0, 0, 1, 1),
            data: this.getData(0, 0, 1, 1),
            coords: this.getCoords(null),
          });
        },
      });

      expect(results).toEqual([{
        dataAtCol: ['B1', 'B2'],
        dataAtRow: ['A2', 'B2', 'C2'],
        dataAtProp: ['A1', 'A2'],
        sourceData: [['A1', 'B1'], ['A2', 'B2']],
        sourceDataArray: [['A1', 'B1'], ['A2', 'B2']],
        data: [['A1', 'B1'], ['A2', 'B2']],
        coords: null,
      }]);
    });

    it('should build the same coordinates and range before the view exists as the view builds', () => {
      const describeRange = (instance) => {
        const coords = instance._createCellCoords(1, 2);
        const range = instance._createCellRange(coords, coords, instance._createCellCoords(2, 3));
        const topLeft = range.getTopLeftCorner();

        return { isRtl: coords.isRtl(), row: coords.row, col: coords.col, topLeft: [topLeft.row, topLeft.col] };
      };
      const beforeView = [];

      hot = createGrid({
        layoutDirection: 'rtl',
        hiddenColumns: true,
        afterHideColumns() {
          beforeView.push(describeRange(this));
        },
      });

      expect(beforeView).toHaveLength(1);
      expect(beforeView[0].isRtl).toBe(true);
      expect(beforeView[0]).toEqual(describeRange(hot));
    });
  });
});
