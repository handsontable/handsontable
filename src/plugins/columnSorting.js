/**
 * This plugin sorts the view by a column (but does not sort the data source!)
 * @constructor
 */
function HandsontableColumnSorting() {
  var plugin = this;
  var sortingEnabled;

  this.afterInit = function () {
    var instance = this;
    if (this.getSettings().columnSorting) {
      this.sortIndex = [];
      this.rootElement.on('click.handsontable', '.columnSorting', function (e) {
        var $target = $(e.target);
        if ($target.is('.columnSorting')) {
          var col = $target.closest('th').index();
          if (instance.getSettings().rowHeaders) {
            col--;
          }
          if (instance.sortColumn === col) {
            instance.sortOrder = !instance.sortOrder;
          }
          else {
            instance.sortColumn = col;
            instance.sortOrder = true;
          }
          plugin.sort.call(instance);
          instance.render();
        }
      });
    }
  };

  this.sort = function () {

    var instance = this;

    if(typeof instance.sortOrder == 'undefined'){
      return;
    }

    sortingEnabled = false;
    this.sortIndex.length = 0;
    var colOffset = this.colOffset();
    for (var i = 0, ilen = this.countRows(); i < ilen; i++) {
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn + colOffset)]);
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

  this.translateRow = function (row) {
    if (sortingEnabled && this.sortIndex && this.sortIndex.length) {
      return this.sortIndex[row][0];
    }
    return row;
  };

  this.onBeforeGetSet = function(getVars){
    var instance = this;
    getVars.row = plugin.translateRow.call(instance, getVars.row);
  }

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
      $(TH).find('span.colHeader')[0].className += ' columnSorting';
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

Handsontable.PluginHooks.add('afterInit', htSortColumn.afterInit);
Handsontable.PluginHooks.add('beforeGet', htSortColumn.onBeforeGetSet);
Handsontable.PluginHooks.add('beforeSet', htSortColumn.onBeforeGetSet);
Handsontable.PluginHooks.add('afterGetColHeader', htSortColumn.getColHeader);

Handsontable.PluginHooks.add('afterCreateRow', htSortColumn.sort);
Handsontable.PluginHooks.add('afterRemoveRow', htSortColumn.sort);
Handsontable.PluginHooks.add('afterChange', htSortColumn.afterChangeSort);
