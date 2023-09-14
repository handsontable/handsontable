describe('manualColumnMove', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('scrolling', () => {
    it('should move the table\'s viewport right when the next mouse-overed element is on ' +
       'the right of the table', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
        manualColumnMove: true,
      });

      const columnHeader = $(getCell(-1, 1));
      const nextElement = $(document.body);

      expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);

      columnHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: columnHeader.offset().left,
        });
      nextElement
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: getMaster()[0].getBoundingClientRect().right + 1,
          clientY: 0,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBe(50);
    });

    it('should not move the table\'s viewport when the next mouse-overed element is the last column', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
        manualColumnMove: true,
      });

      const columnHeader = $(getCell(-1, 1));
      const nextColumnHeader = $(getCell(-1, 2));

      expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);

      columnHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: columnHeader.offset().left,
        });
      nextColumnHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: nextColumnHeader.offset().left + (nextColumnHeader.innerWidth() / 2)
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);
    });

    it('should move the table\'s viewport left when the next mouse-overed element is on ' +
       'the left of the table', async() => {
      spec().$container.css('margin-left', '100px');

      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
        manualColumnMove: true,
      });

      scrollViewportTo({
        row: 0,
        col: countCols() - 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const columnHeader = $(getCell(-1, 8));
      const nextElement = $(document.body);

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(349);

      columnHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: columnHeader.offset().left,
        });
      nextElement
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: getMaster()[0].getBoundingClientRect().left - 1,
          clientY: 0,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeLessThan(349);
    });

    it('should move the table\'s viewport left when the next mouse-overed element is a column ' +
       'that belongs to the left overlay', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        fixedColumnsStart: 1,
        rowHeaders: true,
        colHeaders: true,
        manualColumnMove: true,
      });

      scrollViewportTo({
        row: 0,
        col: countCols() - 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const columnHeader = $(getCell(-1, 9));
      const leftOverlayColumnHeader = $(getCell(-1, 0));

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(349);

      columnHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: columnHeader.offset().left,
        });
      leftOverlayColumnHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: leftOverlayColumnHeader.offset().left - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeLessThan(349);
    });

    it('should move the table\'s viewport left when the next mouse-overed element is a column ' +
       'that belongs to the left overlay (with hidden columns)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 250,
        height: 150,
        fixedColumnsStart: 2,
        rowHeaders: true,
        colHeaders: true,
        manualColumnMove: true,
        hiddenColumns: {
          columns: [0, 9]
        }
      });

      await sleep(10);

      scrollViewportTo({
        row: 0,
        col: countCols() - 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      const columnHeader = $(getCell(-1, 8));
      const leftOverlayColumnHeader = $(getCell(-1, 1));

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(199);

      columnHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: columnHeader.offset().left,
        });
      leftOverlayColumnHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: leftOverlayColumnHeader.offset().left - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeLessThan(199);
    });

    it('should not move the table\'s viewport when the next mouse-overed element is the first column ' +
       'that belongs to the main table and there are some left overlay columns', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 250,
        height: 150,
        fixedColumnsStart: 2,
        rowHeaders: true,
        colHeaders: true,
        manualColumnMove: true,
      });

      scrollViewportTo({
        row: 0,
        col: countCols() - 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const columnHeader = $(getCell(-1, 9));
      const nextColumnHeader = $(getCell(-1, 8));

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(299);

      columnHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: columnHeader.offset().left,
        });
      nextColumnHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: nextColumnHeader.offset().left + nextColumnHeader.innerWidth() - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(299);
    });
  });
});
