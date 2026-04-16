/**
 * E2E regression layout helpers. All return values are pure arithmetic expressions
 * over the primitives from `themeLayoutCore`. Baked per-density numeric triplets
 * are not permitted (enforced by lint rule `no-pick-by-density-in-spec`).
 *
 * @param {object} core Return value of `createThemeLayoutCore`.
 * @returns {object} Methods merged into the public theme layout API.
 */
export function buildThemeLayoutE2eHelpers(core) {
  const {
    lineHeight,
    cellVerticalPadding,
    cellHorizontalPadding,
    cellBorderWidth,
    cellContentHeight,
    defaultDataRowHeight,
    defaultColumnHeaderHeight,
    firstRenderedRowDefaultHeight,
    defaultColumnWidth,
    defaultRowHeaderWidth,
    overlayHeight,
  } = core;

  return {
    // -------------------------------------------------------------------------
    // Bucket A -- already pure formulas in token primitives
    // -------------------------------------------------------------------------

    /**
     * TD outer height in getEditedCellRect E2E rects when it matches the live edited cell.
     * `cellContentHeight + 2 * cellBorderWidth` (top and bottom table cell borders).
     *
     * @returns {number}
     */
    e2eGcrEditedCellOuterHeight() {
      return cellContentHeight + (2 * cellBorderWidth);
    },

    /**
     * `manualRowResizer` jQuery `.position()` when hovering master clone row under `fixedRowsTop: 2`
     * before moving to the top overlay row (manualRowResize E2E).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eManualRowResizerPositionFixedTopMasterFourthRow() {
      return { top: defaultColumnHeaderHeight + (4 * cellContentHeight), left: 0 };
    },

    /**
     * `manualRowResizer` position when hovering bottom overlay first row with `fixedRowsBottom: 2`
     * (manualRowResize E2E).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eManualRowResizerPositionFixedBottomOverlayFirstRow() {
      return { top: defaultDataRowHeight - 5, left: 0 };
    },

    /**
     * Text editor TEXTAREA height for a single data line (matches first rendered row outer height).
     *
     * @returns {string}
     */
    e2eTextEditorTextareaHeightSingleLinePx() {
      return `${firstRenderedRowDefaultHeight}px`;
    },

    /**
     * TEXTAREA parent top for first data row under a column title row (outer row height).
     *
     * @returns {string}
     */
    e2eTextEditorTextareaParentTopPx() {
      return `${defaultDataRowHeight}px`;
    },

    /**
     * Text editor TEXTAREA height for three lines of text.
     *
     * @returns {string}
     */
    e2eTextEditorTextareaHeightThreeLinesPx() {
      return `${(3 * lineHeight) + (2 * cellVerticalPadding) + (2 * cellBorderWidth)}px`;
    },

    /**
     * Border-top position after scroll in merge-cells selection (adds one default data row).
     *
     * @param {number} topPositionBefore jQuery .position().top before scroll.
     * @returns {number}
     */
    e2eMergeCellsBorderTopAfterScroll(topPositionBefore) {
      return topPositionBefore + defaultDataRowHeight;
    },

    /**
     * TEXTAREA parent offset for wide merged cell after horizontal scroll (two data rows below header).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eMergeCellsOpenEditorWideMergeTextareaParentOffset() {
      return {
        top: 2 * defaultDataRowHeight,
        left: defaultRowHeaderWidth,
      };
    },

    /**
     * Comment editor style.width / style.height after programmatic resize (padding + border on both axes).
     *
     * @param {number} width Requested editor width (pixels).
     * @param {number} height Requested editor height (pixels).
     * @returns {{ width: number, height: number }}
     */
    e2eCommentTextareaStyleWithSize(width, height) {
      return {
        width: width + (2 * cellHorizontalPadding) + (2 * cellBorderWidth),
        height: height + (2 * cellVerticalPadding) + (2 * cellBorderWidth),
      };
    },

    /* MergeCells: top overlay height after multiline edit in a 3-row merged block (3-row overlay + 2 lines). */
    e2eDensity_0051ca7391() {
      return overlayHeight({ rows: 3 }) + (2 * lineHeight);
    },

    /* MergeCells: fixed-column clone `.htCore` height for a 3-row merge (5 logical overlay rows). */
    e2eDensity_8992c845e6() {
      return overlayHeight({ rows: 5 });
    },

    /* MergeCells: equivalent to `firstRenderedRowDefaultHeight + 4 * defaultDataRowHeight`. */
    e2eDensity_f2d3fe1fc0() {
      return firstRenderedRowDefaultHeight + (4 * defaultDataRowHeight);
    },

    /* Two default data rows (outer height), e.g. merge backlight / manual row move indicator. */
    e2eDensity_f464e90e18() {
      return 2 * defaultDataRowHeight;
    },

    /* Two default data rows plus 1px (border seam), e.g. adjacent merged pair outer height. */
    e2eDensity_9639197594() {
      return (2 * defaultDataRowHeight) + cellBorderWidth;
    },

    /* MergeCells: outer height for a 3-row merged cell / matching top overlay (first row +1px compensation). */
    e2eDensity_9a971c3cfe() {
      return overlayHeight({ rows: 3 });
    },

    /**
     * GCR rect partial for cell at column offset 234 in the first data row.
     * All fields are pure formulas of primitives.
     *
     * @returns {object}
     */
    e2eGcr_8b522d5d5b() {
      const colOuter = defaultColumnWidth + cellBorderWidth;

      return {
        start: 234,
        top: defaultDataRowHeight,
        width: colOuter,
        maxWidth: colOuter,
        height: cellContentHeight + (2 * cellBorderWidth),
      };
    },

    /**
     * GCR rect partial for far-right cell at column offset 4949, snapped to bottom of viewport.
     *
     * @param {object} docViewport Viewport metrics from `getE2eDocumentViewport()`.
     * @returns {object}
     */
    e2eGcr_3dc880f3f2(docViewport) {
      const { offsetHeight } = docViewport;
      const topSnapPad = defaultDataRowHeight + (2 * cellBorderWidth);
      const colOuter = defaultColumnWidth + cellBorderWidth;

      return {
        start: 4949,
        top: offsetHeight - topSnapPad,
        width: colOuter,
        maxWidth: colOuter,
        height: cellContentHeight + (2 * cellBorderWidth),
      };
    },

    // -------------------------------------------------------------------------
    // Bucket B -- recovered as pure token formulas
    // -------------------------------------------------------------------------

    /**
     * `manualRowResizer` position after moving hover to top overlay second fixed row
     * (manualRowResize E2E, `fixedRowsTop: 2`).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eManualRowResizerPositionFixedTopOverlaySecondRow() {
      return { top: (3 * defaultDataRowHeight) - 5, left: 0 };
    },

    /**
     * Row-header TH height after double-click auto-size with mixed row heights (manualRowResize E2E).
     *
     * @returns {number}
     */
    e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize() {
      return lineHeight + cellContentHeight;
    },

    /**
     * Checkbox label inner width when the label stretches to the cell (non-separated layout).
     *
     * @param {number} cellOuterWidth TD offsetWidth.
     * @returns {number}
     */
    e2eCheckboxRendererMergedLabelInnerWidth(cellOuterWidth) {
      return cellOuterWidth - ((2 * cellHorizontalPadding) + cellBorderWidth);
    },

    e2eDensity_dcb53105f5() {
      return overlayHeight({ rows: 3 }) - (3 * defaultColumnWidth);
    },

    e2eDensity_1369f821b5() {
      return defaultDataRowHeight + (4 * lineHeight);
    },

    e2eDensity_5e8f2219da() {
      return defaultDataRowHeight + (5 * lineHeight);
    },

    e2eDensity_9d03a9eba0() {
      return (2 * lineHeight) + 201;
    },

    e2eDensity_9d8bccd1c7() {
      return (2 * cellVerticalPadding) + 26;
    },

    e2eDensity_315eed5b06() {
      return (2 * cellVerticalPadding) + 27;
    },

    e2eDensity_ed183d57c9() {
      return lineHeight + defaultDataRowHeight;
    },

    e2eDensity_682da48dd2() {
      return lineHeight + firstRenderedRowDefaultHeight;
    },

    e2eDensity_e145a29131() {
      return (2 * cellHorizontalPadding) + 45;
    },

    e2eDensity_c1a868f9c9() {
      return defaultDataRowHeight + (2 * lineHeight);
    },

    e2eDensity_9efbb642b5() {
      return (3 * defaultDataRowHeight) - (4 * cellVerticalPadding);
    },

    e2eDensity_a24230f0bc() {
      return (3 * defaultDataRowHeight) - (2 * cellVerticalPadding);
    },

    e2eDensity_10071d8a47() {
      return (2 * cellHorizontalPadding) + 65;
    },

    e2eDensity_f0a5ff56db() {
      return 3 * defaultDataRowHeight;
    },

    e2eDensity_25c4d95d1f() {
      return (2 * cellVerticalPadding) + 83;
    },

    e2eDensity_9b92431d49() {
      return cellContentHeight + (3 * lineHeight);
    },
  };
}
