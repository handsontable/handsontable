describe('WalkontableSelectionHandles', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$container = $('<div></div>');
    this.$wrapper.width(200).height(200);
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray();
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should create four adjust-handle elements', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        // On desktop data-view instances, handle elements are always created regardless of
        // `adjustHandlesVisible` — this setting only gates their VISIBILITY during positioning.
        // The positioning / visibility behaviour is exercised by the tests added in the next task.
        // Keep `adjustHandlesVisible` in place: later tests rely on it to opt in to the feature.
        adjustHandlesVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
    });

    selections.getFocus()
      .add(new Walkontable.CellCoords(1, 1))
      .add(new Walkontable.CellCoords(3, 3));

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const handles = focusBorder.main.querySelectorAll('.wtSelectionHandle');

    expect(handles.length).toBe(4);
  });

  it('should show all four handles with display:block for an interior selection not touching any grid edge', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        adjustHandlesVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
    });

    // Selection from row 1, col 1 to row 3, col 3 — interior, no grid edge touched.
    selections.getFocus()
      .add(new Walkontable.CellCoords(1, 1))
      .add(new Walkontable.CellCoords(3, 3));

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const { styles } = focusBorder.adjustHandles;

    // Set explicit pill dimensions so midpoint assertions are deterministic.
    // top/bottom: horizontal pills (width=24, height=8); start/end: vertical pills (width=8, height=24).
    const shortSide = 8;
    const longSide = 24;

    focusBorder.adjustHandles.top.style.width = `${longSide}px`;
    focusBorder.adjustHandles.top.style.height = `${shortSide}px`;
    focusBorder.adjustHandles.bottom.style.width = `${longSide}px`;
    focusBorder.adjustHandles.bottom.style.height = `${shortSide}px`;
    focusBorder.adjustHandles.start.style.width = `${shortSide}px`;
    focusBorder.adjustHandles.start.style.height = `${longSide}px`;
    focusBorder.adjustHandles.end.style.width = `${shortSide}px`;
    focusBorder.adjustHandles.end.style.height = `${longSide}px`;

    // Re-draw so positionAdjustHandles picks up the dimensions we just set.
    wt.draw();

    expect(styles.top.display).toBe('block');
    expect(styles.bottom.display).toBe('block');
    expect(styles.start.display).toBe('block');
    expect(styles.end.display).toBe('block');

    // Top and bottom handles both have the same width (24px), so their inline position is equal
    // (both centred on the same column span).
    expect(styles.top.left).toBe(styles.bottom.left);

    // Start and end handles both have the same height (24px), so their vertical midpoint is equal
    // (both centred on the same row span).
    expect(styles.start.top).toBe(styles.end.top);

    // Numeric non-tautological assertion: the top handle's left must land at the midpoint of the
    // border's horizontal span, offset by half the handle width (half = 12 for a 24px-wide handle).
    // Expected: borderLeft + round(borderWidth / 2) - round(topW / 2).
    // Tolerance of ±2 px accounts for sub-pixel rounding in the implementation.
    const borderLeft = parseInt(focusBorder.topStyle.left, 10);
    const borderWidth = parseInt(focusBorder.topStyle.width, 10);
    const halfTopW = Math.round(longSide / 2); // 12
    const expectedTopHandleLeft = borderLeft + Math.round(borderWidth / 2) - halfTopW;

    expect(Math.abs(parseInt(styles.top.left, 10) - expectedTopHandleLeft)).toBeLessThanOrEqual(2);

    // The top handle must also fall strictly inside the border's horizontal extent, confirming it
    // is genuinely centred and not clamped to an edge.
    expect(parseInt(styles.top.left, 10)).toBeGreaterThan(borderLeft);
    expect(parseInt(styles.top.left, 10)).toBeLessThan(borderLeft + borderWidth);
  });

  it('should apply visual inline styles (size, background, borderRadius, boxSizing, cursor, z-index) to handles immediately after createAdjustHandles', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        adjustHandlesVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
    });

    // Interior selection — no grid edge touched, all four handles will be visible after draw.
    selections.getFocus()
      .add(new Walkontable.CellCoords(1, 1))
      .add(new Walkontable.CellCoords(3, 3));

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const topEl = focusBorder.adjustHandles.top;
    const bottomEl = focusBorder.adjustHandles.bottom;
    const startEl = focusBorder.adjustHandles.start;
    const endEl = focusBorder.adjustHandles.end;

    // Verify visual inline styles set by createAdjustHandles (before any positioning overwrite).
    // This test does NOT overwrite those styles — it checks what createAdjustHandles produced.

    // top/bottom handles are horizontal pills: width (long axis) > height (short axis).
    expect(topEl.style.boxSizing).toBe('border-box');
    expect(topEl.style.background).not.toBe('');
    expect(topEl.style.borderRadius).not.toBe('');
    expect(topEl.style.zIndex).toBe('200');
    expect(topEl.style.cursor).toBe('ns-resize');
    expect(parseInt(topEl.style.width, 10)).toBeGreaterThan(parseInt(topEl.style.height, 10));

    expect(bottomEl.style.boxSizing).toBe('border-box');
    expect(bottomEl.style.background).not.toBe('');
    expect(bottomEl.style.zIndex).toBe('200');
    expect(bottomEl.style.cursor).toBe('ns-resize');
    expect(parseInt(bottomEl.style.width, 10)).toBeGreaterThan(parseInt(bottomEl.style.height, 10));

    // start/end handles are vertical pills: height (long axis) > width (short axis).
    expect(startEl.style.boxSizing).toBe('border-box');
    expect(startEl.style.background).not.toBe('');
    expect(startEl.style.borderRadius).not.toBe('');
    expect(startEl.style.zIndex).toBe('200');
    expect(startEl.style.cursor).toBe('ew-resize');
    expect(parseInt(startEl.style.height, 10)).toBeGreaterThan(parseInt(startEl.style.width, 10));

    expect(endEl.style.boxSizing).toBe('border-box');
    expect(endEl.style.background).not.toBe('');
    expect(endEl.style.zIndex).toBe('200');
    expect(endEl.style.cursor).toBe('ew-resize');
    expect(parseInt(endEl.style.height, 10)).toBeGreaterThan(parseInt(endEl.style.width, 10));
  });

  it('should hide the top handle when the selection top edge is at row 0', async() => {
    const selections = createSelectionController({
      border: {
        width: 2,
        color: 'blue',
        adjustHandlesVisible() {
          return true;
        }
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: 5,
      totalColumns: 5,
      selections,
    });

    // Selection starting at row 0 — top edge is on the grid boundary.
    selections.getFocus()
      .add(new Walkontable.CellCoords(0, 1))
      .add(new Walkontable.CellCoords(2, 3));

    wt.draw();

    const focusBorder = wt.selectionManager.getBorderInstance(selections.getFocus());
    const { styles } = focusBorder.adjustHandles;

    // top edge at row 0 → handle hidden.
    expect(styles.top.display).toBe('none');

    // The other three edges are not at a boundary (toRow=2 < 4, fromCol=1 > 0, toCol=3 < 4).
    expect(styles.bottom.display).toBe('block');
    expect(styles.start.display).toBe('block');
    expect(styles.end.display).toBe('block');
  });
});
