xdescribe('WalkontableViewport', () => {
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

  describe('getViewportHeight()', () => {
    describe('with defined table size', () => {
      it('should return correct viewport height when there are no scrollbars', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(300).height(139);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getViewportHeight()).toBe(139);

        wt.draw();

        expect(wt.wtViewport.getViewportHeight()).toBe(139);
      });

      it('should return viewport height excluding column headers height', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(300).height(185);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          columnHeaders: [
            (column, TH) => { TH.innerHTML = column; },
            (column, TH) => { TH.innerHTML = column; },
          ]
        });

        wt.prepare();

        expect(wt.wtViewport.getViewportHeight()).toBe(139);

        wt.draw();

        expect(wt.wtViewport.getViewportHeight()).toBe(139);
      });

      it('should return viewport height excluding scrollbar height when there is horizontal scrollbar', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(300).height(120);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getViewportHeight()).toBe(105);

        wt.draw();

        expect(wt.wtViewport.getViewportHeight()).toBe(105);
      });
    });

    describe('without defined table size (window as scrollable element)', () => {
      it('should return viewport height as high as the browser height minus top position', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({
          width: '',
          height: '',
          overflow: '',
          marginTop: '100px',
        });
        createDataArray(6, 10);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          columnHeaders: [
            (column, TH) => { TH.innerHTML = column; },
          ],
        });

        wt.prepare();

        console.log(wt.wtViewport.getViewportHeight());
        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - 100 - 23);

        wt.draw();

        console.log(wt.wtViewport.getViewportHeight());
        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - 100 - 23);

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ marginTop: '' });
      });

      it('should return viewport height as high as the browser viewport height minus top position (dynamic viewport size depends on the scroll position)', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({
          width: '',
          height: '',
          overflow: '',
          marginTop: '100px',
        });
        createDataArray(window.innerHeight / 23, 6);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          columnHeaders: [
            (column, TH) => { TH.innerHTML = column; },
          ],
        });

        wt.draw();
        setScrollTop(60);

        wt.prepare();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - 40 - 23);

        wt.draw();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - 40 - 23);

        setScrollTop(100);

        wt.prepare();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - 23);

        wt.draw();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - 23);

        setScrollTop(200);

        wt.prepare();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - 23);

        wt.draw();

        // 1px correction after scroll
        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - 23 - 1);

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ marginTop: '' });
      });

      it('should return viewport height as high as the browser viewport height minus top position and scrollbar height', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({ width: '', height: '', overflow: '' });
        createDataArray(1, 1);

        function stretchColumns() {
          return window.innerWidth * 2;
        }

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          columnWidth: stretchColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - BODY_MARGIN - getScrollbarWidth());

        wt.draw();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - BODY_MARGIN - getScrollbarWidth());

        $(document.body).css({ overflowY: 'scroll' });
      });

      it('should return viewport height minus scrollbar height that is caused by the external UI element', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({ width: '', height: '', overflow: '' });
        createDataArray(1, 6);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.draw();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - BODY_MARGIN);

        // add element that causes horizontal scrollbar to appear
        spec().$wrapper.css({ paddingInlineStart: `${window.innerWidth * 2}px` });

        wt.prepare();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - BODY_MARGIN - getScrollbarWidth());

        wt.draw();

        expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight - BODY_MARGIN - getScrollbarWidth());

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ paddingBottom: '' });
      });
    });
  });
});
