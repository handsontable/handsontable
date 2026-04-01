describe('Scrollbar drag optimization (window as scrollable element)', () => {
  const debug = false;

  beforeEach(function() {
    // No overflow, no width/height — the window becomes the scrollable element.
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(1000, 10);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    window.scrollTo(0, 0);
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  /**
   * Simulates a scrollbar drag in window scroll mode: mousedown, then
   * change the window scroll position and trigger syncScrollPositions.
   *
   * @param {Walkontable} wt The Walkontable instance.
   * @param {object} options Options for the drag simulation.
   * @param {number} [options.scrollTop] Target window scrollY value.
   */
  function simulateScrollbarDrag(wt, { scrollTop } = {}) {
    document.documentElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    if (scrollTop !== undefined) {
      window.scrollTo(0, scrollTop);
    }

    wt.wtOverlays.syncScrollPositions();
  }

  /**
   * Simulates releasing the scrollbar (mouseup).
   */
  function simulateScrollbarRelease() {
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }

  describe('drag detection with window scrolling', () => {
    it('should activate sticky mode when mouse is down and window scroll happens', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const spreader = wt.wtTable.spreader;

      expect(spreader.style.position).toBe('relative');

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      expect(spreader.style.position).toBe('sticky');
      expect(spreader.style.top).not.toBe('');

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');
    });

    it('should not activate sticky mode without mousedown', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      window.scrollTo(0, 500);
      wt.wtOverlays.syncScrollPositions();

      expect(wt.wtTable.spreader.style.position).toBe('relative');
    });
  });

  describe('sticky positioning during window scroll drag', () => {
    it('should set sticky on the master spreader only, not overlay clones', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }],
      });

      wt.draw();

      const masterSpreader = wt.wtTable.spreader;
      const cloneSpreader = wt.wtOverlays.inlineStartOverlay.clone.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      // Master spreader is sticky
      expect(masterSpreader.style.position).toBe('sticky');

      // Overlay clone spreader is NOT sticky in window mode —
      // it uses the overlay system's own absolute/fixed positioning.
      expect(cloneSpreader.style.position).not.toBe('sticky');

      simulateScrollbarRelease();
    });
  });

  describe('no visual jump on drag start (window scroll)', () => {
    it('should keep the same first visible row when drag starts', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      // Scroll to a position and render so the state is stable.
      window.scrollTo(0, 2000);
      wt.draw();

      const firstRowBefore = wt.wtTable.getFirstRenderedRow();

      // Start drag by scrolling 1px — enough to trigger detection
      // without crossing a row boundary.
      simulateScrollbarDrag(wt, { scrollTop: 2001 });

      const firstRowAfter = wt.wtTable.getFirstRenderedRow();

      expect(firstRowAfter).toBe(firstRowBefore);

      simulateScrollbarRelease();
    });
  });

  describe('no visual jump on drag end (window scroll)', () => {
    it('should keep the same first visible row after releasing the scrollbar', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      window.scrollTo(0, 3000);
      wt.wtOverlays.syncScrollPositions();

      const firstRowBefore = wt.wtTable.getFirstRenderedRow();

      simulateScrollbarRelease();

      const firstRowAfter = wt.wtTable.getFirstRenderedRow();

      expect(firstRowAfter).toBe(firstRowBefore);
    });

    it('should keep row 0 visible when releasing at the top (window scroll)', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      window.scrollTo(0, 0);
      wt.wtOverlays.syncScrollPositions();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(0);

      simulateScrollbarRelease();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(0);
    });
  });

  describe('sticky offset consistency during fast draws (window scroll)', () => {
    it('should update sticky offset after every scroll event', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const spreader = wt.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      // Scroll near the top — triggers fast draw
      window.scrollTo(0, 50);
      wt.wtOverlays.syncScrollPositions();

      const stickyTop = parseInt(spreader.style.top, 10);
      const startPosition = wt.wtViewport.rowsRenderCalculator.startPosition;
      const parentOffset = wt.wtOverlays.topOverlay.getTableParentOffset();

      // Sticky offset must use the hider-coordinate scroll: scrollY - parentOffset
      expect(stickyTop).toBe(startPosition - (window.scrollY - parentOffset));

      simulateScrollbarRelease();
    });
  });

  describe('multiple drag sessions (window scroll)', () => {
    it('should correctly handle multiple consecutive drag-release cycles', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const spreader = wt.wtTable.spreader;

      // First drag session
      simulateScrollbarDrag(wt, { scrollTop: 3000 });

      expect(spreader.style.position).toBe('sticky');

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');

      // Second drag session
      simulateScrollbarDrag(wt, { scrollTop: 6000 });

      expect(spreader.style.position).toBe('sticky');

      window.scrollTo(0, 1000);
      wt.wtOverlays.syncScrollPositions();

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');

      // Third drag session — back to top
      simulateScrollbarDrag(wt, { scrollTop: 10 });

      window.scrollTo(0, 0);
      wt.wtOverlays.syncScrollPositions();

      simulateScrollbarRelease();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(0);
    });
  });

  describe('variable row heights (window scroll)', () => {
    it('should not jump when releasing with variable row heights near the top', async() => {
      const rowHeights = new Array(1000);

      for (let i = 0; i < 1000; i++) {
        if (i % 3 !== 0) {
          rowHeights[i] = 100 + (i % 51);
        }
      }

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeight(row) {
          return rowHeights[row] || undefined;
        },
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 10000 });

      window.scrollTo(0, 100);
      wt.wtOverlays.syncScrollPositions();

      const firstRowBefore = wt.wtTable.getFirstRenderedRow();

      simulateScrollbarRelease();

      const firstRowAfter = wt.wtTable.getFirstRenderedRow();

      expect(firstRowAfter).toBe(firstRowBefore);
    });
  });
});
