describe('Table.draw() lifecycle hooks (characterization for the drawCycle refactor)', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(100).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should fire `beforeDraw` then `onDraw` exactly once each on a master full draw', async() => {
    const order = [];
    const beforeDraw = jasmine.createSpy('beforeDraw').and.callFake(() => order.push('beforeDraw'));
    const onDraw = jasmine.createSpy('onDraw').and.callFake(() => order.push('onDraw'));

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw,
      onDraw,
    });

    wt.draw();

    expect(beforeDraw).toHaveBeenCalledTimes(1);
    expect(onDraw).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['beforeDraw', 'onDraw']);
  });

  it('should NOT fire `beforeDraw` / `onDraw` on a fast (reposition-only) draw', async() => {
    const beforeDraw = jasmine.createSpy('beforeDraw');
    const onDraw = jasmine.createSpy('onDraw');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw,
      onDraw,
    });

    wt.draw(); // full draw first

    beforeDraw.calls.reset();
    onDraw.calls.reset();

    wt.draw(true); // fast draw, no viewport change -> stays fast

    expect(beforeDraw).toHaveBeenCalledTimes(0);
    expect(onDraw).toHaveBeenCalledTimes(0);
  });

  it('should keep the rendered row band consistent with the rendered DOM when `beforeDraw` skips the render', async() => {
    let skipNextRender = false;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw: (force, skip) => {
        if (skipNextRender) {
          skip.skipRender = true;
        }
      },
    });

    wt.draw();

    const renderedRows = wt.wtTable.TBODY.childNodes.length;

    expect(renderedRows).toBe(wt.wtTable.getRenderedRowsCount());

    skipNextRender = true;
    wt.scrollViewportVertically(60);
    wt.draw();

    // The render was skipped, so the TBODY still holds the previously rendered rows. The rendered-row
    // band and the row filter must keep describing that DOM - otherwise `getCell` resolves a row that
    // the calculators claim is rendered against a TBODY that does not have it.
    expect(wt.wtTable.TBODY.childNodes.length).toBe(renderedRows);
    expect(wt.wtTable.getRenderedRowsCount()).toBe(renderedRows);
    expect(wt.wtTable.rowFilter.offset).toBe(wt.wtTable.getFirstRenderedRow());
    expect(wt.wtTable.getLastRenderedRow() - wt.wtTable.getFirstRenderedRow() + 1).toBe(renderedRows);

    // Every row the calculators report as rendered must resolve to an element (no exit code, no throw).
    for (let row = wt.wtTable.getFirstRenderedRow(); row <= wt.wtTable.getLastRenderedRow(); row++) {
      expect(wt.wtTable.getCell(new Walkontable.CellCoords(row, 0)) instanceof HTMLElement).toBe(true);
    }
  });

  it('should not throw while rendering the active selection on a draw whose render was skipped', async() => {
    let skipNextRender = false;
    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections,
      beforeDraw: (force, skip) => {
        if (skipNextRender) {
          skip.skipRender = true;
        }
      },
    });

    selections.getFocus().add(new Walkontable.CellCoords(61, 0));
    wt.draw();

    skipNextRender = true;
    wt.scrollViewportVertically(60);

    expect(() => wt.draw()).not.toThrow();
  });

  it('should keep the rendered band consistent when `beforeDraw` renders and then skips the outer render', async() => {
    let mode = 'idle';
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw: (force, skip) => {
        if (mode !== 'nest') {
          return;
        }

        // A nested draw renders the new band, so the outer draw's `skipRender` must NOT roll the
        // rendered state back to what was on the screen before the outer draw started.
        mode = 'nested';
        wt.draw();
        skip.skipRender = true;
      },
    });

    wt.draw();

    mode = 'nest';
    wt.scrollViewportVertically(60);
    wt.draw();

    expect(wt.wtTable.TBODY.childNodes.length).toBe(wt.wtTable.getRenderedRowsCount());
    expect(wt.wtTable.rowFilter.offset).toBe(wt.wtTable.getFirstRenderedRow());
    expect(wt.wtTable.getLastRenderedRow() - wt.wtTable.getFirstRenderedRow() + 1)
      .toBe(wt.wtTable.TBODY.childNodes.length);

    for (let row = wt.wtTable.getFirstRenderedRow(); row <= wt.wtTable.getLastRenderedRow(); row++) {
      expect(wt.wtTable.getCell(new Walkontable.CellCoords(row, 0)) instanceof HTMLElement).toBe(true);
    }
  });

  it('should not run the nested reconciliation draw (double `beforeDraw`) when the render is skipped', async() => {
    let skipNextRender = false;
    const beforeDraw = jasmine.createSpy('beforeDraw').and.callFake((force, skip) => {
      if (skipNextRender) {
        skip.skipRender = true;
      }
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [(col, TH) => {
        TH.innerHTML = col + 1;
      }],
      // The legacy (measured) layout path applies the `innerBorderTop` class only AFTER the render,
      // via `resetFixedPosition` - so a scroll away from offset 0 flips `positionChanged` to `true`
      // on the very draw whose render is skipped, which is the scenario under test.
      singlePassLayout: false,
      beforeDraw,
    });

    wt.draw();

    beforeDraw.calls.reset();
    skipNextRender = true;
    wt.scrollViewportVertically(60);
    wt.draw();

    // The `innerBorderTop` flip must have happened on the skipped draw - otherwise this spec
    // does not exercise the `positionChanged` reconciliation path at all.
    expect(wt.wtTable.holder.parentNode.classList.contains('innerBorderTop')).toBe(true);

    // The 1px-shift reconciliation (`refreshAll`) must not run for a skipped render: with the
    // rendered band rolled back it degrades to a nested FULL draw, firing `beforeDraw` a second
    // time within one `draw()` call and rendering the cells the hook just cancelled.
    expect(beforeDraw).toHaveBeenCalledTimes(1);

    // The border toggle shifts the layout by 1px AFTER the overlay positions were computed, so the
    // skipped draw must rerun the fixed-position pass against the post-toggle layout (in element
    // mode the reposition is a transform reset, so the observable contract is the rerun itself).
    const resetFixedPosition = spyOn(wt.wtOverlays.topOverlay, 'resetFixedPosition').and.callThrough();

    skipNextRender = false;
    wt.scrollViewportVertically(0);
    wt.draw(); // full draw back at offset 0 - removes `innerBorderTop` again
    resetFixedPosition.calls.reset();

    skipNextRender = true;
    wt.scrollViewportVertically(60);
    wt.draw();

    // Once from the regular fixed-position pass + once from the skipped-draw reconciliation rerun.
    expect(resetFixedPosition).toHaveBeenCalledTimes(2);
  });

  it('should keep the table safe when the very first render is skipped', async() => {
    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [(col, TH) => {
        TH.innerHTML = col + 1;
      }],
      selections,
      beforeDraw: (force, skip) => {
        skip.skipRender = true;
      },
    });

    selections.getFocus().add(new Walkontable.CellCoords(0, 0));

    // Before the draw completes there was never a render, so the rendered state must describe an
    // empty DOM without leaving the filters `null` (several consumers read `rowFilter` unguarded
    // once the table reports itself as drawn).
    expect(() => wt.draw()).not.toThrow();
    expect(wt.wtTable.rowFilter).not.toBe(null);
    expect(wt.wtTable.columnFilter).not.toBe(null);
    expect(wt.wtTable.getRenderedRowsCount()).toBe(0);
    expect(wt.wtTable.getCell(new Walkontable.CellCoords(0, 0))).toBe(-2);
    // The overlays' spreader positioning must survive the drawn-but-never-rendered state too - the
    // sticky-scroll deactivation calls it directly, outside any draw.
    expect(() => wt.wtOverlays.applyToDOM()).not.toThrow();
  });

  it('should not restore a rendered band built for a larger dataset when the skip follows a row removal', async() => {
    let skipNextRender = false;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw: (force, skip) => {
        if (skipNextRender) {
          skip.skipRender = true;
        }
      },
    });

    wt.draw();

    const renderedRowsBeforeRemoval = wt.wtTable.TBODY.childNodes.length;

    // Shrink the dataset below the rendered band, then skip the follow-up draw - the NestedRows
    // scenario (`skipRender` set right after its row removal). The pre-draw band was built for the
    // old totals and names rows that no longer exist, so it must NOT be restored; the freshly
    // resolved band, capped at the new totals, stays in place.
    createDataArray(5, 4);
    skipNextRender = true;
    wt.draw();

    // The render was really skipped - the TBODY still holds the stale rows.
    expect(wt.wtTable.TBODY.childNodes.length).toBe(renderedRowsBeforeRemoval);
    // The rendered state describes the new dataset, not the pre-removal one.
    expect(wt.wtTable.rowFilter.total).toBe(getTotalRows());
    expect(wt.wtTable.getLastRenderedRow()).toBeLessThan(getTotalRows());
    // A removed row resolves to an out-of-viewport exit code, not to its stale TR.
    expect(wt.wtTable.getCell(new Walkontable.CellCoords(8, 0))).toBe(-2);
  });

  it('should keep the row rollback when only the column count changed before the skipped draw', async() => {
    let skipNextRender = false;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw: (force, skip) => {
        if (skipNextRender) {
          skip.skipRender = true;
        }
      },
    });

    wt.draw();

    // Shrink COLUMNS only, scroll rows, then skip the draw. The totals gates are per axis: the
    // column change keeps the fresh column state (capped at the new total), but must NOT block the
    // row rollback - `totalRows` never moved, and without the rollback the advanced row band points
    // past the stale DOM and `getCell` throws.
    createDataArray(100, 2);
    skipNextRender = true;
    wt.scrollViewportVertically(60);
    wt.draw();

    expect(wt.wtTable.columnFilter.total).toBe(getTotalColumns());
    expect(wt.wtTable.rowFilter.offset).toBe(wt.wtTable.getFirstRenderedRow());

    for (let row = wt.wtTable.getFirstRenderedRow(); row <= wt.wtTable.getLastRenderedRow(); row++) {
      expect(wt.wtTable.getCell(new Walkontable.CellCoords(row, 0)) instanceof HTMLElement).toBe(true);
    }
  });

  it('should restore the `correctHeaderWidth` flag when the render is skipped', async() => {
    let skipNextRender = false;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [(row, TH) => {
        TH.innerHTML = row + 1;
      }],
      beforeDraw: (force, skip) => {
        if (skipNextRender) {
          skip.skipRender = true;
        }
      },
    });

    wt.draw();

    expect(wt.wtTable.correctHeaderWidth).toBe(false);

    // The flag flips before the `beforeDraw` gate, but the header it describes never re-renders on
    // a skipped draw. Left advanced, the next draw would see "no change" and keep the stale header
    // width forever - so the rollback must put the flag back with the rest of the rendered state.
    skipNextRender = true;
    wt.scrollViewportHorizontally(3, 'end');
    wt.draw();

    expect(wt.wtTable.correctHeaderWidth).toBe(false);
  });

  it('should fire `beforeDraw` but SKIP `onDraw` when beforeDraw sets skipRender', async() => {
    const beforeDraw = jasmine.createSpy('beforeDraw').and.callFake((_, skip) => {
      skip.skipRender = true;
    });
    const onDraw = jasmine.createSpy('onDraw');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      beforeDraw,
      onDraw,
    });

    wt.draw();

    expect(beforeDraw).toHaveBeenCalledTimes(1);
    expect(onDraw).toHaveBeenCalledTimes(0); // render (and its onDraw) is gated off
  });
});
