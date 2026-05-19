describe('Scrollbar drag optimization (RTL mode)', () => {
  const debug = false;

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
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
    $('html').attr('dir', 'ltr');

    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  function simulateScrollbarDrag(wt, { scrollTop, scrollLeft } = {}) {
    const holder = wt.wtTable.holder;

    holder.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    if (scrollTop !== undefined) {
      holder.scrollTop = scrollTop;
    }
    if (scrollLeft !== undefined) {
      holder.scrollLeft = scrollLeft;
    }

    wt.wtOverlays.syncScrollPositions();
  }

  function simulateScrollbarRelease() {
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }

  describe('drag detection', () => {
    it('should activate sticky mode when mouse is down and a vertical scroll event fires', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      expect(wt.wtTable.spreader.style.position).toBe('sticky');

      simulateScrollbarRelease();
    });

    it('should deactivate sticky mode on mouseup', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 500, scrollLeft: 100 });

      const spreader = wt.wtTable.spreader;

      expect(spreader.style.position).toBe('sticky');
      expect(spreader.style.top).not.toBe('');
      expect(spreader.style.right).not.toBe('');

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');
    });
  });

  describe('sticky positioning during drag', () => {
    it('should switch the master spreader to position:sticky on drag start', async() => {
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

      simulateScrollbarRelease();

      expect(spreader.style.position).toBe('relative');
    });

    it('should switch the inlineStart overlay clone spreader to sticky during vertical drag', async() => {
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

      const cloneSpreader = wt.wtOverlays.inlineStartOverlay.clone.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      expect(cloneSpreader.style.position).toBe('sticky');

      simulateScrollbarRelease();

      expect(cloneSpreader.style.position).toBe('relative');
    });

    it('should use the "right" CSS property for horizontal sticky offset in RTL', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const spreader = wt.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      // In RTL mode, the horizontal position is set via "right", not "left"
      expect(spreader.style.right).not.toBe('');
      expect(spreader.style.left).toBe('');

      simulateScrollbarRelease();
    });
  });

  describe('no visual jump on drag start', () => {
    it('should keep the same first visible row when drag starts', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;

      holder.scrollTop = 2000;
      wt.draw();

      const firstRowBefore = wt.wtTable.getFirstRenderedRow();

      simulateScrollbarDrag(wt, { scrollTop: 2010 });

      const firstRowAfter = wt.wtTable.getFirstRenderedRow();

      expect(firstRowAfter).toBe(firstRowBefore);

      simulateScrollbarRelease();
    });
  });

  describe('no visual jump on drag end (release)', () => {
    it('should keep the same first visible row after releasing the scrollbar', async() => {
      const wt = walkontable({
        rtlMode: true,
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
        rtlMode: true,
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
        rtlMode: true,
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
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;
      const spreader = wt.wtTable.spreader;

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      holder.scrollTop = 50;
      wt.wtOverlays.syncScrollPositions();

      const stickyTop = parseInt(spreader.style.top, 10);
      const startPosition = wt.wtViewport.rowsRenderCalculator.startPosition;

      expect(stickyTop).toBe(startPosition - holder.scrollTop);

      simulateScrollbarRelease();
    });
  });

  describe('multiple drag sessions', () => {
    it('should correctly handle multiple consecutive drag-release cycles', async() => {
      const wt = walkontable({
        rtlMode: true,
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
  });

  describe('horizontal scroll drag with RTL negative scrollLeft (Chrome convention)', () => {
    // In Chrome RTL, scrollLeft is 0 at the right edge and negative going left.
    // These tests verify that #setScrollPosition correctly restores a negative scrollLeft
    // on deactivation rather than writing a positive value (which would jump to the right edge).

    it('should preserve negative scrollLeft after releasing the scrollbar', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;

      // Set a negative RTL scrollLeft to simulate scrolling left from the right edge.
      holder.scrollLeft = -200;
      wt.draw();

      // Activate sticky mode via vertical scroll.
      simulateScrollbarDrag(wt, { scrollTop: 500 });

      // Drag to a new horizontal position.
      holder.scrollLeft = -300;
      wt.wtOverlays.syncScrollPositions();

      simulateScrollbarRelease();

      // After deactivation, scrollLeft must remain negative (not jump to 0 or positive).
      // Without the fix, #setScrollPosition writes +left (positive), which Chrome clamps to 0.
      expect(holder.scrollLeft).toBeLessThan(0);
    });

    it('should set sticky "right" offset equal to startPosition minus abs(scrollLeft)', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;
      const spreader = wt.wtTable.spreader;

      // Scroll left by 200px in RTL Chrome convention (negative scrollLeft).
      holder.scrollLeft = -200;
      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 500 });

      holder.scrollLeft = -201;
      wt.wtOverlays.syncScrollPositions();

      const stickyRight = parseInt(spreader.style.right, 10);
      const startPosition = wt.wtViewport.columnsRenderCalculator.startPosition;
      const scrollLeft = Math.abs(holder.scrollLeft);

      // Sticky offset compensates the scroll: stickyRight = startPosition - |scrollLeft|.
      expect(stickyRight).toBe(startPosition - scrollLeft);

      simulateScrollbarRelease();
    });

    it('should not shift the first visible column after releasing when horizontally scrolled', async() => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const holder = wt.wtTable.holder;

      holder.scrollLeft = -200;
      wt.draw();

      simulateScrollbarDrag(wt, { scrollTop: 5000 });

      holder.scrollLeft = -300;
      wt.wtOverlays.syncScrollPositions();

      const firstColBefore = wt.wtTable.getFirstRenderedColumn();

      simulateScrollbarRelease();

      const firstColAfter = wt.wtTable.getFirstRenderedColumn();

      expect(firstColAfter).toBe(firstColBefore);
    });
  });
});
