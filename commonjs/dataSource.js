'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('./helpers/object');

var _array = require('./helpers/array');

var _number = require('./helpers/number');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class DataSource
 * @private
 */
var DataSource = function () {
  function DataSource(hotInstance) {
    var dataSource = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    _classCallCheck(this, DataSource);

    /**
     * Instance of Handsontable.
     *
     * @type {Handsontable}
     */
    this.hot = hotInstance;
    /**
     * Data source
     *
     * @type {Array}
     */
    this.data = dataSource;
    /**
     * Type of data source.
     *
     * @type {String}
     * @default 'array'
     */
    this.dataType = 'array';

    this.colToProp = function () {};
    this.propToCol = function () {};
  }

  /**
   * Get all data.
   *
   * @param {Boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
   *                                  in another format.
   * @returns {Array}
   */


  _createClass(DataSource, [{
    key: 'getData',
    value: function getData() {
      var toArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var result = this.data;

      if (toArray) {
        result = this.getByRange({ row: 0, col: 0 }, { row: Math.max(this.countRows() - 1, 0), col: Math.max(this.countColumns() - 1, 0) }, true);
      }

      return result;
    }

    /**
     * Set new data source.
     *
     * @param data {Array}
     */

  }, {
    key: 'setData',
    value: function setData(data) {
      this.data = data;
    }

    /**
     * Returns array of column values from the data source. `column` is the index of the row in the data source.
     *
     * @param {Number} column Visual column index.
     * @returns {Array}
     */

  }, {
    key: 'getAtColumn',
    value: function getAtColumn(column) {
      var _this = this;

      var result = [];

      (0, _array.arrayEach)(this.data, function (row) {
        var property = _this.colToProp(column);
        var value = void 0;

        if (typeof property === 'string') {
          value = (0, _object.getProperty)(row, property);
        } else if (typeof property === 'function') {
          value = property(row);
        } else {
          value = row[property];
        }

        result.push(value);
      });

      return result;
    }

    /**
     * Returns a single row of the data (array or object, depending on what you have). `row` is the index of the row in the data source.
     *
     * @param {Number} row Physical row index.
     * @returns {Array|Object}
     */

  }, {
    key: 'getAtRow',
    value: function getAtRow(row) {
      return this.data[row];
    }

    /**
     * Returns a single value from the data.
     *
     * @param {Number} row Physical row index.
     * @param {Number} column Visual column index.
     * @returns {*}
     */

  }, {
    key: 'getAtCell',
    value: function getAtCell(row, column) {
      var result = null;

      var modifyRowData = this.hot.runHooks('modifyRowData', row);

      var dataRow = isNaN(modifyRowData) ? modifyRowData : this.data[row];

      if (dataRow) {
        var prop = this.colToProp(column);

        if (typeof prop === 'string') {
          result = (0, _object.getProperty)(dataRow, prop);
        } else if (typeof prop === 'function') {
          result = prop(this.data.slice(row, row + 1)[0]);
        } else {
          result = dataRow[prop];
        }
      }

      return result;
    }

    /**
     * Returns source data by passed range.
     *
     * @param {Object} start Object with physical `row` and `col` keys (or visual column index, if data type is an array of objects).
     * @param {Object} end Object with physical `row` and `col` keys (or visual column index, if data type is an array of objects).
     * @param {Boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
     *                                  in another format.
     * @returns {Array}
     */

  }, {
    key: 'getByRange',
    value: function getByRange(start, end) {
      var _this2 = this;

      var toArray = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var startRow = Math.min(start.row, end.row);
      var startCol = Math.min(start.col, end.col);
      var endRow = Math.max(start.row, end.row);
      var endCol = Math.max(start.col, end.col);
      var result = [];

      (0, _number.rangeEach)(startRow, endRow, function (currentRow) {
        var row = _this2.getAtRow(currentRow);
        var newRow = void 0;

        if (_this2.dataType === 'array') {
          newRow = row.slice(startCol, endCol + 1);
        } else if (_this2.dataType === 'object') {
          newRow = toArray ? [] : {};

          (0, _number.rangeEach)(startCol, endCol, function (column) {
            var prop = _this2.colToProp(column);

            if (toArray) {
              newRow.push(row[prop]);
            } else {
              newRow[prop] = row[prop];
            }
          });
        }

        result.push(newRow);
      });

      return result;
    }

    /**
     * Count number of rows.
     *
     * @returns {Number}
     */

  }, {
    key: 'countRows',
    value: function countRows() {
      return Array.isArray(this.data) ? this.data.length : 0;
    }

    /**
     * Count number of columns.
     *
     * @returns {Number}
     */

  }, {
    key: 'countColumns',
    value: function countColumns() {
      var result = 0;

      if (Array.isArray(this.data)) {
        if (this.dataType === 'array') {
          result = this.data[0].length;
        } else if (this.dataType === 'object') {
          result = Object.keys(this.data[0]).length;
        }
      }

      return result;
    }

    /**
     * Destroy instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.data = null;
      this.hot = null;
    }
  }]);

  return DataSource;
}();

exports.default = DataSource;