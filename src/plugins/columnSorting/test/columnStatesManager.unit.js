import {
  ColumnStatesManager,
  ASC_SORT_STATE,
  DESC_SORT_STATE,
  NONE_SORT_STATE,
} from 'handsontable/plugins/columnSorting/columnStatesManager';
import {deepClone} from 'handsontable/helpers/object';

describe('ColumnSorting', () => {
  describe('ColumnStatesManager.setSortingOrder', () => {
    it('should change state queue', () => {
      const columnStatesManager = new ColumnStatesManager();
      const initialState = deepClone(columnStatesManager.states);

      columnStatesManager.setSortingOrder(0, ASC_SORT_STATE);

      const stateAfterFunctionCall = deepClone(columnStatesManager.states);

      expect(stateAfterFunctionCall).not.toEqual(initialState);
    });
  });

  describe('ColumnStatesManager.isListOfSortedColumnsEmpty', () => {
    it('should return `true` when state queue is empty', () => {
      const columnStatesManager = new ColumnStatesManager();

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeTruthy();
    });

    it('should return `true` when state of the only sorted column was changed to not sorted', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(0, DESC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(0, NONE_SORT_STATE, false);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeTruthy();
    });

    it('should return `false` when state queue is not empty', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(0, DESC_SORT_STATE);

      expect(columnStatesManager.isListOfSortedColumnsEmpty()).toBeFalsy();
    });
  });

  describe('ColumnStatesManager.getSortedColumns', () => {
    it('should return list of all sorted columns (respecting the states queue)', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(0, DESC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(2, ASC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(1, ASC_SORT_STATE, false);

      expect(columnStatesManager.getSortedColumns()).toEqual([0, 2, 1]);
    });
  });

  describe('ColumnStatesManager.getIndexOfColumnInStatesQueue', () => {
    it('should return index of particular column in the states queue', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(0, DESC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(2, ASC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(1, ASC_SORT_STATE, false);

      expect(columnStatesManager.getIndexOfColumnInStatesQueue(0)).toEqual(0);
      expect(columnStatesManager.getIndexOfColumnInStatesQueue(2)).toEqual(1);
      expect(columnStatesManager.getIndexOfColumnInStatesQueue(1)).toEqual(2);
      expect(columnStatesManager.getIndexOfColumnInStatesQueue(3)).toEqual(-1);
    });
  });

  describe('ColumnStatesManager.getNumberOfSortedColumns', () => {
    it('should return number of sorted columns', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(0, DESC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(2, ASC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(1, ASC_SORT_STATE, false);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(3);

      columnStatesManager.setSortingOrder(0, NONE_SORT_STATE, false);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(2);

      columnStatesManager.setSortingOrder(2, NONE_SORT_STATE, false);
      columnStatesManager.setSortingOrder(1, NONE_SORT_STATE, false);

      expect(columnStatesManager.getNumberOfSortedColumns()).toEqual(0);
    });
  });

  describe('ColumnStatesManager.getOrdersOfSortedColumns', () => {
    it('should return list of all sorting orders (respecting the states queue)', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(0, DESC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(2, ASC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(1, ASC_SORT_STATE, false);

      expect(columnStatesManager.getOrdersOfSortedColumns()).toEqual([DESC_SORT_STATE, ASC_SORT_STATE, ASC_SORT_STATE]);
    });
  });

  describe('ColumnStatesManager.getFirstSortedColumn', () => {
    it('should return first sorted column', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(0, DESC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(2, ASC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(1, ASC_SORT_STATE, false);

      expect(columnStatesManager.getFirstSortedColumn()).toEqual(0);
    });
  });

  describe('ColumnStatesManager.isColumnSorted', () => {
    it('should return if particular column is sorted', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(1, ASC_SORT_STATE, false);

      expect(columnStatesManager.isColumnSorted(1)).toBeTruthy();
      expect(columnStatesManager.isColumnSorted(2)).toBeFalsy();
    });
  });

  describe('ColumnStatesManager.getSortingOrderOfColumn', () => {
    it('should return `undefined` when column is not sorted', () => {
      const columnStatesManager = new ColumnStatesManager();

      expect(columnStatesManager.getSortingOrderOfColumn(0)).toBeUndefined();
    });

    it('should return `undefined` when state of sorted column was changed to not sorted', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(0, DESC_SORT_STATE, false);
      columnStatesManager.setSortingOrder(0, NONE_SORT_STATE, false);

      expect(columnStatesManager.getSortingOrderOfColumn(0)).toBeUndefined();
    });

    it('should return proper order when column is sorted', () => {
      const columnStatesManager = new ColumnStatesManager();

      columnStatesManager.setSortingOrder(2, DESC_SORT_STATE, false);

      expect(columnStatesManager.getSortingOrderOfColumn(2)).toEqual(DESC_SORT_STATE);
    });
  });
});
