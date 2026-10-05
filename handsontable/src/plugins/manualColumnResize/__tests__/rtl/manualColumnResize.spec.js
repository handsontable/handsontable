describe('manualColumnResize (RTL)', () => {
  const id = 'testContainer';

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

  it('should resize (narrowing) selected columns', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true
    });

    const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(1)');

    $colHeader.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    getTopClone().find('tr:eq(0) th:eq(1)').simulate('mousedown');
    getTopClone().find('tr:eq(0) th:eq(2)').simulate('mouseover');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mouseover');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mousemove');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mousemove', { clientX: spec().$container.find('tr:eq(0) th:eq(1)').offset().left + 29 });
    $resizer.simulate('mouseup');

    await waitForNextAnimationFrames(2);

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');

    expect($columnHeaders.eq(1).outerWidth()).toBe(20);
    expect($columnHeaders.eq(2).outerWidth()).toBe(20);
    expect($columnHeaders.eq(3).outerWidth()).toBe(20);
  });

  it('should resize (expanding) selected columns', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      autoColumnSize: false,
      manualColumnResize: true
    });

    const $colHeader = getTopClone().find('thead tr:eq(0) th:eq(1)');

    $colHeader.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    getTopClone().find('tr:eq(0) th:eq(1)').simulate('mousedown');
    getTopClone().find('tr:eq(0) th:eq(2)').simulate('mouseover');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mouseover');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mousemove');
    getTopClone().find('tr:eq(0) th:eq(3)').simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mousemove', { clientX: spec().$container.find('tr:eq(0) th:eq(1)').offset().left - 150 });
    $resizer.simulate('mouseup');

    await waitForNextAnimationFrames(2);

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');

    expect($columnHeaders.eq(1).outerWidth()).toBe(
      196,
    );
    expect($columnHeaders.eq(2).outerWidth()).toBe(
      196,
    );
    expect($columnHeaders.eq(3).outerWidth()).toBe(
      196,
    );
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

      it(`should display the resize handle in the proper position and with
 a proper size`, async() => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          colHeaders: true,
          manualColumnResize: true
        });

        const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualColumnResizer');

        expect($handle.offset().left)
          .toEqual($headerTH.offset().left - ($handle.outerWidth() / 2) + 1);
        expect($handle.height()).toEqual($headerTH.outerHeight());
      });

      it('should display the resize handle in the proper z-index and be greater than top overlay z-index', async() => {
        handsontable({
          layoutDirection,
          data: [
            { id: 1, name: 'Ted', lastName: 'Right' },
            { id: 2, name: 'Frank', lastName: 'Honest' },
            { id: 3, name: 'Joan', lastName: 'Well' },
            { id: 4, name: 'Sid', lastName: 'Strong' },
            { id: 5, name: 'Jane', lastName: 'Neat' }
          ],
          colHeaders: true,
          manualColumnResize: true
        });

        const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualColumnResizer');

        expect($handle.css('z-index')).toBeGreaterThan(getTopClone().css('z-index'));
      });

      it('should position the resize handle at the visible column header start edge after horizontal scroll with `preventOverflow: \'horizontal\'` (#10403)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 20),
          colHeaders: true,
          manualColumnResize: true,
          preventOverflow: 'horizontal',
          width: 400,
          height: 200,
        });

        await scrollViewportHorizontally(300);
        await waitForNextAnimationFrames(2);

        const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(8)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualColumnResizer');

        expect($handle.offset().left)
          .toEqual($headerTH.offset().left - ($handle.outerWidth() / 2) + 1);
      });
    });
  });
});
