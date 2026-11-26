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
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function createGrid(overrides = {}) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(ROWS, COLUMNS),
      mergeCells: true,
      manualColumnMove: true,
      manualRowMove: true,
      columnSorting: true,
      undoRedo: true,
      licenseKey: TEST_LICENSE_KEY,
      ...overrides,
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
   * @param {number} [rows] How many rows of the grid to read.
   * @param {number} [columns] How many columns of the grid to read.
   * @returns {object} The observable state.
   */
  function readState(rows = ROWS, columns = COLUMNS) {
    const flags = [];

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const { hidden, spanned, copyable, rowspan, colspan } = hot.getCellMeta(row, column);

        flags.push({ row, column, hidden, spanned, copyable, rowspan, colspan });
      }
    }

    return {
      merges: hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan })),
      flags: flags.filter(cell => cell.hidden || cell.spanned || cell.copyable === false),
      copyableText: hot.getCopyableText(0, 0, rows - 1, columns - 1),
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
        // What the user sees: one cell spans the two rows and the two columns.
        expect(hot.getCell(1, 1).colSpan).toBe(2);
        expect(hot.getCell(1, 1).rowSpan).toBe(2);
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

    it('should move an older merge through a column move and a row move in one batch', () => {
      const { batched, unbatched } = runBothWays((instance) => {
        instance.getPlugin('manualColumnMove').moveColumn(5, 0);
        instance.getPlugin('manualRowMove').moveRow(5, 0);
      }, instance => instance.getPlugin('mergeCells').merge(1, 1, 2, 2));

      expect(unbatched.merges).toEqual([{ row: 2, col: 2, rowspan: 2, colspan: 2 }]);
      expect(batched).toEqual(unbatched);
    });

    it('should move an older merge through a row move and a column move in one batch', () => {
      const { batched, unbatched } = runBothWays((instance) => {
        instance.getPlugin('manualRowMove').moveRow(5, 0);
        instance.getPlugin('manualColumnMove').moveColumn(5, 0);
      }, instance => instance.getPlugin('mergeCells').merge(1, 1, 2, 2));

      expect(unbatched.merges).toEqual([{ row: 2, col: 2, rowspan: 2, colspan: 2 }]);
      expect(batched).toEqual(unbatched);
    });

    it('should run a call a listener makes while the held back ones run after the ones still waiting', () => {
      createGrid();

      const merged = [];
      let isFirst = true;

      hot.addHook('afterMergeCells', (_range, mergeParent) => {
        merged.push([mergeParent.row, mergeParent.col]);

        if (isFirst) {
          isFirst = false;
          hot.getPlugin('mergeCells').merge(5, 5, 6, 6);
        }
      });
      hot.batch(() => {
        hot.getPlugin('manualRowMove').moveRow(5, 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        hot.getPlugin('mergeCells').merge(3, 1, 4, 2);
      });

      expect(merged).toEqual([[1, 1], [3, 1], [5, 5]]);
    });

    it('should drop a held back call when rows are added before the batch ends', () => {
      createGrid();

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        hot.batch(() => {
          hot.getPlugin('manualRowMove').moveRow(5, 0);
          hot.getPlugin('mergeCells').merge(3, 1, 4, 2);
          hot.alter('insert_row_above', 0, 2);
        });

        expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
        expect(warn.mock.calls.flat().join(' ')).toContain('was dropped');
      } finally {
        warn.mockRestore();
      }
    });

    it('should drop a held back call when an insert and a removal cancel out before the batch ends', () => {
      createGrid();

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        hot.batch(() => {
          hot.getPlugin('manualRowMove').moveRow(5, 0);
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
          hot.alter('insert_row_above', 0);
          hot.alter('remove_row', ROWS);
        });

        expect(hot.countRows()).toBe(ROWS);
        expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
        expect(warn.mock.calls.flat().join(' ')).toContain('was dropped');
      } finally {
        warn.mockRestore();
      }
    });

    it('should drop a held back call when columns are added or removed before the batch ends', () => {
      createGrid();

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        hot.batch(() => {
          hot.getPlugin('manualColumnMove').moveColumn(5, 0);
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
          hot.alter('insert_col_start', 0);
        });

        expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
        expect(warn.mock.calls.flat().join(' ')).toContain('was dropped');

        warn.mockClear();
        hot.batch(() => {
          hot.getPlugin('manualColumnMove').moveColumn(5, 0);
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
          hot.alter('remove_col', 0);
        });

        expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
        expect(warn.mock.calls.flat().join(' ')).toContain('was dropped');
      } finally {
        warn.mockRestore();
      }
    });

    it('should drop a held back call and warn when a row of its range is trimmed before the batch ends', () => {
      createGrid({ trimRows: true });

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        hot.batch(() => {
          hot.getPlugin('manualRowMove').moveRow(5, 0);
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
          hot.getPlugin('trimRows').trimRow(1);
        });
        hot.getPlugin('trimRows').untrimAll();

        expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
        expect(warn.mock.calls.flat().join(' ')).toContain('trimmed');
      } finally {
        warn.mockRestore();
      }
    });

    it('should run every held back call and throw the first error after the last one', () => {
      createGrid();

      const merged = [];
      let isFirst = true;

      hot.addHook('beforeMergeCells', () => {
        if (isFirst) {
          isFirst = false;
          throw new Error('first merge refused');
        }
      });
      hot.addHook('afterMergeCells', (_range, mergeParent) => merged.push([mergeParent.row, mergeParent.col]));

      expect(() => hot.batch(() => {
        hot.getPlugin('manualRowMove').moveRow(5, 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        hot.getPlugin('mergeCells').merge(4, 4, 5, 5);
      })).toThrow('first merge refused');

      expect(merged).toEqual([[4, 4]]);
    });

    it('should not run a held back call after the plugin was disabled and enabled in the batch', () => {
      createGrid();
      hot.batch(() => {
        hot.getPlugin('manualRowMove').moveRow(5, 0);
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        hot.getPlugin('mergeCells').disablePlugin();
      });
      hot.getPlugin('mergeCells').enablePlugin();
      hot.batch(() => {});

      expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells).toEqual([]);
    });

    it('should find an undo entry without an anchor by its coordinates, and not another merge of its size', () => {
      createGrid();

      const mergeCells = hot.getPlugin('mergeCells');

      mergeCells.mergedCellsCollection.add({ row: 1, col: 1, rowspan: 2, colspan: 2 }, true);
      mergeCells.mergedCellsCollection.add({ row: 4, col: 4, rowspan: 2, colspan: 2 }, true);
      mergeCells.restoreState([], {
        other: [{ row: 4, col: 4, rowspan: 2, colspan: 2, anchor: null }],
      });

      expect(mergeCells.mergedCellsCollection.mergedCells.map(({ row, col }) => [row, col])).toEqual([[1, 1]]);
    });
  });

  describe('a row move that splits a merge that exists before the batch', () => {
    const MOVES = {
      'one row': () => hot.getPlugin('manualRowMove').moveRow(2, 6),
      'two rows': () => hot.getPlugin('manualRowMove').moveRows([2, 3], 6),
      'the first row of the merge': () => hot.getPlugin('manualRowMove').moveRows([1], 6),
    };

    /**
     * Runs the scenario on a fresh grid, in a batch or outside it, and reads what a user can observe.
     *
     * @param {Function} scenario Called after the merge was made.
     * @param {boolean} isBatched Whether the scenario runs in `hot.batch()`.
     * @param {object} [settings] Settings merged over the grid defaults.
     * @returns {object} The observable state.
     */
    function run(scenario, isBatched, settings = {}) {
      createGrid(settings);
      hot.getPlugin('mergeCells').merge(1, 0, 3, 0);

      if (isBatched) {
        hot.batch(scenario);
      } else {
        scenario();
      }

      const state = readState();

      hot.destroy();
      hot = null;
      container.remove();
      container = document.createElement('div');
      document.body.appendChild(container);

      return state;
    }

    Object.entries(MOVES).forEach(([name, move]) => {
      it(`should split the merge when ${name} move(s) out of it, as the same call outside the batch does`, () => {
        const expected = run(move, false);

        expect(run(move, true)).toEqual(expected);
      });
    });

    it('should not draw the merge over a row it does not own', () => {
      createGrid();
      hot.getPlugin('mergeCells').merge(1, 0, 3, 0);
      hot.batch(() => hot.getPlugin('manualRowMove').moveRow(2, 6));

      expect(hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan])).toEqual([[1, 0, 2, 1]]);
      expect(hot.getCopyableText(1, 0, 6, 0)).toBe('A2\n\nA5\nA6\nA7\n');
    });

    it('should keep a merge that a row move in a batch does not break whole', () => {
      const move = () => hot.getPlugin('manualRowMove').moveRow(6, 5);
      const expected = run(move, false);

      expect(run(move, true)).toEqual(expected);
    });

    it('should keep the cell meta a user set next to the merge when a row move in a batch shifts it', () => {
      const { batched, unbatched } = runBothWays(
        instance => instance.getPlugin('manualRowMove').moveRow(0, 7),
        (instance) => {
          instance.getPlugin('mergeCells').merge(4, 0, 5, 0);
          instance.setCellMeta(3, 0, 'copyable', false);
        }
      );

      expect(unbatched.flags.find(cell => cell.row === 2 && cell.column === 0)?.copyable).toBe(false);
      expect(batched).toEqual(unbatched);
    });

    it('should split the merge as outside the batch when a row of the grid is trimmed', () => {
      const move = () => hot.getPlugin('manualRowMove').moveRow(2, 6);
      const settings = { trimRows: [4] };
      const expected = run(move, false, settings);

      expect(run(move, true, settings)).toEqual(expected);
    });

    it('should split the merge as outside the batch when a row inside the merge is trimmed', () => {
      const move = () => hot.getPlugin('manualRowMove').moveRow(3, 6);
      const settings = { trimRows: [2] };
      const expected = run(move, false, settings);

      expect(run(move, true, settings)).toEqual(expected);
    });

    it('should split the merge when a column move and a row move are made in one batch', () => {
      const scenario = () => {
        hot.getPlugin('manualColumnMove').moveColumn(5, 0);
        hot.getPlugin('manualRowMove').moveRow(2, 6);
      };
      const expected = run(scenario, false);

      expect(run(scenario, true)).toEqual(expected);
    });

    it('should not rebuild the live row caches for a move that touches no merge, and move as outside the batch', () => {
      const move = () => hot.getPlugin('manualRowMove').moveRow(5, 7);
      const expected = run(move, false);

      createGrid();
      hot.getPlugin('mergeCells').merge(1, 0, 3, 0);

      const spy = jest.spyOn(hot.rowIndexMapper, 'runWithLiveCache');

      hot.batch(move);

      expect(spy).not.toHaveBeenCalled();
      expect(readState()).toEqual(expected);
    });

    it('should translate the merges of a move away from them when a row of the grid is trimmed', () => {
      createGrid({ trimRows: [4] });
      hot.getPlugin('mergeCells').merge(1, 0, 3, 0);

      const spy = jest.spyOn(hot.rowIndexMapper, 'runWithLiveCache');

      hot.batch(() => hot.getPlugin('manualRowMove').moveRow(5, 6));

      expect(spy).toHaveBeenCalled();
    });

    it('should rebuild the live row caches for a move that touches a merge', () => {
      createGrid();
      hot.getPlugin('mergeCells').merge(1, 0, 3, 0);

      const spy = jest.spyOn(hot.rowIndexMapper, 'runWithLiveCache');

      hot.batch(() => hot.getPlugin('manualRowMove').moveRow(2, 6));

      expect(spy).toHaveBeenCalled();
    });

    it('should undo and redo the split with the same state as outside the batch', () => {
      const state = {};

      [false, true].forEach((isBatched) => {
        createGrid();
        hot.getPlugin('mergeCells').merge(1, 0, 3, 0);

        const initial = readState();

        if (isBatched) {
          hot.batch(MOVES['one row']);
        } else {
          MOVES['one row']();
        }

        const moved = readState();

        hot.getPlugin('undoRedo').undo();

        const undone = readState();

        hot.getPlugin('undoRedo').redo();

        state[isBatched] = { initial, moved, undone, redone: readState() };

        hot.destroy();
        hot = null;
        container.remove();
        container = document.createElement('div');
        document.body.appendChild(container);
      });

      expect(state.true).toEqual(state.false);
      expect(state.true.undone).toEqual(state.true.initial);
      expect(state.true.redone).toEqual(state.true.moved);
    });

    /**
     * Builds a 10 x 4 grid, merges the given range, sorts it outside any batch when asked to, runs a scenario in
     * a batch or outside it and reads the grid.
     *
     * @param {object} options The setup.
     * @param {number[]} options.merge The range to merge, `[fromRow, fromColumn, toRow, toColumn]`.
     * @param {object} [options.settings] Settings merged over the grid defaults.
     * @param {boolean} [options.isSorted] Whether to sort the grid, descending, before the scenario.
     * @param {Function} options.scenario The calls to make.
     * @param {boolean} options.isBatched Whether they run in `hot.batch()`.
     * @returns {object} The observable state.
     */
    function runOnTallGrid({ merge, settings = {}, isSorted = false, scenario, isBatched }) {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(10, 4), ...settings });
      hot.getPlugin('mergeCells').merge(...merge);

      if (isSorted) {
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      }

      if (isBatched) {
        hot.batch(scenario);
      } else {
        scenario();
      }

      const state = readState(10, 4);

      hot.destroy();
      hot = null;
      container.remove();
      container = document.createElement('div');
      document.body.appendChild(container);

      return state;
    }

    it('should keep the flags of a row a sorted merge drew over before the move, as outside the batch', () => {
      const options = {
        merge: [3, 0, 6, 0],
        settings: { trimRows: [9, 6] },
        isSorted: true,
        scenario: () => hot.getPlugin('manualRowMove').moveRow(3, 7),
      };
      const expected = runOnTallGrid({ ...options, isBatched: false });

      expect(runOnTallGrid({ ...options, isBatched: true })).toEqual(expected);
    });

    it('should draw no merge over a row it does not own when a sort comes before the move in the same batch', () => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(10, 4) });
      hot.getPlugin('mergeCells').merge(1, 0, 3, 0);
      hot.batch(() => {
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
        hot.getPlugin('manualRowMove').moveRow(2, 6);
      });

      hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells.forEach(({ row, rowspan }) => {
        for (let visualRow = row; visualRow < row + rowspan; visualRow++) {
          expect([1, 2, 3]).toContain(hot.toPhysicalRow(visualRow));
        }
      });
    });

    it('should leave no merge behind when the sort is cleared after the move in the same batch', () => {
      createGrid({ data: Handsontable.helper.createSpreadsheetData(10, 4) });
      hot.getPlugin('mergeCells').merge(1, 0, 3, 0);
      hot.batch(() => {
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
        hot.getPlugin('manualRowMove').moveRow(2, 6);
        hot.getPlugin('columnSorting').clearSort();
      });

      hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells.forEach(({ row, col, rowspan, colspan }) => {
        hot.getPlugin('mergeCells').unmerge(row, col, row + rowspan - 1, col + colspan - 1);
      });

      const { merges, flags } = readState(10, 4);

      expect(merges).toEqual([]);
      expect(flags).toEqual([]);
    });
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
