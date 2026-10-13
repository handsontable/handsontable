import Handsontable from 'handsontable/base';

/**
 * Builds a grid of `A1`-style values, so a value that lands on another record after an undo shows
 * in the assertion.
 *
 * @param {number} rows The number of rows.
 * @param {number} columns The number of columns.
 * @returns {Array}
 */
export function spreadsheet(rows, columns) {
  return Array.from({ length: rows }, (_, row) => Array.from(
    { length: columns }, (__, column) => `${String.fromCharCode(65 + column)}${row + 1}`,
  ));
}

/**
 * Gives each test of the calling `describe` a fresh container, and destroys the grid after it.
 * Call it at the top of the `describe`.
 *
 * @returns {{ create: Function, undoAll: Function }} `create(settings)` builds the grid with the undo
 * plugin on; `undoAll()` undoes until the undo stack is empty.
 */
export function setUpUndoGrid() {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  return {
    create(settings) {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        undo: true,
        ...settings,
      });

      return hot;
    },
    undoAll() {
      const undoRedo = hot.getPlugin('undoRedo');

      while (undoRedo.isUndoAvailable()) {
        undoRedo.undo();
      }
    },
  };
}
