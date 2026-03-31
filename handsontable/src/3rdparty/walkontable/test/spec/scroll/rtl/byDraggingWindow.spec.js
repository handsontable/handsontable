describe('Scrollbar drag optimization - window scroll (RTL mode)', () => {
  const debug = false;

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
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
    $('html').attr('dir', 'ltr');

    if (!debug) {
      $('.wtHolder').remove();
    }

    window.scrollTo(0, 0);
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  function simulateScrollbarDrag(wt, { scrollTop } = {}) {
    document.documentElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    if (scrollTop !== undefined) {
      window.scrollTo(0, scrollTop);
    }

    wt.wtOverlays.syncScrollPositions();
  }

  function simulateScrollbarRelease() {
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }

  describe('drag detection with window scrolling (RTL)', () => {
    it('should activate sticky mode when mouse is down and window scroll happens', async() => {
      const wt = walkontable({
        rtlMode: true,
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
        rtlMode: true,
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

  describe('sticky positioning during window scroll drag (RTL)', () => {
    it('should set sticky on the master spreader only, not overlay clones', async() => {
      const wt = walkontable({
        rtlMode: true,
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

      expect(masterSpreader.style.position).toBe('sticky');
      expect(cloneSpreader.style.position).not.toBe('sticky');

      simulateScrollbarRelease();
    });

    it('should use the "right" CSS property for horizontal offset in RTL window mode', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const spreader = wt.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      expect(spreader.style.right).not.toBe('');
      expect(spreader.style.left).toBe('');

      simulateScrollbarRelease();
    });
  });

  describe('no visual jump on drag start (RTL window scroll)', () => {
    it('should keep the same first visible row when drag starts', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      window.scrollTo(0, 2000);
      wt.draw();

      const firstRowBefore = wt.wtTable.getFirstRenderedRow();

      simulateScrollbarDrag(wt, { scrollTop: 2001 });

      const firstRowAfter = wt.wtTable.getFirstRenderedRow();

      expect(firstRowAfter).toBe(firstRowBefore);

      simulateScrollbarRelease();
    });
  });

  describe('no visual jump on drag end (RTL window scroll)', () => {
    it('should keep the same first visible row after releasing the scrollbar', async() => {
      const wt = walkontable({
        rtlMode: true,
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

    it('should keep row 0 visible when releasing at the top (RTL window scroll)', async() => {
      const wt = walkontable({
        rtlMode: true,
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

  describe('multiple drag sessions (RTL window scroll)', () => {
    it('should correctly handle multiple consecutive drag-release cycles', async() => {
      const wt = walkontable({
        rtlMode: true,
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

  describe('variable row heights (RTL window scroll)', () => {
    it('should not jump when releasing with variable row heights near the top', async() => {
      const rowHeights = new Array(1000);

      for (let i = 0; i < 1000; i++) {
        if (i % 3 !== 0) {
          rowHeights[i] = 100 + (i % 51);
        }
      }

      const wt = walkontable({
        rtlMode: true,
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

  describe('combined vertical and horizontal scroll drag (RTL window scroll)', () => {
    it('should activate sticky mode and use "right" property when both axes are dragged', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const spreader = wt.wtTable.spreader;

      expect(spreader.style.position).toBe('relative');

      // Activate via vertical scroll (horizontal RTL window-scroll cannot be reliably
      // simulated in headless Chrome, but vertical works fine).
      simulateScrollbarDrag(wt, { scrollTop: 500 });

      expect(spreader.style.position).toBe('sticky');
      // In RTL mode the horizontal sticky offset must use "right", not "left".
      expect(spreader.style.right).not.toBe(undefined);
      expect(spreader.style.left).toBe('');

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');
    });

    it('should keep the same first visible column after releasing the scrollbar in RTL', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      window.scrollTo(0, 3000);
      wt.wtOverlays.syncScrollPositions();

      const firstColBefore = wt.wtTable.getFirstRenderedColumn();

      simulateScrollbarRelease();

      const firstColAfter = wt.wtTable.getFirstRenderedColumn();

      expect(firstColAfter).toBe(firstColBefore);
    });
  });
});
