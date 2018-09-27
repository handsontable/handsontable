import { ColumnStatesManager } from 'handsontable-pro/plugins/multiColumnSorting/columnStatesManager';
import { DESC_SORT_STATE, ASC_SORT_STATE } from 'handsontable-pro/plugins/multiColumnSorting/utils';
import { DomHelper } from 'handsontable-pro/plugins/multiColumnSorting/domHelper';

describe('MultiColumnSorting', () => {
  describe('DomHelper.getAddedClasses', () => {
    it('should add `columnSorting` CSS class by default', () => {
      const columnStatesManager = new ColumnStatesManager();
      const domHelper = new DomHelper(columnStatesManager);

      columnStatesManager.setSortStates([
        { column: 1, sortOrder: DESC_SORT_STATE }
      ]);

      expect(domHelper.getAddedClasses(0).includes('columnSorting')).toBeTruthy();
      expect(domHelper.getAddedClasses(1).includes('columnSorting')).toBeTruthy();
    });

    it('should add `sortAction` CSS class for clickable header', () => {
      const columnStatesManager = new ColumnStatesManager();
      const domHelper = new DomHelper(columnStatesManager);

      columnStatesManager.setSortStates([
        { column: 1, sortOrder: DESC_SORT_STATE }
      ]);

      expect(domHelper.getAddedClasses(0, void 0, true).includes('sortAction')).toBeTruthy();
      expect(domHelper.getAddedClasses(0, void 0, false).includes('sortAction')).toBeFalsy();

      expect(domHelper.getAddedClasses(1, void 0, true).includes('sortAction')).toBeTruthy();
      expect(domHelper.getAddedClasses(1, void 0, false).includes('sortAction')).toBeFalsy();
    });

    describe('should add proper CSS classes for enabled / disabled indicator', () => {
      it('single sorted column', () => {
        const columnStatesManager = new ColumnStatesManager();
        const domHelper = new DomHelper(columnStatesManager);

        columnStatesManager.setSortStates([
          { column: 1, sortOrder: DESC_SORT_STATE }
        ]);

        expect(domHelper.getAddedClasses(0, false).includes('ascending')).toBeFalsy();
        expect(domHelper.getAddedClasses(0, false).includes('descending')).toBeFalsy();
        expect(domHelper.getAddedClasses(0, false).includes('indicatorDisabled')).toBeTruthy();
        expect(domHelper.getAddedClasses(0, true).includes('ascending')).toBeFalsy();
        expect(domHelper.getAddedClasses(0, true).includes('descending')).toBeFalsy();
        expect(domHelper.getAddedClasses(0, true).includes('indicatorDisabled')).toBeFalsy();

        expect(domHelper.getAddedClasses(1, false).includes('ascending')).toBeFalsy();
        expect(domHelper.getAddedClasses(1, false).includes('descending')).toBeFalsy();
        expect(domHelper.getAddedClasses(1, false).includes('indicatorDisabled')).toBeTruthy();
        expect(domHelper.getAddedClasses(1, true).includes('ascending')).toBeFalsy();
        expect(domHelper.getAddedClasses(1, true).includes('descending')).toBeTruthy();
        expect(domHelper.getAddedClasses(1, true).includes('indicatorDisabled')).toBeFalsy();
      });

      it('multiple sorted columns', () => {
        const columnStatesManager = new ColumnStatesManager();
        const domHelper = new DomHelper(columnStatesManager);

        columnStatesManager.setSortStates([
          { column: 1, sortOrder: DESC_SORT_STATE },
          { column: 0, sortOrder: ASC_SORT_STATE },
        ]);

        expect(domHelper.getAddedClasses(0, false).includes('ascending')).toBeFalsy();
        expect(domHelper.getAddedClasses(0, false).includes('descending')).toBeFalsy();
        expect(domHelper.getAddedClasses(0, false).includes('sort-2')).toBeFalsy();
        expect(domHelper.getAddedClasses(0, false).includes('indicatorDisabled')).toBeTruthy();
        expect(domHelper.getAddedClasses(0, true).includes('ascending')).toBeTruthy();
        expect(domHelper.getAddedClasses(0, true).includes('descending')).toBeFalsy();
        expect(domHelper.getAddedClasses(0, true).includes('sort-2')).toBeTruthy();
        expect(domHelper.getAddedClasses(0, true).includes('indicatorDisabled')).toBeFalsy();

        expect(domHelper.getAddedClasses(1, false).includes('ascending')).toBeFalsy();
        expect(domHelper.getAddedClasses(1, false).includes('descending')).toBeFalsy();
        expect(domHelper.getAddedClasses(1, false).includes('indicatorDisabled')).toBeTruthy();
        expect(domHelper.getAddedClasses(1, false).includes('sort-1')).toBeFalsy();
        expect(domHelper.getAddedClasses(1, true).includes('ascending')).toBeFalsy();
        expect(domHelper.getAddedClasses(1, true).includes('descending')).toBeTruthy();
        expect(domHelper.getAddedClasses(1, true).includes('sort-1')).toBeTruthy();
        expect(domHelper.getAddedClasses(1, true).includes('indicatorDisabled')).toBeFalsy();
      });
    });
  });

  describe('DomHelper.getRemovedClasses', () => {
    it('should return all calculated classes', () => {
      const columnStatesManager = new ColumnStatesManager();
      const domHelper = new DomHelper(columnStatesManager);

      columnStatesManager.setSortStates([
        { column: 1, sortOrder: DESC_SORT_STATE },
        { column: 0, sortOrder: ASC_SORT_STATE },
        { column: 2, sortOrder: ASC_SORT_STATE },
        { column: 3, sortOrder: ASC_SORT_STATE },
      ]);

      const htmlElementMock = { className: 'columnSorting sort-1 sort-2 sort-3 sort-4 sortAction' };

      expect(domHelper.getRemovedClasses(htmlElementMock).length).toEqual(9);
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('sort-1')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('sort-2')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('sort-3')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('sort-4')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('columnSorting')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('indicatorDisabled')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('sortAction')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('ascending')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('descending')).toBeTruthy();
    });
  });
});
