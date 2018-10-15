'use strict';

var _columnStatesManager = require('handsontable/plugins/columnSorting/columnStatesManager');

var _utils = require('handsontable/plugins/columnSorting/utils');

var _domHelper = require('handsontable/plugins/columnSorting/domHelper');

describe('ColumnSorting', function () {
  describe('DomHelper.getAddedClasses', function () {
    it('should add `columnSorting` CSS class by default', function () {
      var columnStatesManager = new _columnStatesManager.ColumnStatesManager();
      var domHelper = new _domHelper.DomHelper(columnStatesManager);

      columnStatesManager.setSortStates([{ column: 1, sortOrder: _utils.DESC_SORT_STATE }]);

      expect(domHelper.getAddedClasses(0).includes('columnSorting')).toBeTruthy();
      expect(domHelper.getAddedClasses(1).includes('columnSorting')).toBeTruthy();
    });

    it('should add `sortAction` CSS class for clickable header', function () {
      var columnStatesManager = new _columnStatesManager.ColumnStatesManager();
      var domHelper = new _domHelper.DomHelper(columnStatesManager);

      columnStatesManager.setSortStates([{ column: 1, sortOrder: _utils.DESC_SORT_STATE }]);

      expect(domHelper.getAddedClasses(0, void 0, true).includes('sortAction')).toBeTruthy();
      expect(domHelper.getAddedClasses(0, void 0, false).includes('sortAction')).toBeFalsy();

      expect(domHelper.getAddedClasses(1, void 0, true).includes('sortAction')).toBeTruthy();
      expect(domHelper.getAddedClasses(1, void 0, false).includes('sortAction')).toBeFalsy();
    });

    describe('should add proper CSS classes for enabled / disabled indicator', function () {
      it('single sorted column', function () {
        var columnStatesManager = new _columnStatesManager.ColumnStatesManager();
        var domHelper = new _domHelper.DomHelper(columnStatesManager);

        columnStatesManager.setSortStates([{ column: 1, sortOrder: _utils.DESC_SORT_STATE }]);

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

  describe('DomHelper.getRemovedClasses', function () {
    it('should return all calculated classes', function () {
      var columnStatesManager = new _columnStatesManager.ColumnStatesManager();
      var domHelper = new _domHelper.DomHelper(columnStatesManager);

      // DIFF - MultiColumnSorting & ColumnSorting: removed manipulation on CSS classes related to the number indicators.
      columnStatesManager.setSortStates([{ column: 3, sortOrder: _utils.ASC_SORT_STATE }]);

      // DIFF - MultiColumnSorting & ColumnSorting: removed manipulation on CSS classes related to the number indicators.
      var htmlElementMock = { className: 'columnSorting sortAction' };

      expect(domHelper.getRemovedClasses(htmlElementMock).length).toEqual(5);
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('columnSorting')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('indicatorDisabled')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('sortAction')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('ascending')).toBeTruthy();
      expect(domHelper.getRemovedClasses(htmlElementMock).includes('descending')).toBeTruthy();
    });
  });
});