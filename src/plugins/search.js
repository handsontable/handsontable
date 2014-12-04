(function (Handsontable) {

  'use strict';

  Handsontable.Search = function Search(instance) {
    this.query = function (queryStr, callback, queryMethod) {
      var rowCount = instance.countRows();
      var colCount = instance.countCols();
      var queryResult = [];

      if (!callback) {
        callback = Handsontable.Search.global.getDefaultCallback();
      }

      if (!queryMethod) {
        queryMethod = Handsontable.Search.global.getDefaultQueryMethod();
      }

      for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (var colIndex = 0; colIndex < colCount; colIndex++) {
          var cellData = instance.getDataAtCell(rowIndex, colIndex);
          var cellProperties = instance.getCellMeta(rowIndex, colIndex);
          var cellCallback = cellProperties.search.callback || callback;
          var cellQueryMethod = cellProperties.search.queryMethod || queryMethod;
          var testResult = cellQueryMethod(queryStr, cellData);

          if (testResult) {
            var singleResult = {
              row: rowIndex,
              col: colIndex,
              data: cellData
            };

            queryResult.push(singleResult);
          }

          if (cellCallback) {
            cellCallback(instance, rowIndex, colIndex, cellData, testResult);
          }
        }
      }

      return queryResult;

    };

  };

  Handsontable.Search.DEFAULT_CALLBACK = function (instance, row, col, data, testResult) {
    instance.getCellMeta(row, col).isSearchResult = testResult;
  };

  Handsontable.Search.DEFAULT_QUERY_METHOD = function (query, value) {

    if (typeof query == 'undefined' || query == null || !query.toLowerCase || query.length === 0){
      return false;
    }

    if(typeof value == 'undefined' || value == null) {
      return false;
    }

    return value.toString().toLowerCase().indexOf(query.toLowerCase()) != -1;
  };

  Handsontable.Search.DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';

  Handsontable.Search.global = (function () {

    var defaultCallback = Handsontable.Search.DEFAULT_CALLBACK;
    var defaultQueryMethod = Handsontable.Search.DEFAULT_QUERY_METHOD;
    var defaultSearchResultClass = Handsontable.Search.DEFAULT_SEARCH_RESULT_CLASS;

    return {
      getDefaultCallback: function () {
        return defaultCallback;
      },

      setDefaultCallback: function (newDefaultCallback) {
        defaultCallback = newDefaultCallback;
      },

      getDefaultQueryMethod: function () {
        return defaultQueryMethod;
      },

      setDefaultQueryMethod: function (newDefaultQueryMethod) {
        defaultQueryMethod = newDefaultQueryMethod;
      },

      getDefaultSearchResultClass: function () {
        return defaultSearchResultClass;
      },

      setDefaultSearchResultClass: function (newSearchResultClass) {
        defaultSearchResultClass = newSearchResultClass;
      }
    };

  })();



  Handsontable.SearchCellDecorator = function (instance, TD, row, col, prop, value, cellProperties) {

    var searchResultClass = (typeof cellProperties.search == 'object' && cellProperties.search.searchResultClass) || Handsontable.Search.global.getDefaultSearchResultClass();

    if(cellProperties.isSearchResult){
      Handsontable.Dom.addClass(TD, searchResultClass);
    } else {
      Handsontable.Dom.removeClass(TD, searchResultClass);
    }
  };



  var originalDecorator = Handsontable.renderers.cellDecorator;

  Handsontable.renderers.cellDecorator = function (instance, TD, row, col, prop, value, cellProperties) {
    originalDecorator.apply(this, arguments);
    Handsontable.SearchCellDecorator.apply(this, arguments);
  };

  function init() {
    /* jshint ignore:start */
    var instance = this;
    /* jshint ignore:end */

    var pluginEnabled = !!instance.getSettings().search;

    if (pluginEnabled) {
      instance.search = new Handsontable.Search(instance);
    } else {
      delete instance.search;
    }
  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);


})(Handsontable);
