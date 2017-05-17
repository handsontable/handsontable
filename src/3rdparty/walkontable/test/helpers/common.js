export function spec() {
  return currentSpec;
};

export function createDataArray(rows, cols) {
  spec().data = [];
  rows = typeof rows === 'number' ? rows : 100;
  cols = typeof cols === 'number' ? cols : 4;

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
};

export function getData(row, col) {
  return spec().data[row][col];
};

export function getTotalRows() {
  return spec().data.length;
};

export function getTotalColumns() {
  return spec().data[0] ? spec().data[0].length : 0;
};

var currentSpec;

beforeEach(function() {
  currentSpec = this;

  var matchers = {
    toBeInArray() {
      return {
        compare(actual, expected) {
          return {
            pass: Array.isArray(expected) && expected.indexOf(actual) > -1
          };
        }
      };
    },
    toBeFunction() {
      return {
        compare(actual, expected) {
          return {
            pass: typeof actual === 'function'
          };
        }
      };
    },
    toBeAroundValue() {
      return {
        compare(actual, expected, diff) {
          diff = diff || 1;

          var pass = actual >= expected - diff && actual <= expected + diff;
          var message = `Expected ${actual} to be around ${expected} (between ${expected - diff} and ${expected + diff})`;

          if (!pass) {
            message = `Expected ${actual} NOT to be around ${expected} (between ${expected - diff} and ${expected + diff})`;
          }

          return {
            pass,
            message
          };
        }
      };
    }
  };

  jasmine.addMatchers(matchers);
});

afterEach(() => {
  window.scrollTo(0, 0);
});

export function getTableWidth(elem) {
  return $(elem).outerWidth() || $(elem).find('tbody').outerWidth() || $(elem).find('thead').outerWidth(); // IE8 reports 0 as <table> offsetWidth
};

export function range(from, to) {
  if (!arguments.length) {
    return [];
  }

  if (arguments.length == 1) {
    to = from;
    from = 0;
  }

  if (to > from) {
    from = [to, to = from][0]; // one-liner for swapping two values
  }

  var result = [];

  while (to++ < from) {
    result.push(to);
  }

  return result;
};

/**
 * Rewrite all existing selections from selections[0] etc. to selections.current etc
 * @param instance
 * @returns {object} modified instance
 */
export function shimSelectionProperties(instance) {
  if (instance.selections[0]) {
    instance.selections.current = instance.selections[0];
  }
  if (instance.selections[1]) {
    instance.selections.area = instance.selections[1];
  }
  if (instance.selections[2]) {
    instance.selections.highlight = instance.selections[2];
  }
  if (instance.selections[3]) {
    instance.selections.fill = instance.selections[3];
  }

  return instance;
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
  var _rows = [],
    i,
    j;

  for (i = 0; i < rows; i++) {
    var row = [];

    for (j = 0; j < columns; j++) {
      row.push(spreadsheetColumnLabel(j) + (i + 1));
    }
    _rows.push(row);
  }

  return _rows;
}

const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc.
 *
 * @param {Number} index Column index.
 * @returns {String}
 */
export function spreadsheetColumnLabel(index) {
  let dividend = index + 1;
  let columnLabel = '';
  let modulo;

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
  if (w1 == w2) {
    w2 = outer.clientWidth;
  }

  (document.body || document.documentElement).removeChild(outer);

  return (w1 - w2);
}

var cachedScrollbarWidth;

export function getScrollbarWidth() {
  if (cachedScrollbarWidth === void 0) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth();
  }

  return cachedScrollbarWidth;
}
