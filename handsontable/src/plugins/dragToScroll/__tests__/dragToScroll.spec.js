describe('DragToScroll', () => {
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

  /**
   *
   */
  function createBoundaries() {
    return {
      top: 100,
      left: 100,
      width: 900,
      height: 900,
      bottom: 1000,
      right: 1000
    };
  }

  it('exact top, exact left should be in boundaries', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(0);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(100, 100);
  });

  it('exact bottom, exact right should be in boundaries', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(0);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(1000, 1000);
  });

  it('less than top, less than left should be out in "top" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(-1);
    });

    dragToScroll.check(99, 99);
  });

  it('exact top, less than left should be out in "left" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(99, 100);
  });

  it('less than top, more than right should be out in "top" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(-1);
    });

    dragToScroll.check(1001, 99);
  });

  it('more than bottom, more than right should be out in "bottom" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(1);
    });

    dragToScroll.check(1001, 1001);
  });

  it('exact bottom, more than right should be out in "right" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(1);
      expect(scrollY).toEqual(0);
    });

    dragToScroll.check(1001, 1000);
  });

  it('more than bottom, less than left should be out in "bottom" direction', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      dragToScroll: true
    });

    const dragToScroll = hot.getPlugin('dragToScroll');

    dragToScroll.setBoundaries(createBoundaries());

    dragToScroll.setCallback((scrollX, scrollY) => {
      expect(scrollX).toEqual(-1);
      expect(scrollY).toEqual(1);
    });

    dragToScroll.check(99, 1001);
  });

  describe('contextmenu', () => {
    it('should not scroll if the \'mouseup\' event has not been fired after the \'contextmenu\' event', () => {
      handsontable({
        dragToScroll: true
      });

      contextMenu();

      expect(getPlugin('dragToScroll').isListening()).toBe(false);
    });
  });

  describe('drag to scroll (non-window scrollable element)', () => {
    it('should scroll the table to the right, when dragging the selection in that direction outside the table', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
      });

      const $cell = $(getCell(0, 0));
      const $nextElement = $(document.body);

      expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: $cell.offset().left,
        });
      $nextElement
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: getMaster()[0].getBoundingClientRect().right + 1,
          clientY: 0,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBe(50);
    });

    it('should not scroll the table to the right, when dragging the selection in that direction inside the table', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 215,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
      });

      const $cell = $(getCell(0, 1));
      const $nextCell = $(getCell(0, 2));

      expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: $cell.offset().left,
        });
      $nextCell
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: $nextCell.offset().left + ($nextCell.innerWidth() / 2)
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
      });

      scrollViewportTo({
        row: 0,
        col: countCols() - 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const $cell = $(getCell(0, 8));
      const $nextElement = $(document.body);

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(349);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: $cell.offset().left,
        });
      $nextElement
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
      });

      scrollViewportTo({
        row: 0,
        col: countCols() - 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const $cell = $(getCell(0, 9));
      const $leftOverlayCell = $(getCell(0, 0));

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(349);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: $cell.offset().left,
        });
      $leftOverlayCell
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: $leftOverlayCell.offset().left - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeLessThan(349);
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
      });

      scrollViewportTo({
        row: 0,
        col: countCols() - 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const $cell = $(getCell(0, 9));
      const $nextCell = $(getCell(0, 8));

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(299);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientX: $cell.offset().left,
        });
      $nextCell
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: $nextCell.offset().left + $nextCell.innerWidth() - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollLeft()).toBeGreaterThan(299);
    });

    it('should scroll the table down, when dragging the selection in that direction outside the table', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
      });

      const $cell = $(getCell(0, 0));
      const $nextElement = $(document.body);

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: $cell.offset().top,
        });
      $nextElement
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: getMaster()[0].getBoundingClientRect().bottom + 1,
          clientX: 0,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(20);
    });

    it('should not scroll the table to down, when dragging the selection in that direction inside the table', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 215,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
      });

      const $cell = $(getCell(0, 1));
      const $nextCell = $(getCell(0, 2));

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: $cell.offset().top,
        });
      $nextCell
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: $nextCell.offset().top + ($nextCell.innerHeight() / 2)
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);
    });

    it('should move the table\'s viewport upwards when the next mouse-overed element is above' +
      ' of the table', async() => {
      spec().$container.css('margin-top', '100px');

      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const $cell = $(getCell(8, 0));
      const $nextElement = $(document.body);

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(105);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: $cell.offset().top,
        });
      $nextElement
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: getMaster()[0].getBoundingClientRect().top - 1,
          clientX: 0,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).forThemes(({ classic, main }) => {
        classic.toBeLessThan(105);
        main.toBeLessThan(170); // not sure if the correct value
      });
    });

    it('should move the table\'s viewport upwards when the next mouse-overed element is a row ' +
      'that belongs to the top overlay', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        fixedRowsTop: 1,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const $cell = $(getCell(9, 0));
      const $topOverlayCell = $(getCell(0, 0));

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(105);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: $cell.offset().top,
        });
      $topOverlayCell
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: $topOverlayCell.offset().top - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).forThemes(({ classic, main }) => {
        classic.toBeLessThan(105);
        main.toBeLessThan(170); // not sure if the correct value
      });
    });

    it('should not move the table\'s viewport when the next mouse-overed element is the first row ' +
      'that belongs to the main table and there are some top overlay rows', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 250,
        height: 150,
        fixedRowsTop: 2,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const $cell = $(getCell(9, 0));
      const $nextCell = $(getCell(8, 0));

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(100);

      $cell
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: $cell.offset().top,
        });
      $nextCell
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: $nextCell.offset().top + $nextCell.innerHeight() - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(100);
    });
  });
});
