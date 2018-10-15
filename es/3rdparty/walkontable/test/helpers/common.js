function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

export function sleep() {
  var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;

  return Promise.resolve({
    then: function then(resolve) {
      if (delay === 0) {
        setImmediate(resolve);
      } else {
        setTimeout(resolve, delay);
      }
    }
  });
}

var currentSpec = void 0;

export function spec() {
  return currentSpec;
}

export function createDataArray() {
  var rows = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
  var cols = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

  spec().data = [];

  for (var i = 0; i < rows; i++) {
    var row = [];

    if (cols > 0) {
      row.push(i);

      for (var j = 0; j < cols - 1; j++) {
        /* eslint-disable no-mixed-operators */
        /* eslint-disable no-bitwise */
        row.push(String.fromCharCode(65 + j % 20).toLowerCase() + (j / 20 | 0 || '')); // | 0 is parseInt - see http://jsperf.com/math-floor-vs-math-round-vs-parseint/18
      }
    }
    spec().data.push(row);
  }
}

export function getData(row, col) {
  return spec().data[row][col];
}

export function getTotalRows() {
  return spec().data.length;
}

export function getTotalColumns() {
  return spec().data[0] ? spec().data[0].length : 0;
}

beforeEach(function () {
  currentSpec = this;

  var matchers = {
    toBeInArray: function toBeInArray() {
      return {
        compare: function compare(actual, expected) {
          return {
            pass: Array.isArray(expected) && expected.indexOf(actual) > -1
          };
        }
      };
    },
    toBeFunction: function toBeFunction() {
      return {
        compare: function compare(actual) {
          return {
            pass: typeof actual === 'function'
          };
        }
      };
    },
    toBeAroundValue: function toBeAroundValue() {
      return {
        compare: function compare(actual, expected) {
          var diff = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

          var pass = actual >= expected - diff && actual <= expected + diff;
          var message = 'Expected ' + actual + ' to be around ' + expected + ' (between ' + (expected - diff) + ' and ' + (expected + diff) + ')';

          if (!pass) {
            message = 'Expected ' + actual + ' NOT to be around ' + expected + ' (between ' + (expected - diff) + ' and ' + (expected + diff) + ')';
          }

          return {
            pass: pass,
            message: message
          };
        }
      };
    }
  };

  jasmine.addMatchers(matchers);
});

afterEach(function () {
  window.scrollTo(0, 0);
});

export function getTableWidth(elem) {
  return $(elem).outerWidth() || $(elem).find('tbody').outerWidth() || $(elem).find('thead').outerWidth(); // IE8 reports 0 as <table> offsetWidth
}

export function range(start, end) {
  if (!arguments.length) {
    return [];
  }

  var from = start;
  var to = end;

  if (arguments.length === 1) {
    to = from;
    from = 0;
  }

  if (to > from) {
    from = [to, to = from][0]; // one-liner for swapping two values
  }

  var result = [];

  while (to < from) {
    to += 1;
    result.push(to);
  }

  return result;
}

/**
 * Creates the selection controller necessary for the Walkontable to make selections typical for Handsontable such as
 * current selection, area selection, selection for autofill and custom borders.
 *
 * @param {Object} selections An object with custom selection instances.
 * @returns {Object} Selection controller.
 */
export function createSelectionController() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      current = _ref.current,
      area = _ref.area,
      fill = _ref.fill,
      custom = _ref.custom;

  var currentCtrl = current || new Walkontable.Selection({
    className: 'current',
    border: {
      width: 2,
      color: '#4b89ff'
    }
  });
  var areaCtrl = area || new Walkontable.Selection({
    className: 'area',
    border: {
      width: 1,
      color: '#4b89ff'
    }
  });
  var fillCtrl = fill || new Walkontable.Selection({
    className: 'fill',
    border: {
      width: 1,
      color: '#ff0000'
    }
  });
  var customCtrl = custom || [];

  return _defineProperty({
    getCell: function getCell() {
      return currentCtrl;
    },
    createOrGetArea: function createOrGetArea() {
      return areaCtrl;
    },
    getAreas: function getAreas() {
      return [areaCtrl];
    },
    getFill: function getFill() {
      return fillCtrl;
    }
  }, Symbol.iterator, function () {
    return [fillCtrl, currentCtrl, areaCtrl].concat(_toConsumableArray(customCtrl))[Symbol.iterator]();
  });
}

export function getTableTopClone() {
  return $('.ht_clone_top');
}

export function getTableLeftClone() {
  return $('.ht_clone_left');
}

export function getTableCornerClone() {
  return $('.ht_clone_top_left_corner');
}

export function createSpreadsheetData(rows, columns) {
  var _rows = [];
  var i = void 0;
  var j = void 0;

  for (i = 0; i < rows; i++) {
    var row = [];

    for (j = 0; j < columns; j++) {
      row.push(spreadsheetColumnLabel(j) + (i + 1));
    }
    _rows.push(row);
  }

  return _rows;
}

var COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc.
 *
 * @param {Number} index Column index.
 * @returns {String}
 */
export function spreadsheetColumnLabel(index) {
  var dividend = index + 1;
  var columnLabel = '';
  var modulo = void 0;

  while (dividend > 0) {
    modulo = (dividend - 1) % COLUMN_LABEL_BASE_LENGTH;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / COLUMN_LABEL_BASE_LENGTH, 10);
  }

  return columnLabel;
}

export function walkontableCalculateScrollbarWidth() {
  var inner = document.createElement('div');
  inner.style.height = '200px';
  inner.style.width = '100%';

  var outer = document.createElement('div');
  outer.style.boxSizing = 'content-box';
  outer.style.height = '150px';
  outer.style.left = '0px';
  outer.style.overflow = 'hidden';
  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.width = '200px';
  outer.style.visibility = 'hidden';
  outer.appendChild(inner);

  (document.body || document.documentElement).appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 === w2) {
    w2 = outer.clientWidth;
  }

  (document.body || document.documentElement).removeChild(outer);

  return w1 - w2;
}

var cachedScrollbarWidth = void 0;

export function getScrollbarWidth() {
  if (cachedScrollbarWidth === void 0) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth();
  }

  return cachedScrollbarWidth;
}