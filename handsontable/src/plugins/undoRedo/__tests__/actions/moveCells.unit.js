import { MoveCellsAction } from '../../actions/moveCells';

/**
 * Builds a minimal region snapshot for a 1x1 region.
 *
 * @param {number} row The region's top row.
 * @param {number} col The region's start column.
 * @returns {object} The snapshot.
 */
function snapshot(row, col) {
  return {
    fromRow: row,
    fromCol: col,
    toRow: row,
    toCol: col,
    data: [['x']],
    meta: [{}],
  };
}

describe('MoveCellsAction', () => {
  describe('redo without the MoveCells plugin registered', () => {
    /**
     * A stub instance whose `getPlugin` reports MoveCells as absent — the shape a consumer gets from
     * the tree-shakeable `base.ts` entry when they register UndoRedo but not MoveCells.
     *
     * @returns {object} The stub.
     */
    function hotWithoutMoveCells() {
      return {
        getPlugin: () => undefined,
        addHookOnce: jest.fn(),
        removeHook: jest.fn(),
        render: jest.fn(),
        selectCells: jest.fn(),
        _createCellCoords: (row, col) => ({ row, col }),
        _createCellRange: (highlight, from, to) => ({ highlight, from, to }),
      };
    }

    it('does not throw', () => {
      const action = new MoveCellsAction({
        sourceSnapshot: snapshot(1, 1),
        targetSnapshot: snapshot(5, 5),
        isCopy: false,
      });

      expect(() => action.redo(hotWithoutMoveCells(), () => {})).not.toThrow();
    });

    it('settles the redo as not performed', () => {
      const action = new MoveCellsAction({
        sourceSnapshot: snapshot(1, 1),
        targetSnapshot: snapshot(5, 5),
        isCopy: false,
      });
      const callback = jest.fn();

      action.redo(hotWithoutMoveCells(), callback);

      // `{ wasRedone: false }` puts the action back on the undone stack, so the user can retry it
      // rather than losing it silently.
      expect(callback).toHaveBeenCalledWith({ wasRedone: false });
    });

    it('does not leave an afterMoveCells listener behind', () => {
      const action = new MoveCellsAction({
        sourceSnapshot: snapshot(1, 1),
        targetSnapshot: snapshot(5, 5),
        isCopy: false,
      });
      const hot = hotWithoutMoveCells();

      action.redo(hot, () => {});

      // The guard must bail before the hook is registered — a stray one-shot listener would fire on
      // the next unrelated move and re-select the wrong range.
      expect(hot.addHookOnce).not.toHaveBeenCalled();
    });
  });
});
