import { getCellCoordsFromMousePosition } from 'handsontable/helpers/dom/cellCoords';

/**
 * Builds a minimal HOT instance stub for getCellCoordsFromMousePosition tests.
 *
 * Merges are described declaratively through `mergedCells`: only the anchor cell reports a
 * `rowspan`/`colspan` in its meta (matching real Handsontable), and every rendered slave of a
 * vertical merge resolves to the SAME cached `<td>` element — so a lookup can detect the merge by
 * element identity even when the anchor sits outside the scanned range.
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
 * @param {number}   opts.totalRows        Total number of rows (defaults to lastRow + 1).
 * @param {number}   opts.totalCols        Total number of columns (defaults to lastCol + 1).
 * @param {number}   opts.fixedRowsTop     Count of frozen top rows.
 * @param {number}   opts.fixedRowsBottom  Count of frozen bottom rows.
 * @param {Array}    opts.mergedCells      Merge anchors as `{ row, col, rowspan?, colspan? }`.
 * @param {number[]} opts.hiddenColumns    Columns that render no cell (`getCell` returns null).
 * @param {number[]} opts.hiddenMetaColumns Columns that render but report `hidden: true` meta
 *                                          (e.g. a horizontal-merge slave).
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
  totalRows,
  totalCols,
  fixedRowsTop = 0,
  fixedRowsBottom = 0,
  mergedCells = [],
  hiddenColumns = [],
  hiddenMetaColumns = [],
  rowHeight = 23,
  colWidth = 80,
} = {}) {
  const rowCount = totalRows ?? (lastRow + 1);
  const colCount = totalCols ?? (lastCol + 1);
  const merges = mergedCells.map(m => ({ rowspan: 1, colspan: 1, ...m }));

  // Returns the merge whose band covers (row, col), or null.
  const findMerge = (row, col) => merges.find(m =>
    row >= m.row && row < m.row + m.rowspan &&
    col >= m.col && col < m.col + m.colspan) ?? null;

  // Cell top for a row. Frozen top rows sit at the top edge, frozen bottom rows at the bottom
  // edge, and scrollable rows are viewport-relative to the first partially visible row.
  const cellTop = (row) => {
    if (fixedRowsTop > 0 && row < fixedRowsTop) {
      return tableRect.top + colHeaderHeight + (row * rowHeight);
    }
    if (fixedRowsBottom > 0 && row >= rowCount - fixedRowsBottom) {
      return tableRect.top + colHeaderHeight + viewportHeight - ((rowCount - row) * rowHeight);
    }

    return tableRect.top + colHeaderHeight + ((row - firstRow) * rowHeight);
  };
  // Rendered left for a column, skipping the width of any hidden columns before it.
  const cellLeft = (col) => {
    let hiddenBefore = 0;

    for (let c = firstCol; c < col; c++) {
      if (hiddenColumns.includes(c)) {
        hiddenBefore += 1;
      }
    }

    return tableRect.left + rowHeaderWidth + ((col - firstCol - hiddenBefore) * colWidth);
  };
  // Cell right for col c in RTL (columns grow leftward from the right edge of the viewport).
  const cellRight = c => tableRect.right - rowHeaderWidth - ((c - firstCol) * colWidth);

  const makeCell = (row, col, merge) => {
    const el = document.createElement('td');
    const anchorRow = merge ? merge.row : row;
    const height = rowHeight * (merge ? merge.rowspan : 1);
    const width = colWidth * (merge ? merge.colspan : 1);
    const top = cellTop(anchorRow);
    const rect = isRtl
      ? { top, right: cellRight(col), bottom: top + height, left: cellRight(col) - width }
      : { top, left: cellLeft(col), bottom: top + height, right: cellLeft(col) + width };

    Object.defineProperty(el, 'offsetHeight', { get: () => height });
    Object.defineProperty(el, 'offsetWidth', { get: () => width });
    el.getBoundingClientRect = () => rect;

    return el;
  };

  // Cache one element per vertical-merge band so its slaves share element identity.
  const bandCache = new Map();

  const getCell = (row, col) => {
    if (hiddenColumns.includes(col)) {
      return null;
    }

    const merge = findMerge(row, col);

    if (merge && merge.rowspan > 1) {
      const key = `${merge.row}:${merge.col}`;

      if (!bandCache.has(key)) {
        bandCache.set(key, makeCell(row, col, merge));
      }

      return bandCache.get(key);
    }

    return makeCell(row, col, merge);
  };

  const getCellMeta = (row, col) => {
    const anchor = merges.find(m => m.row === row && m.col === col);
    const meta = anchor
      ? { rowspan: anchor.rowspan, colspan: anchor.colspan }
      : { rowspan: 1, colspan: 1 };

    if (hiddenMetaColumns.includes(col)) {
      meta.hidden = true;
    }

    return meta;
  };

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
    countRows: () => rowCount,
    countCols: () => colCount,
    getCell,
    getCellMeta,
    getCellMetaTransient: getCellMeta,
    _createCellCoords: (row, col) => ({ row, col }),
    columnIndexMapper: {
      getVisualFromRenderableIndex: n => n,
      getNearestNotHiddenIndex: n => n,
    },
    rowIndexMapper: {
      getVisualFromRenderableIndex: n => n,
      getNearestNotHiddenIndex: n => n,
      getNotHiddenIndexesLength: () => rowCount,
    },
    view: {
      isVerticallyScrollableByWindow: () => isWindowScrollV,
      isHorizontallyScrollableByWindow: () => isWindowScrollH,
      getViewportWidth: () => viewportWidth,
      getViewportHeight: () => viewportHeight,
      getColumnHeaderHeight: () => colHeaderHeight,
      getRowHeaderWidth: () => rowHeaderWidth,
      countNotHiddenFixedColumnsStart: () => 0,
      countNotHiddenFixedRowsTop: () => fixedRowsTop,
      countNotHiddenFixedRowsBottom: () => fixedRowsBottom,
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

  describe('vertical merge in a column other than the one under the mouse', () => {
    // Reproduces DEV-2115: the first visible column (col 0) has a vertical merge
    // spanning rows 2-4 (rowspan 3). The row lookup used to always measure against
    // that first column, so any mouse Y inside the merged band collapsed onto the
    // merge anchor (row 2). When the mouse is over a NON-merged column, the row must
    // resolve to the actual row under the pointer, independent of the other column's
    // merge.
    const mergedFirstColumnGeometry = {
      tableRect: { left: 0, top: 0, right: 500, bottom: 180 },
      viewportWidth: 500,
      viewportHeight: 180,
      firstRow: 0,
      lastRow: 5,
      firstCol: 0,
      lastCol: 4,
      rowHeight: 30,
      colWidth: 80,
      mergedCells: [{ row: 2, col: 0, rowspan: 3 }], // rows 2-4 merged in column 0
    };

    it('resolves the row under the mouse in a non-merged column, ignoring the merge in column 0', () => {
      const hot = buildHot(mergedFirstColumnGeometry);
      // Mouse over column 1 (x 80-160), Y at the centre of row 3 (90..120 → 105).
      const coords = getCellCoordsFromMousePosition(hot, 100, 105);

      expect(coords.col).toBe(1);
      expect(coords.row).toBe(3);
    });

    it('resolves the last merged-band row in a non-merged column', () => {
      const hot = buildHot(mergedFirstColumnGeometry);
      // Y at the centre of row 4 (120..150 → 135), still inside column 0's merged band.
      const coords = getCellCoordsFromMousePosition(hot, 100, 135);

      expect(coords.col).toBe(1);
      expect(coords.row).toBe(4);
    });
  });

  describe('reference column selection with a horizontal merge present', () => {
    // Regression guard: column 1 is a slave of a purely horizontal merge, so its cells report
    // `hidden: true` while still rendering at their own single-row height. Column 0 holds a
    // vertical merge (rows 0-2). The row lookup must not reject column 1 just because it is
    // hidden — otherwise it falls back to the vertically merged column 0 and collapses the row.
    const horizontalSlaveGeometry = {
      tableRect: { left: 0, top: 0, right: 160, bottom: 120 },
      viewportWidth: 160,
      viewportHeight: 120,
      firstRow: 0,
      lastRow: 3,
      firstCol: 0,
      lastCol: 1,
      rowHeight: 30,
      colWidth: 80,
      mergedCells: [{ row: 0, col: 0, rowspan: 3 }], // column 0 merged across rows 0-2
      hiddenMetaColumns: [1], // column 1 renders per-row but reports hidden: true (horizontal slave)
    };

    it('does not reject a hidden horizontal-merge slave as the row reference', () => {
      const hot = buildHot(horizontalSlaveGeometry);
      // Y at the centre of row 2 (60..90 → 75), inside column 0's vertical merge band.
      // Column 1 (hidden horizontal slave) has real per-row heights, so the row must resolve
      // to 2 - not collapse onto the merge anchor (row 0) via a fallback to column 0.
      const coords = getCellCoordsFromMousePosition(hot, 100, 75);

      expect(coords.row).toBe(2);
    });
  });

  describe('vertical merge confined to the fixed (frozen) top rows', () => {
    // Regression guard (DEV-2115 follow-up): a vertical merge that lives only in the frozen top
    // rows must be detected when resolving a row inside the frozen overlay. The reference column
    // is chosen per row-scan range, so the fixed-top walk sees the frozen merge even though the
    // scrollable "partially visible" range starts below it.
    const frozenTopMergeGeometry = {
      tableRect: { left: 0, top: 0, right: 400, bottom: 400 },
      viewportWidth: 400,
      viewportHeight: 400,
      // Scrollable body is scrolled down - the frozen rows (0-2) are outside this range.
      firstRow: 10,
      lastRow: 20,
      firstCol: 0,
      lastCol: 4,
      totalRows: 30,
      fixedRowsTop: 3,
      rowHeight: 30,
      colWidth: 80,
      mergedCells: [{ row: 0, col: 0, rowspan: 2 }], // A1:A2 vertical merge in frozen rows
    };

    it('resolves a frozen row inside the merge band using a merge-free reference column', () => {
      const hot = buildHot(frozenTopMergeGeometry);
      // Y at the centre of frozen row 1 (30..60 → 45), inside column 0's frozen merge band.
      // Pointer over column 1 (x 80-160). Must resolve to row 1, not the merge anchor (row 0).
      const coords = getCellCoordsFromMousePosition(hot, 100, 45);

      expect(coords.col).toBe(1);
      expect(coords.row).toBe(1);
    });
  });

  describe('vertical merge confined to the fixed (frozen) bottom rows', () => {
    // Regression guard (DEV-2115 follow-up): the fixed-bottom row-scan branch must pick a
    // merge-free reference column exactly like the fixed-top and scrollable branches. A vertical
    // merge inside the frozen bottom band would otherwise collapse the resolved row onto the
    // merge anchor. This also pins the branch's row-scan arguments: passing them in the wrong
    // order makes `findRowReferenceColumn` scan an empty range and hand back the merged column.
    const frozenBottomMergeGeometry = {
      tableRect: { left: 0, top: 0, right: 400, bottom: 400 },
      viewportWidth: 400,
      viewportHeight: 400,
      // Scrollable body is scrolled to the middle - the frozen bottom rows (28-29) are below it.
      firstRow: 10,
      lastRow: 20,
      firstCol: 0,
      lastCol: 4,
      totalRows: 30,
      fixedRowsBottom: 2,
      rowHeight: 30,
      colWidth: 80,
      mergedCells: [{ row: 28, col: 0, rowspan: 2 }], // A29:A30 vertical merge in frozen bottom rows
    };

    it('resolves a frozen bottom row inside the merge band using a merge-free reference column', () => {
      const hot = buildHot(frozenBottomMergeGeometry);
      // The frozen bottom band spans y 340..400 (rows 28-29). Y at the centre of row 29
      // (370..400 → 385). Pointer over column 1. Must resolve to row 29, not the merge
      // anchor (row 28).
      const coords = getCellCoordsFromMousePosition(hot, 100, 385);

      expect(coords.col).toBe(1);
      expect(coords.row).toBe(29);
    });
  });

  describe('hidden column between the merged column and a usable one', () => {
    // Regression guard (DEV-2115 follow-up): column 0 is vertically merged (rows 0-2) and
    // column 1 is hidden (e.g. `hiddenColumns`), so it renders no cells. The reference-column
    // search must skip the hidden column (no renderable cell to measure) rather than pick it,
    // which would hand back a null start cell and collapse the row lookup.
    const hiddenColumnGeometry = {
      tableRect: { left: 0, top: 0, right: 240, bottom: 120 },
      viewportWidth: 240,
      viewportHeight: 120,
      firstRow: 0,
      lastRow: 3,
      firstCol: 0,
      lastCol: 2,
      rowHeight: 30,
      colWidth: 80,
      mergedCells: [{ row: 0, col: 0, rowspan: 3 }], // column 0 merged across rows 0-2
      hiddenColumns: [1], // column 1 renders no cell
    };

    it('skips the hidden column and resolves the row against column 2', () => {
      const hot = buildHot(hiddenColumnGeometry);
      // Pointer over column 2 (x 80-160), Y at the centre of row 2 (60..90 → 75), inside
      // column 0's merged band. Must resolve to row 2 via column 2, not collapse onto row 0.
      const coords = getCellCoordsFromMousePosition(hot, 100, 75);

      expect(coords.col).toBe(2);
      expect(coords.row).toBe(2);
    });
  });

  describe('vertical merge whose anchor sits above the scanned range', () => {
    // Regression guard for the element-identity signal in findRowReferenceColumn: column 0 holds
    // a vertical merge anchored at row 8 (rowspan 5, rows 8-12), but the scrollable range starts
    // at row 10. None of the scanned slave rows (10-12) reports a rowspan - only the anchor does,
    // and it is out of range. The merge is detectable ONLY because every slave resolves to the
    // same rendered element. Without the identity check the row would collapse onto row 10.
    const anchorAboveRangeGeometry = {
      tableRect: { left: 0, top: 0, right: 400, bottom: 330 },
      viewportWidth: 400,
      viewportHeight: 330,
      firstRow: 10,
      lastRow: 20,
      firstCol: 0,
      lastCol: 4,
      totalRows: 30,
      rowHeight: 30,
      colWidth: 80,
      mergedCells: [{ row: 8, col: 0, rowspan: 5 }], // rows 8-12; anchor (row 8) is above the range
    };

    it('detects the merge by element identity and resolves the true row under the pointer', () => {
      const hot = buildHot(anchorAboveRangeGeometry);
      // Pointer over column 1 (x 80-160), Y at the centre of row 12 (60..90 → 75, viewport-
      // relative to firstRow 10). Column 0's slaves 10-12 share one element, so column 0 is
      // rejected and the row resolves via column 1 to row 12.
      const coords = getCellCoordsFromMousePosition(hot, 100, 75);

      expect(coords.col).toBe(1);
      expect(coords.row).toBe(12);
      // Guard: without the identity check the merged column 0 would be used and collapse to row 10.
      expect(coords.row).not.toBe(10);
    });
  });
});
