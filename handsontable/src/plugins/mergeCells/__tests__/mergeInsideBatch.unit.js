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

  /**
   * Runs the steps outside a batch and inside one, on two fresh grids, and returns what each run left.
   *
   * @param {Function} steps The calls to make, given the instance.
   * @param {Function} [prepare] Calls made on each grid before the steps, outside any batch.
   * @returns {{ batched: object, unbatched: object }} The observable state of each run.
   */
  function runBothWays(steps, prepare = () => {}) {
    createGrid();
    prepare(hot);
    steps(hot);

    const unbatched = readState();

    hot.destroy();
    container.remove();
    container = document.createElement('div');
    document.body.appendChild(container);

    createGrid();
    prepare(hot);
    hot.batch(() => steps(hot));

    return { batched: readState(), unbatched };
  }

  describe('a call after the merge, or a merge next to older ones', () => {
    it('should keep a merge in place when a row move after it leaves its rows alone', () => {
      const { batched, unbatched } = runBothWays((instance) => {
        instance.getPlugin('manualRowMove').moveRow(5, 0);
        instance.getPlugin('mergeCells').merge(1, 1, 2, 2);
        instance.getPlugin('manualRowMove').moveRow(7, 6);
      });

      expect(unbatched.merges).toEqual([{ row: 1, col: 1, rowspan: 2, colspan: 2 }]);
      expect(batched).toEqual(unbatched);
    });

    it('should keep a merge in place when a column move after it leaves its columns alone', () => {
      const { batched, unbatched } = runBothWays((instance) => {
        instance.getPlugin('manualColumnMove').moveColumn(5, 0);
        instance.getPlugin('mergeCells').merge(1, 1, 2, 2);
        instance.getPlugin('manualColumnMove').moveColumn(7, 6);
      });

      expect(unbatched.merges).toEqual([{ row: 1, col: 1, rowspan: 2, colspan: 2 }]);
      expect(batched).toEqual(unbatched);
    });

    it('should refuse a merge that overlaps an older one after a row move, as outside the batch', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        const { batched, unbatched } = runBothWays((instance) => {
          instance.getPlugin('manualRowMove').moveRow(5, 0);
          instance.getPlugin('mergeCells').merge(2, 0, 3, 0);
        }, instance => instance.getPlugin('mergeCells').merge(0, 0, 1, 0));

        expect(unbatched.merges).toHaveLength(1);
        expect(batched).toEqual(unbatched);
        // One refusal in each run.
        expect(warn).toHaveBeenCalledTimes(2);
      } finally {
        warn.mockRestore();
      }
    });

    it('should keep the cell meta a user set next to the merge', () => {
      const { batched, unbatched } = runBothWays((instance) => {
        instance.getPlugin('manualRowMove').moveRow(5, 0);
        instance.getPlugin('mergeCells').merge(0, 0, 1, 0);
      }, instance => instance.setCellMeta(1, 0, 'copyable', false));

      expect(hot.getCellMeta(hot.toVisualRow(1), 0).copyable).toBe(false);
      expect(batched).toEqual(unbatched);
    });

    it('should keep an older merge whole through two column moves', () => {
      const { batched, unbatched } = runBothWays((instance) => {
        instance.getPlugin('manualColumnMove').moveColumn(0, 3);
        instance.getPlugin('manualColumnMove').moveColumn(5, 4);
      }, instance => instance.getPlugin('mergeCells').merge(0, 1, 1, 2));

      expect(unbatched.merges).toEqual([{ row: 0, col: 0, rowspan: 2, colspan: 2 }]);
      expect(batched).toEqual(unbatched);
    });

    it('should apply a merge and the unmerge that follows it in the order they were called', () => {
      const { batched, unbatched } = runBothWays((instance) => {
        instance.getPlugin('manualRowMove').moveRow(5, 0);
        instance.getPlugin('mergeCells').merge(1, 1, 2, 2);
        instance.getPlugin('mergeCells').unmerge(1, 1, 2, 2);
      });

      expect(unbatched.merges).toEqual([]);
      expect(batched).toEqual(unbatched);
    });

    it('should fire the merge hooks once, at the end of the batch', () => {
      createGrid();

      const events = [];

      hot.addHook('afterMergeCells', () => events.push('afterMergeCells'));
      hot.batch(() => {
        hot.getPlugin('manualRowMove').moveRow(5, 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        events.push('callback end');
      });

      expect(events).toEqual(['callback end', 'afterMergeCells']);
    });

    // A row move in a batch that splits a merge draws it over a row it does not own: the re-anchor at the end of
    // the batch moves the merge without splitting it.
    it.todo('should split a merge that a row move in a batch breaks, as the same call outside the batch does');
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
