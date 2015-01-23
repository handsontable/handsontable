function WalkontableSettings(instance, settings) {
  var that = this;
  this.instance = instance;

  //default settings. void 0 means it is required, null means it can be empty
  this.defaults = {
    table: void 0,
    debug: false, //shows WalkontableDebugOverlay

    //presentation mode
    stretchH: 'none', //values: all, last, none
    currentRowClassName: null,
    currentColumnClassName: null,

    //data source
    data: void 0,
    fixedColumnsLeft: 0,
    fixedRowsTop: 0,
    rowHeaders: function () {
      return [];
    }, //this must be array of functions: [function (row, TH) {}]
    columnHeaders: function () {
      return [];
    }, //this must be array of functions: [function (column, TH) {}]
    totalRows: void 0,
    totalColumns: void 0,
    cellRenderer: function (row, column, TD) {
      var cellData = that.getSetting('data', row, column);
      Handsontable.Dom.fastInnerText(TD, cellData === void 0 || cellData === null ? '' : cellData);
    },
    //columnWidth: 50,
    columnWidth: function (col) {
      return; //return undefined means use default size for the rendered cell content
    },
    rowHeight: function (row) {
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

  //reference to settings
  this.settings = {};
  for (var i in this.defaults) {
    if (this.defaults.hasOwnProperty(i)) {
      if (settings[i] !== void 0) {
        this.settings[i] = settings[i];
      }
      else if (this.defaults[i] === void 0) {
        throw new Error('A required setting "' + i + '" was not provided');
      }
      else {
        this.settings[i] = this.defaults[i];
      }
    }
  }
}

/**
 * generic methods
 */

WalkontableSettings.prototype.update = function (settings, value) {
  if (value === void 0) { //settings is object
    for (var i in settings) {
      if (settings.hasOwnProperty(i)) {
        this.settings[i] = settings[i];
      }
    }
  }
  else { //if value is defined then settings is the key
    this.settings[settings] = value;
  }
  return this.instance;
};

WalkontableSettings.prototype.getSetting = function (key, param1, param2, param3, param4) {
  if (typeof this.settings[key] === 'function') {
    return this.settings[key](param1, param2, param3, param4); //this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  }
  else if (param1 !== void 0 && Array.isArray(this.settings[key])) { //perhaps this can be removed, it is only used in tests
    return this.settings[key][param1];
  }
  else {
    return this.settings[key];
  }
};

WalkontableSettings.prototype.has = function (key) {
  return !!this.settings[key];
};
