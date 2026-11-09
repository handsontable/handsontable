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

  describe('data getters and coordinates', () => {
    it('should not throw inside `afterHideColumns` fired at init (the data is not loaded yet)', () => {
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

      expect(results).toHaveLength(1);
      expect(results[0][6]).toBeNull();
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
