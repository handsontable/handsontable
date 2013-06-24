/**
 * This plugin sorts the view by a column (but does not sort the data source!)
 * @constructor
 */
function HandsontableColumnSorting() {
  var plugin = this;
  var sortingEnabled;


  this.setSortingColumn = function(col, order) {
    var instance = this;


    if (instance.sortColumn === col && typeof order == 'undefined') {
      instance.sortOrder = !instance.sortOrder;
    } else {
      instance.sortOrder = typeof order != 'undefined' ? order : true;
    }

    instance.sortColumn = col;



  };

  this.sortByColumn = function(col, order){
    var instance = this;

    plugin.setSortingColumn.call(instance, col, order);
    plugin.sort.call(instance);
    instance.render();

    instance.PluginHooks.run('afterSorting');
  }

  var bindColumnSortingAfterClick = function(){
    var instance = this;

    instance.rootElement.on('click.handsontable', '.columnSorting', function (e) {
      var $target = $(e.target);
      if ($target.is('.columnSorting')) {
        var col = $target.closest('th').index();
        if (instance.getSettings().rowHeaders) {
          col--;
        }
        plugin.sortByColumn.call(instance, col);
      }
    });
  };

  this.init = function (source) {
    var instance = this;
    var sortingSettings = instance.getSettings().columnSorting;
    var sortingColumn, sortingOrder;

    sortingEnabled = Boolean(sortingSettings);

    if (sortingEnabled) {
      instance.sortIndex = [];

      sortingColumn = typeof sortingSettings.column != 'undefined' ? sortingSettings.column: 0;
      sortingOrder = typeof sortingSettings.column != 'undefined' ? sortingSettings.order : true;

      plugin.sortByColumn.call(instance, sortingSettings.column, sortingSettings.order);

      if(source == 'afterInit'){
        bindColumnSortingAfterClick.call(instance);
      }
    }
  };



  this.sort = function () {
    sortingEnabled = false;
    var instance = this;

    instance.sortIndex.length = 0;

    for (var i = 0, ilen = this.countRows(); i < ilen; i++) {
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn)]);
    }

    this.sortIndex.sort(function (a, b) {
      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null) {
        return 1;
      }
      if (b[1] === null) {
        return -1;
      }
      if (a[1] < b[1]) return instance.sortOrder ? -1 : 1;
      if (a[1] > b[1]) return instance.sortOrder ? 1 : -1;
      return 0;
    });
    sortingEnabled = true;
  };

  this.translateRow = function (getVars) {
    if (sortingEnabled && this.sortIndex && this.sortIndex.length) {
      getVars.row = this.sortIndex[getVars.row][0];
    }
  };

  this.getColHeader = function (col, TH) {
    if (this.getSettings().columnSorting) {
      $(TH).find('span.colHeader:first').addClass('columnSorting');
    }
  };
}
var htSortColumn = new HandsontableColumnSorting();

Handsontable.PluginHooks.add('afterInit', function(){htSortColumn.init.call(this, 'afterInit')});
Handsontable.PluginHooks.add('afterUpdateSettings', function(){htSortColumn.init.call(this, 'afterUpdateSettings')});
Handsontable.PluginHooks.add('beforeGet', htSortColumn.translateRow);
Handsontable.PluginHooks.add('beforeSet', htSortColumn.translateRow);
Handsontable.PluginHooks.add('afterGetColHeader', htSortColumn.getColHeader);