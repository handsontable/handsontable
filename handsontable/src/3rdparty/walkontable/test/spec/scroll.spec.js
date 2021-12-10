describe('WalkontableScroll', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('scroll', () => {
    it('should scroll to last column when rowHeaders is not in use', () => {
      const wt = walkontable({
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

    it('scroll not scroll the viewport if all rows are visible', () => {
      spec().data.splice(5);

      spec().$wrapper.height(201).width(100);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getVisibleRowsCount()).toEqual(5);

      wt.scrollViewportVertically(getTotalRows() - 1);
      wt.draw();

      expect(wt.wtTable.getCoords(spec().$table.find('tbody tr:eq(0) td:eq(0)')[0]))
        .toEqual(new Walkontable.CellCoords(0, 0));
    });

    it('scroll horizontal should take totalColumns if it is smaller than width', () => {
      const wt = walkontable({
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

    it('scroll vertical should return `false` if given number smaller than 0', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.scrollViewportVertically(-1)).toBe(false);
    });

    it('scroll vertical should return `false` if given number bigger than totalRows', () => {
      spec().data.splice(20, spec().data.length - 20);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.scrollViewportVertically(999)).toBe(false);
    });

    it('scroll horizontal should return `false` if given number smaller than 0', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.scrollViewportHorizontally(-1)).toBe(false);
    });

    it('scroll horizontal should return `false` if given number bigger than totalRows', () => {
      const wt = walkontable({
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

    it('scroll viewport to a cell on far right should make it visible on right edge', () => {
      spec().$wrapper.width(125).height(201);

      const wt = walkontable({
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

    it('scroll viewport to a cell on far left should make it visible on left edge', () => {
      spec().$wrapper.width(100).height(201);

      const wt = walkontable({
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

    it('scroll viewport to a cell on far left should make it visible on left edge (with row header)', () => {
      spec().$wrapper.width(140).height(201);

      const wt = walkontable({
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

    it('scroll viewport to a cell on far right should make it visible on right edge (with row header)', () => {
      const wt = walkontable({
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

    it('scroll viewport to a cell on far bottom should make it visible on bottom edge', () => {
      spec().$wrapper.width(125).height(201);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(12, 0));
      wt.draw();

      expect(wt.getViewport()[0]).toBeAroundValue(5);
      expect(wt.getViewport()[1]).toBeAroundValue(0);
      expect(wt.getViewport()[2]).toBeAroundValue(12);
      expect(wt.getViewport()[3]).toBeAroundValue(1);
    });

    it('scroll viewport to a cell on far top should make it visible on top edge', () => {
      spec().$wrapper.width(100).height(201);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(20, 0));
      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(12, 0));
      wt.draw();

      expect(wt.wtTable.getCoords(spec().$table.find('tbody tr:first td:first')[0]))
        .toEqual(new Walkontable.CellCoords(12, 0));
    });

    it('scroll viewport to a cell that does not exist (vertically) should return `false`', () => {
      spec().data.splice(20, spec().data.length - 20);

      spec().$wrapper.width(100).height(201);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.scrollViewport(new Walkontable.CellCoords(40, 0))).toBe(false);
    });

    it('scroll viewport to a cell that does not exist (horizontally) should return `false`', () => {
      spec().$wrapper.width(100).height(201);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.scrollViewport(new Walkontable.CellCoords(0, 40))).toBe(false);
    });

    it('remove row from the last scroll page should scroll viewport a row up if needed', () => {
      spec().$wrapper.width(100).height(210);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(getTotalRows() - 1, 0));
      wt.draw();

      const originalViewportStartRow = wt.getViewport()[0];

      spec().data.splice(getTotalRows() - 4, 1); // remove row at index 96
      wt.draw();

      expect(originalViewportStartRow - 1).toEqual(wt.getViewport()[0]);
    });

    it('should scroll to last row if smaller data source is loaded that does not have currently displayed row', () => {
      spec().$wrapper.width(100).height(260);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportVertically(50);
      wt.draw();
      spec().data.splice(30, spec().data.length - 30);
      wt.draw();

      expect(spec().$table.find('tbody tr').length).toBeGreaterThan(9);
    });

    it('should scroll to last column if smaller data source is loaded that does not have currently displayed column', () => {
      createDataArray(20, 100);

      const wt = walkontable({
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

    it('should scroll to last row with very high rows', () => {
      createDataArray(20, 100);

      for (let i = 0, ilen = spec().data.length; i < ilen; i++) {
        spec().data[i][0] += '\n this \nis \na \nmultiline \ncell';
      }

      spec().$wrapper.width(260).height(201);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportVertically(getTotalRows() - 1);
      wt.draw();

      expect(spec().$table.find('tbody tr:last td:first')[0])
        .toBe(wt.wtTable.getCell(new Walkontable.CellCoords(spec().data.length - 1, 0))); // last rendered row should be last data row
    });

    xit('should scroll to last row with very high rows (respecting fixedRows)', () => {
      createDataArray(20, 100);

      for (let i = 0, ilen = spec().data.length; i < ilen; i++) {
        spec().data[i][0] += '\n this \nis \na \nmultiline \ncell';
      }

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2
      });

      wt.draw();
      wt.scrollViewportVertically(2000);
      wt.draw();

      expect(spec().$table.find('tbody tr:eq(0) td:first')[0])
        .toBe(wt.wtTable.getCell(new Walkontable.CellCoords(0, 0))); // first rendered row should fixed row 0
      expect(spec().$table.find('tbody tr:eq(1) td:first')[0])
        .toBe(wt.wtTable.getCell(new Walkontable.CellCoords(1, 0))); // second rendered row should fixed row 1
      expect(spec().$table.find('tbody tr:eq(2) td:first')[0])
        .toBe(wt.wtTable.getCell(new Walkontable.CellCoords(2, 0))); // third rendered row should fixed row 1
      expect(spec().$table.find('tbody tr:last td:first')[0])
        .toBe(wt.wtTable.getCell(new Walkontable.CellCoords(spec().data.length - 1, 0))); // last rendered row should be last data row
    });

    it('should scroll to last column with very wide cells', () => {
      createDataArray(20, 100);
      spec().$wrapper.width(260).height(201);

      const wt = walkontable({
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

    it('should scroll the desired cell to the bottom edge even if it\'s located in a fixed column', async() => {
      createDataArray(20, 100);
      spec().$wrapper.width(260).height(201);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(8, 1));
      wt.draw();

      await sleep(50);

      expect(wt.wtTable.getLastVisibleRow()).toBe(8);
    });

    it('should update the scroll position of overlays only once, when scrolling the master table', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const topOverlayCallback = jasmine.createSpy('topOverlayCallback');
      const leftOverlayCallback = jasmine.createSpy('leftOverlayCallback');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2
      });
      const masterHolder = wt.wtTable.holder;
      const leftOverlayHolder = wt.wtOverlays.leftOverlay.clone.wtTable.holder;
      const topOverlayHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;

      topOverlayHolder.addEventListener('scroll', topOverlayCallback);
      leftOverlayHolder.addEventListener('scroll', leftOverlayCallback);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(50, 50));
      wt.draw();

      await sleep(100);
      expect(topOverlayCallback.calls.count()).toEqual(1);
      expect(leftOverlayCallback.calls.count()).toEqual(1);

      expect(topOverlayHolder.scrollLeft).toEqual(masterHolder.scrollLeft);
      expect(leftOverlayHolder.scrollTop).toEqual(masterHolder.scrollTop);

      topOverlayHolder.removeEventListener('scroll', topOverlayCallback);
      leftOverlayHolder.removeEventListener('scroll', leftOverlayCallback);
    });

    it('should call onScrollVertically hook, if scrollTop was changed', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const scrollHorizontally = jasmine.createSpy('scrollHorizontal');
      const scrollVertically = jasmine.createSpy('scrollVertically');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        onScrollVertically: scrollVertically,
        onScrollHorizontally: scrollHorizontally,
      });

      wt.draw();
      wt.wtTable.holder.scrollTop = 400;

      wt.draw();

      await sleep(50);

      expect(scrollVertically.calls.count()).toEqual(1);
      expect(scrollHorizontally.calls.count()).toEqual(0);
    });

    it('should call onScrollHorizontally hook, if scrollLeft was changed', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const scrollHorizontally = jasmine.createSpy('scrollHorizontal');
      const scrollVertically = jasmine.createSpy('scrollVertically');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        onScrollVertically: scrollVertically,
        onScrollHorizontally: scrollHorizontally,
      });

      wt.draw();
      wt.wtTable.holder.scrollLeft = 400;

      wt.draw();

      await sleep(50);

      expect(scrollVertically.calls.count()).toEqual(0);
      expect(scrollHorizontally.calls.count()).toEqual(1);
    });

    it('should scroll the table when the `wheel` event is triggered on the top-left corner overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const leftCallback = jasmine.createSpy('leftCallback');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const topLeftCornerOverlayHolder = wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder;
      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const leftHolder = wt.wtOverlays.leftOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      leftHolder.addEventListener('scroll', leftCallback);

      // wheel + shift
      wheelOnElement(topLeftCornerOverlayHolder, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(0);

      wheelOnElement(topLeftCornerOverlayHolder, 0, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(2);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(1);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      leftHolder.removeEventListener('scroll', leftCallback);
    });

    it('should scroll the table when the `wheel` event is triggered on the bottom-left corner overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const leftCallback = jasmine.createSpy('leftCallback');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const bottomLeftCornerOverlayHolder = wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder;
      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const leftHolder = wt.wtOverlays.leftOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      leftHolder.addEventListener('scroll', leftCallback);

      // wheel + shift
      wheelOnElement(bottomLeftCornerOverlayHolder, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(0);

      wheelOnElement(bottomLeftCornerOverlayHolder, 0, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(2);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(1);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      leftHolder.removeEventListener('scroll', leftCallback);
    });

    it('should scroll the table when the `wheel` event is triggered on the left overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const leftCallback = jasmine.createSpy('leftCallback');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const leftHolder = wt.wtOverlays.leftOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      leftHolder.addEventListener('scroll', leftCallback);

      // wheel + shift
      wheelOnElement(leftHolder, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(0);

      wheelOnElement(leftHolder, 0, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(2);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(1);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      leftHolder.removeEventListener('scroll', leftCallback);
    });

    it('should scroll the table when the `wheel` event is triggered on the top overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const leftCallback = jasmine.createSpy('leftCallback');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const leftHolder = wt.wtOverlays.leftOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      leftHolder.addEventListener('scroll', leftCallback);

      // wheel + shift
      wheelOnElement(topHolder, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(0);

      wheelOnElement(topHolder, 0, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(2);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(1);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      leftHolder.removeEventListener('scroll', leftCallback);
    });

    it('should scroll the table when the `wheel` event is triggered on the bottom overlay', async() => {
      createDataArray(100, 100);
      spec().$wrapper.width(260).height(201);

      const masterCallback = jasmine.createSpy('masterCallback');
      const topCallback = jasmine.createSpy('topCallback');
      const bottomCallback = jasmine.createSpy('bottomCallback');
      const leftCallback = jasmine.createSpy('leftCallback');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const topHolder = wt.wtOverlays.topOverlay.clone.wtTable.holder;
      const bottomHolder = wt.wtOverlays.bottomOverlay.clone.wtTable.holder;
      const leftHolder = wt.wtOverlays.leftOverlay.clone.wtTable.holder;
      const masterHolder = wt.wtTable.holder;

      masterHolder.addEventListener('scroll', masterCallback);
      topHolder.addEventListener('scroll', topCallback);
      bottomHolder.addEventListener('scroll', bottomCallback);
      leftHolder.addEventListener('scroll', leftCallback);

      // wheel + shift
      wheelOnElement(bottomHolder, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(1);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(0);

      wheelOnElement(bottomHolder, 0, 400);
      wt.draw();

      await sleep(200);

      expect(masterCallback.calls.count()).toEqual(2);
      expect(topCallback.calls.count()).toEqual(1);
      expect(bottomCallback.calls.count()).toEqual(1);
      expect(leftCallback.calls.count()).toEqual(1);

      masterHolder.removeEventListener('scroll', masterCallback);
      topHolder.removeEventListener('scroll', topCallback);
      bottomHolder.removeEventListener('scroll', bottomCallback);
      leftHolder.removeEventListener('scroll', leftCallback);
    });
  });

  describe('scrollViewport - horizontally', () => {
    beforeEach(() => {
      spec().$wrapper.width(201).height(201);
    });

    it('should scroll to last column on the right', () => {
      spec().data = createSpreadsheetData(10, 10);

      spec().$wrapper.width(201).height(201);
      const wt = walkontable({
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

    xit('should scroll to a very wide column that is after viewport', () => {
      spec().data = createSpreadsheetData(10, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(col) {
          if (col === 3) {
            return 300;
          }

          return 50;
        }
      });

      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(0);

      wt.scrollViewport(new Walkontable.CellCoords(0, 3)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(3);

      wt.scrollViewport(new Walkontable.CellCoords(0, 2)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(2);

      wt.scrollViewport(new Walkontable.CellCoords(0, 3)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(3);

      wt.scrollViewport(new Walkontable.CellCoords(0, 4)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(4);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(3);
    });

    xit('should scroll to a very wide column that is after viewport (with fixedColumnsLeft)', () => {
      spec().data = createSpreadsheetData(1, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(col) {
          if (col === 3) {
            return 300;
          }

          return 50;
        },
        fixedColumnsLeft: 2
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 3));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 2));
      wt.draw();
      expect(wt.wtTable.getFirstVisibleColumn()).toBeGreaterThan(2);
      expect(wt.wtTable.getLastVisibleColumn()).toBeGreaterThan(2);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 3));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(0, 4));
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(4);
    });
  });

  describe('scrollViewport - vertically', () => {
    beforeEach(() => {
      spec().$wrapper.width(201).height(201);
    });

    xit('should scroll to a very high row that is after viewport', () => {
      spec().data = createSpreadsheetData(20, 1);

      const txt = 'Very very very very very very very very very very very very very very very very very long text.';

      spec().data[4][0] = txt;

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      expect(wt.wtTable.getFirstVisibleRow()).toEqual(0);

      wt.scrollViewport(new Walkontable.CellCoords(4, 0));
      wt.draw();
      expect(wt.wtTable.getLastVisibleRow()).toEqual(4);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(5, 0));
      wt.draw();
      expect(wt.wtTable.getLastVisibleRow()).toEqual(5);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(4, 0));
      wt.draw();
      expect(wt.wtTable.getFirstVisibleRow()).toEqual(4);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(3, 0));
      wt.draw();
      expect(wt.wtTable.getFirstVisibleRow()).toEqual(3);
    });

    xit('should scroll to a very high row that is after viewport (at the end)', () => {
      spec().data = createSpreadsheetData(20, 1);

      const txt = 'Very very very very very very very very very very very very very very very very very long text.';

      spec().data[19][0] = txt;

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(18, 0));
      wt.draw();
      expect(spec().$table.find('tbody tr').length).toBe(2);
      expect(spec().$table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A18');
      expect(spec().$table.find('tbody tr:eq(1) td:eq(0)').html()).toBe(txt);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(19, 0));
      wt.draw();
      expect(spec().$table.find('tbody tr').length).toBe(1);
      expect(spec().$table.find('tbody tr:eq(0) td:eq(0)').html()).toBe(txt); // scrolled down

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(18, 0));
      wt.draw();
      expect(spec().$table.find('tbody tr').length).toBe(2);
      expect(spec().$table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A18'); // scrolled up
      expect(spec().$table.find('tbody tr:eq(1) td:eq(0)').html()).toBe(txt);

      wt.draw();
      wt.scrollViewport(new Walkontable.CellCoords(17, 0));
      wt.draw();
      expect(spec().$table.find('tbody tr').length).toBe(3);
      expect(spec().$table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A17'); // scrolled up
      expect(spec().$table.find('tbody tr:eq(1) td:eq(0)').html()).toBe('A18');
      expect(spec().$table.find('tbody tr:eq(2) td:eq(0)').html()).toBe(txt);
    });
  });
});
