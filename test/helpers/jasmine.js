/* eslint-disable import/prefer-default-export */
var currentSpec;

export function spec() {
  return currentSpec;
};

function hot() {
  return spec().$container.data('handsontable');
};

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
    },
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
    toBeVisibleAtLeftOfViewport() {
      return {
        compare(actual) {
          const viewport = hot().view.wt.wtTable.holder;
          const horizontalPosition = viewport.scrollLeft - actual.offsetLeft;

          return {
            pass: horizontalPosition === 0,
            message: 'Expected the element to be scrolled to the top of the Handsontable viewport'
          };
        }
      };
    },
    toBeVisibleAtRightOfViewport() {
      return {
        compare(actual) {
          const viewport = hot().view.wt.wtTable.holder;
          const horizontalPosition = viewport.scrollLeft - actual.offsetLeft + actual.clientWidth - scrollbarWidth + 1;

          return {
            pass: horizontalPosition === viewport.offsetWidth,
            message: 'Expected the element to be scrolled to the top of the Handsontable viewport'
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
          const elementNotFulfillingCondition = checkedArray.find((element) => !conditionFunction(element));
          const containsUndefined = isListWithValues && checkedArray.includes(undefined);
          const pass = isListWithValues && !containsUndefined && elementNotFulfillingCondition === undefined;
          let message;

          if (!isListWithValues) {
            message = 'Non-empty list should be passed as expect parameter.';

          } else if (containsUndefined) {
            message = `List ${redColor}${checkedArray.join(', ')}${resetColor} contains ${redColor}undefined${resetColor} value.`;

          } else if (elementNotFulfillingCondition !== undefined) {
            let entityValue = elementNotFulfillingCondition;

            if (typeof elementNotFulfillingCondition === 'string') {
              entityValue = `"${elementNotFulfillingCondition}"`;
            }

            message = `Entity ${redColor}${entityValue}${resetColor}, from list: ${redColor}${checkedArray.join(', ')}${resetColor} doesn't satisfy the condition.`;
          }

          return {
            pass,
            message
          };
        }
      };
    },
    toBeMatchToSelectionPattern() {
      const symbols = new Map([
        ['C', 'current']
      ]);

      return {
        compare(actualPattern) {
          const currentState = [];
          const rowsCount = hot().countRows();
          const colsCount = hot().countCols();
          const message = 'Expected the pattern selection to match to the visual state of the rendered selection.';

          if (!Array.isArray(actualPattern)) {
            return {
              pass: false,
              message,
            };
          }

          for (let r = 0; r < rowsCount; r++) {
            const currentRowState = [];

            for (let c = 0; c < colsCount; c++) {
              if (!actualPattern[r] || !actualPattern[r][c]) {
                break;
              }

              const actualCell = actualPattern[r][c];

              if (actualCell === ' ') {
                currentRowState.push(' ');

              } else {
                const cell = hot().getCell(r, c);
                const layerName = parseInt(actualCell, 10);
                const isLayerChecking = !isNaN(layerName);
                let className;

                if (isLayerChecking) {
                  className = layerName === 0 ? 'area' : `area-${layerName <= 7 ? layerName : 7}`;
                } else {
                  className = symbols.get(actualCell);
                }

                if (cell.classList.contains(className)) {
                  currentRowState.push(actualCell);
                } else {
                  currentRowState.push('x');
                }
              }
            }
            currentState.push(currentRowState);
          }

          return {
            pass: JSON.stringify(currentState) === JSON.stringify(actualPattern),
            message,
          };
        }
      };
    },
  };

  jasmine.addMatchers(matchers);

  if (document.activeElement && document.activeElement != document.body) {
    document.activeElement.blur();

  } else if (!document.activeElement) { // IE
    document.body.focus();
  }
});

afterEach(() => {
  window.scrollTo(0, 0);
});
