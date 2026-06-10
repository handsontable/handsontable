describe('MasterTable.alignOverlaysWithTrimmingContainer', () => {
  describe('with overflow:hidden trimming container', () => {
    const debug = false;

    beforeEach(function() {
      this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
      this.$wrapper.width(300).height(200);
      this.$container = $('<div></div>');
      this.$table = $('<table></table>').addClass('htCore');
      this.$wrapper.append(this.$container);
      this.$container.append(this.$table);
      this.$wrapper.appendTo('body');
      createDataArray(20, 4);
    });

    afterEach(function() {
      if (!debug) {
        $('.wtHolder').remove();
      }
      this.$wrapper.remove();
      this.wotInstance.destroy();
    });

    it('should set holder width and height from trimming container dimensions on first draw', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtTable.holder.style.width).toBe('300px');
      expect(wt.wtTable.holder.style.height).toBe('200px');
    });

    // alignOverlaysWithTrimmingContainer() runs before render() each draw, so the hider
    // height seen on draw N is the post-render height from draw N-1. The fingerprint
    // stabilises only after two draws. The fast path is verified on the third draw.
    it('should not run the slow-path measurement on a repeated draw when dimensions are unchanged', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw(); // draw 1 — hider grows from 0 after render
      wt.draw(); // draw 2 — fingerprint stabilises

      let cloneCallCount = 0;

      spyOn(spec().$wrapper[0], 'cloneNode').and.callFake(function(...args) {
        cloneCallCount += 1;

        return HTMLElement.prototype.cloneNode.apply(this, args);
      });

      wt.draw(); // draw 3 — must hit the fast path

      expect(cloneCallCount).toBe(0);
    });

    it('should update holder width when trimming container is resized horizontally', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      spec().$wrapper.width(500);
      wt.draw();

      expect(wt.wtTable.holder.style.width).toBe('500px');
    });

    it('should update holder height when trimming container is resized vertically', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      spec().$wrapper.height(350);
      wt.draw();

      expect(wt.wtTable.holder.style.height).toBe('350px');
    });

    it('should re-run the slow path when hider grows due to added rows', async() => {
      createDataArray(3, 4);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw(); // draw 1 — hider grows from 0 to 3-row height after render
      wt.draw(); // draw 2 — fingerprint stabilises

      // alignOverlaysWithTrimmingContainer() runs before render(), so the hider height
      // in the fingerprint is always one draw behind. Draw 3 still sees the old hider
      // height; draw 4 sees the new height and triggers the slow path.
      createDataArray(50, 4);
      wt.draw(); // draw 3 — render expands hider; fingerprint still on old cache

      let slowPathRan = false;

      spyOn(spec().$wrapper[0], 'cloneNode').and.callFake(function(...args) {
        slowPathRan = true;

        return HTMLElement.prototype.cloneNode.apply(this, args);
      });

      wt.draw(); // draw 4 — fingerprint misses on new hider height

      expect(slowPathRan).toBe(true);
    });
  });

  // A CSS-only overflow toggle changes useAutoHeight without altering box dimensions.
  // Without the trimmingOverflow fingerprint field the fast path returns a stale
  // holderHeight, re-triggering issue #3119.
  describe('with zero-intrinsic-height container — overflow fingerprint (DEV-1777)', () => {
    const debug = false;

    beforeEach(function() {
      this.$outerWrapper = $('<div></div>').css({
        position: 'relative',
        overflow: 'hidden',
        width: '400px',
      });
      this.$container = $('<div></div>');
      this.$table = $('<table></table>').addClass('htCore');

      this.$outerWrapper.append(this.$container.append(this.$table));
      this.$outerWrapper.appendTo('body');

      createDataArray(5, 4);
    });

    afterEach(function() {
      if (!debug) {
        $('.wtHolder').remove();
      }
      this.$outerWrapper.remove();
      this.wotInstance.destroy();
    });

    it('should set holder height to "auto" when overflow-x is scroll and overflow-y is hidden', async() => {
      // Exact pattern that triggers the #3119 feedback loop. holder must not be fixed
      // at a pixel value that drives the zero-height container to expand.
      spec().$outerWrapper.css({ 'overflow-x': 'scroll', 'overflow-y': 'hidden' });

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      }, spec().$table[0]);

      wt.draw();

      expect(wt.wtTable.holder.style.height).toBe('auto');
    });

    it('should keep holder height at "0px" when overflow:hidden is applied to both axes', async() => {
      // Not a scroll viewport — no feedback-loop risk, height=0 is correct.
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      }, spec().$table[0]);

      wt.draw();

      expect(wt.wtTable.holder.style.height).toBe('0px');
    });

    it('should keep holder height at "0px" when overflow:scroll is applied to both axes', async() => {
      // All-axis scroll viewport with no intrinsic height — height=0 signals no defined
      // size. useAutoHeight must not trigger.
      spec().$outerWrapper.css({ overflow: 'scroll' });

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      }, spec().$table[0]);

      wt.draw();

      expect(wt.wtTable.holder.style.height).toBe('0px');
    });

    it('should update holder height from "0px" to "auto" when overflow changes from hidden/hidden to scroll/hidden', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      }, spec().$table[0]);

      const { holder } = wt.wtTable;

      wt.draw();

      expect(holder.style.height).toBe('0px');

      // Box dimensions unchanged — offsetHeight still 0. trimmingOverflow fingerprint
      // detects the CSS change and forces slow path, which sets useAutoHeight=true.
      spec().$outerWrapper[0].style.overflowX = 'scroll';
      spec().$outerWrapper[0].style.overflowY = 'hidden';

      wt.draw();

      expect(holder.style.height).toBe('auto');
    });

    it('should update holder height from "auto" back to "0px" when overflow changes from scroll/hidden to hidden/hidden', async() => {
      spec().$outerWrapper.css({ 'overflow-x': 'scroll', 'overflow-y': 'hidden' });

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      }, spec().$table[0]);

      const { holder } = wt.wtTable;

      wt.draw();

      expect(holder.style.height).toBe('auto');

      spec().$outerWrapper[0].style.overflowX = 'hidden';
      spec().$outerWrapper[0].style.overflowY = 'hidden';

      wt.draw();

      expect(holder.style.height).toBe('0px');
    });
  });

  // The master holder carries `overscroll-behavior-*: none` (to stop the macOS
  // rubber-band bounce detaching the scrolling content from the overlays) only
  // on an axis it can actually scroll. On a non-scrollable axis the default
  // `auto` chaining is kept so a wheel over the grid still scrolls the page.
  describe('per-axis overscroll containment classes', () => {
    const debug = false;

    beforeEach(function() {
      this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
      this.$container = $('<div></div>');
      this.$table = $('<table></table>').addClass('htCore');
      this.$wrapper.append(this.$container);
      this.$container.append(this.$table);
      this.$wrapper.appendTo('body');
    });

    afterEach(function() {
      if (!debug) {
        $('.wtHolder').remove();
      }
      this.$wrapper.remove();
      this.wotInstance.destroy();
    });

    it('should add htOverscrollContainX (not Y) when the holder scrolls only horizontally', async() => {
      spec().$wrapper.width(150).height(400);
      createDataArray(2, 4);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 100, // 4 × 100 = 400px content, wider than the 150px holder
      });

      wt.draw();

      const { holder } = wt.wtTable;

      // preconditions — the scenario must actually overflow horizontally only
      expect(holder.scrollWidth).toBeGreaterThan(holder.clientWidth);
      expect(holder.scrollHeight).toBe(holder.clientHeight);

      expect(holder.classList.contains('htOverscrollContainX')).toBe(true);
      expect(holder.classList.contains('htOverscrollContainY')).toBe(false);
    });

    it('should add htOverscrollContainY (not X) when the holder scrolls only vertically', async() => {
      spec().$wrapper.width(600).height(100);
      createDataArray(40, 4);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50, // 4 × 50 = 200px content, narrower than the 600px holder
      });

      wt.draw();

      const { holder } = wt.wtTable;

      expect(holder.scrollHeight).toBeGreaterThan(holder.clientHeight);
      expect(holder.scrollWidth).toBe(holder.clientWidth);

      expect(holder.classList.contains('htOverscrollContainY')).toBe(true);
      expect(holder.classList.contains('htOverscrollContainX')).toBe(false);
    });

    it('should add both containment classes when the holder scrolls on both axes', async() => {
      spec().$wrapper.width(150).height(100);
      createDataArray(40, 4);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 100,
      });

      wt.draw();

      const { holder } = wt.wtTable;

      expect(holder.scrollWidth).toBeGreaterThan(holder.clientWidth);
      expect(holder.scrollHeight).toBeGreaterThan(holder.clientHeight);

      expect(holder.classList.contains('htOverscrollContainX')).toBe(true);
      expect(holder.classList.contains('htOverscrollContainY')).toBe(true);
    });

    it('should add no containment class when the content fits both axes', async() => {
      spec().$wrapper.width(600).height(400);
      createDataArray(2, 4);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50,
      });

      wt.draw();

      const { holder } = wt.wtTable;

      expect(holder.scrollWidth).toBe(holder.clientWidth);
      expect(holder.scrollHeight).toBe(holder.clientHeight);

      expect(holder.classList.contains('htOverscrollContainX')).toBe(false);
      expect(holder.classList.contains('htOverscrollContainY')).toBe(false);
    });

    it('should drop htOverscrollContainY once the content shrinks to fit the holder vertically', async() => {
      spec().$wrapper.width(600).height(100);
      createDataArray(40, 4);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50,
      });

      const { holder } = wt.wtTable;

      wt.draw(); // draw 1 — hider grows after render
      wt.draw(); // draw 2 — fingerprint stabilises

      expect(holder.classList.contains('htOverscrollContainY')).toBe(true);

      createDataArray(1, 4);

      // alignOverlaysWithTrimmingContainer() reads the hider before render(), so the
      // shrunk height lands in the fingerprint one draw later; draw 4 re-measures.
      wt.draw(); // draw 3 — render shrinks hider; align still on old cache
      wt.draw(); // draw 4 — fingerprint misses, slow path re-measures scrollability

      expect(holder.classList.contains('htOverscrollContainY')).toBe(false);
    });
  });
});
