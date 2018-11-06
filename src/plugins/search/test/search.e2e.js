describe('Search plugin', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
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
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        search: true
      });

      hot.getPlugin('search').query('2');

      render();

      const searchResultClass = hot.getPlugin('search').searchResultClass;

      let cell = hot.getCell(0, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(0, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(0, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(1, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = hot.getCell(1, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = hot.getCell(1, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = hot.getCell(2, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(2, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(2, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);

      hot.updateSettings({
        search: false
      });

      cell = hot.getCell(0, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(0, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(0, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(1, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(1, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(1, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(2, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(2, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(2, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
    });

    it('should remove beforeRenderer hook when disable plugin', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        search: true
      });

      const onBeforeRenderer = spyOn(hot.getPlugin('search'), 'onBeforeRenderer');

      hot.getPlugin('search').query('2');
      hot.render();

      expect(onBeforeRenderer.calls.count()).toEqual(9);

      hot.updateSettings({
        search: false
      });

      expect(onBeforeRenderer.calls.count()).toEqual(18);

      hot.render();

      expect(onBeforeRenderer.calls.count()).toEqual(18);
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
        data: Handsontable.helper.createSpreadsheetData(2, 2),
        search: true
      });

      const searchCallback = jasmine.createSpy('searchCallback');

      hot.getPlugin('search').query('A', searchCallback);

      expect(searchCallback.calls.count()).toEqual(4);
      expect(searchCallback.calls.argsFor(0).splice(1)).toEqual([0, 0, 'A1', true]);
      expect(searchCallback.calls.argsFor(1).splice(1)).toEqual([0, 1, 'B1', false]);
      expect(searchCallback.calls.argsFor(2).splice(1)).toEqual([1, 0, 'A2', true]);
      expect(searchCallback.calls.argsFor(3).splice(1)).toEqual([1, 1, 'B2', false]);
    });
  });

  describe('default search callback', () => {
    it('should add isSearchResult = true, to cell properties of all matched cells', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        search: true
      });

      hot.getPlugin('search').query('2');

      render();

      let cellProperties = hot.getCellMeta(0, 0);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = hot.getCellMeta(0, 1);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = hot.getCellMeta(0, 2);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = hot.getCellMeta(1, 0);
      expect(cellProperties.isSearchResult).toBeTruthy();
      cellProperties = hot.getCellMeta(1, 1);
      expect(cellProperties.isSearchResult).toBeTruthy();
      cellProperties = hot.getCellMeta(1, 2);
      expect(cellProperties.isSearchResult).toBeTruthy();
      cellProperties = hot.getCellMeta(2, 0);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = hot.getCellMeta(2, 1);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = hot.getCellMeta(2, 2);
      expect(cellProperties.isSearchResult).toBeFalsy();
    });
  });

  describe('search result decorator', () => {
    it('should add default search result class to cells which mach the query', () => {

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        search: true
      });

      hot.getPlugin('search').query('2');

      render();

      const searchResultClass = hot.getPlugin('search').searchResultClass;

      let cell = hot.getCell(0, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(0, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(0, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(1, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = hot.getCell(1, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = hot.getCell(1, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = hot.getCell(2, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(2, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = hot.getCell(2, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
    });

    it('should add custom search result class to cells which mach the query', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        search: {
          searchResultClass: 'customSearchResultClass'
        }
      });

      hot.getPlugin('search').query('2');

      render();

      let cell = hot.getCell(0, 0);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = hot.getCell(0, 1);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = hot.getCell(0, 2);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = hot.getCell(1, 0);
      expect($(cell).hasClass('customSearchResultClass')).toBe(true);
      cell = hot.getCell(1, 1);
      expect($(cell).hasClass('customSearchResultClass')).toBe(true);
      cell = hot.getCell(1, 2);
      expect($(cell).hasClass('customSearchResultClass')).toBe(true);
      cell = hot.getCell(2, 0);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = hot.getCell(2, 1);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = hot.getCell(2, 2);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
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

  describe('cellProperties.className', () => {
    it('should add default search result class to cells when we have classes in array', () => {

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        search: true,
        columns() {
          return {
            className: ['columns', 'cell']
          };
        }
      });

      hot.getPlugin('search').query('2');

      render();

      let cellClassName = hot.getCell(0, 0).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = hot.getCell(0, 1).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = hot.getCell(0, 2).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = hot.getCell(1, 0).className;
      expect(cellClassName).toBe('columns cell htSearchResult');
      cellClassName = hot.getCell(1, 1).className;
      expect(cellClassName).toBe('columns cell htSearchResult');
      cellClassName = hot.getCell(1, 2).className;
      expect(cellClassName).toBe('columns cell htSearchResult');
      cellClassName = hot.getCell(2, 0).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = hot.getCell(2, 1).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = hot.getCell(2, 2).className;
      expect(cellClassName).toBe('columns cell');
    });

    it('should add default search result class to cells when we have class in string', () => {

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        search: true,
        className: 'cell',
      });

      hot.getPlugin('search').query('2');

      render();

      let cellClassName = hot.getCell(0, 0).className;
      expect(cellClassName).toBe('cell');
      cellClassName = hot.getCell(0, 1).className;
      expect(cellClassName).toBe('cell');
      cellClassName = hot.getCell(0, 2).className;
      expect(cellClassName).toBe('cell');
      cellClassName = hot.getCell(1, 0).className;
      expect(cellClassName).toBe('cell htSearchResult');
      cellClassName = hot.getCell(1, 1).className;
      expect(cellClassName).toBe('cell htSearchResult');
      cellClassName = hot.getCell(1, 2).className;
      expect(cellClassName).toBe('cell htSearchResult');
      cellClassName = hot.getCell(2, 0).className;
      expect(cellClassName).toBe('cell');
      cellClassName = hot.getCell(2, 1).className;
      expect(cellClassName).toBe('cell');
      cellClassName = hot.getCell(2, 2).className;
      expect(cellClassName).toBe('cell');
    });
  });
});
