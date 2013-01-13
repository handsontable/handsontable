/**
 * This plugin sorts the view by a column (but does not sort the data source!)
 * @constructor
 */
function HandsontableColumnSorting() {
  var plugin = this;

  this.afterInit = function () {
    if (this.getSettings().columnSorting) {
      this.sortedColumn = 1;
      plugin.sort.call(this);
    }
  };

  this.sort = function () {
    this.sortedOrder = [];
    var data = this.getData();
    for (var i = 0, ilen = this.countRows(); i < ilen; i++) {
      this.sortedOrder.push([i, data[i][this.sortedColumn]]);
    }
    this.sortedOrder.sort(function (a, b) {
      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null) {
        return 1;
      }
      if (b[1] === null) {
        return -1;
      }
      if (a[1] < b[1]) return -1;
      if (a[1] > b[1]) return 1;
      return 0;
    });
  };

  this.translateRow = function (getVars) {
    if (this.sortedOrder) {
      getVars.row = this.sortedOrder[getVars.row][0];
    }
  };
}
var htSortColumn = new HandsontableColumnSorting();

Handsontable.PluginHooks.push('afterInit', htSortColumn.afterInit);
Handsontable.PluginHooks.push('beforeGet', htSortColumn.translateRow);
Handsontable.PluginHooks.push('beforeSet', htSortColumn.translateRow);