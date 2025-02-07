describe('manualRowMove', () => {
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
    it('should move the table\'s viewport down when the next mouse-overed element is below the table', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      const rowHeader = $(getCell(1, -1));
      const nextElement = $(document.body);

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top,
        });
      nextElement
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: 0,
          clientY: getMaster()[0].getBoundingClientRect().bottom + 1,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(20);
    });

    it.forTheme('classic')('should move the table\'s viewport down when the next mouse-overed ' +
      'element is a row that belongs to ' +
       'the bottom overlay', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        fixedRowsBottom: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      const rowHeader = $(getCell(1, -1));
      const bottomOverlayFirstRowHeader = $(getCell(8, -1));

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top,
        });
      bottomOverlayFirstRowHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: bottomOverlayFirstRowHeader.offset().top + bottomOverlayFirstRowHeader.innerHeight()
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(0);
    });

    it.forTheme('main')('should move the table\'s viewport down when the next mouse-overed element ' +
      'is a row that belongs to the bottom overlay', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 190,
        fixedRowsBottom: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      const rowHeader = $(getCell(1, -1));
      const bottomOverlayFirstRowHeader = $(getCell(8, -1));

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top,
        });
      bottomOverlayFirstRowHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: bottomOverlayFirstRowHeader.offset().top + bottomOverlayFirstRowHeader.innerHeight()
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(0);
    });

    it('should move the table\'s viewport down when the next mouse-overed element is a row that belongs to ' +
       'the bottom overlay (with hidden rows)', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        fixedRowsBottom: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        hiddenRows: {
          rows: [0, 9]
        }
      });

      const rowHeader = $(getCell(1, -1));
      const bottomOverlayFirstRowHeader = $(getCell(8, -1));

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top,
        });
      bottomOverlayFirstRowHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: bottomOverlayFirstRowHeader.offset().top + bottomOverlayFirstRowHeader.innerHeight()
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(0);
    });

    it.forTheme('classic')('should not move the table\'s viewport when the next mouse-overed element' +
      ' is the last row that belongs to the main table and there are some bottom overlay rows', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        fixedRowsBottom: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      const rowHeader = $(getCell(1, -1));
      const nextRowHeader = $(getCell(2, -1));

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top + rowHeader.innerHeight() - 1,
        });
      nextRowHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: nextRowHeader[0].getBoundingClientRect().top + 1,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);
    });

    it.forTheme('main')('should not move the table\'s viewport when the next mouse-overed element ' +
      'is the last row that belongs to the main table and there are some bottom overlay rows', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 190,
        fixedRowsBottom: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      const rowHeader = $(getCell(1, -1));
      const nextRowHeader = $(getCell(2, -1));

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top + rowHeader.innerHeight() - 1,
        });
      nextRowHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: nextRowHeader[0].getBoundingClientRect().top + 1,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);
    });

    it('should move the table\'s viewport up when the next mouse-overed element is above the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const rowHeader = $(getCell(7, -1));
      const nextElement = $(document.body);

      expect(getMaster().find('.wtHolder').scrollTop()).forThemes(({ classic, main }) => {
        classic.toBeGreaterThan(105);
        main.toBeGreaterThan(185); // not sure about this value
      });

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top,
        });
      nextElement
        .simulate('mouseover')
        .simulate('mousemove', {
          clientX: 0,
          clientY: getMaster()[0].getBoundingClientRect().top - 1,
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).forThemes(({ classic, main }) => {
        classic.toBeLessThan(105);
        main.toBeLessThan(185);
      });
    });

    it('should move the table\'s viewport up when the next mouse-overed element is a row that belongs to ' +
       'the top overlay', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        fixedRowsTop: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const rowHeader = $(getCell(7, -1));
      const topOverlayLastRowHeader = $(getCell(1, -1));

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(100);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top,
        });
      topOverlayLastRowHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: topOverlayLastRowHeader.offset().top - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBeLessThan(100);
    });

    it('should move the table\'s viewport up when the next mouse-overed element is a row that belongs to ' +
       'the top overlay (with hidden rows)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        fixedRowsTop: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        hiddenRows: {
          rows: [0, 9]
        }
      });

      scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const rowHeader = $(getCell(7, -1));
      const topOverlayLastRowHeader = $(getCell(1, -1));

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(50);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top,
        });
      topOverlayLastRowHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: topOverlayLastRowHeader.offset().top - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBeLessThan(100);
    });

    it('should not move the table\'s viewport when the next mouse-overed element is the first row that belongs ' +
       'to the main table and there are some top overlay rows', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 150,
        fixedRowsTop: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const rowHeader = $(getCell(8, -1));
      const nextRowHeader = $(getCell(7, -1));

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(100);

      rowHeader
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: rowHeader.offset().top,
        });
      nextRowHeader
        .simulate('mouseover')
        .simulate('mousemove', {
          clientY: nextRowHeader.offset().top + nextRowHeader.innerHeight() - 1
        })
        .simulate('mouseup');

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(100);
    });
  });
});
