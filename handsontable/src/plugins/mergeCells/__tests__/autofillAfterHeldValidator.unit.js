import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * An autofill over a merged cell recreates the merge along the filled area once the fill lands in
 * `afterChange`. When the fill waits for its validator, the rows can be reordered before it lands.
 */
describe('MergeCells autofill that waits for its validator', () => {
  let container;
  let hot;
  let pending;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
    pending = [];
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Holds every answer until the test releases it.
   *
   * @param {*} value The validated value.
   * @param {Function} callback The validator callback.
   */
  function heldValidator(value, callback) {
    pending.push(callback);
  }

  /**
   * Creates a grid of six records with A1:A2 merged. Column 0 is validated, column 1 holds the sort key,
   * which orders the records `p0, p3, p2, p5, p1, p4`.
   */
  function createGrid() {
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => [`p${row}`, (row * 5) % 7]),
      cells: (row, col) => (col === 0 ? { validator: heldValidator } : {}),
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
      columnSorting: true,
      licenseKey: TEST_LICENSE_KEY,
    });
  }

  /**
   * Drags the fill handle of A1:A2 down to A6.
   */
  function fillDownToLastRow() {
    hot.selectCell(0, 0, 1, 0);
    hot.selection.highlight.getFill()
      .add(hot._createCellCoords(0, 0))
      .add(hot._createCellCoords(5, 0))
      .commit();
    hot.getPlugin('autofill').fillIn();
  }

  /**
   * Flushes the microtasks, answers every held validator with `true`, and flushes again.
   */
  async function answerAll() {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }

    pending.splice(0).forEach(answer => answer(true));

    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  /**
   * Lists every merge as `[row, col, rowspan, colspan]`, sorted by row.
   *
   * @returns {Array}
   */
  function merges() {
    return hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
      .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan])
      .sort(([a], [b]) => a - b);
  }

  it('should recreate the merge along the filled rows when nothing moved during the wait', async() => {
    createGrid();

    fillDownToLastRow();
    await answerAll();

    expect(merges()).toEqual([[0, 0, 2, 1], [2, 0, 2, 1], [4, 0, 2, 1]]);
  });

  it('should not merge the rows the filled records were sorted to during the wait', async() => {
    createGrid();

    fillDownToLastRow();
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const mergesAfterSort = merges();

    await answerAll();

    expect(merges()).toEqual(mergesAfterSort);
  });
});
