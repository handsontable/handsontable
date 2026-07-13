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

    // Set an explicit size so midpoint assertions are deterministic even before Task 6 CSS lands.
    const handleSize = 8;

    focusBorder.adjustHandles.top.style.width = `${handleSize}px`;
    focusBorder.adjustHandles.top.style.height = `${handleSize}px`;
    focusBorder.adjustHandles.bottom.style.width = `${handleSize}px`;
    focusBorder.adjustHandles.bottom.style.height = `${handleSize}px`;
    focusBorder.adjustHandles.start.style.width = `${handleSize}px`;
    focusBorder.adjustHandles.start.style.height = `${handleSize}px`;
    focusBorder.adjustHandles.end.style.width = `${handleSize}px`;
    focusBorder.adjustHandles.end.style.height = `${handleSize}px`;

    // Re-draw so positionAdjustHandles picks up the size we just set.
    wt.draw();

    expect(styles.top.display).toBe('block');
    expect(styles.bottom.display).toBe('block');
    expect(styles.start.display).toBe('block');
    expect(styles.end.display).toBe('block');

    // Top and bottom handles share the same inline position (both centred on the same column span).
    expect(styles.top.left).toBe(styles.bottom.left);

    // Start and end handles share the same vertical midpoint (both centred on the same row span).
    expect(styles.start.top).toBe(styles.end.top);

    // Numeric non-tautological assertion: the top handle's left must land at the midpoint of the
    // border's horizontal span, offset by half the handle size (half = 4 for an 8px handle).
    // Expected: borderLeft + round(borderWidth / 2) - 4.
    // Tolerance of ±2 px accounts for sub-pixel rounding in the implementation.
    const borderLeft = parseInt(focusBorder.topStyle.left, 10);
    const borderWidth = parseInt(focusBorder.topStyle.width, 10);
    const half = 4; // handleSize / 2
    const expectedTopHandleLeft = borderLeft + Math.round(borderWidth / 2) - half;

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
    const startEl = focusBorder.adjustHandles.start;

    // Verify visual inline styles set by createAdjustHandles (before any positioning overwrite).
    // This test does NOT overwrite those styles — it checks what createAdjustHandles produced.
    expect(topEl.style.boxSizing).toBe('border-box');
    expect(topEl.style.background).not.toBe('');
    expect(topEl.style.borderRadius).not.toBe('');
    expect(topEl.style.width).not.toBe('');
    expect(topEl.style.height).not.toBe('');
    expect(topEl.style.zIndex).toBe('200');
    expect(topEl.style.cursor).toBe('ns-resize');

    expect(startEl.style.boxSizing).toBe('border-box');
    expect(startEl.style.background).not.toBe('');
    expect(startEl.style.borderRadius).not.toBe('');
    expect(startEl.style.width).not.toBe('');
    expect(startEl.style.height).not.toBe('');
    expect(startEl.style.zIndex).toBe('200');
    expect(startEl.style.cursor).toBe('ew-resize');
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
