
import * as dom from './../../../dom.js';


/**
 * @class WalkontableSettings
 */
class WalkontableSettings {
  /**
   * @param {Walkontable} wotInstance
   * @param {Object} settings
   */
  constructor(wotInstance, settings) {
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

      //data source
      data: void 0,
      fixedColumnsLeft: 0,
      fixedRowsTop: 0,
      // this must be array of functions: [function (row, TH) {}]
      rowHeaders: function() {
        return [];
      },
      // this must be array of functions: [function (column, TH) {}]
      columnHeaders: function() {
        return [];
      },
      totalRows: void 0,
      totalColumns: void 0,
      cellRenderer: (row, column, TD) => {
        let cellData = this.getSetting('data', row, column);

        dom.fastInnerText(TD, cellData === void 0 || cellData === null ? '' : cellData);
      },
      // columnWidth: 50,
      columnWidth: function(col) {
        return; //return undefined means use default size for the rendered cell content
      },
      rowHeight: function(row) {
        return; //return undefined means use default size for the rendered cell content
      },
      defaultRowHeight: 23,
      defaultColumnWidth: 50,
      selections: null,
      hideBorderOnMouseDownOver: false,
      viewportRowCalculatorOverride: null,
      viewportColumnCalculatorOverride: null,

      //callbacks
      onCellMouseDown: null,
      onCellMouseOver: null,
      //    onCellMouseOut: null,
      onCellDblClick: null,
      onCellCornerMouseDown: null,
      onCellCornerDblClick: null,
      beforeDraw: null,
      onDraw: null,
      onBeforeDrawBorders: null,
      onScrollVertically: null,
      onScrollHorizontally: null,
      onBeforeTouchScroll: null,
      onAfterMomentumScroll: null,

      //constants
      scrollbarWidth: 10,
      scrollbarHeight: 10,

      renderAllRows: false,
      groups: false
    };
    // reference to settings
    this.settings = {};

    for (let i in this.defaults) {
      if (this.defaults.hasOwnProperty(i)) {
        if (settings[i] !== void 0) {
          this.settings[i] = settings[i];

        } else if (this.defaults[i] === void 0) {
          throw new Error('A required setting "' + i + '" was not provided');

        } else {
          this.settings[i] = this.defaults[i];
        }
      }
    }
  }

  /**
   * Update settings
   *
   * @param {Object} settings
   * @param {*} value
   * @returns {Walkontable}
   */
  update(settings, value) {
    if (value === void 0) { //settings is object
      for (let i in settings) {
        if (settings.hasOwnProperty(i)) {
          this.settings[i] = settings[i];
        }
      }
    } else { //if value is defined then settings is the key
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
  getSetting(key, param1, param2, param3, param4) {
    if (typeof this.settings[key] === 'function') {
      // this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
      return this.settings[key](param1, param2, param3, param4);

    } else if (param1 !== void 0 && Array.isArray(this.settings[key])) {
      // perhaps this can be removed, it is only used in tests
      return this.settings[key][param1];

    } else {
      return this.settings[key];
    }
  }

  /**
   * Checks if setting exists
   *
   * @param {Boolean} key
   * @returns {Boolean}
   */
  has(key) {
    return !!this.settings[key];
  }
}

export {WalkontableSettings};

window.WalkontableSettings = WalkontableSettings;
