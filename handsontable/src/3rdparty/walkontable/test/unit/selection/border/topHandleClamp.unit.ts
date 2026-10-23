import Border from 'walkontable/selection/border/border';

/**
 * The start-edge clamp of the mobile top selection handle, run against a stub `this`: the method only
 * reads `this.wot`, `this.selectionHandles` and three occlusion predicates, so no DOM is built.
 */

type Styles = Record<string, string>;

type HandleStub = {
  wot: unknown,
  selectionHandles: { styles: { top: Styles, topHitArea: Styles, bottom: Styles, bottomHitArea: Styles } },
  settings: Record<string, unknown>,
  isTopHandleOccludedByClone: (axis: 'row' | 'column') => boolean,
  isSouthEastOfAreaSelection: () => boolean,
  isBottomHandleOccludedByInlineEndClone: () => boolean,
  isBottomHandleOccludedByClone: () => boolean,
};

const HANDLE_SIZE = 12;
const HIT_AREA_SIZE = 40;

/**
 * Builds the stub.
 *
 * @param {object} options The grid shape.
 * @param {boolean} [options.rtl=false] Whether the grid is right to left.
 * @param {number} [options.firstRenderedRow=0] The first row the table renders.
 * @param {number} [options.firstRenderedColumn=0] The first column the table renders.
 * @param {boolean} [options.underTopClone=false] Whether a clone covers the top edge.
 * @param {boolean} [options.underInlineStartClone=false] Whether a clone covers the inline-start edge.
 * @param {boolean} [options.cornerVisible=false] Whether the handles are shown at all, so their `display` is set.
 * @returns {object}
 */
function createBorder({ rtl = false, firstRenderedRow = 0, firstRenderedColumn = 0, underTopClone = false,
  underInlineStartClone = false, cornerVisible = false } = {}): HandleStub {
  return Object.assign(Object.create(Border.prototype), {
    wot: {
      wtSettings: { getSetting: (key: string) => (key === 'rtlMode' ? rtl : undefined) },
      wtTable: {
        getFirstRenderedRow: () => firstRenderedRow,
        getFirstRenderedColumn: () => firstRenderedColumn,
        getWidth: () => 350,
        getHeight: () => 300,
      },
    },
    selectionHandles: {
      styles: {
        top: { borderWidth: '2px', width: `${HANDLE_SIZE}px` },
        topHitArea: { width: `${HIT_AREA_SIZE}px` },
        bottom: {},
        bottomHitArea: {},
      },
    },
    settings: cornerVisible ? { border: { cornerVisible: () => true } } : {},
    isTopHandleOccludedByClone: (axis: 'row' | 'column') => (axis === 'row' ? underTopClone : underInlineStartClone),
    isSouthEastOfAreaSelection: () => true,
    isBottomHandleOccludedByInlineEndClone: () => false,
    isBottomHandleOccludedByClone: () => false,
  }) as HandleStub;
}

/**
 * Positions the handles of a selection whose top-start cell sits at `top` / `left`.
 *
 * @param {object} border The stub.
 * @param {object} cell The top-start cell: raw corner indexes and its offset in the table.
 * @param {number} cell.row The raw start row.
 * @param {number} cell.col The raw start column.
 * @param {number} cell.top The cell's top offset in the table.
 * @param {number} cell.left The cell's inline-start offset in the table.
 * @returns {object} The style objects the method wrote to.
 */
function position(
  border: HandleStub,
  { row, col, top, left }: { row: number, col: number, top: number, left: number },
) {
  (Border.prototype as unknown as { updateMultipleSelectionHandlesPosition: (...args: unknown[]) => void })
    .updateMultipleSelectionHandlesPosition.call(border, row, col, row + 2, col + 1, top, left, 100, 60);

  return border.selectionHandles.styles;
}

describe('Border#updateMultipleSelectionHandlesPosition, top handle at the start edges', () => {
  it('should keep the handle on the table and shift its hit area by the same distance at the first cell', () => {
    const styles = position(createBorder(), { row: 0, col: 0, top: 0, left: 0 });

    // Unclamped: -13px for the handle and -30px for the hit area.
    expect(styles.top).toMatchObject({ top: '0px', left: '0px' });
    expect(styles.topHitArea).toMatchObject({ top: '-17px', left: '-17px' });
  });

  it('should clamp the inline property that the direction names', () => {
    const styles = position(createBorder({ rtl: true }), { row: 0, col: 0, top: 0, left: 0 });

    expect(styles.top).toMatchObject({ top: '0px', right: '0px' });
    expect(styles.top.left).toBeUndefined();
    expect(styles.topHitArea).toMatchObject({ top: '-17px', right: '-17px' });
  });

  it('should clamp one axis and leave the other at the outer corner', () => {
    const rowOnly = position(createBorder(), { row: 0, col: 3, top: 0, left: 100 });
    const columnOnly = position(createBorder(), { row: 3, col: 0, top: 80, left: 0 });

    expect(rowOnly.top).toMatchObject({ top: '0px', left: '87px' });
    expect(rowOnly.topHitArea).toMatchObject({ top: '-17px', left: '70px' });
    expect(columnOnly.top).toMatchObject({ top: '67px', left: '0px' });
    expect(columnOnly.topHitArea).toMatchObject({ top: '50px', left: '-17px' });
  });

  it('should not move a handle that already sits on the table, hit area included', () => {
    // A cell 23px from the top edge: the handle is at 10px, the hit area hangs 7px past the edge.
    const styles = position(createBorder(), { row: 1, col: 1, top: 23, left: 60 });

    expect(styles.top).toMatchObject({ top: '10px', left: '47px' });
    expect(styles.topHitArea).toMatchObject({ top: '-7px', left: '30px' });
  });

  it('should leave an axis alone when the real start is scrolled out of the rendered band', () => {
    // `top` and `left` measure the first rendered row and column here, not the selection's corner.
    const styles = position(createBorder({ firstRenderedRow: 20, firstRenderedColumn: 4 }),
      { row: 0, col: 0, top: 0, left: 0 });

    expect(styles.top).toMatchObject({ top: '-13px', left: '-13px' });
    expect(styles.topHitArea).toMatchObject({ top: '-30px', left: '-30px' });
  });

  it('should clamp when the real start is the first rendered track of a scrolled table', () => {
    const styles = position(createBorder({ firstRenderedRow: 20, firstRenderedColumn: 4 }),
      { row: 20, col: 4, top: 0, left: 0 });

    expect(styles.top).toMatchObject({ top: '0px', left: '0px' });
    expect(styles.topHitArea).toMatchObject({ top: '-17px', left: '-17px' });
  });

  it('should place the handle inside the cell when a clone covers the edge', () => {
    const styles = position(createBorder({ underTopClone: true, underInlineStartClone: true }),
      { row: 0, col: 0, top: 30, left: 50 });

    expect(styles.top).toMatchObject({ top: '31px', left: '51px' });
    expect(styles.topHitArea).toMatchObject({ top: '30px', left: '50px' });
  });

  describe('display', () => {
    it('should hide the handle and its hit area when a clone covers a start row that is scrolled out', () => {
      // `top` measures the first rendered row, which is the first visible one with no row overscan.
      const styles = position(createBorder({ underTopClone: true, firstRenderedRow: 20, cornerVisible: true }),
        { row: 0, col: 1, top: 0, left: 50 });

      expect(styles.top.display).toBe('none');
      expect(styles.topHitArea.display).toBe('none');
      expect(styles.bottom.display).toBe('block');
    });

    it('should hide the handle when a clone covers a start column that is scrolled out', () => {
      const styles = position(
        createBorder({ underInlineStartClone: true, firstRenderedColumn: 10, cornerVisible: true }),
        { row: 1, col: 0, top: 30, left: 0 },
      );

      expect(styles.top.display).toBe('none');
      expect(styles.topHitArea.display).toBe('none');
    });

    it('should hide the handle when no clone covers the edge and the start is scrolled out', () => {
      const styles = position(createBorder({ firstRenderedRow: 20, cornerVisible: true }),
        { row: 3, col: 1, top: 0, left: 50 });

      expect(styles.top.display).toBe('none');
      expect(styles.topHitArea.display).toBe('none');
    });

    it('should show the handle when the real start is the first rendered track', () => {
      const styles = position(
        createBorder({ underTopClone: true, firstRenderedRow: 20, firstRenderedColumn: 4, cornerVisible: true }),
        { row: 20, col: 4, top: 0, left: 0 },
      );

      expect(styles.top.display).toBe('block');
      expect(styles.topHitArea.display).toBe('block');
    });

    it('should show the handle of a header-anchored corner whatever the first rendered track is', () => {
      const styles = position(
        createBorder({ underTopClone: true, firstRenderedRow: 20, firstRenderedColumn: 4, cornerVisible: true }),
        { row: -1, col: -1, top: 0, left: 0 },
      );

      expect(styles.top.display).toBe('block');
      expect(styles.topHitArea.display).toBe('block');
    });
  });
});
