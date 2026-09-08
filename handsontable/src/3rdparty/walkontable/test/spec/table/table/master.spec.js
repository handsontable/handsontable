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

  // The horizontal axis owned by the root (`overflow-x: clip`) and the vertical one by a parent that
  // hides its overflow but has no height of its own. The parent's height is its content – the grids –
  // so a holder sized to it in pixels feeds that height back into the parent: with two grids each
  // holder takes the sum of both and the parent grows to the CSS height limit (issue #3119, which the
  // element mode guards against with the same probe).
  describe('with a vertical owner that has no intrinsic height (#3119)', () => {
    const debug = false;

    beforeEach(function() {
      this.$outerWrapper = $('<div></div>').css({ 'overflow-y': 'hidden' });
      this.$wrapper = $('<div></div>').addClass('handsontable').css({ 'overflow-x': 'clip', width: '350px' });
      this.$secondWrapper = $('<div></div>').addClass('handsontable').css({ 'overflow-x': 'clip', width: '350px' });
      this.$container = $('<div></div>');
      this.$secondContainer = $('<div></div>');
      this.$table = $('<table></table>').addClass('htCore');
      this.$secondTable = $('<table></table>').addClass('htCore');

      this.$outerWrapper
        .append(this.$wrapper.append(this.$container.append(this.$table)))
        .append(this.$secondWrapper.append(this.$secondContainer.append(this.$secondTable)));
      this.$outerWrapper.appendTo('body');

      createDataArray(5, 4);
    });

    afterEach(function() {
      if (!debug) {
        $('.wtHolder').remove();
      }

      this.secondInstance.destroy();
      this.$outerWrapper.remove();
      this.wotInstance.destroy();
    });

    it('should leave the holder height to the content instead of feeding the parent its own height', async() => {
      const options = {
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      };
      const wt = walkontable({ ...options }, spec().$table[0]);
      const secondWt = walkontable({ ...options }, spec().$secondTable[0]);

      spec().secondInstance = secondWt;
      spec().wotInstance = wt;

      wt.draw();
      secondWt.draw();
      wt.draw();
      secondWt.draw();

      expect(wt.wtTable.holder.style.height).toBe('auto');
      expect(secondWt.wtTable.holder.style.height).toBe('auto');
      expect(wt.wtTable.holder.style.width).toBe('350px');
      expect(wt.wtTable.hasDefinedSize()).toBe(true);
      expect(wt.wtViewport.isHorizontallyScrollableByWindow()).toBe(false);
      expect(wt.wtViewport.isVerticallyScrollableByWindow()).toBe(false);
      expect(spec().$outerWrapper[0].offsetHeight).toBeLessThan(window.innerHeight * 2);
    });

    it('should size the holder to the vertical owner when it has a height of its own', async() => {
      spec().$outerWrapper.css({ height: '120px' });

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      }, spec().$table[0]);

      spec().secondInstance = { destroy() {} };

      wt.draw();
      wt.draw();

      expect(wt.wtTable.holder.style.height).toBe('120px');
      expect(wt.wtTable.holder.style.width).toBe('350px');
      expect(wt.wtTable.hasDefinedSize()).toBe(true);
    });
  });

  // One axis owned by an element, the other by the window: a root with `overflow-x: clip` and no
  // vertical clip (a definite `width` with no sized `height`). The holder takes the root's width and
  // scrolls horizontally inside it, and is left at its content height for the window to scroll.
  describe('with an ancestor that clips the horizontal axis only', () => {
    const debug = false;

    beforeEach(function() {
      this.$wrapper = $('<div></div>').addClass('handsontable').css({ 'overflow-x': 'clip', width: '300px' });
      this.$container = $('<div></div>');
      this.$table = $('<table></table>').addClass('htCore');
      this.$wrapper.append(this.$container);
      this.$container.append(this.$table);
      this.$wrapper.appendTo('body');
      createDataArray(20, 20);
    });

    afterEach(function() {
      if (!debug) {
        $('.wtHolder').remove();
      }
      this.$wrapper.remove();
      this.wotInstance.destroy();
    });

    it('should size the holder to the root width and leave its height to the content', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtTable.holder.style.width).toBe('300px');
      expect(wt.wtTable.holder.style.height).toBe('auto');
      expect(wt.wtTable.hasDefinedSize()).toBe(true);
    });

    it('should let the stylesheet scroll the holder and clip the master', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      // No inline overflow: `.ht_master .wtHolder { overflow: auto }` scrolls the columns and
      // `.ht_master { overflow: hidden }` clips the clones to the box. The window mode's inline
      // `visible` must not be left on either.
      expect(wt.wtTable.holder.style.overflow).toBe('');
      expect(wt.wtTable.wtRootElement.style.overflow).toBe('');
      expect(getComputedStyle(wt.wtTable.holder).overflowX).toBe('auto');
      expect(getComputedStyle(wt.wtTable.wtRootElement).overflowX).toBe('hidden');
      expect(wt.wtTable.holder.scrollWidth).toBeGreaterThan(wt.wtTable.holder.clientWidth);
    });

    it('should not probe the container with a clone on a repeated draw', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();
      wt.draw();

      let cloneCallCount = 0;

      spyOn(spec().$wrapper[0], 'cloneNode').and.callFake(function(...args) {
        cloneCallCount += 1;

        return HTMLElement.prototype.cloneNode.apply(this, args);
      });

      wt.draw();

      expect(cloneCallCount).toBe(0);
    });

    it('should hand both axes back to the window when the clip is removed', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.isHorizontallyScrollableByWindow()).toBe(false);

      spec().$wrapper[0].style.overflowX = '';
      wt.draw();

      expect(spec().$wrapper[0].style.overflow).toBe('');
      expect(getComputedStyle(spec().$wrapper[0]).overflowX).toBe('visible');
      expect(wt.wtOverlays.inlineStartOverlay.trimmingContainer).toBe(window);
      expect(wt.wtViewport.isHorizontallyScrollableByWindow()).toBe(true);
      expect(wt.wtViewport.isVerticallyScrollableByWindow()).toBe(true);
      expect(wt.wtTable.holder.style.overflow).toBe('visible');
      expect(wt.wtTable.wtRootElement.style.overflow).toBe('visible');
    });
  });
});
