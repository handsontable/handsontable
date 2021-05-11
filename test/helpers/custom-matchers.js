import { generateASCIITable } from './asciiTable';
import { normalize, pretty } from './htmlNormalize';

// http://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
const scrollbarWidth = (function calculateScrollbarWidth() {
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
}());

beforeEach(function() {
  const currentSpec = this;

  /**
   * @returns {Handsontable}
   */
  function hot() {
    return currentSpec.$container.data('handsontable');
  }

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
        compare(actual, expected, diff) {
          const margin = diff || 1;

          const pass = actual >= expected - margin && actual <= expected + margin;
          let message = `Expected ${actual} to be around ${expected} (between ${expected - margin}
 and ${expected + margin})`;

          if (!pass) {
            message = `Expected ${actual} NOT to be around ${expected} (between ${expected - margin}
 and ${expected + margin})`;
          }

          return {
            pass,
            message
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
    /**
     * The matcher checks if the passed cell element is contained in the table viewport.
     *
     * @returns {object}
     */
    toBeVisibleInViewport() {
      return {
        compare(actual) {
          const viewport = hot().view.wt.wtTable.holder;
          const verticalPosition = actual.offsetTop - viewport.scrollTop + scrollbarWidth + actual.clientHeight;
          const horizontalPosition = actual.offsetLeft - viewport.scrollLeft + scrollbarWidth + actual.clientWidth;

          const pass = verticalPosition < viewport.offsetHeight && verticalPosition > 0
            && horizontalPosition < viewport.offsetWidth && horizontalPosition > 0;

          return {
            pass,
            message: 'Expected the element to be visible in the Handsontable viewport'
          };
        }
      };
    },
    /**
     * The matcher checks if the viewport is scrolled in the way that the cell is visible at the top of the viewport.
     *
     * @returns {object}
     */
    toBeVisibleAtTopOfViewport() {
      return {
        compare(actual) {
          const viewport = hot().view.wt.wtTable.holder;
          const verticalPosition = actual.offsetTop - viewport.scrollTop - 1;

          return {
            pass: verticalPosition === 0,
            message: 'Expected the element to be scrolled to the top of the Handsontable viewport'
          };
        }
      };
    },
    /**
     * The matcher checks if the viewport is scrolled in the way that the cell is visible at the bottom of the viewport.
     *
     * @returns {object}
     */
    toBeVisibleAtBottomOfViewport() {
      return {
        compare(actual) {
          const viewport = hot().view.wt.wtTable.holder;
          const verticalPosition = actual.offsetTop - viewport.scrollTop + scrollbarWidth + actual.clientHeight + 1;

          return {
            pass: verticalPosition === viewport.offsetHeight,
            message: 'Expected the element to be scrolled to the bottom of the Handsontable viewport'
          };
        }
      };
    },
    /**
     * The matcher checks if the viewport is scrolled in the way that the cell is visible on the left of the viewport.
     *
     * @returns {object}
     */
    toBeVisibleAtLeftOfViewport() {
      return {
        compare(actual) {
          const viewport = hot().view.wt.wtTable.holder;

          return {
            pass: viewport.getBoundingClientRect().x === actual.getBoundingClientRect().x,
            message: 'Expected the element to be scrolled to the left of the Handsontable viewport'
          };
        }
      };
    },
    /**
     * The matcher checks if the viewport is scrolled in the way that the cell is visible on the right of the viewport.
     *
     * @returns {object}
     */
    toBeVisibleAtRightOfViewport() {
      return {
        compare(actual) {
          const viewport = hot().view.wt.wtTable.holder;
          const rightBorderPosition = actual.getBoundingClientRect().x + actual.clientWidth + scrollbarWidth + 1;

          return {
            pass: rightBorderPosition === viewport.getBoundingClientRect().x + viewport.offsetWidth,
            message: 'Expected the element to be scrolled to the right of the Handsontable viewport'
          };
        }
      };
    },
    toBeListFulfillingCondition() {
      const redColor = '\x1b[31m';
      const resetColor = '\x1b[0m';

      return {
        compare(checkedArray, conditionFunction) {
          if (typeof conditionFunction !== 'function') {
            throw Error('Parameter passed to `toBeListFulfillingCondition` should be a function.');
          }

          const isListWithValues = Array.isArray(checkedArray) || checkedArray.length > 0;
          const elementNotFulfillingCondition = checkedArray.find(element => !conditionFunction(element));
          const containsUndefined = isListWithValues && checkedArray.includes(undefined);
          const pass = isListWithValues && !containsUndefined && elementNotFulfillingCondition === undefined;
          let message;

          if (!isListWithValues) {
            message = 'Non-empty list should be passed as expect parameter.';

          } else if (containsUndefined) {
            message = `List ${redColor}${checkedArray.join(', ')}${resetColor}
contains ${redColor}undefined${resetColor} value.`;

          } else if (elementNotFulfillingCondition !== undefined) {
            let entityValue = elementNotFulfillingCondition;

            if (typeof elementNotFulfillingCondition === 'string') {
              entityValue = `"${elementNotFulfillingCondition}"`;
            }

            message = `Entity ${redColor}${entityValue}${resetColor}, from
list: ${redColor}${checkedArray.join(', ')}${resetColor} doesn't satisfy the condition.`;
          }

          return {
            pass,
            message
          };
        }
      };
    },
    /* eslint-disable jsdoc/require-description-complete-sentence */
    /**
     * The matcher checks if the provided selection pattern matches to the rendered cells by checking if
     * the appropriate CSS class name was added.
     *
     * The provided structure should be passed as an array of arrays, for instance:
     * ```
     * // Non-contiguous selection (with enabled top and left headers)
     * expect(`
     *   |   ║   :   : * : * |
     *   |===:===:===:===:===|
     *   | - ║   :   : A : 0 |
     *   | - ║   : 1 : 0 : 0 |
     *   | - ║   : 2 : 1 : 0 |
     *   | - ║   : 2 : 1 : 0 |
     *   | - ║   : 1 : 1 : 0 |
     *   | - ║   :   : 0 : 0 |
     *   `).toBeMatchToSelectionPattern();
     * // Single cell selection (with fixedRowsTop: 1 and fixedColumnsLeft: 2)
     * expect(`
     *   |   :   |   :   :   |
     *   |---:---:---:---:---|
     *   |   :   |   :   :   |
     *   |   :   |   :   :   |
     *   |   :   | # :   :   |
     *   |   :   |   :   :   |
     *   |   :   |   :   :   |
     *   |   :   |   :   :   |
     *   `).toBeMatchToSelectionPattern();
     * ```
     *
     * The meaning of the symbol used to describe the cells:
     * ' ' - An empty space indicates cell which doesn't have added any selection classes.
     * '0' - The number (from 0 to 7) indicates selected layer level.
     * 'A' - The letters (from A to H) indicates the position of the cell which contains the hidden editor
     *       (which `current` class name). The letter `A` indicates the currently selected cell with
     *       a background of the first layer and `H` as the latest layer (most dark).
     * '#' - The hash symbol indicates the currently selected cell without changed background color.
     *
     * The meaning of the symbol used to describe headers:
     * '*' - The asterisk symbol indicates selected header.
     * '-' - The single hyphen symbol indicates highlighted header.
     *
     * The meaning of the symbol used to describe the table:
     * ':'   - Column separator (only for better visual looks).
     * '║'   - This symbol separates the row headers from the table content.
     * '===' - This symbol separates the column headers from the table content.
     * '|'   - The symbol which indicates the left overlay edge.
     * '---' - The symbol which indicates the top overlay edge.
     *
     * @returns {object}
     */
    /* eslint-enable jsdoc/require-description-complete-sentence */
    toBeMatchToSelectionPattern() {
      return {
        compare(actualPattern) {
          const asciiTable = generateASCIITable(hot().rootElement);

          const patternParts = (actualPattern || '').split(/\n/);
          const redundantPadding = patternParts.reduce((padding, line) => {
            const trimmedLine = line.trim();
            let nextPadding = padding;

            if (trimmedLine) {
              const currentPadding = line.search(/\S|$/);

              if (currentPadding < nextPadding) {
                nextPadding = currentPadding;
              }
            }

            return nextPadding;
          }, Infinity);

          const normalizedPattern = patternParts.reduce((acc, line) => {
            const trimmedLine = line.trim();

            if (trimmedLine) {
              acc.push(line.substr(redundantPadding));
            }

            return acc;
          }, []);

          const actualAsciiTable = normalizedPattern.join('\n');
          const message = `Expected the pattern selection \n${actualAsciiTable}\nto
match to the visual state of the rendered selection \n${asciiTable}\n`;

          return {
            pass: asciiTable === actualAsciiTable,
            message,
          };
        }
      };
    },
  };

  jasmine.addMatchers(matchers);
});
