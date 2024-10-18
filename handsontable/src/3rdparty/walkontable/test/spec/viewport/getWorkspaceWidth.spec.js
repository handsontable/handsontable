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
    describe('with defined table size', () => {
      it('should return correct workspace width when there are no scrollbars', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(300).height(139);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(300);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(300);
      });

      it('should return workspace width including row headers width', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(400).height(139);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          rowHeaders: [
            (row, TH) => { TH.innerHTML = row; },
            (row, TH) => { TH.innerHTML = row; },
          ]
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(400);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(400);
      });

      it('should return workspace width including scrollbar width when there is vertical scrollbar', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(250).height(139);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(250);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(250);
      });
    });

    describe('without defined table size (window as scrollable element)', () => {
      it('should return workspace width as wide as the table container element width minus inline start position', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({
          width: '',
          height: '',
          overflow: '',
          marginInlineStart: '100px',
          marginInlineEnd: '150px',
        });
        createDataArray(6, 10);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - (BODY_MARGIN * 2) - 100 - 150);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - (BODY_MARGIN * 2) - 100 - 150);

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ marginInlineStart: '', marginInlineEnd: '' });
      });

      it('should return workspace width as wide as the browser viewport width minus inline start position', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({
          width: '',
          height: '',
          overflow: '',
          marginInlineStart: '100px',
          marginInlineEnd: '150px',
        });
        createDataArray(6, window.innerWidth / 50);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - BODY_MARGIN - 100);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - BODY_MARGIN - 100);

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ marginInlineStart: '', marginInlineEnd: '' });
      });

      it('should return workspace width as wide as the browser viewport width minus inline start position (dynamic viewport size depends on the scroll position)', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({
          width: '',
          height: '',
          overflow: '',
          marginInlineStart: '100px',
          marginInlineEnd: '150px',
        });
        createDataArray(6, window.innerWidth / 50);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.draw();
        setScrollLeft(60);

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - BODY_MARGIN - 40);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - BODY_MARGIN - 40);

        setScrollLeft(100);

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - BODY_MARGIN);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - BODY_MARGIN);

        setScrollLeft(200);

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth);

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth);

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ marginInlineStart: '', marginInlineEnd: '' });
      });

      it('should return workspace width as wide as the table container element width minus inline start position and scrollbar width', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({ width: '', height: '', overflow: '' });
        createDataArray(1, 1);

        function stretchRows() {
          return window.innerHeight * 2;
        }

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          rowHeight: stretchRows,
          rowHeightByOverlayName: stretchRows,
        });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - ((BODY_MARGIN * 2)) - getScrollbarWidth());

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - ((BODY_MARGIN * 2)) - getScrollbarWidth());

        $(document.body).css({ overflowY: 'scroll' });
      });

      it('should return workspace width minus scrollbar width that is caused by the external UI element', () => {
        $(document.body).css({ overflowY: 'auto' });
        spec().$wrapper.css({ width: '', height: '', overflow: '' });
        createDataArray(6, 1);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - (BODY_MARGIN * 2));

        // add element that causes vertical scrollbar to appear
        spec().$wrapper.css({ paddingBottom: `${window.innerHeight * 2}px` });

        wt.prepare();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - (BODY_MARGIN * 2) - getScrollbarWidth());

        wt.draw();

        expect(wt.wtViewport.getWorkspaceWidth()).toBe(window.innerWidth - (BODY_MARGIN * 2) - getScrollbarWidth());

        $(document.body).css({ overflowY: 'scroll' });
        spec().$wrapper.css({ paddingBottom: '' });
      });
    });
  });
});
