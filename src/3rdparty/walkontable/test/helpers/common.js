export function sleep(delay = 100) {
  return Promise.resolve({
    then(resolve) {
      if (delay === 0) {
        setImmediate(resolve);
      } else {
        setTimeout(resolve, delay);
      }
    }
  });
}

let currentSpec;

export function spec() {
  return currentSpec;
}

export function createDataArray(rows = 100, cols = 4) {
  spec().data = [];

  for (let i = 0; i < rows; i++) {
    const row = [];

    if (cols > 0) {
      row.push(i);

      for (let j = 0; j < cols - 1; j++) {
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

beforeEach(function() {
  currentSpec = this;

  const matchers = {
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
        compare(actual) {
          return {
            pass: typeof actual === 'function'
          };
        }
      };
    },
    toBeAroundValue() {
      return {
        compare(actual, expected, diff = 1) {
          const pass = actual >= expected - diff && actual <= expected + diff;
          let message = `Expected ${actual} to be around ${expected} (between ${expected - diff} and ${expected + diff})`;

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
}

export function range(start, end) {
  if (!arguments.length) {
    return [];
  }

  let from = start;
  let to = end;

  if (arguments.length === 1) {
    to = from;
    from = 0;
  }

  if (to > from) {
    from = [to, to = from][0]; // one-liner for swapping two values
  }

  const result = [];

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
export function createSelectionController({ current, area, fill, custom } = {}) {
  const currentCtrl = current || new Walkontable.Selection({
    className: 'current',
    border: {
      width: 2,
      color: '#4b89ff',
    },
  });
  const areaCtrl = area || new Walkontable.Selection({
    className: 'area',
    border: {
      width: 1,
      color: '#4b89ff',
    },
  });
  const fillCtrl = fill || new Walkontable.Selection({
    className: 'fill',
    border: {
      width: 1,
      color: '#ff0000',
    },
  });
  const customCtrl = custom || [];

  return {
    getCell() {
      return currentCtrl;
    },
    createOrGetArea() {
      return areaCtrl;
    },
    getAreas() {
      return [areaCtrl];
    },
    getFill() {
      return fillCtrl;
    },
    [Symbol.iterator]() {
      return [
        fillCtrl,
        currentCtrl,
        areaCtrl,
        ...customCtrl,
      ][Symbol.iterator]();
    },
  };
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
  const _rows = [];
  let i;
  let j;

  for (i = 0; i < rows; i++) {
    const row = [];

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
  const inner = document.createElement('div');
  inner.style.height = '200px';
  inner.style.width = '100%';

  const outer = document.createElement('div');
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
  const w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  let w2 = inner.offsetWidth;
  if (w1 === w2) {
    w2 = outer.clientWidth;
  }

  (document.body || document.documentElement).removeChild(outer);

  return (w1 - w2);
}

let cachedScrollbarWidth;

export function getScrollbarWidth() {
  if (cachedScrollbarWidth === void 0) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth();
  }

  return cachedScrollbarWidth;
}
