describe('manualRowResize (RTL mode)', () => {
  const id = 'test';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should resize (expanding and narrowing) selected rows', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      rowHeaders: true,
      manualRowResize: true
    });

    resizeRow(2, 60);
    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

    const $rowsHeaders = getInlineStartClone().find('tr th');

    $rowsHeaders.eq(1).simulate('mousedown');
    $rowsHeaders.eq(2).simulate('mouseover');
    $rowsHeaders.eq(3).simulate('mouseover');
    $rowsHeaders.eq(3).simulate('mousemove');
    $rowsHeaders.eq(3).simulate('mouseup');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await sleep(600);

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top - $rowsHeaders.eq(3).height() + 80 });
    $resizer.simulate('mouseup');

    expect($rowsHeaders.eq(1).height()).toBe(80);
    expect($rowsHeaders.eq(2).height()).toBe(80);
    expect($rowsHeaders.eq(3).height()).toBe(80);

    await sleep(1200);

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top - $rowsHeaders.eq(3).height() + 35 });
    $resizer.simulate('mouseup');

    expect($rowsHeaders.eq(1).height()).toBe(35);
    expect($rowsHeaders.eq(2).height()).toBe(35);
    expect($rowsHeaders.eq(3).height()).toBe(35);
  });

  describe('handle position in a table positioned using CSS\'s `transform`', () => {
    it('should display the handles in the correct position, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(-50px, 120px)');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 10),
        colHeaders: true,
        rowHeaders: true,
        manualRowResize: true,
        height: 400,
        width: 200
      });

      const mainHolder = hot.view._wt.wtTable.holder;
      let $rowHeader = getInlineStartClone().find('tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      $(mainHolder).scrollTop(1); // we have to trigger innerBorderTop before we scroll to correct position
      await sleep(100);
      $(mainHolder).scrollTop(200);
      await sleep(400);

      $rowHeader = getInlineStartClone().find('tr:eq(13) th:eq(0)');
      $rowHeader.simulate('mouseover');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    });

    it('should display the handles in the correct position, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(-50px, 120px)');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(80, 10),
        colHeaders: true,
        rowHeaders: true,
        manualRowResize: true,
      });

      let $rowHeader = getInlineStartClone().find('tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      $(window).scrollTop(600);

      await sleep(400);

      $rowHeader = getInlineStartClone().find('tr:eq(13) th:eq(0)');
      $rowHeader.simulate('mouseover');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      $(window).scrollTop(0);
    });
  });

  describe('handle and guide', () => {
    using('configuration object', [
      { htmlDir: 'rtl', layoutDirection: 'inherit' },
      { htmlDir: 'ltr', layoutDirection: 'rtl' },
    ], ({ htmlDir, layoutDirection }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      it('should display the resize handle in the proper position and with a proper size', () => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          rowHeaders: true,
          manualRowResize: true
        });

        const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualRowResizer');

        expect($handle.offset().top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - $handle.outerHeight() - 1, 0);
          main.toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - ($handle.outerHeight() / 2) - 1, 0);
        });
        expect($handle.offset().left).toBeCloseTo($headerTH.offset().left, 0);
        expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
      });

      it('should display the resize handle in the correct place after the table has been scrolled', async() => {
        const hot = handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(20, 20),
          rowHeaders: true,
          manualRowResize: true,
          height: 100,
          width: 200
        });

        const mainHolder = hot.view._wt.wtTable.holder;
        let $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

        $rowHeader.simulate('mouseover');

        const $handle = spec().$container.find('.manualRowResizer');

        $handle[0].style.background = 'red';

        expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
        expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);

        $(mainHolder).scrollTop(200);
        $(mainHolder).scroll();

        await sleep(400);

        $rowHeader = getInlineStartClone().find('tbody tr:eq(10) th:eq(0)');
        $rowHeader.simulate('mouseover');

        expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
        expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      });
    });
  });
});
