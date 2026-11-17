import Border from 'walkontable/selection/border/border';
import { CUSTOM_SELECTION_TYPE } from 'walkontable/selection/constants';
import Settings from 'walkontable/settings';

/**
 * The start freeze-line rules of `Border`, run against a stub `this` backed by the REAL settings accessor:
 * the methods only read `this.wot` and `this.settings`, so no DOM and no overlay are built.
 */

type BorderStub = {
  settings: { selectionType: string },
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
 * @param {number} [options.fixedRowsTop=0] Frozen top rows.
 * @param {number} [options.fixedColumnsStart=0] Frozen start columns.
 * @param {boolean} [options.isCustom=false] Whether the border draws a `customBorders` range.
 * @param {object} [options.snapshot] The master's visible-range snapshot.
 * @returns {object}
 */
function createBorder({ fixedRowsTop = 0, fixedColumnsStart = 0, isCustom = false,
  snapshot = null as unknown } = {}): BorderStub {
  const wtSettings = new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => 20,
    totalColumns: () => 10,
    fixedColumnsStart: () => fixedColumnsStart,
    fixedColumnsEnd: () => 0,
    fixedRowsTop: () => fixedRowsTop,
    fixedRowsBottom: 0,
  });
  const wot = {
    getSetting: (key: string) => wtSettings.getSetting(key),
    wtTable: { name: 'master' },
    wtOverlays: { selectionVisibleRange: snapshot },
  };
  const settings = { selectionType: isCustom ? CUSTOM_SELECTION_TYPE : 'area' };

  // A real prototype chain without running the constructor (which builds DOM): the methods call each other.
  return Object.assign(Object.create(Border.prototype), { wot, settings }) as BorderStub;
}

const call = <T>(border: BorderStub, method: string, ...args: unknown[]): T =>
  (Border.prototype as unknown as Record<string, (...a: unknown[]) => T>)[method].apply(border, args);

describe('Border start freeze-line predicates', () => {
  describe('isEdgeOnStartFreezeLine', () => {
    it('should be true for a selection starting on the first column after the frozen ones', () => {
      const border = createBorder({ fixedColumnsStart: 2 });

      expect([1, 2, 3].map(index => call(border, 'isEdgeOnStartFreezeLine', 'column', index)))
        .toEqual([false, true, false]);
    });

    it('should be true for a selection starting on the first row after the frozen ones', () => {
      const border = createBorder({ fixedRowsTop: 2 });

      expect([1, 2, 3].map(index => call(border, 'isEdgeOnStartFreezeLine', 'row', index)))
        .toEqual([false, true, false]);
    });

    it('should be false for a custom border on the first column after the frozen ones', () => {
      // Nothing in the frozen overlays draws a custom border's edge there, so it keeps the shift onto its cell.
      const border = createBorder({ fixedColumnsStart: 2, isCustom: true });

      expect([1, 2, 3].map(index => call(border, 'isEdgeOnStartFreezeLine', 'column', index)))
        .toEqual([false, false, false]);
    });

    it('should be false for a custom border on the first row after the frozen ones', () => {
      const border = createBorder({ fixedRowsTop: 2, isCustom: true });

      expect([1, 2, 3].map(index => call(border, 'isEdgeOnStartFreezeLine', 'row', index)))
        .toEqual([false, false, false]);
    });

    it('should be false for a custom border on a track that scrolling lined up with the frozen area', () => {
      const snapshot = { column: { full: [5, 9], partial: [5, 9] } };
      const selection = createBorder({ fixedColumnsStart: 2, snapshot });
      const custom = createBorder({ fixedColumnsStart: 2, isCustom: true, snapshot });

      expect(call(selection, 'isEdgeOnStartFreezeLine', 'column', 5)).toBe(true);
      expect(call(custom, 'isEdgeOnStartFreezeLine', 'column', 5)).toBe(false);
    });

    it('should be false when nothing is frozen on the axis', () => {
      const border = createBorder({ fixedColumnsStart: 0, fixedRowsTop: 0 });

      expect(call(border, 'isEdgeOnStartFreezeLine', 'column', 0)).toBe(false);
      expect(call(border, 'isEdgeOnStartFreezeLine', 'row', 0)).toBe(false);
    });
  });
});
