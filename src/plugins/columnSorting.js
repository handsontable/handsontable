/**
 * This plugin sorts the view by a column (but does not sort the data source!)
 * @constructor
 */
function HandsontableColumnSorting() {
  var plugin = this;

  this.init = function (source) {
    var instance = this;
    var sortingSettings = instance.getSettings().columnSorting;
    var sortingColumn, sortingOrder;

    instance.sortingEnabled = !!(sortingSettings);

    if (instance.sortingEnabled) {
      instance.sortIndex = [];

      var loadedSortingState = loadSortingState.call(instance);

      if (typeof loadedSortingState != 'undefined') {
        sortingColumn = loadedSortingState.sortColumn;
        sortingOrder = loadedSortingState.sortOrder;
      } else {
        sortingColumn = sortingSettings.column;
        sortingOrder = sortingSettings.sortOrder;
      }
      plugin.sortByColumn.call(instance, sortingColumn, sortingOrder);

      instance.sort = function(){
        var args = Array.prototype.slice.call(arguments);

        return plugin.sortByColumn.apply(instance, args)
      }

      if (typeof instance.getSettings().observeChanges == 'undefined'){
        enableObserveChangesPlugin.call(instance);
      }

      if (source == 'afterInit') {
        bindColumnSortingAfterClick.call(instance);

        instance.addHook('afterCreateRow', plugin.afterCreateRow);
        instance.addHook('afterRemoveRow', plugin.afterRemoveRow);
      }
    } else {
      delete instance.sort;
    }
  };

  this.setSortingColumn = function (col, order) {
    var instance = this;

    if (typeof col == 'undefined') {
      delete instance.sortColumn;
      delete instance.sortOrder;

      return;
    } else if (instance.sortColumn === col && typeof order == 'undefined') {
      instance.sortOrder = !instance.sortOrder;
    } else {
      instance.sortOrder = typeof order != 'undefined' ? order : true;
    }

    instance.sortColumn = col;

  };

  this.sortByColumn = function (col, order) {
    var instance = this;

    plugin.setSortingColumn.call(instance, col, order);

    instance.PluginHooks.run('beforeColumnSort', instance.sortColumn, instance.sortOrder);

    plugin.sort.call(instance);
    instance.render();

    saveSortingState.call(instance);

    instance.PluginHooks.run('afterColumnSort', instance.sortColumn, instance.sortOrder);
  };

  var saveSortingState = function () {
    var instance = this;

    var sortingState = {};

    if (typeof instance.sortColumn != 'undefined') {
      sortingState.sortColumn = instance.sortColumn;
    }

    if (typeof instance.sortOrder != 'undefined') {
      sortingState.sortOrder = instance.sortOrder;
    }

    if (sortingState.hasOwnProperty('sortColumn') || sortingState.hasOwnProperty('sortOrder')) {
      instance.PluginHooks.run('persistentStateSave', 'columnSorting', sortingState);
    }

  };

  var loadSortingState = function () {
    var instance = this;
    var storedState = {};
    instance.PluginHooks.run('persistentStateLoad', 'columnSorting', storedState);

    return storedState.value;
  };

  var bindColumnSortingAfterClick = function () {
    var instance = this;

    instance.rootElement.on('click.handsontable', '.columnSorting', function (e) {
      if (instance.view.wt.wtDom.hasClass(e.target, 'columnSorting')) {
        var col = getColumn(e.target);
        plugin.sortByColumn.call(instance, col);
      }
    });

    function countRowHeaders() {
      var THs = instance.view.TBODY.querySelector('tr').querySelectorAll('th');
      return THs.length;
    }

    function getColumn(target) {
      var TH = instance.view.wt.wtDom.closest(target, 'TH');
      return instance.view.wt.wtDom.index(TH) - countRowHeaders();
    }
  };

  function enableObserveChangesPlugin () {
    var instance = this;
    instance.registerTimeout('enableObserveChanges', function(){
      instance.updateSettings({
        observeChanges: true
      });
    }, 0);
  }

  function defaultSort(sortOrder) {
    return function (a, b) {
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

  function dateSort(sortOrder) {
    return function (a, b) {
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

      if (aDate < bDate) return sortOrder ? -1 : 1;
      if (aDate > bDate) return sortOrder ? 1 : -1;

      return 0;
    }
  }

  this.sort = function () {
    var instance = this;

    if (typeof instance.sortOrder == 'undefined') {
      return;
    }

    instance.sortingEnabled = false; //this is required by translateRow plugin hook
    instance.sortIndex.length = 0;

    var colOffset = this.colOffset();
    for (var i = 0, ilen = this.countRows() - instance.getSettings()['minSpareRows']; i < ilen; i++) {
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn + colOffset)]);
    }

    var colMeta = instance.getCellMeta(0, instance.sortColumn);
    var sortFunction;
    switch (colMeta.type) {
      case 'date':
        sortFunction = dateSort;
        break;
      default:
        sortFunction = defaultSort;
    }

    this.sortIndex.sort(sortFunction(instance.sortOrder));

    //Append spareRows
    for(var i = this.sortIndex.length; i < instance.countRows(); i++){
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn + colOffset)]);
    }

    instance.sortingEnabled = true; //this is required by translateRow plugin hook
  };

  this.translateRow = function (row) {
    var instance = this;
    if (instance.sortingEnabled && instance.sortIndex && instance.sortIndex.length) {
      return instance.sortIndex[row][0];
    }
    return row;
  };

  this.onBeforeGetSet = function (getVars) {
    var instance = this;
    getVars.row = plugin.translateRow.call(instance, getVars.row);
  };

  this.untranslateRow = function (row) {
    if (sortingEnabled && this.sortIndex && this.sortIndex.length) {
      for (var i = 0; i < this.sortIndex.length; i++) {
        if (this.sortIndex[i][0] == row) {
          return i;
        }
      }
    }
  };

  this.getColHeader = function (col, TH) {
    if (this.getSettings().columnSorting) {
      this.view.wt.wtDom.addClass(TH.querySelector('.colHeader'), 'columnSorting');
    }
  };

  function isSorted(instance){
    return typeof instance.sortColumn != 'undefined';
  }

  this.afterCreateRow = function(index, amount){
    var instance = this;

    if(!isSorted(instance)){
      return;
    }

    instance.sortIndex.splice(index, 0, [index, instance.getData()[index][this.sortColumn + instance.colOffset()]]);

    for(var i = 0; i < instance.sortIndex.length; i++){
      if(i == index) continue;

      if (instance.sortIndex[i][0] >= index){
        instance.sortIndex[i][0] += 1;
      }
    }

    saveSortingState.call(instance);

  };

  this.afterRemoveRow = function(index, amount){
    var instance = this;

    if(!isSorted(instance)){
      return;
    }

    instance.sortIndex.splice(index, amount);

    for(var i = 0; i < instance.sortIndex.length; i++){

      if (instance.sortIndex[i][0] > index){
        instance.sortIndex[i][0] -= amount;
      }
    }

    saveSortingState.call(instance);

  };

  this.afterChangeSort = function (changes/*, source*/) {
    var instance = this;
    var sortColumnChanged = false;
    var selection = {};
    if (!changes) {
      return;
    }

    for (var i = 0; i < changes.length; i++) {
      if (changes[i][1] == instance.sortColumn) {
        sortColumnChanged = true;
        selection.row = plugin.translateRow.call(instance, changes[i][0]);
        selection.col = changes[i][1];
        break;
      }
    }

    if (sortColumnChanged) {
      setTimeout(function () {
        plugin.sort.call(instance);
        instance.render();
        instance.selectCell(plugin.untranslateRow.call(instance, selection.row), selection.col);
      }, 0);
    }
  };
}
var htSortColumn = new HandsontableColumnSorting();

Handsontable.PluginHooks.add('afterInit', function () {
  htSortColumn.init.call(this, 'afterInit')
});
Handsontable.PluginHooks.add('afterUpdateSettings', function () {
  htSortColumn.init.call(this, 'afterUpdateSettings')
});
Handsontable.PluginHooks.add('beforeGet', htSortColumn.onBeforeGetSet);
Handsontable.PluginHooks.add('beforeSet', htSortColumn.onBeforeGetSet);
Handsontable.PluginHooks.add('afterGetColHeader', htSortColumn.getColHeader);

