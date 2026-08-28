import DataMap from 'handsontable/dataMap/dataMap';
import Handsontable from 'handsontable/base';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();

describe('DataMap', () => {
  describe('filterData', () => {
    /**
     * Builds the minimal context `filterData` needs: a hot mock whose `filterData` hook
     * returns its first argument (the default hook behavior) and a data source array.
     *
     * @param {number} rowCount The number of single-cell rows to create in the data source.
     * @returns {object}
     */
    function createFilterDataContext(rowCount) {
      const dataSource = [];

      for (let i = 0; i < rowCount; i++) {
        dataSource.push([i]);
      }

      return {
        hot: {
          runHooks: (name, firstArg) => firstArg,
        },
        dataSource,
      };
    }

    it('should remove the given physical rows from the data source', () => {
      const context = createFilterDataContext(5);

      DataMap.prototype.filterData.call(context, 1, 2, [1, 2]);

      expect(context.dataSource).toEqual([[0], [3], [4]]);
    });

    it('should not overflow the call stack when the data source holds hundreds of thousands of rows', () => {
      const context = createFilterDataContext(300000);

      expect(() => {
        DataMap.prototype.filterData.call(context, 0, 1, [0]);
      }).not.toThrow();

      expect(context.dataSource.length).toBe(299999);
      expect(context.dataSource[0]).toEqual([1]);
      expect(context.dataSource[299998]).toEqual([299999]);
    });
  });
});

describe('DataMap.get with function column accessors', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  it('should return null and not call the accessor when the row index maps past the source data', () => {
    const accessor = jest.fn(row => row.value);

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [{ value: 'A1' }, { value: 'A2' }],
      dataSchema: () => ({ value: null }),
      columns: [{ data: accessor }],
    });

    accessor.mockClear();
    // Reproduces the transient state RemoveRowAction.undo creates: the mapper is one index
    // longer than the source array until alter() splices the row in.
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2]);

    expect(hot.getDataAtCell(2, 0)).toBe(null);
    expect(accessor).not.toHaveBeenCalledWith(undefined);
  });
});
