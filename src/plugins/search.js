(function (Handsontable) {

  'use strict';

  Handsontable.Search = function Search(instance) {
    this.query = function (queryStr, callback, queryMethod) {
      var rowCount = instance.countRows();
      var colCount = instance.countCols();
      var queryResult = [];

      if (!callback) {
        callback = this.getDefaultCallback();
      }

      if (!queryMethod) {
        queryMethod = this.getDefaultQueryMethod();
      }

      for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (var colIndex = 0; colIndex < colCount; colIndex++) {
          var cellData = instance.getDataAtCell(rowIndex, colIndex);
          var testResult = queryMethod(queryStr, cellData);

          if (testResult) {
            var singleResult = {
              row: rowIndex,
              col: colIndex,
              data: cellData
            };

            queryResult.push(singleResult);
          }

          if (callback) {
            callback(instance, rowIndex, colIndex, cellData, testResult);
          }
        }
      }

      return queryResult;

    };

    var defaultCallback = Handsontable.Search.DEFAULT_CALLBACK;
    var defaultQueryMethod = Handsontable.Search.DEFAULT_QUERY_METHOD;

    this.getDefaultCallback = function () {
      return defaultCallback;
    };

    this.setDefaultCallback = function (newDefaultCallback) {
      defaultCallback = newDefaultCallback;
    };

    this.getDefaultQueryMethod = function () {
      return defaultQueryMethod;
    };

    this.setDefaultQueryMethod = function (newDefaultQueryMethod) {
      defaultQueryMethod = newDefaultQueryMethod;
    };

  };

  Handsontable.Search.DEFAULT_CALLBACK = function (instance, row, col, data, testResult) {
    instance.getCellMeta(row, col).isSearchResult = testResult;
  };

  Handsontable.Search.DEFAULT_QUERY_METHOD = function (query, value) {
    return value.toLowerCase().indexOf(query.toLowerCase()) != -1;
  };

  Handsontable.SearchCellDecorator = function (instance, TD, row, col, prop, value, cellProperties) {
    if(cellProperties.isSearchResult){
      Handsontable.Dom.addClass(TD, cellProperties.searchResultClass || Handsontable.SearchCellDecorator.DEFAULT_SEARCH_RESULT_CLASS);
    } else {
      Handsontable.Dom.removeClass(TD, cellProperties.searchResultClass || Handsontable.SearchCellDecorator.DEFAULT_SEARCH_RESULT_CLASS);
    }
  };

  Handsontable.SearchCellDecorator.DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';

  var originalDecorator = Handsontable.renderers.cellDecorator;

  Handsontable.renderers.cellDecorator = function (instance, TD, row, col, prop, value, cellProperties) {
    originalDecorator.apply(this, arguments);
    Handsontable.SearchCellDecorator.apply(this, arguments);
  };

  function init() {
    var instance = this;

    var pluginEnabled = !!instance.getSettings().search;

    if (pluginEnabled) {
      instance.search = new Handsontable.Search(instance);
    } else {
      delete instance.search;
    }

  }

  Handsontable.PluginHooks.add('afterInit', init);
  Handsontable.PluginHooks.add('afterUpdateSettings', init);


})(Handsontable);