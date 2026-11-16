import Border from 'walkontable/selection/border/border';
import Settings from 'walkontable/settings';

/**
 * The `fixedRowsBottom` freeze-line rules of `Border` for a row that scrolling lined up with the bottom rows,
 * run against a stub `this` backed by the REAL settings accessor: the methods only read `this.wot` and
 * `this.settings`, so no DOM and no overlay are built.
 */

type BorderStub = {
  wot: {
    getSetting: (key: string) => unknown,
    wtTable: { name: string },
    wtOverlays: { selectionVisibleRange: unknown, bottomCloneCoversLinedUpRow: () => boolean },
  },
  settings: { selectionType?: string },
};

/**
 * The master's visible-range snapshot with the given last fully and last partially visible rows.
 *
 * @param {number} lastFull The last fully visible row.
 * @param {number} lastPartial The last partially visible row.
 * @param {boolean} [bottomCloneCoversLinedUpRow=true] Whether the bottom clone is taller than the counted
 *   height of the frozen bottom rows, so it covers the bottom border of a row lined up with it.
 * @returns {object}
 */
function rowsSnapshot(lastFull: number, lastPartial: number, bottomCloneCoversLinedUpRow = true) {
  return { row: { full: [0, lastFull], partial: [0, lastPartial] }, bottomCloneCoversLinedUpRow };
}

/**
 * Builds the stub.
 *
 * @param {object} options The grid shape.
 * @param {number} [options.totalRows=20] Renderable rows.
 * @param {number} [options.fixedRowsBottom=0] Frozen bottom rows.
 * @param {string} [options.overlay='master'] The name of the table that owns the border.
 * @param {object} [options.snapshot] The master's visible-range snapshot.
 * @param {string} [options.selectionType] The border's selection type.
 * @returns {object}
 */
function createBorder({ totalRows = 20, fixedRowsBottom = 0, overlay = 'master', snapshot = null as unknown,
  selectionType = 'focus' } = {}): BorderStub {
  const wtSettings = new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => totalRows,
    totalColumns: () => 10,
    fixedRowsTop: 0,
    fixedRowsBottom: () => fixedRowsBottom,
  });
  const wot = {
    getSetting: (key: string) => wtSettings.getSetting(key),
    wtTable: { name: overlay },
    wtOverlays: {
      selectionVisibleRange: snapshot,
      // The real method reads the bottom clone's height once per draw; the stub answers from the snapshot.
      bottomCloneCoversLinedUpRow: () =>
        (snapshot as { bottomCloneCoversLinedUpRow?: boolean } | null)?.bottomCloneCoversLinedUpRow === true,
    },
  };

  // A real prototype chain without running the constructor (which builds DOM): the methods call each other.
  return Object.assign(Object.create(Border.prototype), { wot, settings: { selectionType } }) as BorderStub;
}

const call = <T>(border: BorderStub, method: string, ...args: unknown[]): T =>
  (Border.prototype as unknown as Record<string, (...a: unknown[]) => T>)[method].apply(border, args);

describe('Border bottom freeze-line predicates', () => {
  describe('isRowLinedUpWithBottomFreezeLine', () => {
    it('should be true for a scrollable row that is the last one shown, and shown whole', () => {
      const border = createBorder({ fixedRowsBottom: 2, snapshot: rowsSnapshot(9, 9) });

      expect([8, 9, 10].map(row => call(border, 'isRowLinedUpWithBottomFreezeLine', row)))
        .toEqual([false, true, false]);
    });

    it('should be false while another row is partly shown below it', () => {
      const border = createBorder({ fixedRowsBottom: 2, snapshot: rowsSnapshot(9, 10) });

      expect(call(border, 'isRowLinedUpWithBottomFreezeLine', 9)).toBe(false);
    });

    it('should be false for the last scrollable row, which the index rule covers', () => {
      const border = createBorder({ totalRows: 20, fixedRowsBottom: 2, snapshot: rowsSnapshot(17, 17) });

      expect(call(border, 'isRowLinedUpWithBottomFreezeLine', 17)).toBe(false);
      expect(call(border, 'isFrozenBottomBoundaryEdge', 17)).toBe(true);
    });

    it('should be false without frozen bottom rows, where the row ends at the viewport edge', () => {
      const border = createBorder({ fixedRowsBottom: 0, snapshot: rowsSnapshot(9, 9) });

      expect(call(border, 'isRowLinedUpWithBottomFreezeLine', 9)).toBe(false);
    });

    it('should be false while the bottom clone is as tall as counted, so the row keeps its border in view', () => {
      const border = createBorder({ fixedRowsBottom: 2, snapshot: rowsSnapshot(9, 9, false) });

      expect(call(border, 'isRowLinedUpWithBottomFreezeLine', 9)).toBe(false);
      expect(call(border, 'isEdgeOnBottomFreezeLine', 9)).toBe(false);
      expect(call(border, 'isBottomHandleOccludedByClone', 9)).toBe(false);
    });

    it('should be false before the first draw took a snapshot', () => {
      const border = createBorder({ fixedRowsBottom: 2, snapshot: null });

      expect(call(border, 'isRowLinedUpWithBottomFreezeLine', 9)).toBe(false);
    });
  });

  describe('isEdgeOnBottomFreezeLine', () => {
    it('should be true for the last scrollable row at any scroll position', () => {
      const border = createBorder({ totalRows: 20, fixedRowsBottom: 2, snapshot: rowsSnapshot(9, 10) });

      expect(call(border, 'isEdgeOnBottomFreezeLine', 17)).toBe(true);
    });

    it('should be true for a selection on a lined-up row', () => {
      const border = createBorder({ fixedRowsBottom: 2, snapshot: rowsSnapshot(9, 9) });

      expect([8, 9].map(row => call(border, 'isEdgeOnBottomFreezeLine', row))).toEqual([false, true]);
    });

    it('should be false for a custom border on a lined-up row, which no frozen overlay draws', () => {
      const border = createBorder({
        fixedRowsBottom: 2, snapshot: rowsSnapshot(9, 9), selectionType: 'custom-selection',
      });

      expect(call(border, 'isEdgeOnBottomFreezeLine', 9)).toBe(false);
      expect(call(border, 'isRowLinedUpWithBottomFreezeLine', 9)).toBe(true);
    });
  });

  describe('isBottomHandleOccludedByClone', () => {
    it('should pull the mobile bottom handle inside on a lined-up row, in the master only', () => {
      const snapshot = rowsSnapshot(9, 9);

      expect(call(createBorder({ fixedRowsBottom: 2, snapshot }), 'isBottomHandleOccludedByClone', 9)).toBe(true);
      expect(call(createBorder({ fixedRowsBottom: 2, snapshot, overlay: 'bottom' }),
        'isBottomHandleOccludedByClone', 9)).toBe(false);
    });
  });
});
