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
    it('should be disabled by default', async() => {
      handsontable();

      expect(getPlugin('search').isEnabled()).toBe(false);
    });

    it('should disable plugin using updateSettings', async() => {
      handsontable({
        search: true
      });

      await updateSettings({
        search: false
      });

      expect(getPlugin('search').isEnabled()).toBe(false);
    });

    it('should enable plugin using updateSettings', async() => {
      handsontable({
        search: false
      });

      await updateSettings({
        search: true
      });

      expect(getPlugin('search')).toBeDefined();
    });

    it('should remove default search result class to cells when disable plugin', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        search: true
      });

      getPlugin('search').query('2');

      await render();

      const searchResultClass = getPlugin('search').searchResultClass;

      let cell = getCell(0, 0);

      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(0, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(0, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(1, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = getCell(1, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = getCell(1, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = getCell(2, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(2, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(2, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);

      await updateSettings({
        search: false
      });

      cell = getCell(0, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(0, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(0, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(1, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(1, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(1, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(2, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(2, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(2, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
    });
  });

  describe('query method', () => {
    it('should use the default query method if no queryMethod is passed to query function', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      spyOn(getPlugin('search'), 'queryMethod');

      const queryMethod = getPlugin('search').getQueryMethod();

      getPlugin('search').query('A');

      expect(queryMethod.calls.count()).toEqual(25);
    });

    it('should handle locales properly while using default query method', async() => {
      let result;

      handsontable({
        data: [
          ['Abdulhamit Akkaya'],
          ['Abubekir Kılıç'],
          ['Furkan İnanç'],
          ['Halil İbrahim Öztürk'],
          ['Kaan Yerli'],
          ['Ömer Emin Sarıkoç'],
        ],
        search: true,
        locale: 'tr-TR',
      });

      result = getPlugin('search').query('inanç');

      expect(result).toEqual([jasmine.objectContaining({
        row: 2,
        col: 0,
        data: 'Furkan İnanç',
      })]);

      result = getPlugin('search').query('İnanç');

      expect(result).toEqual([jasmine.objectContaining({
        row: 2,
        col: 0,
        data: 'Furkan İnanç',
      })]);
    });

    it('should use the custom default query method if no queryMethod is passed to query function', async() => {
      const customQueryMethod = jasmine.createSpy('customQueryMethod');

      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      getPlugin('search').setQueryMethod(customQueryMethod);

      getPlugin('search').query('A');

      expect(customQueryMethod.calls.count()).toEqual(25);
    });

    it('should use the query method from the constructor if no queryMethod is passed to query function', async() => {
      const customQueryMethod = jasmine.createSpy('customQueryMethod');

      handsontable({
        data: createSpreadsheetData(5, 5),
        search: {
          queryMethod: customQueryMethod
        }
      });

      getPlugin('search').query('A');

      expect(customQueryMethod.calls.count()).toEqual(25);
    });

    it('should use method passed to query function', async() => {
      const customQueryMethod = jasmine.createSpy('customQueryMethod');

      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      getPlugin('search').query('A', null, customQueryMethod);

      expect(customQueryMethod.calls.count()).toEqual(25);
    });

    it('should pass search string and cell params to the query method', async() => {
      const customQueryMethod = jasmine.createSpy('customQueryMethod');

      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      getPlugin('search').query('A', null, customQueryMethod);

      // Replace `cellProperties.instance` with fake to avoid unreadable test reports
      const replaceInstanceWithFake = arg => (
        arg && typeof arg === 'object' && 'instance' in arg
          ? { ...arg, instance: {} }
          : arg
      );

      expect(customQueryMethod.calls.count()).toEqual(25);
      expect(customQueryMethod.calls.argsFor(0).map(replaceInstanceWithFake)).toEqual(['A', 'A1', {
        row: 0,
        col: 0,
        visualRow: 0,
        visualCol: 0,
        prop: 0,
        instance: {},
        className: ''
      }]);
      expect(customQueryMethod.calls.argsFor(7).map(replaceInstanceWithFake)).toEqual(['A', 'C2', {
        row: 1,
        col: 2,
        visualRow: 1,
        visualCol: 2,
        prop: 2,
        instance: {},
        className: ''
      }]);
      expect(customQueryMethod.calls.argsFor(24).map(replaceInstanceWithFake)).toEqual(['A', 'E5', {
        row: 4,
        col: 4,
        visualRow: 4,
        visualCol: 4,
        prop: 4,
        instance: {},
        className: ''
      }]);
    });
  });

  describe('default query method', () => {

    it('should use query method to find phrase', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      const searchResult = getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);

      for (let i = 0; i < searchResult.length; i += 1) {
        expect(searchResult[i].row).toEqual(i);
        expect(searchResult[i].col).toEqual(0);
        expect(searchResult[i].data).toEqual(getDataAtCell(i, 0));
      }
    });

    it('default query method should be case insensitive', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      let searchResult = getPlugin('search').query('a');

      expect(searchResult.length).toEqual(5);

      searchResult = getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);
    });

    it('default query method should work with numeric values', async() => {
      handsontable({
        data: [
          [1, 2],
          [22, 4]
        ],
        search: true
      });

      const searchResult = getPlugin('search').query('2');

      expect(searchResult.length).toEqual(2);
    });

    it('default query method should interpret query as string, not regex', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      const searchResult = getPlugin('search').query('A*');

      expect(searchResult.length).toEqual(0);
    });

    it('default query method should always return false if query string is empty', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      let searchResult = getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);

      searchResult = getPlugin('search').query('');

      expect(searchResult.length).toEqual(0);
    });

    it('default query method should always return false if no query string has been specified', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      let searchResult = getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);

      searchResult = getPlugin('search').query();

      expect(searchResult.length).toEqual(0);
    });

    it('default query method should always return false if no query string is not a string', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      let searchResult = getPlugin('search').query('A');

      expect(searchResult.length).toEqual(5);

      searchResult = getPlugin('search').query([1, 2, 3]);

      expect(searchResult.length).toEqual(0);
    });
  });

  describe('search callback', () => {

    it('should invoke default callback for each cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      spyOn(getPlugin('search'), 'callback');

      const callback = getPlugin('search').callback;

      getPlugin('search').query('A');

      expect(callback.calls.count()).toEqual(25);
    });

    it('should change the default callback', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      const search = getPlugin('search');

      spyOn(search, 'callback');

      const callback = search.callback;
      const newCallback = jasmine.createSpy('newCallback');

      search.setCallback(newCallback);

      search.query('A');

      expect(callback).not.toHaveBeenCalled();
      expect(newCallback.calls.count()).toEqual(25);
    });

    it('should invoke callback passed in constructor', async() => {
      const searchCallback = jasmine.createSpy('searchCallback');

      handsontable({
        data: createSpreadsheetData(5, 5),
        search: {
          callback: searchCallback
        }
      });

      getPlugin('search').query('A');

      expect(searchCallback.calls.count()).toEqual(25);
    });

    it('should invoke custom callback for each cell which has been tested', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        search: true
      });

      const searchCallback = jasmine.createSpy('searchCallback');

      getPlugin('search').query('A', searchCallback);

      expect(searchCallback.calls.count()).toEqual(4);
      expect(searchCallback.calls.argsFor(0).splice(1)).toEqual([0, 0, 'A1', true]);
      expect(searchCallback.calls.argsFor(1).splice(1)).toEqual([0, 1, 'B1', false]);
      expect(searchCallback.calls.argsFor(2).splice(1)).toEqual([1, 0, 'A2', true]);
      expect(searchCallback.calls.argsFor(3).splice(1)).toEqual([1, 1, 'B2', false]);
    });
  });

  describe('default search callback', () => {
    it('should add isSearchResult = true, to cell properties of all matched cells', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        search: true
      });

      getPlugin('search').query('2');

      await render();

      let cellProperties = getCellMeta(0, 0);

      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = getCellMeta(0, 1);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = getCellMeta(0, 2);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = getCellMeta(1, 0);
      expect(cellProperties.isSearchResult).toBeTruthy();
      cellProperties = getCellMeta(1, 1);
      expect(cellProperties.isSearchResult).toBeTruthy();
      cellProperties = getCellMeta(1, 2);
      expect(cellProperties.isSearchResult).toBeTruthy();
      cellProperties = getCellMeta(2, 0);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = getCellMeta(2, 1);
      expect(cellProperties.isSearchResult).toBeFalsy();
      cellProperties = getCellMeta(2, 2);
      expect(cellProperties.isSearchResult).toBeFalsy();
    });
  });

  describe('search result decorator', () => {
    it('should add default search result class to cells which mach the query', async() => {

      handsontable({
        data: createSpreadsheetData(3, 3),
        search: true
      });

      getPlugin('search').query('2');

      await render();

      const searchResultClass = getPlugin('search').searchResultClass;

      let cell = getCell(0, 0);

      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(0, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(0, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(1, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = getCell(1, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = getCell(1, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(true);
      cell = getCell(2, 0);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(2, 1);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
      cell = getCell(2, 2);
      expect($(cell).hasClass(searchResultClass)).toBe(false);
    });

    it('should add custom search result class to cells which mach the query', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        search: {
          searchResultClass: 'customSearchResultClass'
        }
      });

      getPlugin('search').query('2');

      await render();

      let cell = getCell(0, 0);

      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = getCell(0, 1);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = getCell(0, 2);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = getCell(1, 0);
      expect($(cell).hasClass('customSearchResultClass')).toBe(true);
      cell = getCell(1, 1);
      expect($(cell).hasClass('customSearchResultClass')).toBe(true);
      cell = getCell(1, 2);
      expect($(cell).hasClass('customSearchResultClass')).toBe(true);
      cell = getCell(2, 0);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = getCell(2, 1);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
      cell = getCell(2, 2);
      expect($(cell).hasClass('customSearchResultClass')).toBe(false);
    });
  });

  describe('HOT properties compatibility', () => {
    it('should work properly when the last row is empty', async() => { // connected with https://github.com/handsontable/handsontable/issues/1606
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        search: true,
        minSpareRows: 1
      });
      let errorThrown = false;

      try {
        getPlugin('search').query('A');
      } catch (err) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(false);
    });
  });

  describe('cellProperties.className', () => {
    it('should add default search result class to cells when we have classes in array', async() => {

      handsontable({
        data: createSpreadsheetData(3, 3),
        search: true,
        columns() {
          return {
            className: ['columns', 'cell']
          };
        }
      });

      getPlugin('search').query('2');

      await render();

      let cellClassName = getCell(0, 0).className;

      expect(cellClassName).toBe('columns cell');
      cellClassName = getCell(0, 1).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = getCell(0, 2).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = getCell(1, 0).className;
      expect(cellClassName).toBe('columns cell htSearchResult');
      cellClassName = getCell(1, 1).className;
      expect(cellClassName).toBe('columns cell htSearchResult');
      cellClassName = getCell(1, 2).className;
      expect(cellClassName).toBe('columns cell htSearchResult');
      cellClassName = getCell(2, 0).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = getCell(2, 1).className;
      expect(cellClassName).toBe('columns cell');
      cellClassName = getCell(2, 2).className;
      expect(cellClassName).toBe('columns cell');
    });

    it('should add default search result class to cells when we have class in string', async() => {

      handsontable({
        data: createSpreadsheetData(3, 3),
        search: true,
        className: 'cell',
      });

      getPlugin('search').query('2');

      await render();

      let cellClassName = getCell(0, 0).className;

      expect(cellClassName).toBe('cell');
      cellClassName = getCell(0, 1).className;
      expect(cellClassName).toBe('cell');
      cellClassName = getCell(0, 2).className;
      expect(cellClassName).toBe('cell');
      cellClassName = getCell(1, 0).className;
      expect(cellClassName).toBe('cell htSearchResult');
      cellClassName = getCell(1, 1).className;
      expect(cellClassName).toBe('cell htSearchResult');
      cellClassName = getCell(1, 2).className;
      expect(cellClassName).toBe('cell htSearchResult');
      cellClassName = getCell(2, 0).className;
      expect(cellClassName).toBe('cell');
      cellClassName = getCell(2, 1).className;
      expect(cellClassName).toBe('cell');
      cellClassName = getCell(2, 2).className;
      expect(cellClassName).toBe('cell');
    });
  });
});
