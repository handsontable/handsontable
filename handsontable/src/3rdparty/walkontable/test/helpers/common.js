/**
 * Test context object.
 *
 * @type {object}
 */
const specContext = {};

beforeEach(function() {
  specContext.spec = this;
});

afterEach(() => {
  specContext.spec = null;
  window.scrollTo(0, 0);
});

beforeAll(() => {
  // Make the test more predictable by hiding the test suite dots
  $('.jasmine_html-reporter').hide();
});
afterAll(() => {
  // After the test are finished show the test suite dots
  $('.jasmine_html-reporter').show();
});

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * The function allows you to run the test suites based on different parameters (object configuration, datasets etc).
 *
 * For example:
 * ```
 * describe('TextEditor', () => {
 *   using('input value', [1, '1', true], (value) => {
 *     it('should correctly display the value in the textarea element', {
 *        // expect()
 *     });
 *   })
 * })
 * // The jasmine will generate following test cases:
 * //   * "TextEditor using input value: `1` should correctly display the value in the textarea element";
 * //   * "TextEditor using input value: `'1'` should correctly display the value in the textarea element"
 * //   * "TextEditor using input value: `true` should correctly display the value in the textarea element"
 * ```
 *
 * @param {string} name The parameter name to be used within the tests.
 * @param {Array<*>} parameters An array of parameters.
 * @param {Function} func Function to execute where the test suite
 */
export function using(name, parameters, func) {
  parameters.forEach((param) => {
    describe(`using ${name}: \`${JSON.stringify(param)}\``, function() {
      func.call(this, param);
    });
  });
}
/* eslint-enable jsdoc/require-description-complete-sentence */

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

  // Walkontable needs to have a theme initialized to properly render the table.
  // (running `useTheme` without a theme name will use the classic theme)
  currentSpec.wotInstance.stylesHandler.useTheme();

  return currentSpec.wotInstance;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function topOverlay() {
  return wot().wtOverlays.topOverlay;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function bottomOverlay() {
  return wot().wtOverlays.bottomOverlay;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function topInlineStartCornerOverlay() {
  return wot().wtOverlays.topInlineStartCornerOverlay;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function inlineStartOverlay() {
  return wot().wtOverlays.inlineStartOverlay;
}

/**
 * @returns {Overlay} Returns the table's overlay instance.
 */
export function bottomInlineStartCornerOverlay() {
  return wot().wtOverlays.bottomInlineStartCornerOverlay;
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
 * @param {object} options An object with custom selection instances.
 * @returns {object} Selection controller.
 */
export function createSelectionController(options = {}) {
  const focusCtrl = createSelection({
    selectionType: 'focus',
    className: 'current',
    border: {
      width: 2,
      color: '#4b89ff',
    },
    ...options,
  });
  const fillCtrl = createSelection({
    selectionType: 'fill',
    className: 'fill',
    border: {
      width: 1,
      color: '#ff0000',
    },
  });

  const areaCtrl = [];
  const headerCtrl = [];
  const activeHeaderCtrl = [];
  const rowHighlightCtrl = [];
  const columnHighlightCtrl = [];
  const customHighlightCtrl = [];

  return {
    getFocus() {
      return focusCtrl;
    },
    getFill() {
      return fillCtrl;
    },
    createLayeredArea() {
      return areaCtrl.at(-1) ?? { cellRange: null };
    },
    getArea(selectionOptions = {}) {
      return addSelectionToCollection(areaCtrl, {
        selectionType: 'area',
        className: 'area',
        createLayers: true,
        border: {
          width: 1,
          color: '#4b89ff',
        },
        ...selectionOptions,
      });
    },
    getHeader() {
      return addSelectionToCollection(headerCtrl, {
        selectionType: 'header',
        className: 'ht__highlight'
      });
    },
    getActiveHeader() {
      return addSelectionToCollection(activeHeaderCtrl, {
        selectionType: 'active-header',
        className: 'ht__active_highlight'
      });
    },
    getRowHighlight() {
      return addSelectionToCollection(rowHighlightCtrl, {
        selectionType: 'row',
        className: 'row'
      });
    },
    getColumnHighlight() {
      return addSelectionToCollection(columnHighlightCtrl, {
        selectionType: 'column',
        className: 'column'
      });
    },
    getCustomHighlight() {
      return addSelectionToCollection(customHighlightCtrl, {
        selectionType: 'custom',
        className: 'custom'
      });
    },
    [Symbol.iterator]() {
      return [
        focusCtrl,
        fillCtrl,
        ...areaCtrl,
        ...headerCtrl,
        ...activeHeaderCtrl,
        ...rowHighlightCtrl,
        ...columnHighlightCtrl,
        ...customHighlightCtrl,
      ][Symbol.iterator]();
    },
  };
}

/**
 * Internally creates, adds to the collection and returns the Selection instance.
 *
 * @param {Selection[]} collection The collection to update.
 * @param {object} options Additional options passed to the Selection constructor.
 * @returns {Selection}
 */
function addSelectionToCollection(collection, options) {
  const selection = createSelection({ ...options });

  collection.push(selection);

  return selection;
}

/**
 * Creates the individual selection for current selection, area selection, selection for autofill or custom borders.
 *
 * @param {object} options An object with custom selection options.
 * @returns {Walkontable.Selection} The selection instance.
 */
export function createSelection(options) {
  return new Walkontable.Selection({
    createCellRange(highlight, from, to) {
      return new Walkontable.CellRange(highlight, from, to);
    },
    createCellCoords(row, column) {
      return new Walkontable.CellCoords(row, column);
    },
    ...options,
  });
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
export function getTableInlineStartClone() {
  return $('.ht_clone_inline_start');
}

/**
 * @returns {jQuery}
 */
export function getTableTopInlineStartCornerClone() {
  return $('.ht_clone_top_inline_start_corner');
}

/**
 * @returns {jQuery}
 */
export function getTableMaster() {
  return $('.ht_master');
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
  if (cachedScrollbarWidth === undefined) {
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

/**
 * Moves the table's viewport to the specified y scroll position.
 *
 * @param {number} y The scroll position.
 */
export function setScrollTop(y) {
  if (wot().wtOverlays.scrollableElement === window) {
    window.scrollTo(window.scrollX, y);
  } else {
    getTableMaster().find('.wtHolder')[0].scrollTop = y;
  }
}

/**
 * Moves the table's viewport to the specified x scroll position.
 *
 * @param {number} x The scroll position.
 */
export function setScrollLeft(x) {
  if (wot().wtOverlays.scrollableElement === window) {
    window.scrollTo(x, window.scrollY);
  } else {
    getTableMaster().find('.wtHolder')[0].scrollLeft = x;
  }
}
