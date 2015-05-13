import * as dom from './../../dom.js';
import {eventManager as eventManagerObject} from './../../eventManager.js';
import BasePlugin from './../_base.js';
import {registerPlugin} from './../../plugins.js';

//registerPlugin('columnSorting', ColumnSorting);

/**
 * This plugin sorts the view by a column (but does not sort the data source!)
 *
 * @private
 * @class ColumnSorting
 * @plugin
 * @constructor
 */
class ColumnSorting extends BasePlugin {
  /**
   * @param {Object} hotInstance
   */
  constructor(hotInstance) {
    super(hotInstance);
    let _this = this;
    //this.hot.addHook('afterContextMenuShow', htContextMenu => this.setupZeroClipboard(htContextMenu));

    this.hot.addHook('afterInit', () => this.init.call(this, 'afterInit'));
    this.hot.addHook('afterUpdateSettings', () => this.init.call(this, 'afterUpdateSettings'));
    this.hot.addHook('modifyRow', function() {
      return _this.translateRow.apply(_this, arguments);
    });
    this.hot.addHook('afterGetColHeader', function() {
      return _this.getColHeader.apply(_this, arguments);
    });

    Handsontable.hooks.register('beforeColumnSort');
    Handsontable.hooks.register('afterColumnSort');

    //Handsontable.hooks.add('afterInit', function () {
    //  htSortColumn.init.call(this, 'afterInit');
    //});
    //Handsontable.hooks.add('afterUpdateSettings', function () {
    //  htSortColumn.init.call(this, 'afterUpdateSettings');
    //});
    //Handsontable.hooks.add('modifyRow', htSortColumn.translateRow);
    //Handsontable.hooks.add('afterGetColHeader', htSortColumn.getColHeader);


  }

  init(source) {
    let sortingSettings = this.hot.getSettings().columnSorting,
      _this = this;

    this.hot.sortingEnabled = !!(sortingSettings);

    if (this.hot.sortingEnabled) {
      this.hot.sortIndex = [];

      let loadedSortingState = this.loadSortingState(),
        sortingColumn,
        sortingOrder;

      if (typeof loadedSortingState != 'undefined') {
        sortingColumn = loadedSortingState.sortColumn;
        sortingOrder = loadedSortingState.sortOrder;

      } else {
        sortingColumn = sortingSettings.column;
        sortingOrder = sortingSettings.sortOrder;
      }

      this.sortByColumn(sortingColumn, sortingOrder);

      this.hot.sort = function() {
        let args = Array.prototype.slice.call(arguments);

        return _this.sortByColumn.apply(_this, args);
      };

      if (typeof this.hot.getSettings().observeChanges == 'undefined') {
        this.enableObserveChangesPlugin();
      }

      if (source == 'afterInit') {
        this.bindColumnSortingAfterClick();

        this.hot.addHook('afterCreateRow', function() {
          _this.afterCreateRow.apply(_this, arguments);
        });
        this.hot.addHook('afterRemoveRow', function() {
          _this.afterRemoveRow.apply(_this, arguments);
        });
        this.hot.addHook('afterLoadData', function() {
          _this.init.apply(_this, arguments);
        });
      }
    } else {
      this.hot.sort = void 0;

      this.hot.removeHook('afterCreateRow', this.afterCreateRow);
      this.hot.removeHook('afterRemoveRow', this.afterRemoveRow);
      this.hot.removeHook('afterLoadData', this.init);
    }
  }

  setSortingColumn(col, order) {
    if (typeof col == 'undefined') {
      this.hot.sortColumn = void 0;
      this.hot.sortOrder = void 0;

      return;
    } else if (this.hot.sortColumn === col && typeof order == 'undefined') {
      this.hot.sortOrder = !this.hot.sortOrder;
    } else {
      this.hot.sortOrder = typeof order != 'undefined' ? order : true;
    }

    this.hot.sortColumn = col;
  }

  sortByColumn(col, order) {
    this.setSortingColumn(col, order);

    if (typeof this.hot.sortColumn == 'undefined') {
      return;
    }

    Handsontable.hooks.run(this.hot, 'beforeColumnSort', this.hot.sortColumn, this.hot.sortOrder);

    this.sort();
    this.hot.render();

    this.saveSortingState();

    Handsontable.hooks.run(this.hot, 'afterColumnSort', this.hot.sortColumn, this.hot.sortOrder);
  }

  saveSortingState() {
    let sortingState = {};

    if (typeof this.hot.sortColumn != 'undefined') {
      sortingState.sortColumn = this.hot.sortColumn;
    }

    if (typeof this.hot.sortOrder != 'undefined') {
      sortingState.sortOrder = this.hot.sortOrder;
    }

    if (sortingState.hasOwnProperty('sortColumn') || sortingState.hasOwnProperty('sortOrder')) {
      Handsontable.hooks.run(this.hot, 'persistentStateSave', 'columnSorting', sortingState);
    }

  }

  loadSortingState() {
    let storedState = {};
    Handsontable.hooks.run(this.hot, 'persistentStateLoad', 'columnSorting', storedState);

    return storedState.value;
  }

  bindColumnSortingAfterClick() {
    let eventManager = eventManagerObject(this.hot),
      _this = this;

    eventManager.addEventListener(this.hot.rootElement, 'click', function(e) {
      if (dom.hasClass(e.target, 'columnSorting')) {
        let col = getColumn(e.target);
        _this.sortByColumn(col);
      }
    });

    function countRowHeaders() {
      let THs = _this.hot.view.TBODY.querySelector('tr').querySelectorAll('th');
      return THs.length;
    }

    function getColumn(target) {
      let TH = dom.closest(target, 'TH');
      return dom.index(TH) - countRowHeaders();
    }
  }

  enableObserveChangesPlugin() {
    let _this = this;

    this.hot._registerTimeout(
      setTimeout(function() {
        _this.hot.updateSettings({
          observeChanges: true
        });
      }, 0));
  }

  defaultSort(sortOrder) {
    return function(a, b) {
      if (typeof a[1] == "string") {
        a[1] = a[1].toLowerCase();
      }
      if (typeof b[1] == "string") {
        b[1] = b[1].toLowerCase();
      }

      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null || a[1] === "") {
        return 1;
      }
      if (b[1] === null || b[1] === "") {
        return -1;
      }
      if (a[1] < b[1]) {
        return sortOrder ? -1 : 1;
      }
      if (a[1] > b[1]) {
        return sortOrder ? 1 : -1;
      }
      return 0;
    };
  }

  dateSort(sortOrder) {
    return function(a, b) {
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

      if (aDate < bDate) {
        return sortOrder ? -1 : 1;
      }
      if (aDate > bDate) {
        return sortOrder ? 1 : -1;
      }

      return 0;
    };
  }

  sort() {
    if (typeof this.hot.sortOrder == 'undefined') {
      return;
    }

    let colMeta,
      sortFunction;

    this.hot.sortingEnabled = false; //this is required by translateRow plugin hook
    this.hot.sortIndex.length = 0;

    var colOffset = this.hot.colOffset();
    for (var i = 0, ilen = this.hot.countRows() - this.hot.getSettings()['minSpareRows']; i < ilen; i++) {
      this.hot.sortIndex.push([i, this.hot.getDataAtCell(i, this.hot.sortColumn + colOffset)]);
    }

    colMeta = this.hot.getCellMeta(0, this.hot.sortColumn);

    switch (colMeta.type) {
      case 'date':
        sortFunction = this.dateSort;
        break;
      default:
        sortFunction = this.defaultSort;
    }

    this.hot.sortIndex.sort(sortFunction(this.hot.sortOrder));

    //Append spareRows
    for (var i = this.hot.sortIndex.length; i < this.hot.countRows(); i++) {
      this.hot.sortIndex.push([i, this.hot.getDataAtCell(i, this.hot.sortColumn + colOffset)]);
    }

    this.hot.sortingEnabled = true; //this is required by translateRow plugin hook
  }

  translateRow(row) {
    if (this.hot.sortingEnabled && this.hot.sortIndex && this.hot.sortIndex.length && this.hot.sortIndex[row]) {
      return this.hot.sortIndex[row][0];
    }

    return row;
  }

  untranslateRow(row) {
    if (this.hot.sortingEnabled && this.hot.sortIndex && this.hot.sortIndex.length) {
      for (var i = 0; i < this.hot.sortIndex.length; i++) {
        if (this.hot.sortIndex[i][0] == row) {
          return i;
        }
      }
    }
  }

  getColHeader(col, TH) {
    if (this.hot.getSettings().columnSorting && col >= 0) {
      dom.addClass(TH.querySelector('.colHeader'), 'columnSorting');
    }
  }

  isSorted() {
    return typeof this.hot.sortColumn != 'undefined';
  }

  afterCreateRow(index, amount) {
    if (!this.isSorted()) {
      return;
    }

    for (var i = 0; i < this.hot.sortIndex.length; i++) {
      if (this.hot.sortIndex[i][0] >= index) {
        this.hot.sortIndex[i][0] += amount;
      }
    }

    for (var i = 0; i < amount; i++) {
      this.hot.sortIndex.splice(index + i, 0, [index + i, this.hot.getData()[index + i][this.hot.sortColumn + this.hot.colOffset()]]);
    }

    this.saveSortingState();
  }

  afterRemoveRow(index, amount) {
    if (!this.isSorted()) {
      return;
    }

    let physicalRemovedIndex = this.translateRow(index);

    this.hot.sortIndex.splice(index, amount);

    for (var i = 0; i < this.hot.sortIndex.length; i++) {
      if (this.hot.sortIndex[i][0] > physicalRemovedIndex) {
        this.hot.sortIndex[i][0] -= amount;
      }
    }

    this.saveSortingState();
  }

  afterChangeSort(changes /*, source*/) {
    let sortColumnChanged = false,
      selection = {},
      _this = this;

    if (!changes) {
      return;
    }

    for (var i = 0; i < changes.length; i++) {
      if (changes[i][1] == this.hot.sortColumn) {
        sortColumnChanged = true;
        selection.row = this.translateRow(changes[i][0]);
        selection.col = changes[i][1];
        break;
      }
    }

    if (sortColumnChanged) {
      this.hot._registerTimeout(setTimeout(function() {
        _this.sort();
        _this.hot.render();
        _this.hot.selectCell(this.untranslateRow(selection.row), selection.col);
      }, 0));
    }
  }

}

export default ColumnSorting;

registerPlugin('columnSorting', ColumnSorting);
