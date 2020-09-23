import { ColumnStatesManager } from 'handsontable/plugins/columnSorting/columnStatesManager';
import { DESC_SORT_STATE, ASC_SORT_STATE } from 'handsontable/plugins/columnSorting/utils';
import { getClassesToAdd, getClassedToRemove } from 'handsontable/plugins/columnSorting/domHelpers';
import { IndexMapper } from 'handsontable/translations';

const hotMock = {
  toPhysicalColumn: column => column,
  toVisualColumn: column => column,
  columnIndexMapper: new IndexMapper()
};

// Mocking that table have 3 columns.
hotMock.columnIndexMapper.initToLength(3);

describe('ColumnSorting DOM helpers', () => {
  describe('getClassesToAdd', () => {
    it('should add `columnSorting` CSS class by default', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock);

      columnStatesManager.setSortStates([
        { column: 1, sortOrder: DESC_SORT_STATE }
      ]);

      expect(getClassesToAdd(columnStatesManager, 0).includes('columnSorting')).toBeTruthy();
      expect(getClassesToAdd(columnStatesManager, 1).includes('columnSorting')).toBeTruthy();

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });

    it('should add `sortAction` CSS class for clickable header', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock);

      columnStatesManager.setSortStates([
        { column: 1, sortOrder: DESC_SORT_STATE }
      ]);

      expect(getClassesToAdd(columnStatesManager, 0, void 0, true).includes('sortAction')).toBeTruthy();
      expect(getClassesToAdd(columnStatesManager, 0, void 0, false).includes('sortAction')).toBeFalsy();

      expect(getClassesToAdd(columnStatesManager, 1, void 0, true).includes('sortAction')).toBeTruthy();
      expect(getClassesToAdd(columnStatesManager, 1, void 0, false).includes('sortAction')).toBeFalsy();

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });

    describe('should add proper CSS classes for enabled / disabled indicator', () => {
      it('single sorted column', () => {
        const columnStatesManager = new ColumnStatesManager(hotMock);

        columnStatesManager.setSortStates([
          { column: 1, sortOrder: DESC_SORT_STATE }
        ]);

        expect(getClassesToAdd(columnStatesManager, 0, false).includes('ascending')).toBeFalsy();
        expect(getClassesToAdd(columnStatesManager, 0, false).includes('descending')).toBeFalsy();
        expect(getClassesToAdd(columnStatesManager, 0, false).includes('indicatorDisabled')).toBeTruthy();
        expect(getClassesToAdd(columnStatesManager, 0, true).includes('ascending')).toBeFalsy();
        expect(getClassesToAdd(columnStatesManager, 0, true).includes('descending')).toBeFalsy();
        expect(getClassesToAdd(columnStatesManager, 0, true).includes('indicatorDisabled')).toBeFalsy();

        expect(getClassesToAdd(columnStatesManager, 1, false).includes('ascending')).toBeFalsy();
        expect(getClassesToAdd(columnStatesManager, 1, false).includes('descending')).toBeFalsy();
        expect(getClassesToAdd(columnStatesManager, 1, false).includes('indicatorDisabled')).toBeTruthy();
        expect(getClassesToAdd(columnStatesManager, 1, true).includes('ascending')).toBeFalsy();
        expect(getClassesToAdd(columnStatesManager, 1, true).includes('descending')).toBeTruthy();
        expect(getClassesToAdd(columnStatesManager, 1, true).includes('indicatorDisabled')).toBeFalsy();

        columnStatesManager.destroy(); // Unregister already registered Index Map.
      });
    });
  });

  describe('getClassedToRemove', () => {
    it('should return all calculated classes', () => {
      const columnStatesManager = new ColumnStatesManager(hotMock);

      columnStatesManager.setSortStates([
        { column: 3, sortOrder: ASC_SORT_STATE },
      ]);

      const htmlElementMock = { className: 'columnSorting sortAction' };

      expect(getClassedToRemove(htmlElementMock).length).toEqual(5);
      expect(getClassedToRemove(htmlElementMock).includes('columnSorting')).toBeTruthy();
      expect(getClassedToRemove(htmlElementMock).includes('indicatorDisabled')).toBeTruthy();
      expect(getClassedToRemove(htmlElementMock).includes('sortAction')).toBeTruthy();
      expect(getClassedToRemove(htmlElementMock).includes('ascending')).toBeTruthy();
      expect(getClassedToRemove(htmlElementMock).includes('descending')).toBeTruthy();

      columnStatesManager.destroy(); // Unregister already registered Index Map.
    });
  });
});
