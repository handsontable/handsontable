import * as dom from './../../dom.js';
import {eventManager as eventManagerObject} from './../../eventManager.js';
import BasePlugin from './../_base.js';
import {registerPlugin} from './../../plugins.js';

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
    this.sortIndicators = [];

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
  }

  /**
   * Initial setup
   * @param source {string} Caller info (afterInit/afterUpdateSettings)
   */
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

  /**
   * Set sorted column and order info
   * @param col {number} sorted column
   * @param order {boolean|undefined} sorting order
   */
  setSortingColumn(col, order) {
    if (typeof col == 'undefined') {
      this.hot.sortColumn = void 0;
      this.hot.sortOrder = void 0;

      return;
    } else if (this.hot.sortColumn === col && typeof order == 'undefined') {
      if (this.hot.sortOrder === false) {
        this.hot.sortOrder = void 0;
      } else {
        this.hot.sortOrder = !this.hot.sortOrder;
      }

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

  /**
   * Save the sorting state
   */
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

  /**
   * Load the sorting state
   * @returns {*} previousle saved sorting state
   */
  loadSortingState() {
    let storedState = {};
    Handsontable.hooks.run(this.hot, 'persistentStateLoad', 'columnSorting', storedState);

    return storedState.value;
  }

  /**
   * Bind the events for column sorting
   */
  bindColumnSortingAfterClick() {
    let eventManager = eventManagerObject(this.hot),
      _this = this;

    eventManager.addEventListener(this.hot.rootElement, 'click', function(e) {
      if (dom.hasClass(e.target, 'columnSorting')) {
        let col = getColumn(e.target);

        if (col !== this.lastSortedColumn) {
          _this.sortOrderClass = 'ascending';
        } else {
          switch (_this.hot.sortOrder) {
            case void 0:
              _this.sortOrderClass = 'ascending';
              break;
            case true:
              _this.sortOrderClass = 'descending';
              break;
            case false:
              _this.sortOrderClass = void 0;
          }
        }

        this.lastSortedColumn = col;

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

  /**
   * Default sorting algorithm
   * @param sortOrder
   * @returns {Function} the comparing function
   */
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

  /**
   * Date sorting algorithm
   * @param sortOrder
   * @returns {Function} The compare function
   */
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
    for (var i = 0, ilen = this.hot.countRows() - this.hot.getSettings().minSpareRows; i < ilen; i++) {
      this.hot.sortIndex.push([i, this.hot.getDataAtCell(i, this.hot.sortColumn + colOffset)]);
    }

    colMeta = this.hot.getCellMeta(0, this.hot.sortColumn);

    this.sortIndicators[this.hot.sortColumn] = colMeta.sortIndicator;

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

  /**
   * `modifyRow` hook callback. Translates physical row index to the sorted row index
   * @param row {number} row index
   * @returns {number} sorted row index
   */
  translateRow(row) {
    if (this.hot.sortingEnabled && (typeof this.hot.sortOrder !== 'undefined') && this.hot.sortIndex && this.hot.sortIndex.length && this.hot.sortIndex[row]) {
      return this.hot.sortIndex[row][0];
    }

    return row;
  }

  /**
   * Translates sorted row index to physical row index
   * @param row {number} sorted row index
   * @returns {number} physical row index
   */
  untranslateRow(row) {
    if (this.hot.sortingEnabled && this.hot.sortIndex && this.hot.sortIndex.length) {
      for (var i = 0; i < this.hot.sortIndex.length; i++) {
        if (this.hot.sortIndex[i][0] == row) {
          return i;
        }
      }
    }
  }

  /**
   * `afterGetColHeader` callback. Adds column sorting css classes to clickable headers
   * @param col
   * @param TH
   */
  getColHeader(col, TH) {
    let headerLink = TH.querySelector('.colHeader');

    if (this.hot.getSettings().columnSorting && col >= 0) {
      dom.addClass(headerLink, 'columnSorting');
    }
    dom.removeClass(headerLink, 'descending');
    dom.removeClass(headerLink, 'ascending');

    if (this.sortIndicators[col]) {
      if (col === this.hot.sortColumn) {
        if (this.sortOrderClass === 'ascending') {
          dom.addClass(headerLink, 'ascending');

        } else if (this.sortOrderClass === 'descending') {
          dom.addClass(headerLink, 'descending');
        }
      }
    }
  }

  /**
   * Check if any column is in a sorted state
   * @returns {boolean}
   */
  isSorted() {
    return typeof this.hot.sortColumn != 'undefined';
  }

  /**
   * `afterCreateRow` callback. Updates the sorting state after a row have been created
   * @param index
   * @param amount
   */
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

  /**
   * `afterRemoveRow` hook callback.
   * @param index
   * @param amount
   */
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

}

export default ColumnSorting;

registerPlugin('columnSorting', ColumnSorting);
