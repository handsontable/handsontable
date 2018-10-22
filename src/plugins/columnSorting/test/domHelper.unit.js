import { ColumnStatesManager } from 'handsontable/plugins/columnSorting/columnStatesManager';
import { DESC_SORT_STATE, ASC_SORT_STATE } from 'handsontable/plugins/columnSorting/utils';
import { DomHelper } from 'handsontable/plugins/columnSorting/domHelper';

describe('ColumnSorting', () => {
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

      // DIFF - MultiColumnSorting & ColumnSorting: removed test named: "multiple sorted columns".
    });
  });

  describe('DomHelper.getRemovedClasses', () => {
    it('should return all calculated classes', () => {
      const columnStatesManager = new ColumnStatesManager();
      const domHelper = new DomHelper(columnStatesManager);

      // DIFF - MultiColumnSorting & ColumnSorting: removed manipulation on CSS classes related to the number indicators.
      columnStatesManager.setSortStates([
        { column: 3, sortOrder: ASC_SORT_STATE },
      ]);

      // DIFF - MultiColumnSorting & ColumnSorting: removed manipulation on CSS classes related to the number indicators.
      const htmlElementMock = { className: 'columnSorting sortAction' };

      expect(domHelper.getRemovedClasses(htmlElementMock).length).toEqual(5);
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('columnSorting')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('indicatorDisabled')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('sortAction')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('ascending')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('descending')).toBeTruthy();
    });
  });
});
