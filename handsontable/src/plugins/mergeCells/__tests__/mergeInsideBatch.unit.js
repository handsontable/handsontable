import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * `hot.batch()` holds the index mapper caches until it ends, so a reorder made earlier in the same batch
 * (a column move, a row move, a sort) is not in `toPhysicalRow()` and `toPhysicalColumn()` yet. `merge()` has to
 * give the same merge and the same cell meta as the same calls made outside the batch.
 */
describe('MergeCells -> merge() inside a batch after a reorder', () => {
  const ROWS = 8;
  const COLUMNS = 8;
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds the grid of the ticket.
   *
   * @returns {object} The Handsontable instance.
   */
  function createGrid() {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(ROWS, COLUMNS),
      mergeCells: true,
      manualColumnMove: true,
      manualRowMove: true,
      columnSorting: true,
      undoRedo: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    return hot;
  }

  const REORDERS = {
    'a column move': () => hot.getPlugin('manualColumnMove').moveColumn(5, 0),
    'a row move': () => hot.getPlugin('manualRowMove').moveRow(5, 0),
    'a sort': () => hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' }),
  };

  /**
   * Reads what a user can observe: the merges, the flags the merge writes on every cell, and the text a copy
   * of the whole grid produces next to the data it should reproduce.
   *
   * @returns {object} The observable state.
   */
  function readState() {
    const flags = [];

    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        const { hidden, spanned, copyable, rowspan, colspan } = hot.getCellMeta(row, column);

        flags.push({ row, column, hidden, spanned, copyable, rowspan, colspan });
      }
    }

    return {
      merges: hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan })),
      flags: flags.filter(cell => cell.hidden || cell.spanned || cell.copyable === false),
      copyableText: hot.getCopyableText(0, 0, ROWS - 1, COLUMNS - 1),
      dataText: hot.getData().map(row => row.join('\t')).join('\n'),
    };
  }

  Object.entries(REORDERS).forEach(([name, reorder]) => {
    describe(`after ${name}`, () => {
      it('should merge the same cells as the same calls outside the batch', () => {
        createGrid();
        reorder();
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);

        const expected = readState();

        hot.destroy();
        container.remove();
        container = document.createElement('div');
        document.body.appendChild(container);

        createGrid();
        hot.batch(() => {
          reorder();
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        });

        expect(readState()).toEqual(expected);
      });

      it('should merge the visual range it was given', () => {
        createGrid();
        hot.batch(() => {
          reorder();
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        });

        const state = readState();

        expect(state.merges).toEqual([{ row: 1, col: 1, rowspan: 2, colspan: 2 }]);
        expect(state.flags.filter(cell => cell.hidden).map(({ row, column }) => [row, column]))
          .toEqual([[1, 2], [2, 1], [2, 2]]);
      });

      it('should move a merge that exists before the reorder as the same calls outside the batch do', () => {
        createGrid();
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        reorder();

        const expected = readState();

        hot.destroy();
        container.remove();
        container = document.createElement('div');
        document.body.appendChild(container);

        createGrid();
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        hot.batch(reorder);

        expect(readState()).toEqual(expected);
      });

      it('should merge next to an existing merge as the same calls outside the batch do', () => {
        createGrid();
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        reorder();
        hot.getPlugin('mergeCells').merge(5, 4, 6, 5);

        const expected = readState();

        hot.destroy();
        container.remove();
        container = document.createElement('div');
        document.body.appendChild(container);

        createGrid();
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        hot.batch(() => {
          reorder();
          hot.getPlugin('mergeCells').merge(5, 4, 6, 5);
        });

        expect(readState()).toEqual(expected);
        expect(expected.merges).toHaveLength(2);
      });

      it('should leave the cells clean after the undo and bring the merge back with the redo', () => {
        createGrid();
        hot.batch(() => {
          reorder();
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        });

        const merged = readState();

        hot.getPlugin('undoRedo').undo();

        const undone = readState();

        expect(undone.merges).toEqual([]);
        expect(undone.flags).toEqual([]);

        hot.getPlugin('undoRedo').redo();

        expect(readState()).toEqual(merged);
      });

      it('should undo the merge of a batch that merges before it reorders', () => {
        createGrid();
        hot.batch(() => {
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
          reorder();
        });

        hot.getPlugin('undoRedo').undo();

        const undone = readState();

        expect(undone.merges).toEqual([]);
        expect(undone.flags).toEqual([]);
      });
    });
  });

  it('should move a merge that exists before a column freeze as the same calls outside the batch do', () => {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(ROWS, COLUMNS),
      mergeCells: true,
      manualColumnFreeze: true,
      licenseKey: TEST_LICENSE_KEY,
    });
    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    hot.getPlugin('manualColumnFreeze').freezeColumn(5);

    const expected = readState();

    hot.destroy();
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(ROWS, COLUMNS),
      mergeCells: true,
      manualColumnFreeze: true,
      licenseKey: TEST_LICENSE_KEY,
    });
    hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    hot.batch(() => hot.getPlugin('manualColumnFreeze').freezeColumn(5));

    expect(readState()).toEqual(expected);
    expect(expected.merges).toEqual([{ row: 1, col: 2, rowspan: 2, colspan: 2 }]);
  });

  it('should not change a merge made in a batch without a reorder', () => {
    createGrid();
    hot.batch(() => {
      hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
    });

    const state = readState();

    expect(state.merges).toEqual([{ row: 1, col: 1, rowspan: 2, colspan: 2 }]);
    expect(state.flags.filter(cell => cell.hidden).map(({ row, column }) => [row, column]))
      .toEqual([[1, 2], [2, 1], [2, 2]]);
  });
});
