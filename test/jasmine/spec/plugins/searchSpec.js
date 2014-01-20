describe('Search plugin', function () {

  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe("enabling/disabling plugin", function () {
    it("should expose `search` object when plugin is enabled", function () {

      var hot = handsontable({
        search: true
      });

      expect(hot.search).toBeDefined();

    });

    it("should NOT expose `search` object when plugin is disabled", function () {

      var hot = handsontable({
        search: false
      });

      expect(hot.search).not.toBeDefined();

    });

    it("plugin should be disabled by default", function () {

      var hot = handsontable();

      expect(hot.search).not.toBeDefined();

    });

    it("should disable plugin using updateSettings", function () {

      var hot = handsontable({
        search: true
      });

      expect(hot.search).toBeDefined();

      updateSettings({
        search: false
      });

      expect(hot.search).not.toBeDefined();

    });

    it("should enable plugin using updateSettings", function () {

      var hot = handsontable({
        search: false
      });

      expect(hot.search).not.toBeDefined();

      updateSettings({
        search: true
      });

      expect(hot.search).toBeDefined();

    });
  });

  describe("suite name", function () {
    it("should use search method to find phrase", function () {
      var hot = handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      var searchResult = hot.search.query(/A/i);

      expect(searchResult.length).toEqual(5);

      for(var i = 0; i < searchResult.length; i++){
        expect(searchResult[i].row).toEqual(i);
        expect(searchResult[i].col).toEqual(0);
        expect(searchResult[i].data).toEqual(hot.getDataAtCell(i, 0));
      }

    });

    it("should use invoke callback for each search result", function () {
      var hot = handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      var searchCallback = jasmine.createSpy('searchCallback');

      var searchResult = hot.search.query(/A/i, searchCallback);

      expect(searchCallback.calls.length).toEqual(5)

      for(var i = 0; i < searchResult.length; i++){
        var callArgs = searchCallback.calls[i].args;
        expect(callArgs[0]).toEqual(hot);
        expect(callArgs[1]).toEqual(i);
        expect(callArgs[2]).toEqual(0);
        expect(callArgs[3]).toEqual(hot.getDataAtCell(i, 0));
      }

    });

    it("should use invoke default callback for each search result", function () {

      spyOn(Handsontable.Search, 'DEFAULT_CALLBACK');

      var hot = handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      var searchResult = hot.search.query(/A/i);

      expect(Handsontable.Search.DEFAULT_CALLBACK.calls.length).toEqual(5)

    });

    it("should change the default callback", function () {

      spyOn(Handsontable.Search, 'DEFAULT_CALLBACK');

      var hot = handsontable({
        data: createSpreadsheetData(5, 5),
        search: true
      });

      var defaultCallback = jasmine.createSpy('defaultCallback');
      hot.search.setDefaultCallback(defaultCallback);

      var searchResult = hot.search.query(/A/i);

      expect(Handsontable.Search.DEFAULT_CALLBACK).not.toHaveBeenCalled();
      expect(defaultCallback.calls.length).toEqual(5);

    });

  });
});