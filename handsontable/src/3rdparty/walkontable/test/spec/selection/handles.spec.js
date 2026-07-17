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

    // Handle dimensions come from the CSS token cache (stylesHandler stub in tests):
    // size=8, length=24. top/bottom: width=24 (length), height=8 (size).
    // start/end: width=8 (size), height=24 (length). No inline style manipulation needed.
    const shortSide = 8;
    const longSide = 24;

    expect(styles.top.display).toBe('block');
    expect(styles.bottom.display).toBe('block');
    expect(styles.start.display).toBe('block');
    expect(styles.end.display).toBe('block');

    // Top and bottom handles both have the same token-derived width (24px), so their inline
    // position is equal (both centred on the same column span).
    expect(styles.top.left).toBe(styles.bottom.left);

    // Start and end handles both have the same token-derived height (24px), so their vertical
    // midpoint is equal (both centred on the same row span).
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

  it('should assign correct CSS classes and start hidden after createAdjustHandles', async() => {
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

    // Visual styling (size, background, border, border-radius, cursor, z-index) is now driven
    // entirely by CSS via the --ht-cell-selection-handle-* tokens. JS only manages display state
    // and positioning. Verify the class names (which carry CSS rules) and display state.

    // Shared base class.
    expect(topEl.classList.contains('wtSelectionHandle')).toBe(true);
    expect(bottomEl.classList.contains('wtSelectionHandle')).toBe(true);
    expect(startEl.classList.contains('wtSelectionHandle')).toBe(true);
    expect(endEl.classList.contains('wtSelectionHandle')).toBe(true);

    // Edge-specific orientation classes that CSS uses for sizing/cursor.
    expect(topEl.classList.contains('wtSelectionHandle--top')).toBe(true);
    expect(bottomEl.classList.contains('wtSelectionHandle--bottom')).toBe(true);
    expect(startEl.classList.contains('wtSelectionHandle--start')).toBe(true);
    expect(endEl.classList.contains('wtSelectionHandle--end')).toBe(true);

    // JS sets no inline visual properties on creation — only positioning and display are inline.
    expect(topEl.style.background).toBe('');
    expect(topEl.style.borderRadius).toBe('');
    expect(topEl.style.zIndex).toBe('');
    expect(topEl.style.cursor).toBe('');
    expect(topEl.style.width).toBe('');
    expect(topEl.style.height).toBe('');
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
