import { ColumnStatesManager } from 'handsontable/plugins/columnSorting/columnStatesManager';
import { DESC_SORT_STATE, ASC_SORT_STATE } from 'handsontable/plugins/columnSorting/utils';
import { getClassesToAdd, getClassedToRemove } from 'handsontable/plugins/multiColumnSorting/domHelpers';
import { PhysicalIndexToValueMap as IndexToValueMap } from 'handsontable/translations';

describe('MultiColumnSorting DOM helpers', () => {
  describe('getClassesToAdd', () => {
    it('multiple sorted columns', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 5 columns.
      indexToValueMap.init(5);

      columnStatesManager.setSortStates([
        { column: 1, sortOrder: DESC_SORT_STATE },
        { column: 0, sortOrder: ASC_SORT_STATE },
      ]);

      expect(getClassesToAdd(columnStatesManager, 0, false).includes('sort-2')).toBeFalsy();
      expect(getClassesToAdd(columnStatesManager, 0, true).includes('sort-2')).toBeTruthy();

      expect(getClassesToAdd(columnStatesManager, 1, false).includes('sort-1')).toBeFalsy();
      expect(getClassesToAdd(columnStatesManager, 1, true).includes('sort-1')).toBeTruthy();
    });
  });

  describe('getClassedToRemove', () => {
    it('should return all calculated classes', () => {
      const indexToValueMap = new IndexToValueMap();
      const columnStatesManager = new ColumnStatesManager(indexToValueMap);

      // Mocking map for sorting states when a table have 5 columns.
      indexToValueMap.init(5);

      columnStatesManager.setSortStates([
        { column: 1, sortOrder: DESC_SORT_STATE },
        { column: 0, sortOrder: ASC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 3, sortOrder: ASC_SORT_STATE },
      ]);

      const htmlElementMock = { className: 'columnSorting sort-1 sort-2 sort-3 sort-4 sortAction' };

      expect(getClassedToRemove(htmlElementMock).length).toEqual(4);
      expect(getClassedToRemove(htmlElementMock).includes('sort-1')).toBeTruthy();
      expect(getClassedToRemove(htmlElementMock).includes('sort-2')).toBeTruthy();
      expect(getClassedToRemove(htmlElementMock).includes('sort-3')).toBeTruthy();
      expect(getClassedToRemove(htmlElementMock).includes('sort-4')).toBeTruthy();
    });
  });
});
