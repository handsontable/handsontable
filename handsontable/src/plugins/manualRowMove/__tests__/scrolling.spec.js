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
    it('should move the table\'s viewport down when the next mouse-overed element is below the table', async() => {
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

      expect(getMaster().find('.wtHolder').scrollTop()).toBeGreaterThan(0);
    });

    it('should move the table\'s viewport down when the next mouse-overed ' +
      'element is a row that belongs to the bottom overlay', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: containerHeightForRows(4),
        fixedRowsBottom: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        viewportColumnRenderingOffset: 10,
        viewportRowRenderingOffset: 10,
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
       'the bottom overlay (with hidden rows)', async() => {
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
        },
        viewportColumnRenderingOffset: 10,
        viewportRowRenderingOffset: 10,
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

    it('should not move the table\'s viewport when the next mouse-overed element' +
      ' is the last row that belongs to the main table and there are some bottom overlay rows', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: containerHeightForRows(6),
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
        height: containerHeightForRows(3),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      await scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      const scrollTopBefore = getMaster().find('.wtHolder').scrollTop();
      const rowHeader = $(getCell(7, -1));
      const nextElement = $(document.body);

      expect(scrollTopBefore).toBeGreaterThan(0);

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

      expect(getMaster().find('.wtHolder').scrollTop()).toBeLessThan(scrollTopBefore);
    });

    it('should move the table\'s viewport up when the next mouse-overed element is a row that belongs to the top overlay', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: containerHeightForRows(3),
        fixedRowsTop: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        viewportColumnRenderingOffset: 10,
        viewportRowRenderingOffset: 10,
      });

      await scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      const scrollTopBefore = getMaster().find('.wtHolder').scrollTop();
      const rowHeader = $(getCell(7, -1));
      const topOverlayLastRowHeader = $(getCell(1, -1));

      expect(scrollTopBefore).toBeGreaterThan(0);

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

      expect(getMaster().find('.wtHolder').scrollTop()).toBeLessThan(scrollTopBefore);
    });

    it('should move the table\'s viewport up when the next mouse-overed element is a row that belongs to ' +
       'the top overlay (with hidden rows)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: containerHeightForRows(3),
        fixedRowsTop: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        hiddenRows: {
          rows: [0, 9]
        },
        viewportColumnRenderingOffset: 10,
        viewportRowRenderingOffset: 10,
      });

      await scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      const scrollTopBefore = getMaster().find('.wtHolder').scrollTop();
      const rowHeader = $(getCell(7, -1));
      const topOverlayLastRowHeader = $(getCell(1, -1));

      expect(scrollTopBefore).toBeGreaterThan(0);

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

      expect(getMaster().find('.wtHolder').scrollTop()).toBeLessThan(scrollTopBefore);
    });

    it('should not move the table\'s viewport when the next mouse-overed element is the first row that belongs ' +
       'to the main table and there are some top overlay rows', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        // Tall enough that the master's band holds three body rows below the frozen pane on every
        // theme. At 150px it holds two on horizon (37px rows against a 38px scrollable strip), and
        // the row indexes below then address rows outside the band.
        height: 260,
        fixedRowsTop: 2,
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
      });

      await scrollViewportTo({
        row: countRows() - 1,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'start',
      });

      // The row this test is about is the first main-table row the user can actually see, so read it
      // from the viewport rather than hardcoding an index. It is NOT the master's first RENDERED row:
      // the master also renders the rows hidden behind the frozen pane, and hovering one of those
      // does scroll the viewport. Scrolled to the bottom, `scrollTop` sits at its clamp, so a
      // one-pixel change in the total content height moves which row this is.
      const firstMainTableRow = getFirstFullyVisibleRow();
      const rowHeader = $(getCell(firstMainTableRow + 1, -1));
      const nextRowHeader = $(getCell(firstMainTableRow, -1));
      const scrollTopBefore = getMaster().find('.wtHolder').scrollTop();

      expect(scrollTopBefore).toBeGreaterThan(0);

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

      expect(getMaster().find('.wtHolder').scrollTop()).toBe(scrollTopBefore);
    });
  });
});
