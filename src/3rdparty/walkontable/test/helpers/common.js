import { normalize, pretty } from './htmlNormalize';

/**
 * @param {number} [delay=100] The delay in ms after which the Promise is resolved.
 * @returns {Promise}
 */
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

/**
 * Test context object.
 *
 * @type {object}
 */
const specContext = {};

/**
 * Get the test case context.
 *
 * @returns {object|null}
 */
export function spec() {
  return specContext.spec;
}

/**
 * @returns {Walkontable} Returns the Walkontable instance.
 */
export function wot() {
  return spec().wotInstance;
}

/**
 * Create the Walkontable instance with the provided options and cache it as `wotInstance` in the test context.
 *
 * @param {object} options Walkontable options.
 * @param {HTMLTableElement} [table] The table element to base the instance on.
 * @returns {Walkontable}
 */
export function walkontable(options, table) {
  const currentSpec = spec();

  if (!table) {
    table = currentSpec.$table[0];
  }

  options.table = table;

  currentSpec.wotInstance = new Walkontable.Core(options);

  return currentSpec.wotInstance;
}

/**
 * Creates the new data into an object returned by "spec()" function.
 *
 * @param {number} [rows=100] The number of rows to generate.
 * @param {number} [cols=4] The number of columns to generate.
 */
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

/**
 * Returns the date value at specified coordinates.
 *
 * @param {number} row The physical row index.
 * @param {number} col The physical column index.
 * @returns {*}
 */
export function getData(row, col) {
  return spec().data[row][col];
}

/**
 * Returns the total rows of the currently used dataset.
 *
 * @returns {number}
 */
export function getTotalRows() {
  return spec().data.length;
}

/**
 * Returns the total columns of the currently used dataset.
 *
 * @returns {number}
 */
export function getTotalColumns() {
  return spec().data[0] ? spec().data[0].length : 0;
}

/**
 * Simulates WheelEvent on the element.
 *
 * @param {Element} elem Element to dispatch event.
 * @param {number} deltaX Relative distance in px to scroll horizontally.
 * @param {number} deltaY Relative distance in px to scroll vertically.
 */
export function wheelOnElement(elem, deltaX = 0, deltaY = 0) {
  elem.dispatchEvent(new WheelEvent('wheel', { deltaX, deltaY }));
}

beforeEach(function() {
  specContext.spec = this;

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
    toMatchHTML() {
      return {
        compare(actual, expected) {
          const actualHTML = pretty(normalize(actual));
          const expectedHTML = pretty(normalize(expected));

          const result = {
            pass: actualHTML === expectedHTML,
          };

          result.message = `Expected ${actualHTML} NOT to be ${expectedHTML}`;

          return result;
        }
      };
    },
    toBeAroundValue() {
      return {
        compare(actual, expected, diff = 1) {
          const pass = actual >= expected - diff && actual <= expected + diff;
          let message = `Expected ${actual} to be around ${expected}
 (between ${expected - diff} and ${expected + diff})`;

          if (!pass) {
            message = `Expected ${actual} NOT to be around ${expected}
 (between ${expected - diff} and ${expected + diff})`;
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
  specContext.spec = null;
  window.scrollTo(0, 0);
});

/**
 * Returns the table width.
 *
 * @param {Element} elem An table element to check.
 * @returns {number}
 */
export function getTableWidth(elem) {
  return $(elem).outerWidth() || $(elem).find('tbody').outerWidth() || $(elem).find('thead').outerWidth(); // IE8 reports 0 as <table> offsetWidth
}

/**
 * Creates an array with data defined by the range.
 *
 * @param {number} start The first index.
 * @param {number} end The last index.
 * @returns {Array}
 */
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
 * @param {object} selections An object with custom selection instances.
 * @param {Selection} [selections.current] An optional instance of the current selection.
 * @param {Selection} [selections.area] An optional instance of the area selection.
 * @param {Selection} [selections.fill] An optional instance of the fill selection.
 * @param {Selection} [selections.custom] An optional instance of the custom selection.
 * @param {Selection} [selections.activeHeader] An optional instance of the active header selection.
 * @param {Selection} [selections.header] An optional instance of the header selection.
 * @returns {object} Selection controller.
 */
export function createSelectionController({ current, area, fill, custom, activeHeader, header } = {}) {
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
  const activeHeaderCtrl = activeHeader || new Walkontable.Selection({
    highlightHeaderClassName: 'active_highlight',
  });
  const headerCtrl = header || new Walkontable.Selection({
    highlightHeaderClassName: 'highlight',
  });
  const customCtrl = custom || [];

  return {
    getCell() {
      return currentCtrl;
    },
    getHeader() {
      return headerCtrl;
    },
    getActiveHeader() {
      return activeHeaderCtrl;
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
        currentCtrl,
        fillCtrl,
        areaCtrl,
        headerCtrl,
        activeHeaderCtrl,
        ...customCtrl,
      ][Symbol.iterator]();
    },
  };
}

/**
 * @returns {jQuery}
 */
export function getTableTopClone() {
  return $('.ht_clone_top');
}

/**
 * @returns {jQuery}
 */
export function getTableLeftClone() {
  return $('.ht_clone_left');
}

/**
 * @returns {jQuery}
 */
export function getTableCornerClone() {
  return $('.ht_clone_top_left_corner');
}

/**
 * Creates spreadsheet data as an array of arrays filled with spreadsheet-like label values (e.q "A1", "A2"...).
 *
 * @param {number} rows The number of rows to generate.
 * @param {number} columns The number of columns to generate.
 * @returns {Array}
 */
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
 * @param {number} index The column index.
 * @returns {string}
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

/**
 * Returns the computed width of the native browser scroll bar.
 *
 * @returns {number}
 */
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

/**
 * Returns the computed width of the native browser scroll bar.
 *
 * @returns {number}
 */
export function getScrollbarWidth() {
  if (cachedScrollbarWidth === void 0) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth();
  }

  return cachedScrollbarWidth;
}

/**
 * Run expectation towards a certain WtTable overlay.
 *
 * @param {*} wt WOT instance.
 * @param {*} callb Callback that will receive wtTable of that overlay.
 * @param {*} name Name of the overlay.
 * @returns {Function}
 */
export function expectWtTable(wt, callb, name) {
  const callbAsString = callb.toString().replace(/\s\s+/g, ' ');

  if (name === 'master') {
    return expect(callb(wt.wtTable)).withContext(`${name}: ${callbAsString}`);
  }

  return expect(callb(wt.wtOverlays[`${name}Overlay`].clone.wtTable)).withContext(`${name}: ${callbAsString}`);
}
