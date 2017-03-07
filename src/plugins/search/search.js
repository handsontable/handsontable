import Hooks from './../../pluginHooks';
import {addClass, removeClass} from './../../helpers/dom/element';
import {registerRenderer, getRenderer} from './../../renderers';

/**
 * @private
 * @plugin Search
 */
function Search(instance) {
  this.query = function(queryStr, callback, queryMethod) {
    var rowCount = instance.countRows();
    var colCount = instance.countCols();
    var queryResult = [];

    if (!callback) {
      callback = Search.global.getDefaultCallback();
    }

    if (!queryMethod) {
      queryMethod = Search.global.getDefaultQueryMethod();
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
            data: cellData,
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

Search.DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};

Search.DEFAULT_QUERY_METHOD = function(query, value) {
  if (typeof query == 'undefined' || query == null || !query.toLowerCase || query.length === 0) {
    return false;
  }
  if (typeof value == 'undefined' || value == null) {
    return false;
  }

  return value.toString().toLowerCase().indexOf(query.toLowerCase()) != -1;
};

Search.DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';

Search.global = (function() {

  var defaultCallback = Search.DEFAULT_CALLBACK;
  var defaultQueryMethod = Search.DEFAULT_QUERY_METHOD;
  var defaultSearchResultClass = Search.DEFAULT_SEARCH_RESULT_CLASS;

  return {
    getDefaultCallback() {
      return defaultCallback;
    },

    setDefaultCallback(newDefaultCallback) {
      defaultCallback = newDefaultCallback;
    },

    getDefaultQueryMethod() {
      return defaultQueryMethod;
    },

    setDefaultQueryMethod(newDefaultQueryMethod) {
      defaultQueryMethod = newDefaultQueryMethod;
    },

    getDefaultSearchResultClass() {
      return defaultSearchResultClass;
    },

    setDefaultSearchResultClass(newSearchResultClass) {
      defaultSearchResultClass = newSearchResultClass;
    }
  };

}());

function SearchCellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  var searchResultClass = (cellProperties.search !== null && typeof cellProperties.search == 'object' &&
      cellProperties.search.searchResultClass) || Search.global.getDefaultSearchResultClass();

  if (cellProperties.isSearchResult) {
    addClass(TD, searchResultClass);
  } else {
    removeClass(TD, searchResultClass);
  }
};

var originalBaseRenderer = getRenderer('base');

registerRenderer('base', function(instance, TD, row, col, prop, value, cellProperties) {
  originalBaseRenderer.apply(this, arguments);
  SearchCellDecorator.apply(this, arguments);
});

function init() {
  var instance = this;

  var pluginEnabled = !!instance.getSettings().search;

  if (pluginEnabled) {
    instance.search = new Search(instance);
  } else {
    delete instance.search;
  }
}

Hooks.getSingleton().add('afterInit', init);
Hooks.getSingleton().add('afterUpdateSettings', init);

export default Search;
