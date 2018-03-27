describe('Search plugin', () => {
  const id = 'testContainer';

  beforeEach(function () {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('enabling/disabling plugin', () => {
    it('should be disabled by default', () => {
      const hot = handsontable();

      expect(hot.getPlugin('search').isEnabled()).toBe(false);
    });

    it('should disable plugin using updateSettings', () => {
      const hot = handsontable({
        search: true
      });

      hot.updateSettings({
        search: false
      });

      expect(hot.getPlugin('search').isEnabled()).toBe(false);
    });

    it('should enable plugin using updateSettings', () => {
      const hot = handsontable({
        search: false
      });

      hot.updateSettings({
        search: true
      });

      expect(hot.getPlugin('search')).toBeDefined();
    });

    it('should remove default search result class to cells when disable plugin', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      hot.getPlugin('search').query('2');

      render();

      for (let rowIndex = 0, rowCount = countRows(); rowIndex < rowCount; rowIndex += 1) {
        for (let colIndex = 0, colCount = countCols(); colIndex < colCount; colIndex += 1) {
          const cell = getCell(rowIndex, colIndex);

          if (rowIndex === 1) {
            expect($(cell).hasClass(hot.getPlugin('search').searchResultClass)).toBe(true);
          } else {
            expect($(cell).hasClass(hot.getPlugin('search').searchResultClass)).toBe(false);
          }
        }
      }

      hot.updateSettings({
        search: false
      });

      for (let rowIndex = 0, rowCount = countRows(); rowIndex < rowCount; rowIndex += 1) {
        for (let colIndex = 0, colCount = countCols(); colIndex < colCount; colIndex += 1) {
          const cell = getCell(rowIndex, colIndex);

          if (rowIndex === 1) {
            expect($(cell).hasClass(hot.getPlugin('search').searchResultClass)).toBe(false);
          }
        }
      }
    });
  });

  describe('query method', () => {

    it('should use the default query method if no queryMethod is passed to query function', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      spyOn(hot.getPlugin('search'), 'queryMethod');

      const queryMethod = hot.getPlugin('search').getQueryMethod();

      hot.getPlugin('search').query('A');

      expect(queryMethod.calls.count()).toEqual(25);
    });

    it('should use the custom default query method if no queryMethod is passed to query function', () => {
      const customQueryMethod = jasmine.createSpy('customQueryMethod');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      hot.getPlugin('search').setQueryMethod(customQueryMethod);

      hot.getPlugin('search').query('A');

      expect(customQueryMethod.calls.count()).toEqual(25);
    });

    it('should use the query method from the constructor if no queryMethod is passed to query function', () => {
      const customQueryMethod = jasmine.createSpy('customQueryMethod');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: {
          queryMethod: customQueryMethod
        }
      });

      hot.getPlugin('search').query('A');

      expect(customQueryMethod.calls.count()).toEqual(25);
    });

    it('should use method passed to query function', () => {
      const customQueryMethod = jasmine.createSpy('customQueryMethod');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      hot.getPlugin('search').query('A', null, customQueryMethod);

      expect(customQueryMethod.calls.count()).toEqual(25);
    });
  });

  describe('default query method', () => {

    it('should use query method to find phrase', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      const searchResult = hot.getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);

      for (let i = 0; i < searchResult.length; i += 1) {
        expect(searchResult[i].row).toEqual(i);
        expect(searchResult[i].col).toEqual(0);
        expect(searchResult[i].data).toEqual(hot.getDataAtCell(i, 0));
      }
    });

    it('default query method should be case insensitive', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      let searchResult = hot.getPlugin('search').query('a');

      expect(searchResult.length).toEqual(5);

      searchResult = hot.getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);
    });

    it('default query method should work with numeric values', () => {
      const hot = handsontable({
        data: [
          [1, 2],
          [22, 4]
        ],
        search: true
      });

      const searchResult = hot.getPlugin('search').query('2');

      expect(searchResult.length).toEqual(2);
    });

    it('default query method should interpret query as string, not regex', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      const searchResult = hot.getPlugin('search').query('A*');

      expect(searchResult.length).toEqual(0);
    });

    it('default query method should always return false if query string is empty', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      let searchResult = hot.getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);

      searchResult = hot.getPlugin('search').query('');

      expect(searchResult.length).toEqual(0);
    });

    it('default query method should always return false if no query string has been specified', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      let searchResult = hot.getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);

      searchResult = hot.getPlugin('search').query();

      expect(searchResult.length).toEqual(0);
    });

    it('default query method should always return false if no query string is not a string', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      let searchResult = hot.getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);

      searchResult = hot.getPlugin('search').query([1, 2, 3]);

      expect(searchResult.length).toEqual(0);
    });
  });

  describe('search callback', () => {

    it('should invoke default callback for each cell', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      spyOn(hot.getPlugin('search'), 'callback');

      const callback = hot.getPlugin('search').callback;

      hot.getPlugin('search').query('A');

      expect(callback.calls.count()).toEqual(25);
    });

    it('should change the default callback', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      const search = hot.getPlugin('search');

      spyOn(search, 'callback');

      const callback = search.callback;
      const newCallback = jasmine.createSpy('newCallback');

      search.setCallback(newCallback);

      search.query('A');

      expect(callback).not.toHaveBeenCalled();
      expect(newCallback.calls.count()).toEqual(25);
    });

    it('should invoke callback passed in constructor', () => {
      const searchCallback = jasmine.createSpy('searchCallback');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: {
          callback: searchCallback
        }
      });

      hot.getPlugin('search').query('A');

      expect(searchCallback.calls.count()).toEqual(25);
    });

    it('should invoke custom callback for each cell which has been tested', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      const searchCallback = jasmine.createSpy('searchCallback');

      hot.getPlugin('search').query('A', searchCallback);

      expect(searchCallback.calls.count()).toEqual(25);

      for (let rowIndex = 0, rowCount = countRows(); rowIndex < rowCount; rowIndex += 1) {
        for (let colIndex = 0, colCount = countCols(); colIndex < colCount; colIndex += 1) {
          const callArgs = searchCallback.calls.argsFor((rowIndex * 5) + colIndex);
          expect(callArgs[0]).toEqual(hot);
          expect(callArgs[1]).toEqual(rowIndex);
          expect(callArgs[2]).toEqual(colIndex);
          expect(callArgs[3]).toEqual(hot.getDataAtCell(rowIndex, colIndex));

          if (colIndex === 0) {
            expect(callArgs[4]).toBe(true);
          } else {
            expect(callArgs[4]).toBe(false);
          }
        }
      }
    });
  });

  describe('default search callback', () => {
    it('should add isSearchResult = true, to cell properties of all matched cells', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      hot.getPlugin('search').query('2');

      for (let rowIndex = 0, rowCount = countRows(); rowIndex < rowCount; rowIndex += 1) {
        for (let colIndex = 0, colCount = countCols(); colIndex < colCount; colIndex += 1) {
          const cellProperties = getCellMeta(rowIndex, colIndex);

          if (rowIndex === 1) {
            expect(cellProperties.isSearchResult).toBeTruthy();
          } else {
            expect(cellProperties.isSearchResult).toBeFalsy();
          }
        }
      }
    });
  });

  describe('search result decorator', () => {
    it('should add default search result class to cells which mach the query', () => {

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: true
      });

      hot.getPlugin('search').query('2');

      render();

      for (let rowIndex = 0, rowCount = countRows(); rowIndex < rowCount; rowIndex += 1) {
        for (let colIndex = 0, colCount = countCols(); colIndex < colCount; colIndex += 1) {
          const cell = getCell(rowIndex, colIndex);

          if (rowIndex === 1) {
            expect($(cell).hasClass(hot.getPlugin('search').searchResultClass)).toBe(true);
          } else {
            expect($(cell).hasClass(hot.getPlugin('search').searchResultClass)).toBe(false);
          }
        }
      }
    });

    it('should add custom search result class to cells which mach the query', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        search: {
          searchResultClass: 'customSearchResultClass'
        }
      });

      hot.getPlugin('search').query('2');

      render();

      for (let rowIndex = 0, rowCount = countRows(); rowIndex < rowCount; rowIndex += 1) {
        for (let colIndex = 0, colCount = countCols(); colIndex < colCount; colIndex += 1) {
          const cell = getCell(rowIndex, colIndex);

          if (rowIndex === 1) {
            expect($(cell).hasClass('customSearchResultClass')).toBe(true);
          } else {
            expect($(cell).hasClass('customSearchResultClass')).toBe(false);
          }
        }
      }
    });
  });

  describe('HOT properties compatibility', () => {
    it('should work properly when the last row is empty', () => { // connected with https://github.com/handsontable/handsontable/issues/1606
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        search: true,
        minSpareRows: 1
      });
      let errorThrown = false;

      try {
        hot.getPlugin('search').query('A');
      } catch (err) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(false);
    });
  });
});
