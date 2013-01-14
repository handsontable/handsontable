/**
 * This plugin sorts the view by a column (but does not sort the data source!)
 * @constructor
 */
function HandsontableColumnSorting() {
  var plugin = this;

  this.afterInit = function () {
    var instance = this;
    if (this.getSettings().columnSorting) {
      this.sortIndex = [];
      this.rootElement.on('click.handsontable', '.columnSorting', function (e) {
        var $div = $(e.target);
        if ($div.is('.columnSorting')) {
          instance.sortColumn = $div.closest('th').index();
          instance.sortOrder = !instance.sortOrder;
          if (instance.getSettings().rowHeaders) {
            instance.sortColumn--;
          }
          plugin.sort.call(instance);
          instance.render();
        }
      });
    }
  };

  this.sort = function () {
    var instance = this;
    this.sortIndex.length = 0;
    var data = this.getData();
    for (var i = 0, ilen = this.countRows(); i < ilen; i++) {
      this.sortIndex.push([i, data[i][this.sortColumn]]);
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
  };

  this.translateRow = function (getVars) {
    if (this.sortIndex && this.sortIndex.length) {
      getVars.row = this.sortIndex[getVars.row][0];
    }
  };

  this.getColHeader = function (col, response) {
    var prepend = '<span class="columnSorting">';
    var append = '</span>';
    response.html = prepend + response.html + append;
  };
}
var htSortColumn = new HandsontableColumnSorting();

Handsontable.PluginHooks.push('afterInit', htSortColumn.afterInit);
Handsontable.PluginHooks.push('beforeGet', htSortColumn.translateRow);
Handsontable.PluginHooks.push('beforeSet', htSortColumn.translateRow);
Handsontable.PluginHooks.push('afterGetColHeader', htSortColumn.getColHeader);