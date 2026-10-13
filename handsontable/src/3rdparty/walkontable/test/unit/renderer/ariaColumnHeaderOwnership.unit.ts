import { TableRenderer } from 'walkontable/render/tableRenderer';
import Settings from 'walkontable/settings';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_INLINE_END,
  CLONE_INLINE_START,
  CLONE_TOP,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_TOP_INLINE_START_CORNER,
} from 'walkontable/overlay/constants';

const END_CLONES = [CLONE_INLINE_END, CLONE_TOP_INLINE_END_CORNER, CLONE_BOTTOM_INLINE_END_CORNER];
const OVERLAYS = [
  'master',
  CLONE_TOP,
  CLONE_BOTTOM,
  CLONE_INLINE_START,
  CLONE_INLINE_END,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_END_CORNER,
];

/**
 * Builds a renderer on top of the REAL settings accessor (so `fixedColumnsEnd` is clamped for real).
 *
 * @param {object} options The grid shape.
 * @param {number} [options.totalColumns=10] Renderable columns.
 * @param {number} [options.fixedColumnsStart=0] Frozen start columns.
 * @param {number} [options.fixedColumnsEnd=0] Requested frozen end columns.
 * @param {number} [options.rowHeaders=1] How many row-header levels the grid has.
 * @returns {TableRenderer}
 */
function createRenderer({ totalColumns = 10, fixedColumnsStart = 0, fixedColumnsEnd = 0, rowHeaders = 1 } = {}) {
  const wtSettings = new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => 5,
    totalColumns: () => totalColumns,
    fixedColumnsStart: () => fixedColumnsStart,
    fixedColumnsEnd: () => fixedColumnsEnd,
    guid: 'hot-1',
  });
  const renderer = new TableRenderer(document.createElement('table'), { cellRenderer: () => {} });
  const rowHeaderFns = Array.from({ length: rowHeaders }, () => () => {});

  const rowUtils = { wtSettings, deps: { getRowHeaders: () => rowHeaderFns } };

  renderer.setAxisUtils(rowUtils as unknown as Parameters<typeof renderer.setAxisUtils>[0],
    {} as unknown as Parameters<typeof renderer.setAxisUtils>[1]);

  return renderer;
}

describe('TableRenderer aria column header ownership (end columns)', () => {
  describe('getFirstFixedEndColumn', () => {
    it('should be Infinity when no end column is frozen', () => {
      expect(createRenderer({ fixedColumnsEnd: 0 }).getFirstFixedEndColumn()).toBe(Infinity);
    });

    it('should be the index of the first of the last N columns', () => {
      expect(createRenderer({ totalColumns: 10, fixedColumnsEnd: 3 }).getFirstFixedEndColumn()).toBe(7);
    });

    it('should honor the clamp against the start band', () => {
      expect(createRenderer({ totalColumns: 10, fixedColumnsStart: 8, fixedColumnsEnd: 5 })
        .getFirstFixedEndColumn()).toBe(8);
      expect(createRenderer({ totalColumns: 10, fixedColumnsStart: 10, fixedColumnsEnd: 5 })
        .getFirstFixedEndColumn()).toBe(Infinity);
    });
  });

  describe('ownsAriaColumnHeaderId', () => {
    it('should give every column exactly one owner among the overlays', () => {
      const totalColumns = 10;
      const fixedColumnsStart = 2;
      const renderer = createRenderer({ totalColumns, fixedColumnsStart, fixedColumnsEnd: 3 });
      const first = renderer.getFirstFixedEndColumn();
      const owners: Record<number, string[]> = {};

      for (let column = 0; column < totalColumns; column++) {
        owners[column] = OVERLAYS.filter((name) => {
          renderer.activeOverlayName = name;

          return renderer.ownsAriaColumnHeaderId(column, fixedColumnsStart, first);
        });
      }

      expect(owners).toEqual({
        0: [CLONE_INLINE_START],
        1: [CLONE_INLINE_START],
        2: ['master'],
        3: ['master'],
        4: ['master'],
        5: ['master'],
        6: ['master'],
        7: [CLONE_INLINE_END],
        8: [CLONE_INLINE_END],
        9: [CLONE_INLINE_END],
      });
    });

    it('should leave the corners and the top/bottom clones without ownership', () => {
      const renderer = createRenderer({ fixedColumnsEnd: 2 });

      [CLONE_TOP, CLONE_BOTTOM, CLONE_TOP_INLINE_END_CORNER, CLONE_BOTTOM_INLINE_END_CORNER].forEach((name) => {
        renderer.activeOverlayName = name;

        expect(renderer.ownsAriaColumnHeaderId(9, 0, 8)).toBe(false);
        expect(renderer.ownsAriaColumnHeaderId(3, 0, 8)).toBe(false);
      });
    });

    it('should make the master own every non-start column when no end column is frozen', () => {
      const renderer = createRenderer();

      renderer.activeOverlayName = 'master';

      expect(renderer.ownsAriaColumnHeaderId(9, 1)).toBe(true);
      expect(renderer.ownsAriaColumnHeaderId(0, 1)).toBe(false);
    });
  });

  describe('getAriaColumnHeaderIndex', () => {
    it('should name an end clone column by its place in the grid, row headers counted', () => {
      const renderer = createRenderer({ rowHeaders: 1 });

      END_CLONES.forEach((name) => {
        renderer.activeOverlayName = name;

        // The clone's own first cell (visible index 0) is the grid's column 7: 7 + 1 row header + 1.
        expect(renderer.getAriaColumnHeaderIndex(0, 7)).toBe(9);
        expect(renderer.getAriaColumnHeaderIndex(2, 9)).toBe(11);
      });
    });

    it('should count without row headers when the grid has none', () => {
      const renderer = createRenderer({ rowHeaders: 0 });

      renderer.activeOverlayName = CLONE_INLINE_END;

      expect(renderer.getAriaColumnHeaderIndex(0, 7)).toBe(8);
    });

    it('should name a column by its place in the grid in every table, scrolled or not', () => {
      const renderer = createRenderer({ rowHeaders: 1 });

      OVERLAYS.forEach((name) => {
        renderer.activeOverlayName = name;

        // A scrolled master or top clone starts at column 7: its 5th header cell (visible index 4) is column 11,
        // the very number the body cell of that column carries (11 + 1 row header + 1).
        expect(renderer.getAriaColumnHeaderIndex(4, 11)).toBe(13);
        expect(renderer.getAriaColumnHeaderIndex(0, 0)).toBe(2);
      });
    });

    it('should count a row header cell by its rendered position', () => {
      const renderer = createRenderer();

      OVERLAYS.forEach((name) => {
        renderer.activeOverlayName = name;

        expect(renderer.getAriaColumnHeaderIndex(0, -1)).toBe(1);
      });
    });
  });
});
