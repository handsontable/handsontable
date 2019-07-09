import { fastInnerText } from './../../../helpers/dom/element';
import { objectEach } from './../../../helpers/object';

/**
 * @class Settings
 */
class Settings {
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
      preventOverflow() {
        return false;
      },
      preventWheel: false,

      // data source
      data: void 0,
      freezeOverlays: false,
      fixedColumnsLeft: 0,
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
      minSpareRows: 0,

      // this must be array of functions: [function (row, TH) {}]
      rowHeaders() {
        return [];
      },

      // this must be array of functions: [function (column, TH) {}]
      columnHeaders() {
        return [];
      },
      totalRows: void 0,
      totalColumns: void 0,
      cellRenderer: (row, column, TD) => {
        const cellData = this.getSetting('data', row, column);

        fastInnerText(TD, cellData === void 0 || cellData === null ? '' : cellData);
      },

      // columnWidth: 50,
      columnWidth() {
        // return undefined means use default size for the rendered cell content
      },
      rowHeight() {
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
      onBeforeStretchingColumnWidth: width => width,
      onModifyRowHeaderWidth: null,
      onModifyGetCellCoords: null,

      onWindowResize: null,

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

    objectEach(this.defaults, (value, key) => {
      if (settings[key] !== void 0) {
        this.settings[key] = settings[key];

      } else if (value === void 0) {
        throw new Error(`A required setting "${key}" was not provided`);

      } else {
        this.settings[key] = value;
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
  update(settings, value) {
    if (value === void 0) { // settings is object
      objectEach(settings, (settingValue, key) => {
        this.settings[key] = settingValue;
      });
    } else { // if value is defined then settings is the key
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

    }

    return this.settings[key];
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

export default Settings;
