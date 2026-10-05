import Border from 'walkontable/selection/border/border';
import Settings from 'walkontable/settings';

/**
 * The `fixedColumnsEnd` freeze-line rules of `Border`, run against a stub `this` backed by the REAL
 * settings accessor: the methods only read `this.wot`, so no DOM and no overlay are built.
 */

type BorderStub = {
  wot: {
    getSetting: (key: string) => unknown,
    wtTable: { name: string },
    cloneSource?: unknown,
    wtOverlays: { selectionVisibleRange: unknown },
  },
};

/**
 * Builds the stub.
 *
 * @param {object} options The grid shape.
 * @param {number} [options.totalColumns=10] Renderable columns.
 * @param {number} [options.fixedColumnsStart=0] Frozen start columns.
 * @param {number} [options.fixedColumnsEnd=0] Requested frozen end columns.
 * @param {string} [options.overlay='master'] The name of the table that owns the border.
 * @param {object} [options.snapshot] The master's visible-range snapshot.
 * @returns {object}
 */
function createBorder({ totalColumns = 10, fixedColumnsStart = 0, fixedColumnsEnd = 0, overlay = 'master',
  snapshot = null as unknown } = {}): BorderStub {
  const wtSettings = new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => 20,
    totalColumns: () => totalColumns,
    fixedColumnsStart: () => fixedColumnsStart,
    fixedColumnsEnd: () => fixedColumnsEnd,
    fixedRowsTop: 0,
    fixedRowsBottom: 0,
  });
  const wot = {
    getSetting: (key: string) => wtSettings.getSetting(key),
    wtTable: { name: overlay },
    wtOverlays: { selectionVisibleRange: snapshot },
  };

  // A real prototype chain without running the constructor (which builds DOM): the methods call each other.
  return Object.assign(Object.create(Border.prototype), { wot }) as BorderStub;
}

const call = <T>(border: BorderStub, method: string, ...args: unknown[]): T =>
  (Border.prototype as unknown as Record<string, (...a: unknown[]) => T>)[method].apply(border, args);

describe('Border end freeze-line predicates', () => {
  describe('isFrozenEndBoundaryEdge', () => {
    it('should be true only for the last scrollable column, the one before the end band', () => {
      const border = createBorder({ totalColumns: 10, fixedColumnsEnd: 3 });

      expect([5, 6, 7, 8, 9].map(index => call(border, 'isFrozenEndBoundaryEdge', index)))
        .toEqual([false, true, false, false, false]);
    });

    it('should be false when no end column is frozen', () => {
      const border = createBorder({ totalColumns: 10, fixedColumnsEnd: 0 });

      expect([-1, 0, 8, 9].map(index => call(border, 'isFrozenEndBoundaryEdge', index)))
        .toEqual([false, false, false, false]);
    });

    it('should follow the end band cut down by the start band', () => {
      // 8 start columns leave 2 for the end band: its boundary is column 7.
      const border = createBorder({ totalColumns: 10, fixedColumnsStart: 8, fixedColumnsEnd: 5 });

      expect(call(border, 'isFrozenEndBoundaryEdge', 7)).toBe(true);
      expect(call(border, 'isFrozenEndBoundaryEdge', 4)).toBe(false);
    });
  });

  describe('isFrozenEndBoundaryOppositeEdge', () => {
    it('should be true only for the first column of the end band', () => {
      const border = createBorder({ totalColumns: 10, fixedColumnsEnd: 3 });

      expect([6, 7, 8, 9].map(index => call(border, 'isFrozenEndBoundaryOppositeEdge', index)))
        .toEqual([false, true, false, false]);
    });

    it('should be false when no end column is frozen, including for the first column past the grid', () => {
      const border = createBorder({ totalColumns: 10, fixedColumnsEnd: 0 });

      expect(call(border, 'isFrozenEndBoundaryOppositeEdge', 10)).toBe(false);
    });
  });

  describe('isCornerLiftedAtInlineEnd', () => {
    const lifted = (border: BorderStub, toColumn: number) =>
      call<boolean>(border, 'isCornerLiftedAtInlineEnd', toColumn, 0, document.createElement('td'), window, false);

    it('should lift the fill handle of a selection ending before the end band, which covers its overhang', () => {
      expect(lifted(createBorder({ totalColumns: 10, fixedColumnsEnd: 2 }), 7)).toBe(true);
    });

    it('should not lift it by that rule for a selection ending elsewhere in the middle of the grid', () => {
      expect(lifted(createBorder({ totalColumns: 10, fixedColumnsEnd: 2 }), 5)).toBe(false);
      expect(lifted(createBorder({ totalColumns: 10, fixedColumnsEnd: 0 }), 7)).toBe(false);
    });
  });

  describe('getAdjustHandlesAxisLayout', () => {
    const snapshot = {
      column: { partial: [0, 9], full: [0, 9] },
      row: { partial: [0, 19], full: [0, 19] },
    };

    it('should end the scrollable column segment before the end band', () => {
      const border = createBorder({ totalColumns: 10, fixedColumnsStart: 2, fixedColumnsEnd: 3, snapshot });
      const layout = call<{ total: number, main: number[], overlaySegment: string }>(
        border, 'getAdjustHandlesAxisLayout', 'column'
      );

      expect(layout.total).toBe(10);
      expect(layout.main).toEqual([2, 6]);
    });

    it('should read the clamped end band, so a start band that covers the grid leaves no end segment', () => {
      const border = createBorder({ totalColumns: 10, fixedColumnsStart: 10, fixedColumnsEnd: 3, snapshot });
      const layout = call<{ main: number[] }>(border, 'getAdjustHandlesAxisLayout', 'column');

      expect(layout.main).toEqual([10, 9]);
    });

    it('should name the segment the owning overlay renders on the column axis', () => {
      const endBorder = createBorder({ totalColumns: 10, fixedColumnsEnd: 2, overlay: 'inline_end', snapshot });
      const cornerBorder = createBorder({
        totalColumns: 10, fixedColumnsEnd: 2, overlay: 'top_inline_end_corner', snapshot,
      });

      expect(call<{ overlaySegment: string }>(endBorder, 'getAdjustHandlesAxisLayout', 'column').overlaySegment)
        .toBe('end');
      expect(call<{ overlaySegment: string }>(cornerBorder, 'getAdjustHandlesAxisLayout', 'column').overlaySegment)
        .toBe('end');
    });
  });
});
