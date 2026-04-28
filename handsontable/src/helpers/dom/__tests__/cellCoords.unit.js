import { getCellCoordsFromMousePosition } from 'handsontable/helpers/dom/cellCoords';

/**
 * Builds a minimal HOT instance stub for getCellCoordsFromMousePosition tests.
 *
 * @param {object} opts
 * @param {boolean} opts.isWindowScrollV  Whether the table scrolls vertically via window.
 * @param {boolean} opts.isWindowScrollH  Whether the table scrolls horizontally via window.
 * @param {DOMRect}  opts.tableRect        getBoundingClientRect() of rootElement.
 * @param {number}   opts.innerWidth       rootWindow.innerWidth.
 * @param {number}   opts.innerHeight      rootWindow.innerHeight.
 * @param {number}   opts.viewportWidth    view.getViewportWidth().
 * @param {number}   opts.viewportHeight   view.getViewportHeight().
 * @param {number}   opts.colHeaderHeight  Column-header height (0 = no headers).
 * @param {number}   opts.rowHeaderWidth   Row-header width (0 = no headers).
 * @param {number}   opts.firstRow         Index of the first partially visible row.
 * @param {number}   opts.lastRow          Index of the last partially visible row.
 * @param {number}   opts.firstCol         Index of the first partially visible column.
 * @param {number}   opts.lastCol          Index of the last partially visible column.
 * @param {boolean}  opts.isRtl            Whether the table is in RTL layout.
 * @param {number}   opts.rowHeight        Uniform row height in pixels.
 * @param {number}   opts.colWidth         Uniform column width in pixels.
 * @returns {object} Stubbed HOT instance.
 */
function buildHot({
  isRtl = false,
  isWindowScrollV = false,
  isWindowScrollH = false,
  tableRect = { left: 0, top: 0, right: 500, bottom: 500 },
  innerWidth = 1280,
  innerHeight = 720,
  viewportWidth = 500,
  viewportHeight = 500,
  colHeaderHeight = 0,
  rowHeaderWidth = 0,
  firstRow = 0,
  lastRow = 9,
  firstCol = 0,
  lastCol = 4,
  rowHeight = 23,
  colWidth = 80,
} = {}) {
  // Cell top for row r (viewport-relative, accounting for column header and table top).
  const cellTop = r => tableRect.top + colHeaderHeight + ((r - firstRow) * rowHeight);
  // Cell right for col c in RTL (columns grow leftward from the right edge of the viewport).
  const cellRight = c => tableRect.right - rowHeaderWidth - ((c - firstCol) * colWidth);
  // Cell left for col c (viewport-relative, accounting for row header and table left).
  const cellLeft = c => tableRect.left + rowHeaderWidth + ((c - firstCol) * colWidth);

  const hot = {
    rootWindow: { innerWidth, innerHeight },
    rootElement: {
      getBoundingClientRect: () => ({ ...tableRect }),
    },
    isRtl: () => isRtl,
    hasColHeaders: () => colHeaderHeight > 0,
    hasRowHeaders: () => rowHeaderWidth > 0,
    getFirstPartiallyVisibleRow: () => firstRow,
    getLastPartiallyVisibleRow: () => lastRow,
    getFirstPartiallyVisibleColumn: () => firstCol,
    getLastPartiallyVisibleColumn: () => lastCol,
    countRows: () => lastRow + 1,
    countCols: () => lastCol + 1,
    getCell: (row, col) => {
      const el = document.createElement('td');
      const rect = isRtl
        ? {
          top: cellTop(row),
          right: cellRight(col),
          bottom: cellTop(row) + rowHeight,
          left: cellRight(col) - colWidth,
        }
        : {
          top: cellTop(row),
          left: cellLeft(col),
          bottom: cellTop(row) + rowHeight,
          right: cellLeft(col) + colWidth,
        };

      Object.defineProperty(el, 'offsetHeight', { get: () => rowHeight });
      Object.defineProperty(el, 'offsetWidth', { get: () => colWidth });
      el.getBoundingClientRect = () => rect;

      return el;
    },
    getCellMeta: () => ({ rowspan: 1, colspan: 1 }),
    _createCellCoords: (row, col) => ({ row, col }),
    columnIndexMapper: {
      getVisualFromRenderableIndex: n => n,
      getNearestNotHiddenIndex: n => n,
    },
    rowIndexMapper: {
      getVisualFromRenderableIndex: n => n,
      getNearestNotHiddenIndex: n => n,
      getNotHiddenIndexesLength: () => lastRow + 1,
    },
    view: {
      isVerticallyScrollableByWindow: () => isWindowScrollV,
      isHorizontallyScrollableByWindow: () => isWindowScrollH,
      getViewportWidth: () => viewportWidth,
      getViewportHeight: () => viewportHeight,
      getColumnHeaderHeight: () => colHeaderHeight,
      getRowHeaderWidth: () => rowHeaderWidth,
      countNotHiddenFixedColumnsStart: () => 0,
      countNotHiddenFixedRowsTop: () => 0,
      countNotHiddenFixedRowsBottom: () => 0,
    },
  };

  return hot;
}

describe('getCellCoordsFromMousePosition', () => {
  describe('window-scroll vertical boundary', () => {
    // Geometry: 80 rows, viewport 720px tall, column header 26px.
    // Table absolute top = 500px; scrollY = 979px so table is partially above viewport.
    // tableOffset.top  = 500 - 979 = -479
    // tableOffset.bottom = 2366 - 979 = 1387  (table extends far below viewport)
    // firstPartiallyVisibleRow = 19 (row 19 top ≈ -16px in viewport)
    // lastPartiallyVisibleRow  = 51 (row 51 starts ≈ 720px — at the viewport bottom edge)
    const windowScrollGeometry = {
      isWindowScrollV: true,
      tableRect: { left: 0, top: -479, right: 500, bottom: 1387 },
      innerHeight: 720,
      viewportHeight: 720,
      colHeaderHeight: 26,
      firstRow: 19,
      lastRow: 51,
      firstCol: 0,
      lastCol: 4,
      rowHeight: 23,
      colWidth: 80,
    };

    it('clamps mouseY to window.innerHeight when the table extends below the viewport', () => {
      const hot = buildHot(windowScrollGeometry);
      // Mouse is 50px below the window's bottom edge — simulates drag-to-scroll scenario.
      const mouseY = 720 + 50;
      const mouseX = 40; // safely within column 0

      const coords = getCellCoordsFromMousePosition(hot, mouseX, mouseY);

      // With window-scroll clamping, mouseY is clamped to innerHeight (720) not to
      // the old wrong formula (tableOffset.top + viewportHeight + colHeaderHeight = 267).
      // The resulting row must be the last visible row (51), not a row near the viewport
      // top (~row 31) that the old formula would produce.
      expect(coords.row).toBe(51);
    });

    it('returns the correct last row when mouseY is exactly at window.innerHeight', () => {
      const hot = buildHot(windowScrollGeometry);
      const coords = getCellCoordsFromMousePosition(hot, 40, 720);

      expect(coords.row).toBe(51);
    });

    it('returns a row within the visible range for mouseY inside the viewport', () => {
      const hot = buildHot(windowScrollGeometry);
      // Row 30 top = tableRect.top + colHeaderHeight + (30 - 19) * 23 = -479 + 26 + 253 = -200.
      // clientY of row 30 centre ≈ -200 + 11 = -189 — ABOVE viewport, not useful.
      // Use a Y that's visibly inside: e.g. clientY = 300 (inside the 0-720 viewport window).
      // Row at clientY 300: relativeY = 300 - cellTop(19) = 300 - (-16) = 316.
      // row = 19 + floor(316 / 23) = 19 + 13 = row 32.
      const coords = getCellCoordsFromMousePosition(hot, 40, 300);

      expect(coords.row).toBeGreaterThanOrEqual(19);
      expect(coords.row).toBeLessThanOrEqual(51);
    });
  });

  describe('element-scroll vertical boundary (non-window)', () => {
    // Geometry: plain element scroll, 10 rows, each 30px tall, no headers.
    // tableOffset.top = 0, tableOffset.bottom = 300 (table fits inside the viewport).
    const elementScrollGeometry = {
      isWindowScrollV: false,
      tableRect: { left: 0, top: 0, right: 500, bottom: 300 },
      innerHeight: 720,
      viewportHeight: 300,
      colHeaderHeight: 0,
      firstRow: 0,
      lastRow: 9,
      firstCol: 0,
      lastCol: 4,
      rowHeight: 30,
      colWidth: 80,
    };

    it('clamps mouseY to the table bottom edge for non-window scroll', () => {
      const hot = buildHot(elementScrollGeometry);
      // Mouse is 100px below the table (but still inside the browser viewport).
      const coords = getCellCoordsFromMousePosition(hot, 40, 400);

      // Should return last row (9) since the mouse is below the table.
      expect(coords.row).toBe(9);
    });
  });

  describe('window-scroll horizontal boundary', () => {
    // Geometry: table extends to the right of the viewport (4000px wide).
    const windowScrollGeometry = {
      isWindowScrollH: true,
      tableRect: { left: -200, top: 0, right: 4000, bottom: 400 },
      innerWidth: 1280,
      innerHeight: 720,
      viewportWidth: 1280,
      viewportHeight: 400,
      firstRow: 0,
      lastRow: 9,
      firstCol: 3, // scrolled so col 3 is first visible
      lastCol: 18,
      rowHeight: 30,
      colWidth: 80,
    };

    it('clamps mouseX to window.innerWidth when the table extends beyond the viewport', () => {
      const hot = buildHot(windowScrollGeometry);
      // Mouse is 100px to the right of the viewport edge.
      const coords = getCellCoordsFromMousePosition(hot, 1280 + 100, 15);

      // Last partially visible column is 18.
      expect(coords.col).toBe(18);
    });
  });

  describe('window-scroll horizontal boundary — RTL left edge', () => {
    // RTL geometry: table extends far to the left (scrolled so col 35 is the leftmost
    // visible). tableRect.left is positive because in RTL the browser has scrolled
    // rightward, pushing the table's left edge into positive viewport space.
    // This reproduces the bug where clamping to tableOffset.left caused the computed
    // column to stay constant as the table scrolled, so the selection never advanced.
    const rtlLeftEdgeGeometry = {
      isWindowScrollH: true,
      tableRect: { left: 322, top: 0, right: 1422, bottom: 400 },
      innerWidth: 1100,
      innerHeight: 720,
      viewportWidth: 1100,
      viewportHeight: 400,
      firstRow: 0,
      lastRow: 9,
      firstCol: 6, // lowest-indexed visible col (rightmost in RTL)
      lastCol: 25, // highest-indexed visible col (leftmost in RTL)
      rowHeight: 30,
      colWidth: 50,
    };

    it('returns the leftmost visible column when mouseX is past the left viewport edge in RTL window-scroll', () => {
      const hot = buildHot({ ...rtlLeftEdgeGeometry, isRtl: true });
      // Mouse is 100px past the left viewport edge — simulates dragging leftward in RTL.
      const coords = getCellCoordsFromMousePosition(hot, -100, 15);

      // Must return the leftmost visible column (lastCol = 25), not a mid-viewport column.
      // The old bug caused this to return col ~19 because clamping to tableRect.left
      // (322) kept scrollRelativeX constant across scroll ticks.
      expect(coords.col).toBe(25);
    });
  });

  describe('window-scroll horizontal boundary — RTL max-left scroll (tableOffset.left > innerWidth)', () => {
    // Regression: at max-left RTL scroll the browser has scrolled so far that
    // tableOffset.left (4809) exceeds window.innerWidth (1100). The old code used
    // tableOffset.left as the clamp minimum, so clamp(mouseX, 4809, 1100) always
    // returned 4809 (min > max case). This made scrollRelativeX negative, falling
    // back to firstPartiallyVisibleColumn for EVERY mouse position — including cells
    // that were clearly visible in the viewport. It also made isOutside=true for all
    // viewport positions, firing onCellMouseOverOutside with the wrong column.
    const maxLeftScrollGeometry = {
      isRtl: true,
      isWindowScrollH: true,
      // tableRect.left = 4809 > innerWidth = 1100 is the key reproduction condition.
      tableRect: { left: 4809, top: 0, right: 5878, bottom: 400 },
      innerWidth: 1100,
      innerHeight: 720,
      viewportWidth: 1100,
      viewportHeight: 400,
      firstRow: 0,
      lastRow: 9,
      firstCol: 83, // lowest-indexed visible col (rightmost in RTL at max-left position)
      lastCol: 99, // highest-indexed visible col (leftmost in RTL at max-left position)
      rowHeight: 30,
      colWidth: 60,
    };

    it('does not return firstPartiallyVisibleColumn for a mouse inside the viewport', () => {
      const hot = buildHot(maxLeftScrollGeometry);
      // Mouse at clientX=100, well inside the viewport (0-1100).
      // Old code: clamp(100, 4809, 1100) = 4809 → scrollRelativeX < 0 → col 83 (wrong).
      // New code: clamp(100, 0, 1100) = 100 → correct column lookup.
      const coords = getCellCoordsFromMousePosition(hot, 100, 15);

      expect(coords.col).not.toBe(83); // firstPartiallyVisibleColumn — the old wrong result
      expect(coords.col).toBeGreaterThanOrEqual(83);
      expect(coords.col).toBeLessThanOrEqual(99);
    });

    it('returns a column within the visible range for any mouseX inside the viewport', () => {
      const hot = buildHot(maxLeftScrollGeometry);

      // Test several positions across the viewport width.
      [50, 300, 600, 900, 1050].forEach((mouseX) => {
        const coords = getCellCoordsFromMousePosition(hot, mouseX, 15);

        expect(coords.col).toBeGreaterThanOrEqual(83);
        expect(coords.col).toBeLessThanOrEqual(99);
      });
    });
  });
});
