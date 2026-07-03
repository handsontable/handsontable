describe('RenderSizeProbe', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // A renderer that makes a chosen set of rows taller than the default row height, so the engine's
  // `markOversizedRows` records them in `wtViewport.oversizedRows` (this only runs with AutoRowSize
  // off). The probe must independently reproduce those exact values.
  const tallRowRenderer = tallRows => function(instance, td, row, ...rest) {
    Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, ...rest]);

    if (tallRows.includes(row)) {
      td.innerHTML = '<div style="height: 61px"></div>';
    }

    return td;
  };

  it('should measure the same row heights the engine records in wtViewport.oversizedRows', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      autoRowSize: false,
      rowHeaders: true,
      colHeaders: true,
      renderer: tallRowRenderer([1, 4]),
    });

    const { renderSizeProbe } = hot().view;
    const { oversizedRows } = hot().view._wt.wtViewport;
    const oversizedKeys = Object.keys(oversizedRows).map(Number);

    // The scenario must actually exercise the oversized path, otherwise the assertion is vacuous.
    expect(oversizedKeys.length).toBeGreaterThan(0);

    oversizedKeys.forEach((sourceRow) => {
      expect(renderSizeProbe.rowHeights.get(sourceRow)).toBe(oversizedRows[sourceRow]);
    });
  });

  it('should measure oversized rows rendered in the bottom overlay (fixedRowsBottom)', async() => {
    handsontable({
      data: createSpreadsheetData(8, 3),
      autoRowSize: false,
      rowHeaders: true,
      colHeaders: true,
      fixedRowsBottom: 2,
      height: 200,
      renderer: tallRowRenderer([0, 7]), // one master row, one frozen-bottom row
    });

    const { renderSizeProbe } = hot().view;
    const { oversizedRows } = hot().view._wt.wtViewport;
    const oversizedKeys = Object.keys(oversizedRows).map(Number);

    expect(oversizedKeys.length).toBeGreaterThan(0);

    oversizedKeys.forEach((sourceRow) => {
      expect(renderSizeProbe.rowHeights.get(sourceRow)).toBe(oversizedRows[sourceRow]);
    });
  });

  it('should measure the content-driven height of a multi-line column header', async() => {
    handsontable({
      data: createSpreadsheetData(4, 3),
      autoRowSize: false,
      rowHeaders: true,
      colHeaders: ['line1<br>line2<br>line3', 'B', 'C'],
    });

    const measured = hot().view.renderSizeProbe.columnHeaderHeights.get(0);

    // The wrapped three-line header must be measured taller than a single default header row - this
    // is the value the single-pass reconcile feeds back so the overlays match the master.
    expect(measured).toBeGreaterThan(getDefaultRowHeight() * 2);
  });

  it('should align the row-header overlay THEAD with the master when a header is content-driven', async() => {
    handsontable({
      data: createSpreadsheetData(4, 3),
      autoRowSize: false,
      rowHeaders: true,
      colHeaders: ['line1<br>line2<br>line3', 'B', 'C'],
    });

    const masterThead = spec().$container.find('.ht_master thead')[0];
    const inlineStartThead = spec().$container.find('.ht_clone_inline_start thead')[0];

    expect(masterThead.offsetHeight).toBeGreaterThan(getDefaultRowHeight() * 2);
    expect(Math.abs(inlineStartThead.offsetHeight - masterThead.offsetHeight)).toBeLessThanOrEqual(1);
  });

  it('should not feed measured sizes back or trigger a re-draw (measurement only)', async() => {
    const afterViewRender = jasmine.createSpy('afterViewRender');

    handsontable({
      data: createSpreadsheetData(6, 3),
      autoRowSize: false,
      renderer: tallRowRenderer([2]),
      afterViewRender,
    });

    const rendersAfterInit = afterViewRender.calls.count();

    // A pure API read of the probe must not schedule any further rendering.
    hot().view.renderSizeProbe.measure(hot().view._wt);

    await sleep(50);

    expect(afterViewRender.calls.count()).toBe(rendersAfterInit);
  });
});
