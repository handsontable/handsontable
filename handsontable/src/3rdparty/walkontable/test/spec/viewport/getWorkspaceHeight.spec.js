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

  describe('getWorkspaceHeight()', () => {
    describe('with defined table size', () => {
      it('should return correct workspace height when there are no scrollbars', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(300).height(139);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(139);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(139);
      });

      it('should return workspace height including column headers height', () => {
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

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(185);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(185);
      });

      it('should return workspace height including scrollbar height when there is horizontal scrollbar', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(300).height(120);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(120);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(120);
      });
    });

    describe('without defined table size (window as scrollable element)', () => {
      it('should return workspace height as high as the browser height minus top position', () => {
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
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - 100);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - 100);

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ marginTop: '' });
      });

      it('should return workspace height as high as the browser viewport height minus top position (dynamic viewport size depends on the scroll position)', () => {
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
        });

        wt.draw();
        setScrollTop(60);

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - 40);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - 40);

        setScrollTop(100);

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight);

        setScrollTop(200);

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight);

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ marginTop: '' });
      });

      it('should return workspace height as high as the browser viewport height minus top position and scrollbar height', () => {
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

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - BODY_MARGIN - getScrollbarWidth());

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - BODY_MARGIN - getScrollbarWidth());

        $(document.body).css({ overflowY: 'scroll' });
      });

      it('should return workspace height minus scrollbar height that is caused by the external UI element', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({ width: '', height: '', overflow: '' });
        createDataArray(1, 6);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - BODY_MARGIN);

        // add element that causes horizontal scrollbar to appear
        spec().$wrapper.css({ paddingInlineStart: `${window.innerWidth * 2}px` });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - BODY_MARGIN - getScrollbarWidth());

        wt.draw();

        expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight - BODY_MARGIN - getScrollbarWidth());

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ paddingBottom: '' });
      });
    });
  });
});
