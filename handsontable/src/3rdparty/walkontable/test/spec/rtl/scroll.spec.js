describe('WalkontableScroll (RTL mode)', () => {
  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('scroll', () => {
    it('should scroll to last column when rowHeaders is not in use', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(getTotalColumns() - 1);
      wt.draw();

      expect(spec().$table.find('tbody tr:eq(0) td:last')[0].innerHTML).toBe('c');
    });

    it('should scroll to last column when rowHeaders is in use', () => {
      function plusOne(i) {
        return i + 1;
      }

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = plusOne(col);
        }],
        rowHeaders: [function(row, TH) {
          TH.innerHTML = plusOne(row);
        }]
      });

      wt.draw();
      wt.scrollViewportHorizontally(getTotalColumns() - 1);
      wt.draw();

      expect(spec().$table.find('tbody tr:eq(0) td:last')[0].innerHTML).toBe('c');
    });

    it('scroll horizontal should take totalColumns if it is smaller than width', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(getTotalColumns() - 1);
      wt.draw();

      expect(wt.wtTable.getCoords(spec().$table.find('tbody tr:eq(0) td:eq(0)')[0]))
        .toEqual(new Walkontable.CellCoords(0, 0));
    });

    it('scroll horizontal should return `false` if given number smaller than 0', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.scrollViewportHorizontally(-1)).toBe(false);
    });

    it('scroll horizontal should return `false` if given number bigger than totalRows', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.scrollViewportHorizontally(999)).toBe(false);
    });

    it('scroll viewport to a cell that is visible should do nothing', () => {
      spec().$wrapper.height(201).width(120);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      const tmp = wt.getViewport();

      wt.scrollViewport(new Walkontable.CellCoords(0, 1));
      wt.draw();

      expect(wt.getViewport()).toEqual(tmp);
    });

    it('scroll viewport to a cell on far left should make it visible on left edge', () => {
      spec().$wrapper.width(125).height(201);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      const height = spec().$wrapper[0].clientHeight;
      const visibleRowCount = Math.floor(height / 23);

      wt.scrollViewport(new Walkontable.CellCoords(0, 2));
      wt.draw();

      expect(wt.getViewport()).toEqual([0, 1, visibleRowCount - 1, 2]);
    });

    it('scroll viewport to a cell on far right should make it visible on right edge', () => {
      spec().$wrapper.width(100).height(201);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      const height = spec().$wrapper[0].clientHeight;
      const visibleRowCount = Math.floor(height / 23);

      wt.scrollViewport(new Walkontable.CellCoords(0, 3));
      wt.draw();
      expect(wt.getViewport()).toEqual([0, 3, visibleRowCount - 1, 3]);

      wt.scrollViewport(new Walkontable.CellCoords(0, 1));
      wt.draw();
      expect(wt.getViewport()).toEqual([0, 1, visibleRowCount - 1, 1]);
    });

    it('scroll viewport to a cell on far right should make it visible on right edge (with row header)', () => {
      spec().$wrapper.width(140).height(201);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }]
      });

      wt.draw();

      const height = spec().$wrapper[0].clientHeight;
      const visibleRowCount = Math.floor(height / 23);

      wt.scrollViewport(new Walkontable.CellCoords(0, 3));
      wt.draw();
      expect(wt.getViewport()).toEqual([0, 3, visibleRowCount - 1, 3]);

      wt.scrollViewport(new Walkontable.CellCoords(0, 1));
      wt.draw();
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(1);
    });

    it('scroll viewport to a cell on far left should make it visible on left edge (with row header)', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function(row, TH) {
          TH.innerHTML = row + 1;
        }]
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 2));
      wt.draw();

      expect(wt.wtTable.getCoords(spec().$table.find('tbody tr:first td:last')[0]))
        .toEqual(new Walkontable.CellCoords(0, 3));
    });

    it('scroll viewport to a cell that does not exist (horizontally) should return `false`', () => {
      spec().$wrapper.width(100).height(201);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.scrollViewport(new Walkontable.CellCoords(0, 40))).toBe(false);
    });

    it('should scroll to last column if smaller data source is loaded that does not have currently displayed column', () => {
      createDataArray(20, 100);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(50);
      wt.draw();
      createDataArray(100, 30);
      wt.draw();

      expect(spec().$table.find('tbody tr:first td').length).toBeGreaterThan(3);
    });

    it('should scroll to last column with very wide cells', () => {
      createDataArray(20, 100);
      spec().$wrapper.width(260).height(201);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(50);
      wt.draw();
      createDataArray(100, 30);
      wt.draw();

      expect(spec().$table.find('tbody tr:first td').length).toBeGreaterThan(3);
    });

    it('should update the scroll position of overlays only once, when scrolling the master table', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const topOverlayCallback = jasmine.createSpy('topOverlayCallback');
      const inlineStartOverlayCallback = jasmine.createSpy('inlineStartOverlayCallback');

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2
      });
      const masterHolder = wt.wtTable.holder;
      const inlineStartOverlayHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
      const topOverlayHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;

      topOverlayHolder.addEventListener('scroll', topOverlayCallback);
      inlineStartOverlayHolder.addEventListener('scroll', inlineStartOverlayCallback);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(50, 50));
      wt.draw();

      await sleep(100);
      expect(topOverlayCallback.calls.count()).toEqual(1);
      expect(inlineStartOverlayCallback.calls.count()).toEqual(1);

      expect(topOverlayHolder.scrollLeft).toEqual(masterHolder.scrollLeft);
      expect(inlineStartOverlayHolder.scrollTop).toEqual(masterHolder.scrollTop);

      topOverlayHolder.removeEventListener('scroll', topOverlayCallback);
      inlineStartOverlayHolder.removeEventListener('scroll', inlineStartOverlayCallback);
    });

    it('should call onScrollHorizontally hook, if scrollLeft was changed', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const scrollHorizontally = jasmine.createSpy('scrollHorizontal');
      const scrollVertically = jasmine.createSpy('scrollVertically');

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        onScrollVertically: scrollVertically,
        onScrollHorizontally: scrollHorizontally,
      });

      wt.draw();
      wt.wtTable.holder.scrollLeft = -400;

      wt.draw();

      await sleep(50);

      expect(scrollVertically.calls.count()).toEqual(0);
      expect(scrollHorizontally.calls.count()).toEqual(1);
    });

    it('should scroll the table when the `wheel` event is triggered on the top-right corner overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const inlineStartCallback = jasmine.createSpy('inlineStartCallback');

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const topInlineStartCornerOverlayHolder = wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder;
      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const inlineStartHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      inlineStartHolder.addEventListener('scroll', inlineStartCallback);

      wheelOnElement(topInlineStartCornerOverlayHolder, 0, 400); // scroll to bottom
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(0);
      expect(bottomCallback.calls.count()).toEqual(0);
      expect(inlineStartCallback.calls.count()).toEqual(1);

      masterCallback.calls.reset();
      topCallback.calls.reset();
      bottomCallback.calls.reset();
      inlineStartCallback.calls.reset();

      wheelOnElement(topInlineStartCornerOverlayHolder, -400, 0); // scroll to left
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(inlineStartCallback.calls.count()).toEqual(0);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      inlineStartHolder.removeEventListener('scroll', inlineStartCallback);
    });

    it('should scroll the table when the `wheel` event is triggered on the bottom-right corner overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const bottomInlineStartCornerOverlayHolder = wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder;
      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const inlineStartHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      wheelOnElement(bottomInlineStartCornerOverlayHolder, 0, 400); // scroll to bottom
      wt.draw();

      await sleep(200);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const inlineStartCallback = jasmine.createSpy('inlineStartCallback');

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      inlineStartHolder.addEventListener('scroll', inlineStartCallback);

      wheelOnElement(bottomInlineStartCornerOverlayHolder, 0, -400); // scroll to top
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(0);
      expect(bottomCallback.calls.count()).toEqual(0);
      expect(inlineStartCallback.calls.count()).toEqual(1);

      masterCallback.calls.reset();
      topCallback.calls.reset();
      bottomCallback.calls.reset();
      inlineStartCallback.calls.reset();

      wheelOnElement(bottomInlineStartCornerOverlayHolder, -400, 0); // scroll to left
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(inlineStartCallback.calls.count()).toEqual(0);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      inlineStartHolder.removeEventListener('scroll', inlineStartCallback);
    });

    it('should scroll the table when the `wheel` event is triggered on the right overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const inlineStartCallback = jasmine.createSpy('inlineStartCallback');

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const inlineStartHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      inlineStartHolder.addEventListener('scroll', inlineStartCallback);

      wheelOnElement(inlineStartHolder, 0, 400); // scroll to bottom
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(0);
      expect(bottomCallback.calls.count()).toEqual(0);
      expect(inlineStartCallback.calls.count()).toEqual(1);

      masterCallback.calls.reset();
      topCallback.calls.reset();
      bottomCallback.calls.reset();
      inlineStartCallback.calls.reset();

      wheelOnElement(inlineStartHolder, -400, 0); // scroll to left
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(inlineStartCallback.calls.count()).toEqual(0);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      inlineStartHolder.removeEventListener('scroll', inlineStartCallback);
    });

    it('should scroll the table when the `wheel` event is triggered on the bottom overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const inlineStartHolder = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      wheelOnElement(bottomHolder, 0, 400); // scroll to bottom
      wt.draw();

      await sleep(200);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const inlineStartCallback = jasmine.createSpy('inlineStartCallback');

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      inlineStartHolder.addEventListener('scroll', inlineStartCallback);

      wheelOnElement(bottomHolder, 0, -400); // scroll to top
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(0);
      expect(bottomCallback.calls.count()).toEqual(0);
      expect(inlineStartCallback.calls.count()).toEqual(1);

      masterCallback.calls.reset();
      topCallback.calls.reset();
      bottomCallback.calls.reset();
      inlineStartCallback.calls.reset();

      wheelOnElement(bottomHolder, -400, 0); // scroll to left
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(inlineStartCallback.calls.count()).toEqual(0);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      inlineStartHolder.removeEventListener('scroll', inlineStartCallback);
    });
  });

  describe('scrollViewport - horizontally', () => {
    beforeEach(() => {
      spec().$wrapper.width(201).height(201);
    });

    it('should scroll to last column on the left', () => {
      spec().data = createSpreadsheetData(10, 10);

      spec().$wrapper.width(201).height(201);
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50
      });

      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);

      wt.scrollViewport(new Walkontable.CellCoords(0, 9));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9);
    });

    it('should not scroll back to a column that is in viewport', () => {
      spec().data = createSpreadsheetData(10, 10);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50
      });

      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);

      wt.scrollViewport(new Walkontable.CellCoords(0, 9));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9);

      wt.scrollViewport(new Walkontable.CellCoords(0, 9));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9); // nothing changed

      wt.scrollViewport(new Walkontable.CellCoords(0, 8));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9); // nothing changed

      wt.scrollViewport(new Walkontable.CellCoords(0, 7));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9); // nothing changed
    });

    it('should scroll back to a column that is before viewport', () => {
      spec().data = createSpreadsheetData(10, 10);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50
      });

      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);

      wt.scrollViewport(new Walkontable.CellCoords(0, 9));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 3));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(5);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 4));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(5);// nothing changed

      wt.scrollViewport(new Walkontable.CellCoords(0, 9));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9);
    });

    it('should scroll to a column that is after viewport', () => {
      spec().data = createSpreadsheetData(10, 10);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 2));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 4));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(4);
    });

    it('should scroll to a wide column that is after viewport', () => {
      spec().data = createSpreadsheetData(10, 10);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(col) {
          if (col === 3) {
            return 100;
          }

          return 50;
        }
      });

      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(0);

      wt.scrollViewport(new Walkontable.CellCoords(0, 3));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(2);
    });
  });
});
