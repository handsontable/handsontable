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
