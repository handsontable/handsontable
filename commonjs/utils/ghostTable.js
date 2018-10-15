'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _element = require('./../helpers/dom/element');

var _array = require('./../helpers/array');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class GhostTable
 * @util
 */
var GhostTable = function () {
  function GhostTable(hotInstance) {
    _classCallCheck(this, GhostTable);

    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = hotInstance;
    /**
     * Container element where every table will be injected.
     *
     * @type {HTMLElement|null}
     */
    this.container = null;
    /**
     * Flag which determine is table was injected to DOM.
     *
     * @type {Boolean}
     */
    this.injected = false;
    /**
     * Added rows collection.
     *
     * @type {Array}
     */
    this.rows = [];
    /**
     * Added columns collection.
     *
     * @type {Array}
     */
    this.columns = [];
    /**
     * Samples prepared for calculations.
     *
     * @type {Map}
     * @default {null}
     */
    this.samples = null;
    /**
     * Ghost table settings.
     *
     * @type {Object}
     * @default {Object}
     */
    this.settings = {
      useHeaders: true
    };
  }

  /**
   * Add row.
   *
   * @param {Number} row Row index.
   * @param {Map} samples Samples Map object.
   */


  _createClass(GhostTable, [{
    key: 'addRow',
    value: function addRow(row, samples) {
      if (this.columns.length) {
        throw new Error('Doesn\'t support multi-dimensional table');
      }
      if (!this.rows.length) {
        this.container = this.createContainer(this.hot.rootElement.className);
      }
      var rowObject = { row: row };
      this.rows.push(rowObject);

      this.samples = samples;
      this.table = this.createTable(this.hot.table.className);
      this.table.colGroup.appendChild(this.createColGroupsCol());
      this.table.tr.appendChild(this.createRow(row));
      this.container.container.appendChild(this.table.fragment);

      rowObject.table = this.table.table;
    }

    /**
     * Add a row consisting of the column headers.
     */

  }, {
    key: 'addColumnHeadersRow',
    value: function addColumnHeadersRow(samples) {
      var colHeader = this.hot.getColHeader(0);

      if (colHeader !== null && colHeader !== void 0) {
        var rowObject = { row: -1 };

        this.rows.push(rowObject);

        this.container = this.createContainer(this.hot.rootElement.className);
        this.samples = samples;
        this.table = this.createTable(this.hot.table.className);

        this.table.colGroup.appendChild(this.createColGroupsCol());
        this.table.tHead.appendChild(this.createColumnHeadersRow());
        this.container.container.appendChild(this.table.fragment);

        rowObject.table = this.table.table;
      }
    }

    /**
     * Add column.
     *
     * @param {Number} column Column index.
     * @param {Map} samples Samples Map object.
     */

  }, {
    key: 'addColumn',
    value: function addColumn(column, samples) {
      if (this.rows.length) {
        throw new Error('Doesn\'t support multi-dimensional table');
      }
      if (!this.columns.length) {
        this.container = this.createContainer(this.hot.rootElement.className);
      }
      var columnObject = { col: column };
      this.columns.push(columnObject);

      this.samples = samples;
      this.table = this.createTable(this.hot.table.className);

      if (this.getSetting('useHeaders') && this.hot.getColHeader(column) !== null) {
        this.hot.view.appendColHeader(column, this.table.th);
      }
      this.table.tBody.appendChild(this.createCol(column));
      this.container.container.appendChild(this.table.fragment);

      columnObject.table = this.table.table;
    }

    /**
     * Get calculated heights.
     *
     * @param {Function} callback Callback which will be fired for each calculated row.
     */

  }, {
    key: 'getHeights',
    value: function getHeights(callback) {
      if (!this.injected) {
        this.injectTable();
      }
      (0, _array.arrayEach)(this.rows, function (row) {
        // -1 <- reduce border-top from table
        callback(row.row, (0, _element.outerHeight)(row.table) - 1);
      });
    }

    /**
     * Get calculated widths.
     *
     * @param {Function} callback Callback which will be fired for each calculated column.
     */

  }, {
    key: 'getWidths',
    value: function getWidths(callback) {
      if (!this.injected) {
        this.injectTable();
      }
      (0, _array.arrayEach)(this.columns, function (column) {
        callback(column.col, (0, _element.outerWidth)(column.table));
      });
    }

    /**
     * Set the Ghost Table settings to the provided object.
     *
     * @param {Object} settings New Ghost Table Settings
     */

  }, {
    key: 'setSettings',
    value: function setSettings(settings) {
      this.settings = settings;
    }

    /**
     * Set a single setting of the Ghost Table.
     *
     * @param {String} name Setting name.
     * @param {*} value Setting value.
     */

  }, {
    key: 'setSetting',
    value: function setSetting(name, value) {
      if (!this.settings) {
        this.settings = {};
      }

      this.settings[name] = value;
    }

    /**
     * Get the Ghost Table settings.
     *
     * @returns {Object|null}
     */

  }, {
    key: 'getSettings',
    value: function getSettings() {
      return this.settings;
    }

    /**
     * Get a single Ghost Table setting.
     *
     * @param {String} name
     * @returns {Boolean|null}
     */

  }, {
    key: 'getSetting',
    value: function getSetting(name) {
      if (this.settings) {
        return this.settings[name];
      }
      return null;
    }

    /**
     * Create colgroup col elements.
     *
     * @returns {DocumentFragment}
     */

  }, {
    key: 'createColGroupsCol',
    value: function createColGroupsCol() {
      var _this = this;

      var d = document;
      var fragment = d.createDocumentFragment();

      if (this.hot.hasRowHeaders()) {
        fragment.appendChild(this.createColElement(-1));
      }

      this.samples.forEach(function (sample) {
        (0, _array.arrayEach)(sample.strings, function (string) {
          fragment.appendChild(_this.createColElement(string.col));
        });
      });

      return fragment;
    }

    /**
     * Create table row element.
     *
     * @param {Number} row Row index.
     * @returns {DocumentFragment} Returns created table row elements.
     */

  }, {
    key: 'createRow',
    value: function createRow(row) {
      var _this2 = this;

      var d = document;
      var fragment = d.createDocumentFragment();
      var th = d.createElement('th');

      if (this.hot.hasRowHeaders()) {
        this.hot.view.appendRowHeader(row, th);

        fragment.appendChild(th);
      }

      this.samples.forEach(function (sample) {
        (0, _array.arrayEach)(sample.strings, function (string) {
          var column = string.col;
          var cellProperties = _this2.hot.getCellMeta(row, column);

          cellProperties.col = column;
          cellProperties.row = row;

          var renderer = _this2.hot.getCellRenderer(cellProperties);
          var td = d.createElement('td');

          renderer(_this2.hot, td, row, column, _this2.hot.colToProp(column), string.value, cellProperties);
          fragment.appendChild(td);
        });
      });

      return fragment;
    }
  }, {
    key: 'createColumnHeadersRow',
    value: function createColumnHeadersRow() {
      var _this3 = this;

      var d = document;
      var fragment = d.createDocumentFragment();

      if (this.hot.hasRowHeaders()) {
        var th = d.createElement('th');
        this.hot.view.appendColHeader(-1, th);
        fragment.appendChild(th);
      }

      this.samples.forEach(function (sample) {
        (0, _array.arrayEach)(sample.strings, function (string) {
          var column = string.col;

          var th = d.createElement('th');

          _this3.hot.view.appendColHeader(column, th);
          fragment.appendChild(th);
        });
      });

      return fragment;
    }

    /**
     * Create table column elements.
     *
     * @param {Number} column Column index.
     * @returns {DocumentFragment} Returns created column table column elements.
     */

  }, {
    key: 'createCol',
    value: function createCol(column) {
      var _this4 = this;

      var d = document;
      var fragment = d.createDocumentFragment();

      this.samples.forEach(function (sample) {
        (0, _array.arrayEach)(sample.strings, function (string) {
          var row = string.row;
          var cellProperties = _this4.hot.getCellMeta(row, column);

          cellProperties.col = column;
          cellProperties.row = row;

          var renderer = _this4.hot.getCellRenderer(cellProperties);
          var td = d.createElement('td');
          var tr = d.createElement('tr');

          renderer(_this4.hot, td, row, column, _this4.hot.colToProp(column), string.value, cellProperties);
          tr.appendChild(td);
          fragment.appendChild(tr);
        });
      });

      return fragment;
    }

    /**
     * Remove table from document and reset internal state.
     */

  }, {
    key: 'clean',
    value: function clean() {
      this.rows.length = 0;
      this.rows[-1] = void 0;
      this.columns.length = 0;

      if (this.samples) {
        this.samples.clear();
      }
      this.samples = null;
      this.removeTable();
    }

    /**
     * Inject generated table into document.
     *
     * @param {HTMLElement} [parent=null]
     */

  }, {
    key: 'injectTable',
    value: function injectTable() {
      var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (!this.injected) {
        (parent || this.hot.rootElement).appendChild(this.container.fragment);
        this.injected = true;
      }
    }

    /**
     * Remove table from document.
     */

  }, {
    key: 'removeTable',
    value: function removeTable() {
      if (this.injected && this.container.container.parentNode) {
        this.container.container.parentNode.removeChild(this.container.container);
        this.container = null;
        this.injected = false;
      }
    }

    /**
     * Create col element.
     *
     * @param {Number} column Column index.
     * @returns {HTMLElement}
     */

  }, {
    key: 'createColElement',
    value: function createColElement(column) {
      var d = document;
      var col = d.createElement('col');

      col.style.width = this.hot.view.wt.wtTable.getStretchedColumnWidth(column) + 'px';

      return col;
    }

    /**
     * Create table element.
     *
     * @param {String} className
     * @returns {Object}
     */

  }, {
    key: 'createTable',
    value: function createTable() {
      var className = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var d = document;
      var fragment = d.createDocumentFragment();
      var table = d.createElement('table');
      var tHead = d.createElement('thead');
      var tBody = d.createElement('tbody');
      var colGroup = d.createElement('colgroup');
      var tr = d.createElement('tr');
      var th = d.createElement('th');

      if (this.isVertical()) {
        table.appendChild(colGroup);
      }
      if (this.isHorizontal()) {
        tr.appendChild(th);
        tHead.appendChild(tr);
        table.style.tableLayout = 'auto';
        table.style.width = 'auto';
      }
      table.appendChild(tHead);

      if (this.isVertical()) {
        tBody.appendChild(tr);
      }
      table.appendChild(tBody);
      (0, _element.addClass)(table, className);
      fragment.appendChild(table);

      return { fragment: fragment, table: table, tHead: tHead, tBody: tBody, colGroup: colGroup, tr: tr, th: th };
    }

    /**
     * Create container for tables.
     *
     * @param {String} className
     * @returns {Object}
     */

  }, {
    key: 'createContainer',
    value: function createContainer() {
      var className = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var d = document;
      var fragment = d.createDocumentFragment();
      var container = d.createElement('div');
      var containerClassName = 'htGhostTable htAutoSize ' + className.trim();

      (0, _element.addClass)(container, containerClassName);
      fragment.appendChild(container);

      return { fragment: fragment, container: container };
    }

    /**
     * Checks if table is raised vertically (checking rows).
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isVertical',
    value: function isVertical() {
      return !!(this.rows.length && !this.columns.length);
    }

    /**
     * Checks if table is raised horizontally (checking columns).
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isHorizontal',
    value: function isHorizontal() {
      return !!(this.columns.length && !this.rows.length);
    }
  }]);

  return GhostTable;
}();

exports.default = GhostTable;