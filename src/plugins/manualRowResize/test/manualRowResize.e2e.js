describe('manualRowResize', () => {
  const id = 'test';
  const defaultRowHeight = 22;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change row heights at init', () => {
    handsontable({
      rowHeaders: true,
      manualRowResize: [50, 40, 100]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(51);
    expect(rowHeight(spec().$container, 1)).toEqual(40);
    expect(rowHeight(spec().$container, 2)).toEqual(100);
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
      rowHeaders: true
    });

    updateSettings({ manualRowResize: true });

    spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseover');

    expect($('.manualRowResizer').size()).toBeGreaterThan(0);
  });

  it('should change the default row height with updateSettings', () => {
    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2); // + Double border
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1); // + Single border

    updateSettings({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(61);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);
  });

  it('should change the row height with updateSettings', () => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(61);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    updateSettings({
      manualRowResize: [30, 80, 100]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(31);
    expect(rowHeight(spec().$container, 1)).toEqual(80);
    expect(rowHeight(spec().$container, 2)).toEqual(100);
  });

  it('should not change the row height when `true` is passing', () => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(61);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(61);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);
  });

  it('should change the row height to defaults when undefined is passed', () => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(61);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    updateSettings({
      manualRowResize: void 0
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2); // + Double border
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1); // + Single border
  });

  it('should reset row height', () => {
    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1);

    updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1);
  });

  it('should trigger afterRowResize event after row height changes', () => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    resizeRow(0, 100);
    expect(afterRowResizeCallback).toHaveBeenCalledWith(0, 100, false, void 0, void 0, void 0);
    expect(rowHeight(spec().$container, 0)).toEqual(101);
  });

  it('should not trigger afterRowResize event if row height does not change (delta = 0)', () => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    resizeRow(0, defaultRowHeight);
    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
  });

  it('should not trigger afterRowResize event after if row height does not change (no mousemove event)', () => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    const $th = spec().$container.find('tbody tr:eq(0) th:eq(0)');
    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', {
      clientY: resizerPosition.top
    });

    $resizer.simulate('mouseup');

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
  });

  it('should trigger an afterRowResize after row size changes, after double click', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      autoRowSize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    const $th = spec().$container.find('tbody tr:eq(2) th:eq(0)');
    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', {
      clientY: resizerPosition.top
    });
    $resizer.simulate('mouseup');

    $resizer.simulate('mousedown', {
      clientY: resizerPosition.top
    });
    $resizer.simulate('mouseup');

    await sleep(1000);

    expect(afterRowResizeCallback.calls.count()).toEqual(1);
    expect(afterRowResizeCallback.calls.argsFor(0)[0]).toEqual(2);
    expect(afterRowResizeCallback.calls.argsFor(0)[1]).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1);
  });
  it('should not trigger afterRowResize event after if row height does not change (no dblclick event)', () => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    const $th = spec().$container.find('tbody tr:eq(2) th:eq(0)');
    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', {
      clientY: resizerPosition.top
    });
    $resizer.simulate('mouseup');

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
  });
  it('should display the resize handle in the correct place after the table has been scrolled', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 20),
      rowHeaders: true,
      manualRowResize: true,
      height: 100,
      width: 200
    });

    const mainHolder = hot.view.wt.wtTable.holder;
    let $rowHeader = spec().$container.find('.ht_clone_left tbody tr:eq(2) th:eq(0)');

    $rowHeader.simulate('mouseover');

    const $handle = spec().$container.find('.manualRowResizer');
    $handle[0].style.background = 'red';

    expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);

    $(mainHolder).scrollTop(200);
    $(mainHolder).scroll();

    $rowHeader = spec().$container.find('.ht_clone_left tbody tr:eq(2) th:eq(0)');
    $rowHeader.simulate('mouseover');
    expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
  });

  it('should autosize selected rows after double click on handler', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(9, 9),
      rowHeaders: true,
      manualRowResize: true,
    });

    resizeRow(2, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    spec().$container.find('.ht_clone_left tbody tr:eq(1) th:eq(0)').simulate('mousedown');
    spec().$container.find('.ht_clone_left tbody tr:eq(2) th:eq(0)').simulate('mouseover');
    spec().$container.find('.ht_clone_left tbody tr:eq(3) th:eq(0)').simulate('mouseover');
    spec().$container.find('.ht_clone_left tbody tr:eq(3) th:eq(0)').simulate('mousemove');
    spec().$container.find('.ht_clone_left tbody tr:eq(3) th:eq(0)').simulate('mouseup');

    await sleep(600);

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mouseup');
    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mouseup');

    await sleep(1000);

    expect(rowHeight(spec().$container, 1)).toBeAroundValue(24);
    expect(rowHeight(spec().$container, 2)).toBeAroundValue(24);
    expect(rowHeight(spec().$container, 3)).toBeAroundValue(24);
  });

  it('should resize (expanding and narrowing) selected rows', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 20),
      rowHeaders: true,
      manualRowResize: true
    });

    resizeRow(2, 60);

    const $rowsHeaders = spec().$container.find('.ht_clone_left tr th');
    spec().$container.find('.ht_clone_left tbody tr:eq(1) th:eq(0)').simulate('mouseover');

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

    expect($rowsHeaders.eq(1).height()).toEqual(80);
    expect($rowsHeaders.eq(2).height()).toEqual(80);
    expect($rowsHeaders.eq(3).height()).toEqual(80);

    await sleep(1200);

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top - $rowsHeaders.eq(3).height() + 35 });
    $resizer.simulate('mouseup');

    expect($rowsHeaders.eq(1).height()).toEqual(35);
    expect($rowsHeaders.eq(2).height()).toEqual(35);
    expect($rowsHeaders.eq(3).height()).toEqual(35);
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
        rowHeaders: true,
        manualRowResize: true
      });

      const $headerTH = spec().$container.find('tbody tr:eq(1) th:eq(0)');
      $headerTH.simulate('mouseover');

      const $handle = $('.manualRowResizer');

      expect($handle.offset().top).toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - $handle.outerHeight() - 1, 0);
      expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
    });
  });
});
