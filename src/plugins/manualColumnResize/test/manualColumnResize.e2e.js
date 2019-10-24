describe('manualColumnResize', () => {
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

  it('should change column widths at init', () => {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);
  });

  it('should be enabled after specifying it in updateSettings config', () => {
    handsontable({
      data: [
        { id: 1, name: 'Ted', lastName: 'Right' },
        { id: 2, name: 'Frank', lastName: 'Honest' },
        { id: 3, name: 'Joan', lastName: 'Well' },
        { id: 4, name: 'Sid', lastName: 'Strong' },
        { id: 5, name: 'Jane', lastName: 'Neat' }
      ],
      colHeaders: true
    });

    updateSettings({ manualColumnResize: true });

    spec().$container.find('thead tr:eq(0) th:eq(0)').simulate('mouseover');

    expect($('.manualColumnResizer').size()).toBeGreaterThan(0);
  });

  it('should change the default column widths with updateSettings', () => {
    handsontable({
      manualColumnResize: true
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(50);

    updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(colWidth(spec().$container, 0)).toBe(60);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(80);
  });

  it('should change column widths with updateSettings', () => {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);

    updateSettings({
      manualColumnResize: [60, 50, 80]
    });

    expect(colWidth(spec().$container, 0)).toBe(60);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(80);
  });

  it('should reset column widths when undefined is passed', () => {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);

    updateSettings({
      manualColumnResize: void 0
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
    expect(colWidth(spec().$container, 1)).toBe(50);
    expect(colWidth(spec().$container, 2)).toBe(50);
  });

  it('should not reset column widths when `true` is passed', () => {
    handsontable({
      manualColumnResize: [100, 150, 180]
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);

    updateSettings({
      manualColumnResize: true
    });

    expect(colWidth(spec().$container, 0)).toBe(100);
    expect(colWidth(spec().$container, 1)).toBe(150);
    expect(colWidth(spec().$container, 2)).toBe(180);
  });

  it('should resize (narrowing) appropriate columns, even when stretchH `all` is enabled', () => {
    spec().$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all'
    });

    resizeColumn(1, 65);

    const $columnHeaders = spec().$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(209);
    expect($columnHeaders.eq(1).width()).toBe(64);
    expect($columnHeaders.eq(2).width()).toBe(210);
    expect($columnHeaders.eq(3).width()).toBe(210);
    expect($columnHeaders.eq(4).width()).toBe(211);
  });

  it('should resize (extending) appropriate columns, even when stretchH `all` is enabled', () => {
    spec().$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all'
    });

    resizeColumn(1, 400);

    const $columnHeaders = spec().$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(125);
    expect($columnHeaders.eq(1).width()).toBe(399);
    expect($columnHeaders.eq(2).width()).toBe(126);
    expect($columnHeaders.eq(3).width()).toBe(126);
    expect($columnHeaders.eq(4).width()).toBe(128);
  });

  it('should resize (narrowing) selected columns', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true
    });

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');
    const $colHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
    $colHeader.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    spec().$container.find('tr:eq(0) th:eq(1)').simulate('mousedown');
    spec().$container.find('tr:eq(0) th:eq(2)').simulate('mouseover');
    spec().$container.find('tr:eq(0) th:eq(3)').simulate('mouseover');
    spec().$container.find('tr:eq(0) th:eq(3)').simulate('mousemove');
    spec().$container.find('tr:eq(0) th:eq(3)').simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mousemove', { clientX: spec().$container.find('tr:eq(0) th:eq(1)').position().left + 29 });
    $resizer.simulate('mouseup');

    await sleep(1000);

    expect($columnHeaders.eq(1).width()).toBe(33);
    expect($columnHeaders.eq(2).width()).toBe(34);
    expect($columnHeaders.eq(3).width()).toBe(34);
  });

  it('should resize (expanding) selected columns', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true
    });

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');
    const $colHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
    $colHeader.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    spec().$container.find('tr:eq(0) th:eq(1)').simulate('mousedown');
    spec().$container.find('tr:eq(0) th:eq(2)').simulate('mouseover');
    spec().$container.find('tr:eq(0) th:eq(3)').simulate('mouseover');
    spec().$container.find('tr:eq(0) th:eq(3)').simulate('mousemove');
    spec().$container.find('tr:eq(0) th:eq(3)').simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mousemove', { clientX: spec().$container.find('tr:eq(0) th:eq(1)').position().left + 150 });
    $resizer.simulate('mouseup');

    await sleep(1000);

    expect($columnHeaders.eq(1).width()).toBe(154);
    expect($columnHeaders.eq(2).width()).toBe(155);
    expect($columnHeaders.eq(3).width()).toBe(155);
  });

  it('should resize appropriate columns to calculated stretch width after double click on column handler when stretchH is set as `all`', async() => {
    spec().$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
    });

    resizeColumn(1, 65);

    const $columnHeaders = spec().$container.find('thead tr:eq(1) th');

    expect($columnHeaders.eq(0).width()).toBe(209);
    expect($columnHeaders.eq(1).width()).toBe(64);
    expect($columnHeaders.eq(2).width()).toBe(210);
    expect($columnHeaders.eq(3).width()).toBe(210);
    expect($columnHeaders.eq(4).width()).toBe(211);

    const $th = $columnHeaders.eq(1);

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    await sleep(1000);

    expect($columnHeaders.eq(0).width()).toBe(180);
    expect($columnHeaders.eq(1).width()).toBe(181);
    expect($columnHeaders.eq(2).width()).toBe(181);
    expect($columnHeaders.eq(3).width()).toBe(181);
    expect($columnHeaders.eq(4).width()).toBe(181);
  });

  it('should resize appropriate columns to calculated autoColumnSize width after double click on column handler when stretchH is set as `last`', async() => {
    spec().$container.css('width', '910px');
    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'last',
    });

    resizeColumn(0, 65);

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');

    expect($columnHeaders.eq(0).width()).toBe(63);
    expect($columnHeaders.eq(1).width()).toBe(48);
    expect($columnHeaders.eq(2).width()).toBe(49);
    expect($columnHeaders.eq(3).width()).toBe(49);
    expect($columnHeaders.eq(4).width()).toBe(694);

    const $th = $columnHeaders.eq(0);

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    await sleep(1000);

    expect($columnHeaders.eq(0).width()).toBeAroundValue(19);
    expect($columnHeaders.eq(1).width()).toBe(48);
    expect($columnHeaders.eq(2).width()).toBe(49);
    expect($columnHeaders.eq(3).width()).toBe(49);
    expect($columnHeaders.eq(4).width()).toBeAroundValue(738);
  });

  it('should resize appropriate columns, even if the column order was changed with manualColumnMove plugin', function() {
    handsontable({
      colHeaders: ['First', 'Second', 'Third'],
      manualColumnMove: [2, 1, 0, 3],
      manualColumnResize: true
    });

    const $columnHeaders = spec().$container.find('thead tr:eq(0) th');
    const initialColumnWidths = [];

    $columnHeaders.each(function() {
      initialColumnWidths.push($(this).width());
    });

    resizeColumn.call(this, 0, 100);

    const $resizedTh = $columnHeaders.eq(0);

    expect($resizedTh.text()).toEqual('Third');
    expect($resizedTh.outerWidth()).toEqual(100);

    // Sizes of remaining columns should stay the same
    for (let i = 1; i < $columnHeaders.length; i++) {
      expect($columnHeaders.eq(i).width()).toEqual(initialColumnWidths[i]);
    }
  });

  it('should trigger an afterColumnResize event after column size changes', () => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    resizeColumn(0, 100);

    expect(afterColumnResizeCallback).toHaveBeenCalledWith(0, 100, void 0, void 0, void 0, void 0);
    expect(colWidth(spec().$container, 0)).toEqual(100);
  });

  it('should not trigger an afterColumnResize event if column size does not change (mouseMove event width delta = 0)', () => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    resizeColumn(0, 50);

    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
    expect(colWidth(spec().$container, 0)).toEqual(50);
  });

  it('should not trigger an afterColumnResize event if column size does not change (no mouseMove event)', () => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    const $th = spec().$container.find('thead tr:eq(0) th:eq(0)');
    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    expect(afterColumnResizeCallback).not.toHaveBeenCalled();
    expect(colWidth(spec().$container, 0)).toEqual(50);
  });

  it('should trigger an afterColumnResize after column size changes, after double click', async() => {
    const afterColumnResizeCallback = jasmine.createSpy('afterColumnResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      afterColumnResize: afterColumnResizeCallback
    });

    expect(colWidth(spec().$container, 0)).toEqual(50);

    const $th = spec().$container.find('thead tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    await sleep(1000);

    expect(afterColumnResizeCallback.calls.count()).toEqual(1);
    expect(afterColumnResizeCallback.calls.argsFor(0)[0]).toEqual(0);
    // All modern browsers returns width = 25px, but IE8 seems to compute width differently and returns 24px
    expect(afterColumnResizeCallback.calls.argsFor(0)[1]).toBeInArray([30, 31, 32, 24, 25]);
    expect(colWidth(spec().$container, 0)).toBeInArray([30, 31, 32, 24, 25]);
  });

  it('should autosize column after double click (when initial width is not defined)', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      manualColumnResize: true,
      columns: [{ width: 100 }, { width: 200 }, {}]
    });

    expect(colWidth(spec().$container, 0)).toEqual(100);
    expect(colWidth(spec().$container, 1)).toEqual(200);
    expect(colWidth(spec().$container, 2)).toEqual(50);

    resizeColumn(2, 300);

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    await sleep(1000);

    expect(colWidth(spec().$container, 2)).toBeAroundValue(29, 3);
  });

  it('should autosize selected columns after double click on handler', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(9, 9),
      colHeaders: true,
      manualColumnResize: true,
    });

    resizeColumn(2, 300);

    spec().$container.find('thead tr:eq(0) th:eq(1)').simulate('mousedown');
    spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseover');
    spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseover');
    spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mousemove');
    spec().$container.find('thead tr:eq(0) th:eq(3)').simulate('mouseup');

    const $resizer = spec().$container.find('.manualColumnResizer');
    const resizerPosition = $resizer.position();

    await sleep(600);

    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');
    $resizer.simulate('mousedown', { clientX: resizerPosition.left });
    $resizer.simulate('mouseup');

    await sleep(600);

    expect(colWidth(spec().$container, 1)).toBeAroundValue(32, 2);
    expect(colWidth(spec().$container, 2)).toBeAroundValue(32, 2);
    expect(colWidth(spec().$container, 3)).toBeAroundValue(32, 2);
  });

  it('should adjust resize handles position after table size changed', () => {
    let maxed = false;

    handsontable({
      colHeaders: true,
      manualColumnResize: true,
      stretchH: 'all',
      width() {
        return maxed ? 614 : 200;
      }
    });

    spec().$container.find('thead th:eq(0)').simulate('mouseover');

    const handle = spec().$container.find('.manualColumnResizer');
    const th0 = spec().$container.find('thead th:eq(0)');
    let handleBox = handle[0].getBoundingClientRect();
    let thBox = th0[0].getBoundingClientRect();

    expect(handleBox.left + handleBox.width).toEqual(thBox.left + thBox.width - 1);

    maxed = true;

    render();
    spec().$container.find('thead th:eq(0)').simulate('mouseover');

    handleBox = handle[0].getBoundingClientRect();
    thBox = th0[0].getBoundingClientRect();
    expect(handleBox.left + handleBox.width).toEqual(thBox.left + thBox.width - 1);
  });

  it('should display the resize handle in the correct place after the table has been scrolled', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      colHeaders: true,
      manualColumnResize: true,
      height: 100,
      width: 200
    });

    const mainHolder = hot.view.wt.wtTable.holder;
    let $colHeader = spec().$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');

    $colHeader.simulate('mouseover');

    const $handle = spec().$container.find('.manualColumnResizer');
    $handle[0].style.background = 'red';

    expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
    expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);

    $(mainHolder).scrollLeft(200);

    await sleep(400);

    $colHeader = spec().$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');
    $colHeader.simulate('mouseover');
    expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
    expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);
  });

  describe('handle position in a table positioned using CSS\'s `transform`', () => {
    it('should display the handles in the correct position, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 20),
        colHeaders: true,
        rowHeaders: true,
        manualColumnResize: true,
        height: 100,
        width: 400
      });

      const mainHolder = hot.view.wt.wtTable.holder;
      let $colHeader = spec().$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');

      $colHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualColumnResizer');

      expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
      expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);

      $(mainHolder).scrollLeft(200);

      await sleep(400);

      $colHeader = spec().$container.find('.ht_clone_top thead tr:eq(0) th:eq(7)');
      $colHeader.simulate('mouseover');
      expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
      expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);
    });

    it('should display the handles in the correct position, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 80),
        colHeaders: true,
        rowHeaders: true,
        manualColumnResize: true
      });

      let $colHeader = spec().$container.find('.ht_clone_top thead tr:eq(0) th:eq(2)');

      $colHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualColumnResizer');

      expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
      expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);

      $(window).scrollLeft(600);

      await sleep(400);

      $colHeader = spec().$container.find('.ht_clone_top thead tr:eq(0) th:eq(7)');
      $colHeader.simulate('mouseover');
      expect($colHeader.offset().left + $colHeader.width() - 5).toBeCloseTo($handle.offset().left, 0);
      expect($colHeader.offset().top).toBeCloseTo($handle.offset().top, 0);

      $(window).scrollLeft(0);
    });
  });

  describe('column resizing in a table positioned using CSS\'s `transform`', () => {
    it('should resize (expanding) selected columns, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 20),
        colHeaders: true,
        manualColumnResize: true,
        width: 400,
        height: 200,
        viewportColumnRenderingOffset: 20
      });

      const mainHolder = hot.view.wt.wtTable.holder;
      $(mainHolder).scrollLeft(200);

      await sleep(400);

      spec().$container.find('thead tr:eq(0) th:eq(5)').simulate('mousedown');
      spec().$container.find('thead tr:eq(0) th:eq(6)').simulate('mouseover');
      spec().$container.find('thead tr:eq(0) th:eq(7)').simulate('mouseover');
      spec().$container.find('thead tr:eq(0) th:eq(7)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();
      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
      $resizer.simulate('mouseup');

      expect(spec().$container.find('thead tr:eq(0) th:eq(5)').width()).toBe(79);
      expect(spec().$container.find('thead tr:eq(0) th:eq(6)').width()).toBe(79);
      expect(spec().$container.find('thead tr:eq(0) th:eq(7)').width()).toBe(79);
    });

    it('should resize (expanding) selected columns, with window as a scroll parent', () => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 50),
        colHeaders: true,
        manualColumnResize: true,
        viewportColumnRenderingOffset: 20
      });

      $(window).scrollLeft(400);

      spec().$container.find('thead tr:eq(0) th:eq(9)').simulate('mousedown');
      spec().$container.find('thead tr:eq(0) th:eq(10)').simulate('mouseover');
      spec().$container.find('thead tr:eq(0) th:eq(11)').simulate('mouseover');
      spec().$container.find('thead tr:eq(0) th:eq(11)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();
      $resizer.simulate('mousedown', { clientX: resizerPosition.left });
      $resizer.simulate('mousemove', { clientX: resizerPosition.left + 30 });
      $resizer.simulate('mouseup');

      expect(spec().$container.find('thead tr:eq(0) th:eq(9)').width()).toBe(79);
      expect(spec().$container.find('thead tr:eq(0) th:eq(10)').width()).toBe(79);
      expect(spec().$container.find('thead tr:eq(0) th:eq(11)').width()).toBe(79);

      $(window).scrollLeft(0);
    });
  });

  describe('handle and guide', () => {
    it('should display the resize handle in the proper position and with a proper size', () => {
      handsontable({
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

      const $headerTH = spec().$container.find('thead tr:eq(0) th:eq(1)');
      $headerTH.simulate('mouseover');

      const $handle = $('.manualColumnResizer');

      expect($handle.offset().left).toEqual($headerTH.offset().left + $headerTH.outerWidth() - $handle.outerWidth() - 1);
      expect($handle.height()).toEqual($headerTH.outerHeight());
    });

    it('should display the resize handle in the proper z-index and be greater than top overlay z-index', () => {
      handsontable({
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

      const $headerTH = spec().$container.find('thead tr:eq(0) th:eq(1)');
      $headerTH.simulate('mouseover');

      const $handle = $('.manualColumnResizer');

      expect($handle.css('z-index')).toBeGreaterThan(getTopClone().css('z-index'));
    });
  });
});
