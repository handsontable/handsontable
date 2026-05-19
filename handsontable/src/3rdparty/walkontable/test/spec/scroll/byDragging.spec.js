describe('Scrollbar drag optimization', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(500).height(300);
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

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  /**
   * Simulates a scrollbar drag: mousedown on document, then change scroll position
   * (which triggers scroll events and activates sticky mode via the detection logic).
   *
   * @param {Walkontable} wt The Walkontable instance.
   * @param {object} options Options for the drag simulation.
   * @param {number} [options.scrollTop] Target scrollTop value.
   * @param {number} [options.scrollLeft] Target scrollLeft value.
   */
  function simulateScrollbarDrag(wt, { scrollTop, scrollLeft } = {}) {
    const holder = wt.wtTable.holder;

    holder.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    if (scrollTop !== undefined) {
      holder.scrollTop = scrollTop;
    }
    if (scrollLeft !== undefined) {
      holder.scrollLeft = scrollLeft;
    }

    // Explicitly trigger syncScrollPositions since setting scrollTop
    // programmatically may not fire a synchronous scroll event in test.
    wt.wtOverlays.syncScrollPositions();
  }

  /**
   * Simulates releasing the scrollbar (mouseup).
   */
  function simulateScrollbarRelease() {
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }

  describe('drag detection', () => {
    it('should activate sticky mode when mouse is down and a scroll event fires', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      expect(wt.wtTable.spreader.style.position).toBe('sticky');

      simulateScrollbarRelease();
    });

    it('should not activate sticky mode when a child element is clicked and a scroll follows', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      // Simulate clicking a cell (child of holder) — not a scrollbar click
      const cell = wt.wtTable.getCell(new Walkontable.CellCoords(0, 0));

      cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      // Programmatic scroll follows (e.g., from selection logic)
      wt.wtTable.holder.scrollTop = 500;
      wt.wtOverlays.syncScrollPositions();

      expect(wt.wtTable.spreader.style.position).toBe('relative');

      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    it('should not activate sticky mode when scroll happens without mousedown', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      wt.wtTable.holder.scrollTop = 500;

      expect(wt.wtTable.spreader.style.position).toBe('relative');
    });

    it('should detect horizontal scrollbar drag', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollLeft: 100 });

      expect(wt.wtTable.spreader.style.position).toBe('sticky');

      simulateScrollbarRelease();
    });

    it('should deactivate sticky mode on mouseup', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 500, scrollLeft: 100 });

      const spreader = wt.wtTable.spreader;

      expect(spreader.style.position).toBe('sticky');
      expect(spreader.style.top).not.toBe('');
      expect(spreader.style.left).not.toBe('');

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');
    });
  });

  describe('sticky positioning during drag', () => {
    it('should switch the master spreader to position:sticky on drag start', async() => {
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

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');
    });

    it('should switch the inlineStart overlay clone spreader to sticky during vertical drag', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }],
      });

      wt.draw();

      const cloneSpreader = wt.wtOverlays.inlineStartOverlay.clone.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      expect(cloneSpreader.style.position).toBe('sticky');

      simulateScrollbarRelease();

      expect(cloneSpreader.style.position).toBe('relative');
    });
  });

  describe('no visual jump on drag start', () => {
    it('should keep the same first visible row when drag starts', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;

      holder.scrollTop = 2000;
      wt.draw();

      const firstRowBefore = wt.wtTable.getFirstRenderedRow();

      // Drag to a slightly different position to trigger activation
      simulateScrollbarDrag(wt, { scrollTop: 2010 });

      const firstRowAfter = wt.wtTable.getFirstRenderedRow();

      expect(firstRowAfter).toBe(firstRowBefore);

      simulateScrollbarRelease();
    });
  });

  describe('no visual jump on drag end (release)', () => {
    it('should keep the same first visible row after releasing the scrollbar', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      wt.wtTable.holder.scrollTop = 3000;
      wt.wtOverlays.syncScrollPositions();

      const firstRowBefore = wt.wtTable.getFirstRenderedRow();

      simulateScrollbarRelease();

      const firstRowAfter = wt.wtTable.getFirstRenderedRow();

      expect(firstRowAfter).toBe(firstRowBefore);
    });

    it('should keep row 0 visible when releasing at scrollTop=0 (top edge)', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      wt.wtTable.holder.scrollTop = 0;
      wt.wtOverlays.syncScrollPositions();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(0);

      simulateScrollbarRelease();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(0);
    });

    it('should keep the last row visible when releasing at the bottom edge', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      holder.scrollTop = holder.scrollHeight;
      wt.wtOverlays.syncScrollPositions();

      const lastRowBefore = wt.wtTable.getLastRenderedRow();

      simulateScrollbarRelease();

      const lastRowAfter = wt.wtTable.getLastRenderedRow();

      expect(lastRowAfter).toBe(lastRowBefore);
    });
  });

  describe('sticky offset consistency during fast draws', () => {
    it('should update sticky offset after every scroll event, even during fast draws', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;
      const spreader = wt.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      // Scroll near the top — same rows visible (fast draw), but different scrollTop
      holder.scrollTop = 50;
      wt.wtOverlays.syncScrollPositions();

      const stickyTop = parseInt(spreader.style.top, 10);
      const startPosition = wt.wtViewport.rowsRenderCalculator.startPosition;

      // Sticky offset must reflect current scrollTop, not stale value from 5000
      expect(stickyTop).toBe(startPosition - holder.scrollTop);

      simulateScrollbarRelease();
    });

    it('should not leave a stale sticky offset from a previous scroll position', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;
      const spreader = wt.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 8000 });

      const stickyAt8000 = parseInt(spreader.style.top, 10);

      holder.scrollTop = 30;
      wt.wtOverlays.syncScrollPositions();

      const stickyAt30 = parseInt(spreader.style.top, 10);

      expect(stickyAt30).not.toBe(stickyAt8000);
      expect(stickyAt30).toBe(
        wt.wtViewport.rowsRenderCalculator.startPosition - 30
      );

      simulateScrollbarRelease();
    });
  });

  describe('variable row heights', () => {
    it('should not jump when releasing the scrollbar with variable row heights near the top', async() => {
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

      const holder = wt.wtTable.holder;

      simulateScrollbarDrag(wt, { scrollTop: 10000 });

      holder.scrollTop = 100;
      wt.wtOverlays.syncScrollPositions();

      const firstRowBefore = wt.wtTable.getFirstRenderedRow();

      simulateScrollbarRelease();

      const firstRowAfter = wt.wtTable.getFirstRenderedRow();

      expect(firstRowAfter).toBe(firstRowBefore);
    });

    it('should not jump when releasing the scrollbar with variable row heights at the bottom', async() => {
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

      const holder = wt.wtTable.holder;

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      holder.scrollTop = holder.scrollHeight;
      wt.wtOverlays.syncScrollPositions();

      const lastRowBefore = wt.wtTable.getLastRenderedRow();

      simulateScrollbarRelease();

      const lastRowAfter = wt.wtTable.getLastRenderedRow();

      expect(lastRowAfter).toBe(lastRowBefore);
    });
  });

  describe('multiple drag sessions', () => {
    it('should correctly handle multiple consecutive drag-release cycles', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;
      const spreader = wt.wtTable.spreader;

      // First drag session
      simulateScrollbarDrag(wt, { scrollTop: 3000 });

      expect(spreader.style.position).toBe('sticky');

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');

      // Second drag session
      simulateScrollbarDrag(wt, { scrollTop: 6000 });

      expect(spreader.style.position).toBe('sticky');

      holder.scrollTop = 1000;
      wt.wtOverlays.syncScrollPositions();

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');

      // Third drag session — back to the beginning
      simulateScrollbarDrag(wt, { scrollTop: 10 });

      holder.scrollTop = 0;
      wt.wtOverlays.syncScrollPositions();

      simulateScrollbarRelease();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(0);
    });

    it('should reset sticky styles on destroy() when sticky mode is active mid-drag', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const spreader = wt.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 3000 });

      expect(spreader.style.position).toBe('sticky');
      expect(spreader.style.top).not.toBe('');

      // Destroy while sticky mode is still active (no mouseup fired).
      wt.destroy();

      expect(spreader.style.position).toBe('relative');
      expect(spreader.style.top).toBe('');
      expect(spreader.style.left).toBe('');
      expect(spreader.style.right).toBe('');
    });
  });
});
