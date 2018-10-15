'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _element = require('./../../../helpers/dom/element');

var _object = require('./../../../helpers/object');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Settings
 */
var Settings = function () {
  /**
   * @param {Walkontable} wotInstance
   * @param {Object} settings
   */
  function Settings(wotInstance, settings) {
    var _this = this;

    _classCallCheck(this, Settings);

    this.wot = wotInstance;

    // legacy support
    this.instance = wotInstance;

    // default settings. void 0 means it is required, null means it can be empty
    this.defaults = {
      table: void 0,
      debug: false, // shows WalkontableDebugOverlay

      // presentation mode
      externalRowCalculator: false,
      stretchH: 'none', // values: all, last, none
      currentRowClassName: null,
      currentColumnClassName: null,
      preventOverflow: function preventOverflow() {
        return false;
      },


      // data source
      data: void 0,
      freezeOverlays: false,
      fixedColumnsLeft: 0,
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
      minSpareRows: 0,

      // this must be array of functions: [function (row, TH) {}]
      rowHeaders: function rowHeaders() {
        return [];
      },


      // this must be array of functions: [function (column, TH) {}]
      columnHeaders: function columnHeaders() {
        return [];
      },

      totalRows: void 0,
      totalColumns: void 0,
      cellRenderer: function cellRenderer(row, column, TD) {
        var cellData = _this.getSetting('data', row, column);

        (0, _element.fastInnerText)(TD, cellData === void 0 || cellData === null ? '' : cellData);
      },

      // columnWidth: 50,
      columnWidth: function columnWidth() {
        // return undefined means use default size for the rendered cell content
      },
      rowHeight: function rowHeight() {
        // return undefined means use default size for the rendered cell content
      },

      defaultRowHeight: 23,
      defaultColumnWidth: 50,
      selections: null,
      hideBorderOnMouseDownOver: false,
      viewportRowCalculatorOverride: null,
      viewportColumnCalculatorOverride: null,

      // callbacks
      onCellMouseDown: null,
      onCellContextMenu: null,
      onCellMouseOver: null,
      onCellMouseOut: null,
      onCellMouseUp: null,

      //    onCellMouseOut: null,
      onCellDblClick: null,
      onCellCornerMouseDown: null,
      onCellCornerDblClick: null,
      beforeDraw: null,
      onDraw: null,
      onBeforeRemoveCellClassNames: null,
      onAfterDrawSelection: null,
      onBeforeDrawBorders: null,
      onScrollVertically: null,
      onScrollHorizontally: null,
      onBeforeTouchScroll: null,
      onAfterMomentumScroll: null,
      onBeforeStretchingColumnWidth: function onBeforeStretchingColumnWidth(width) {
        return width;
      },
      onModifyRowHeaderWidth: null,
      onModifyGetCellCoords: null,

      // constants
      scrollbarWidth: 10,
      scrollbarHeight: 10,

      renderAllRows: false,
      groups: false,
      rowHeaderWidth: null,
      columnHeaderHeight: null,
      headerClassName: null
    };

    // reference to settings
    this.settings = {};

    (0, _object.objectEach)(this.defaults, function (value, key) {
      if (settings[key] !== void 0) {
        _this.settings[key] = settings[key];
      } else if (value === void 0) {
        throw new Error('A required setting "' + key + '" was not provided');
      } else {
        _this.settings[key] = value;
      }
    });
  }

  /**
   * Update settings
   *
   * @param {Object} settings
   * @param {*} value
   * @returns {Walkontable}
   */


  _createClass(Settings, [{
    key: 'update',
    value: function update(settings, value) {
      var _this2 = this;

      if (value === void 0) {
        // settings is object
        (0, _object.objectEach)(settings, function (settingValue, key) {
          _this2.settings[key] = settingValue;
        });
      } else {
        // if value is defined then settings is the key
        this.settings[settings] = value;
      }
      return this.wot;
    }

    /**
     * Get setting by name
     *
     * @param {String} key
     * @param {*} param1
     * @param {*} param2
     * @param {*} param3
     * @param {*} param4
     * @returns {*}
     */

  }, {
    key: 'getSetting',
    value: function getSetting(key, param1, param2, param3, param4) {
      if (typeof this.settings[key] === 'function') {
        // this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
        return this.settings[key](param1, param2, param3, param4);
      } else if (param1 !== void 0 && Array.isArray(this.settings[key])) {
        // perhaps this can be removed, it is only used in tests
        return this.settings[key][param1];
      }

      return this.settings[key];
    }

    /**
     * Checks if setting exists
     *
     * @param {Boolean} key
     * @returns {Boolean}
     */

  }, {
    key: 'has',
    value: function has(key) {
      return !!this.settings[key];
    }
  }]);

  return Settings;
}();

exports.default = Settings;