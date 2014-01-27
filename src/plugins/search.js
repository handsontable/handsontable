(function (Handsontable) {

  'use strict';

  Handsontable.Search = function Search(instance) {
    this.query = function (regex, callback) {
      var rowCount = instance.countRows();
      var colCount = instance.countCols();
      var queryResult = [];

      if (typeof callback == 'undefined') {
        callback = this.getDefaultCallback();
      }

      for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (var colIndex = 0; colIndex < colCount; colIndex++) {
          var cellData = instance.getDataAtCell(rowIndex, colIndex);
          var testResult = regex.test(Handsontable.helper.toString(cellData));

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

    this.getDefaultCallback = function () {
      return defaultCallback;
    };

    this.setDefaultCallback = function (newDefaultCallback) {
      defaultCallback = newDefaultCallback;
    };
  };

  Handsontable.Search.DEFAULT_CALLBACK = function (instance, row, col, data, testResult) {
    instance.getCellMeta(row, col).isSearchResult = testResult;
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