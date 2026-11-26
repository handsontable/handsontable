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

    describe('when rows or columns are added or removed before the batch ends', () => {
      const MERGE = [1, 1, 2, 2];
      const WIDE_MERGE = [1, 1, 3, 3];
      const reorderOnOtherAxis = {
        row: () => hot.getPlugin('manualColumnMove').moveColumn(5, 0),
        col: () => hot.getPlugin('manualRowMove').moveRow(5, 0),
      };
      /**
       * Reads the merges as plain rows.
       *
       * @returns {number[][]} `[row, col, rowspan, colspan]` of every merge.
       */
      const readMerges = () => hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan]);
      // A move on the other axis leaves the altered axis unbatched, so the same calls outside the batch give the
      // merge the user expects.
      const ALTERS = [
        ['row', 'insert_row_above', 0, 2, MERGE, 'before the range'],
        ['row', 'insert_row_below', 0, 1, MERGE, 'right before the range'],
        ['row', 'insert_row_above', 1, 1, MERGE, 'at its first row'],
        ['row', 'insert_row_above', 2, 1, MERGE, 'inside the range'],
        ['row', 'insert_row_below', 1, 2, MERGE, 'between its rows'],
        ['row', 'insert_row_below', 2, 1, MERGE, 'after its last row'],
        ['row', 'insert_row_above', 5, 1, MERGE, 'after the range'],
        ['row', 'remove_row', 0, 1, MERGE, 'a row before the range'],
        ['row', 'remove_row', 5, 2, MERGE, 'rows after the range'],
        ['row', 'remove_row', 2, 1, WIDE_MERGE, 'a row inside the range'],
        ['col', 'insert_col_start', 0, 2, MERGE, 'before the range'],
        ['col', 'insert_col_end', 0, 1, MERGE, 'right before the range'],
        ['col', 'insert_col_start', 1, 1, MERGE, 'at its first column'],
        ['col', 'insert_col_start', 2, 1, MERGE, 'inside the range'],
        ['col', 'insert_col_end', 1, 2, MERGE, 'between its columns'],
        ['col', 'insert_col_end', 2, 1, MERGE, 'after its last column'],
        ['col', 'insert_col_start', 5, 1, MERGE, 'after the range'],
        ['col', 'remove_col', 0, 1, MERGE, 'a column before the range'],
        ['col', 'remove_col', 5, 2, MERGE, 'columns after the range'],
        ['col', 'remove_col', 2, 1, WIDE_MERGE, 'a column inside the range'],
      ];

      // A move on the altered axis makes `alter()` pivot from the stale cache, which only matches the live order
      // outside the rows the move permutes. So the ranges and the alters sit past them.
      const reorderOnSameAxis = {
        row: () => hot.getPlugin('manualRowMove').moveRow(1, 0),
        col: () => hot.getPlugin('manualColumnMove').moveColumn(1, 0),
      };
      const LATE_MERGE = { row: [3, 1, 4, 2], col: [1, 3, 2, 4] };
      const LATE_WIDE_MERGE = { row: [3, 1, 5, 2], col: [1, 3, 2, 5] };
      const SAME_AXIS_ALTERS = [
        ['row', 'insert_row_above', 2, 2, LATE_MERGE.row, 'before the range'],
        ['row', 'insert_row_above', 3, 1, LATE_MERGE.row, 'at its first row'],
        ['row', 'insert_row_below', 3, 2, LATE_MERGE.row, 'between its rows'],
        ['row', 'insert_row_below', 4, 1, LATE_MERGE.row, 'after its last row'],
        ['row', 'insert_row_above', 6, 1, LATE_MERGE.row, 'after the range'],
        ['row', 'remove_row', 2, 1, LATE_MERGE.row, 'a row before the range'],
        ['row', 'remove_row', 6, 2, LATE_MERGE.row, 'rows after the range'],
        ['row', 'remove_row', 4, 1, LATE_WIDE_MERGE.row, 'a row inside the range'],
        ['col', 'insert_col_start', 2, 2, LATE_MERGE.col, 'before the range'],
        ['col', 'insert_col_start', 3, 1, LATE_MERGE.col, 'at its first column'],
        ['col', 'insert_col_end', 3, 2, LATE_MERGE.col, 'between its columns'],
        ['col', 'insert_col_end', 4, 1, LATE_MERGE.col, 'after its last column'],
        ['col', 'insert_col_start', 6, 1, LATE_MERGE.col, 'after the range'],
        ['col', 'remove_col', 2, 1, LATE_MERGE.col, 'a column before the range'],
        ['col', 'remove_col', 6, 2, LATE_MERGE.col, 'columns after the range'],
        ['col', 'remove_col', 4, 1, LATE_WIDE_MERGE.col, 'a column inside the range'],
      ];

      [
        ['the other axis', ALTERS, reorderOnOtherAxis],
        ['the same axis', SAME_AXIS_ALTERS, reorderOnSameAxis],
      ].forEach(([reorderName, table, reorders]) => table.forEach(([axis, action, index, amount, merge, name]) => {
        it(`should follow ${action}(${index}, ${amount}) ${name} after a move on ${reorderName}, as the same calls outside the batch do`, () => {
          const reorder = reorders[axis];

          createGrid();
          reorder();
          hot.getPlugin('mergeCells').merge(...merge);
          hot.alter(action, index, amount);

          const expected = { merges: readMerges(), dataText: hot.getData().map(row => row.join('\t')).join('\n') };

          hot.destroy();
          container.remove();
          container = document.createElement('div');
          document.body.appendChild(container);

          const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

          try {
            createGrid();
            hot.batch(() => {
              reorder();
              hot.getPlugin('mergeCells').merge(...merge);
              hot.alter(action, index, amount);
            });

            expect(expected.merges).toHaveLength(1);
            expect({ merges: readMerges(), dataText: hot.getData().map(row => row.join('\t')).join('\n') })
              .toEqual(expected);
            expect(warn).not.toHaveBeenCalled();
          } finally {
            warn.mockRestore();
          }
        });
      }));

      it('should keep a merge when a row is removed after a row move in the batch', () => {
        createGrid();

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualRowMove').moveRow(5, 0);
            hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
            hot.alter('remove_row', 7);
          });

          expect(hot.countRows()).toBe(ROWS - 1);
          expect(readMerges()).toEqual([[1, 1, 2, 2]]);
          expect(warn).not.toHaveBeenCalled();
        } finally {
          warn.mockRestore();
        }
      });

      it('should keep a merge when a column is inserted after a column move in the batch', () => {
        createGrid();

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualColumnMove').moveColumn(5, 0);
            hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
            hot.alter('insert_col_start', 7);
          });

          expect(hot.countCols()).toBe(COLUMNS + 1);
          expect(readMerges()).toEqual([[1, 1, 2, 2]]);
          expect(warn).not.toHaveBeenCalled();
        } finally {
          warn.mockRestore();
        }
      });

      it('should merge the rows the user meant when rows are inserted after a row move in the batch', () => {
        createGrid();

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualRowMove').moveRow(5, 0);
            hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
            hot.alter('insert_row_above', 0);
          });

          const values = hot.getData().flat();
          const [merge] = hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells;

          // The merge covers the source rows of A1 and A2: it keeps B1 and clears B2, C1 and C2.
          expect(values).toEqual(expect.arrayContaining(['A1', 'A2', 'B1', 'A6']));
          expect(values).not.toContain('B2');
          expect(values).not.toContain('C1');
          expect(values).not.toContain('C2');
          expect(readMerges()).toHaveLength(1);
          expect([merge.rowspan, merge.colspan]).toEqual([2, 2]);
          expect(hot.getSourceDataAtCell(hot.toPhysicalRow(merge.row), 1)).toBe('B1');
          expect(warn).not.toHaveBeenCalled();
        } finally {
          warn.mockRestore();
        }
      });

      [
        ['insert_row_above', 0, 3, 'rows before the range'],
        ['insert_row_below', 1, 2, 'rows between the rows of the range'],
        ['insert_row_below', 2, 1, 'a row after the range'],
        ['insert_row_above', 2, 2, 'rows inside the range'],
        ['remove_row', 4, 2, 'rows after the range'],
      ].forEach(([action, index, amount, name]) => {
        it(`should merge the rows the user meant for ${action}(${index}, ${amount}) ${name} after a row move`, () => {
          createGrid();

          const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

          try {
            hot.batch(() => {
              hot.getPlugin('manualRowMove').moveRow(5, 0);
              hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
              hot.alter(action, index, amount);
            });

            const values = hot.getData().flat();
            const [merge] = hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells;

            // The merge covers the cells of A1 and A2: it keeps B1 and clears B2, C1 and C2.
            expect(readMerges()).toHaveLength(1);
            expect(merge.colspan).toBe(2);
            expect(hot.getSourceDataAtCell(hot.toPhysicalRow(merge.row), 1)).toBe('B1');
            expect(values).not.toContain('B2');
            expect(values).not.toContain('C1');
            expect(values).not.toContain('C2');
            expect(warn).not.toHaveBeenCalled();
          } finally {
            warn.mockRestore();
          }
        });
      });

      it('should re-base the corners whatever order the removed rows are given in', () => {
        createGrid();
        hot.batch(() => {
          hot.getPlugin('manualColumnMove').moveColumn(5, 0);
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
          hot.alter('remove_row', [[5, 1], [0, 1]]);
        });

        expect(readMerges()).toEqual([[0, 1, 2, 2]]);
      });

      it('should drop a held unmerge with a warning when a corner row is removed, and leave the merge', () => {
        createGrid();
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualColumnMove').moveColumn(5, 0);
            hot.getPlugin('mergeCells').unmerge(1, 1, 2, 2);
            hot.alter('remove_row', 2);
          });

          expect(readMerges()).toHaveLength(1);
          expect(warn).toHaveBeenCalledTimes(1);
        } finally {
          warn.mockRestore();
        }
      });

      it('should not unmerge a merge the held call did not name when a corner row is removed after a row move', () => {
        createGrid();
        hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
        hot.getPlugin('mergeCells').merge(3, 1, 4, 2);
        hot.getPlugin('mergeCells').merge(5, 1, 6, 2);

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualRowMove').moveRow(7, 1);
            hot.getPlugin('mergeCells').unmerge(0, 1, 1, 2);
            hot.alter('remove_row', 0);
          });

          // The call named no merge that is left, and it must not pick the neighbor of its removed corner.
          expect(readMerges()).toHaveLength(3);
          expect(warn).toHaveBeenCalledTimes(1);
        } finally {
          warn.mockRestore();
        }
      });

      it('should follow an insert and the removal of the inserted row', () => {
        createGrid();

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualColumnMove').moveColumn(5, 0);
            hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
            hot.alter('insert_row_above', 0);
            hot.alter('remove_row', 0);
          });

          expect(hot.countRows()).toBe(ROWS);
          expect(readMerges()).toEqual([[1, 1, 2, 2]]);
          expect(warn).not.toHaveBeenCalled();
        } finally {
          warn.mockRestore();
        }
      });

      it('should follow every held call, and keep the order of a merge and the unmerge that follows it', () => {
        createGrid();

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualColumnMove').moveColumn(5, 0);
            hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
            hot.getPlugin('mergeCells').merge(4, 4, 5, 5);
            hot.alter('insert_row_above', 0);
            hot.getPlugin('mergeCells').unmerge(2, 1, 3, 2);
          });

          expect(readMerges()).toEqual([[5, 4, 2, 2]]);
          expect(warn).not.toHaveBeenCalled();
        } finally {
          warn.mockRestore();
        }
      });

      it('should drop a held back call once, with a warning, when a corner row is removed, and keep the others', () => {
        createGrid();

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualColumnMove').moveColumn(5, 0);
            hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
            hot.getPlugin('mergeCells').merge(4, 4, 5, 5);
            hot.alter('remove_row', 1);
            hot.alter('remove_row', 0);
          });

          expect(readMerges()).toEqual([[2, 4, 2, 2]]);
          expect(warn).toHaveBeenCalledTimes(1);
          expect(warn.mock.calls.flat().join(' ')).toContain('was dropped');
          expect(warn.mock.calls.flat().join(' ')).toContain('removed');
        } finally {
          warn.mockRestore();
        }
      });

      it('should drop a held back call with a warning when a corner column is removed', () => {
        createGrid();

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          hot.batch(() => {
            hot.getPlugin('manualRowMove').moveRow(5, 0);
            hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
            hot.alter('remove_col', 2);
          });

          expect(readMerges()).toEqual([]);
          expect(warn).toHaveBeenCalledTimes(1);
          expect(warn.mock.calls.flat().join(' ')).toContain('was dropped');
        } finally {
          warn.mockRestore();
        }
      });

      // A hook the plugin forgot to remove would re-base the corners twice after a disable and an enable.
      [
        ['row', 'insert_row_above', 0, [[2, 1, 2, 2]]],
        ['row', 'remove_row', 0, [[0, 1, 2, 2]]],
        ['col', 'insert_col_start', 0, [[1, 2, 2, 2]]],
        ['col', 'remove_col', 0, [[1, 0, 2, 2]]],
      ].forEach(([axis, action, index, expected]) => {
        it(`should follow ${action} once after the plugin was disabled and enabled again`, () => {
          createGrid();
          hot.getPlugin('mergeCells').disablePlugin();
          hot.getPlugin('mergeCells').enablePlugin();

          hot.batch(() => {
            // A move on the other axis leaves the altered axis unbatched.
            if (axis === 'row') {
              hot.getPlugin('manualColumnMove').moveColumn(5, 0);

            } else {
              hot.getPlugin('manualRowMove').moveRow(5, 0);
            }
            hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
            hot.alter(action, index);
          });

          expect(readMerges()).toEqual(expected);
        });
      });

      it('should undo a batch with a merge and an insert as one step', () => {
        createGrid();
        hot.batch(() => {
          hot.getPlugin('manualColumnMove').moveColumn(5, 0);
          hot.getPlugin('mergeCells').merge(1, 1, 2, 2);
          hot.alter('insert_row_above', 0);
        });

        expect(readMerges()).toHaveLength(1);

        hot.getPlugin('undoRedo').undo();

        expect(hot.countRows()).toBe(ROWS);
        expect(readMerges()).toEqual([]);
        expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
      });
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
