/**
 * This plugin sorts the view by a column (but does not sort the data source!)
 * @constructor
 */
function HandsontableColumnSorting() {
  var plugin = this;
  var sortingEnabled;


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
        var col = getColumn($target);
        plugin.sortByColumn.call(instance, col);
      }
    });

    function countRowHeaders($target){
      var $thead = $target.closest('thead');
      var $tbody = $thead.siblings('tbody');
      var $row = $tbody.find('tr:first');
      var $headers = $row.find('th');

      return $headers.length;

    }

    function getColumn($target){
      return $target.closest('th').index() - countRowHeaders($target);
    }
  };

  function defaultSort(sortOrder){
    return function(a, b){
      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null) {
        return 1;
      }
      if (b[1] === null) {
        return -1;
      }
      if (a[1] < b[1]) return sortOrder ? -1 : 1;
      if (a[1] > b[1]) return sortOrder ? 1 : -1;
      return 0;
    }
  }

  function dateSort(sortOrder){
    return function(a, b){
      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null) {
        return 1;
      }
      if (b[1] === null) {
        return -1;
      }

      var aDate = new Date(a[1]);
      var bDate = new Date(b[1]);

      if(aDate < bDate) return sortOrder ? -1 : 1;
      if(aDate > bDate) return sortOrder ? 1 : -1;

      return 0;
    }
  }

  this.sort = function () {
    var instance = this;

    if(typeof instance.sortOrder == 'undefined'){
      return;
    }

    sortingEnabled = false;
    instance.sortIndex.length = 0;

    var colOffset = this.colOffset();
    for (var i = 0, ilen = this.countRows(); i < ilen; i++) {
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn + colOffset)]);
    }

    var colMeta = instance.getCellMeta(0, instance.sortColumn);
    var sortFunction;
    switch(colMeta.type){
      case 'date':
        sortFunction = dateSort;
        break;
      default:
        sortFunction = defaultSort;
    }

    this.sortIndex.sort(sortFunction(instance.sortOrder));
    sortingEnabled = true;
  };

  this.translateRow = function (row) {
    if (sortingEnabled && this.sortIndex && this.sortIndex.length) {
      return this.sortIndex[row][0];
    }
    return row;
  };

  this.onBeforeGetSet = function(getVars){
    var instance = this;
    getVars.row = plugin.translateRow.call(instance, getVars.row);
  };

  this.untranslateRow = function (row) {
    if (sortingEnabled && this.sortIndex && this.sortIndex.length) {
      for(var i = 0; i < this.sortIndex.length; i++){
        if(this.sortIndex[i][0] == row){
          return i;
        }
      }
    }
  };

  this.getColHeader = function (col, TH) {
    if (this.getSettings().columnSorting) {
      $(TH).find('span.colHeader:first').addClass('columnSorting');
    }
  };

  this.afterChangeSort = function(changes, source){
    var instance = this;
    var sortColumnChanged = false;
    var selection = {};
    if(!changes){
      return;
    }

    for(var i=0; i < changes.length; i++){
      if(changes[i][1] == instance.sortColumn){
        sortColumnChanged = true;
        selection.row = plugin.translateRow.call(instance, changes[i][0]);
        selection.col = changes[i][1];
        break;
      }
    }

    if(sortColumnChanged){
      setTimeout(function(){
        plugin.sort.call(instance);
        instance.render();
        instance.selectCell(plugin.untranslateRow.call(instance, selection.row), selection.col);
      },0);
    }
  };
}
var htSortColumn = new HandsontableColumnSorting();

Handsontable.PluginHooks.add('afterInit', function(){htSortColumn.init.call(this, 'afterInit')});
Handsontable.PluginHooks.add('afterUpdateSettings', function(){htSortColumn.init.call(this, 'afterUpdateSettings')});
Handsontable.PluginHooks.add('beforeGet', htSortColumn.onBeforeGetSet);
Handsontable.PluginHooks.add('beforeSet', htSortColumn.onBeforeGetSet);
Handsontable.PluginHooks.add('afterGetColHeader', htSortColumn.getColHeader);

Handsontable.PluginHooks.add('afterCreateRow', htSortColumn.sort);
Handsontable.PluginHooks.add('afterRemoveRow', htSortColumn.sort);
Handsontable.PluginHooks.add('afterChange', htSortColumn.afterChangeSort);