describe('WalkontableViewport', () => {
  const BODY_MARGIN = parseInt(getComputedStyle(document.body).margin, 10);
  const OUTER_WIDTH = 200;
  const OUTER_HEIGHT = 200;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(OUTER_WIDTH).height(OUTER_HEIGHT);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(200, 200);
  });

  afterEach(function() {
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('getWorkspaceWidth()', () => {
    it('should return correct viewport width in case when the root element has defined size', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceWidth()).toBe(200);
    });

    it('should return correct viewport width in case when the table has not defined size', async() => {
      spec().$wrapper
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      createDataArray(20, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceWidth())
        .toBe(document.documentElement.offsetWidth - (BODY_MARGIN * 2)); // body margin from the left and right
    });

    it('should return correct viewport width including row header widths', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { { TH.innerHTML = col; } },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
          (row, TH) => { TH.innerHTML = row; },
        ]
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceWidth()).toBe(200);
    });
  });

  describe('getWorkspaceHeight()', () => {
    it('should return correct viewport height in case when the root element has defined size', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceHeight()).toBe(200);
    });

    it('should return correct viewport height in case when the table has not defined size', async() => {
      spec().$wrapper
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      createDataArray(1, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight);
    });

    it('should return correct viewport height including column header heights', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { TH.innerHTML = col; },
          (col, TH) => { TH.innerHTML = col; },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
        ]
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceHeight()).toBe(200);
    });

    it('should return a finite value bounded by window height when the trimming container has overflow set but no explicit height (#3119)', async() => {
      spec().$wrapper
        .css('overflow-x', 'auto')
        .css('overflow-y', 'hidden')
        .css('width', '350px')
        .css('height', '');

      createDataArray(10, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const workspaceHeight = wt.wtViewport.getWorkspaceHeight();

      expect(isFinite(workspaceHeight)).toBe(true);
      expect(workspaceHeight).toBeGreaterThan(0);
      expect(workspaceHeight).toBeLessThanOrEqual(window.innerHeight);
    });

    it('should not render all rows when the trimming container has overflow set but no explicit height (#3119)', async() => {
      spec().$wrapper
        .css('overflow-x', 'auto')
        .css('overflow-y', 'hidden')
        .css('width', '350px')
        .css('height', '');

      createDataArray(1000, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtTable.getRenderedRowsCount()).toBeLessThan(100);
    });
  });

  describe('getViewportWidth()', () => {
    it('should return correct viewport width in case when the root element has defined size', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getViewportWidth()).toBe(200);
    });

    it('should return viewport width without including the row headers width', async() => {
      createDataArray(10, 2);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { TH.innerHTML = col; },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
          (row, TH) => { TH.innerHTML = row; },
        ]
      });

      wt.draw();

      expect(wt.wtViewport.getViewportWidth()).toBe(100);
    });

    it('should return correct viewport width in case when the table has not defined size', async() => {
      spec().$wrapper
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      createDataArray(20, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getViewportWidth())
        .toBe(document.documentElement.offsetWidth - (BODY_MARGIN * 2)); // body margin from the left and right
    });
  });

  describe('getViewportHeight()', () => {
    it('should return correct viewport height in case when the root element has defined size', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getViewportHeight()).toBe(200);
    });

    it('should return viewport height without including the column headers height', async() => {
      createDataArray(10, 2);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { TH.innerHTML = col; },
          (col, TH) => { TH.innerHTML = col; },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
        ]
      });

      wt.draw();

      expect(wt.wtViewport.getViewportHeight()).toBe(154);
    });

    it('should return correct viewport height in case when the table has not defined size', async() => {
      spec().$wrapper
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      createDataArray(20, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight);
    });
  });

  describe('hasVerticalScroll()', () => {
    it('should return `false` when the table\'s viewport is bigger than dataset', async() => {
      createDataArray(6, 6);

      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(wt.wtViewport.hasVerticalScroll()).toBe(false);
    });

    it('should return `true` when the dataset is bigger than table\'s viewport', async() => {
      createDataArray(50, 6);

      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(wt.wtViewport.hasVerticalScroll()).toBe(true);
    });

    it('should return `true` when the viewport height is the same as total height of all rows (#dev-2248)', async() => {
      createDataArray(13, 15);

      spec().$wrapper.width(500).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.hasVerticalScroll()).toBe(true);
    });
  });

  describe('hasHorizontalScroll()', () => {
    it('should return `false` when the table\'s viewport is bigger than dataset width', async() => {
      createDataArray(6, 6);

      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);
    });

    it('should return `false` when the table\'s viewport is the same as dataset width', async() => {
      createDataArray(50, 10);

      spec().$wrapper.width(515).height(300); // +15px scrollbar width

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);
    });

    it('should return `true` when the table\'s viewport is 1px bigger than dataset width', async() => {
      createDataArray(50, 10);

      spec().$wrapper.width(514).height(300); // +15px scrollbar width - 1px to trigger horizontal scroll

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });

    it('should return `true` when the dataset is much bigger than table\'s viewport', async() => {
      createDataArray(6, 50);

      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });

    it('should return `true` when the viewport width is the same as total width of all columns (#dev-2248)', async() => {
      createDataArray(50, 10);

      spec().$wrapper.width(500).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });
  });

  describe('layout snapshot (single-pass) validation', () => {
    // S11 validates that the layout snapshot (`getLayout()`, predicted from content totals) agrees
    // with the live post-render measurement (`hasVerticalScroll()`/`hasHorizontalScroll()`) before
    // anything consumes it (consumption lands in S13-S16). Each case asserts the snapshot equals both
    // the known-correct expectation and the live method — a divergence here is a snapshot-input bug.
    const expectSnapshotToMatchMeasurement = (wt, expectedVertical, expectedHorizontal) => {
      const layout = wt.wtViewport.getLayout();

      expect(layout.hasVerticalScroll).toBe(expectedVertical);
      expect(layout.hasHorizontalScroll).toBe(expectedHorizontal);
      expect(layout.hasVerticalScroll).toBe(wt.wtViewport.hasVerticalScroll());
      expect(layout.hasHorizontalScroll).toBe(wt.wtViewport.hasHorizontalScroll());
    };

    it('should predict no scrollbars when the viewport is bigger than the dataset', async() => {
      createDataArray(6, 6);
      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expectSnapshotToMatchMeasurement(wt, false, false);
    });

    it('should predict a vertical scrollbar when the dataset is taller than the viewport', async() => {
      createDataArray(50, 6);
      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expectSnapshotToMatchMeasurement(wt, true, false);
    });

    it('should predict a vertical scrollbar at the height boundary (viewport === total rows height) (#dev-2248)', async() => {
      createDataArray(13, 15);
      spec().$wrapper.width(500).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getLayout().hasVerticalScroll).toBe(true);
      expect(wt.wtViewport.getLayout().hasVerticalScroll).toBe(wt.wtViewport.hasVerticalScroll());
    });

    it('should predict no horizontal scrollbar when the viewport width equals the dataset width', async() => {
      createDataArray(50, 10);
      spec().$wrapper.width(515).height(300); // +15px scrollbar width

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getLayout().hasHorizontalScroll).toBe(false);
      expect(wt.wtViewport.getLayout().hasHorizontalScroll).toBe(wt.wtViewport.hasHorizontalScroll());
    });

    it('should predict a horizontal scrollbar when the dataset is wider than the viewport', async() => {
      createDataArray(6, 50);
      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getLayout().hasHorizontalScroll).toBe(true);
      expect(wt.wtViewport.getLayout().hasHorizontalScroll).toBe(wt.wtViewport.hasHorizontalScroll());
    });
  });

  describe('hidden container initialization', () => {
    it('should not throw when draw(fastDraw=true) is called after container transitions from hidden to visible', async() => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170).css('display', 'none');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      // draw() is interrupted — rowsRenderCalculator and columnsRenderCalculator keep their
      // initial `null` (never rendered)
      wt.draw();

      expect(wt.wtViewport.rowsRenderCalculator).toBeNull();
      expect(wt.wtViewport.columnsRenderCalculator).toBeNull();

      // Simulate accordion/tab opening: container becomes visible
      spec().$wrapper.css('display', '');

      // draw(true) triggers areAllProposedVisibleRowsAlreadyRendered() and
      // areAllProposedVisibleColumnsAlreadyRendered() — both must not throw despite
      // rowsRenderCalculator / columnsRenderCalculator being undefined;
      // the guards force a full redraw which sets both calculators
      expect(() => wt.draw(true)).not.toThrow();

      expect(wt.wtViewport.rowsRenderCalculator).toBeDefined();
      expect(wt.wtViewport.columnsRenderCalculator).toBeDefined();
    });
  });

  describe('usesLayoutSnapshotForCalculators()', () => {
    /**
     * Builds the settings for a table that qualifies for the single-pass calculator path: uniform
     * sizes, own-element scroll (the beforeEach wrapper is sized with `overflow: hidden`), and
     * `singlePassLayout` on. Each test overrides one field to flip the gate off.
     *
     * @param {object} overrides Settings overrides.
     * @returns {object}
     */
    function gateSettings(overrides = {}) {
      return {
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        singlePassLayout: true,
        rowHeightsUniform: () => true,
        columnWidthsUniform: () => true,
        ...overrides,
      };
    }

    it('should return true for uniform sizes in own-element scroll mode with singlePassLayout on', async() => {
      const wt = walkontable(gateSettings());

      wt.draw();

      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(true);
    });

    it('should return false when singlePassLayout is off (escape hatch, e.g. mergeCells)', async() => {
      const wt = walkontable(gateSettings({ singlePassLayout: false }));

      wt.draw();

      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(false);
    });

    it('should return false when row heights are not uniform', async() => {
      const wt = walkontable(gateSettings({ rowHeightsUniform: () => false }));

      wt.draw();

      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(false);
    });

    it('should return false when column widths are not uniform', async() => {
      const wt = walkontable(gateSettings({ columnWidthsUniform: () => false }));

      wt.draw();

      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(false);
    });

    it('should return false when the table scrolls with the window (no own scroll)', async() => {
      spec().$wrapper
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      const wt = walkontable(gateSettings());

      wt.draw();

      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(false);
    });

    it('should skip the post-render second visible-calculators pass on the gated (uniform) path', async() => {
      const wt = walkontable(gateSettings());
      const secondPass = spyOn(wt.wtViewport, 'createVisibleCalculators').and.callThrough();

      wt.draw();

      // Gate is on and no oversized row invalidated the caches, so pass 1 (in createCalculators)
      // already holds the correct visible ranges — the redundant second pass is skipped.
      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(true);
      expect(secondPass).not.toHaveBeenCalled();
    });

    it('should still run the second visible-calculators pass when the gate is off', async() => {
      const wt = walkontable(gateSettings({ rowHeightsUniform: () => false }));
      const secondPass = spyOn(wt.wtViewport, 'createVisibleCalculators').and.callThrough();

      wt.draw();

      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(false);
      expect(secondPass).toHaveBeenCalled();
    });

    it('should serve getWorkspaceWidth/Height from the layout snapshot on the gated path (Inc 3)', async() => {
      const wt = walkontable(gateSettings());

      wt.draw();

      // On the gated path the workspace box is resolved once into the snapshot; the public getters
      // return that value (identical to a fresh measure) instead of re-reading the DOM each call.
      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(true);
      expect(wt.wtViewport.getWorkspaceWidth()).toBe(wt.wtViewport.getLayout().workspaceWidth);
      expect(wt.wtViewport.getWorkspaceHeight()).toBe(wt.wtViewport.getLayout().workspaceHeight);
      // and the snapshot value equals the raw measure (behavior-preserving, only fewer reads)
      expect(wt.wtViewport.getLayout().workspaceWidth).toBe(OUTER_WIDTH);
      expect(wt.wtViewport.getLayout().workspaceHeight).toBe(OUTER_HEIGHT);
    });

    it('should measure getWorkspaceWidth/Height from the DOM when the gate is off', async() => {
      const wt = walkontable(gateSettings({ rowHeightsUniform: () => false }));

      wt.draw();

      // Non-uniform (gate off): the legacy measured path stays behavior-identical.
      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(false);
      expect(wt.wtViewport.getWorkspaceWidth()).toBe(OUTER_WIDTH);
      expect(wt.wtViewport.getWorkspaceHeight()).toBe(OUTER_HEIGHT);
    });
  });
});
