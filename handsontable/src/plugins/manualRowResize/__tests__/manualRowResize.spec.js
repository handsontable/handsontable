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

    getLeftClone().find('tbody tr:eq(0) th:eq(0)').simulate('mouseover');

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

  it('should keep proper row heights after inserting row', () => {
    handsontable({
      manualRowResize: [void 0, void 0, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight + 1);

    alter('insert_row', 0);

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 3)).toBe(120);
  });

  it('should keep proper row heights after removing row', () => {
    handsontable({
      manualRowResize: [void 0, void 0, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight + 1);

    alter('remove_row', 0);

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 2);
    expect(rowHeight(spec().$container, 1)).toBe(120);
    expect(rowHeight(spec().$container, 2)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight + 1);
  });

  it('should trigger beforeRowResize event after row height changes', () => {
    const beforeRowResizeCallback = jasmine.createSpy('beforeRowResizeCallback');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      beforeRowResize: beforeRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);

    resizeRow(0, 100);
    expect(beforeRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(101);
  });

  it('should appropriate resize rowHeight after beforeRowResize call a few times', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(24);

    hot.addHook('beforeRowResize', () => 100);
    hot.addHook('beforeRowResize', () => 200);
    hot.addHook('beforeRowResize', () => void 0);

    const $th = getLeftClone().find('tbody tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    mouseDoubleClick($resizer, { clientY: resizerPosition.top });

    await sleep(700);

    expect(rowHeight(spec().$container, 0)).toEqual(201);
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
    expect(afterRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
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

    resizeRow(0, defaultRowHeight + 2);
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

    const $th = getLeftClone().find('tbody tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    simulateClick($resizer, { clientY: resizerPosition.top });

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

    const $th = getLeftClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    mouseDoubleClick($resizer, { clientY: resizerPosition.top });

    await sleep(1000);

    expect(afterRowResizeCallback.calls.count()).toEqual(1);
    expect(afterRowResizeCallback.calls.argsFor(0)[1]).toEqual(2);
    expect(afterRowResizeCallback.calls.argsFor(0)[0]).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight + 1);
  });

  it('should resize appropriate rows to calculated autoRowSize height after double click on row handler after ' +
     'updateSettings usage with new `rowHeights` values', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
    });

    setDataAtCell(1, 0, 'Longer\ntext');

    await sleep(50);

    updateSettings({
      rowHeights: [45, 120, 160, 60, 80],
    });

    const $rowHeaders = getLeftClone().find('tbody tr th');

    {
      const $th = $rowHeaders.eq(0); // resize the first row.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      mouseDoubleClick($resizer, { clientY: resizerPosition.top });

      await sleep(1000);

      expect($rowHeaders.eq(0).height()).toBe(22);
      expect($rowHeaders.eq(1).height()).toBe(119);
      expect($rowHeaders.eq(2).height()).toBe(159);
      expect($rowHeaders.eq(3).height()).toBe(59);
      expect($rowHeaders.eq(4).height()).toBe(79);
    }
    {
      const $th = $rowHeaders.eq(1); // resize the second column.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      mouseDoubleClick($resizer, { clientY: resizerPosition.top });

      await sleep(1000);

      expect($rowHeaders.eq(0).height()).toBe(22);
      expect($rowHeaders.eq(1).height()).toBe(42);
      expect($rowHeaders.eq(2).height()).toBe(159);
      expect($rowHeaders.eq(3).height()).toBe(59);
      expect($rowHeaders.eq(4).height()).toBe(79);
    }
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

    const $th = getLeftClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 2);
  });

  it('should display the resize handle in the correct place after the table has been scrolled', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 20),
      rowHeaders: true,
      manualRowResize: true,
      height: 100,
      width: 200
    });

    const mainHolder = hot.view.wt.wtTable.holder;
    let $rowHeader = getLeftClone().find('tbody tr:eq(2) th:eq(0)');

    $rowHeader.simulate('mouseover');

    const $handle = spec().$container.find('.manualRowResizer');

    $handle[0].style.background = 'red';

    expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);

    $(mainHolder).scrollTop(200);
    $(mainHolder).scroll();

    await sleep(400);

    $rowHeader = getLeftClone().find('tbody tr:eq(10) th:eq(0)');
    $rowHeader.simulate('mouseover');

    expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
  });

  it('should autosize row after double click (when initial height is not defined)', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true
    });

    resizeRow(2, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    mouseDoubleClick($resizer, { clientY: resizerPosition.top });

    await sleep(1000);

    expect(rowHeight(spec().$container, 2)).toBeAroundValue(23, 3);
  });

  it('should autosize row after double click (when initial height is defined by the `rowHeights` option)', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true,
      rowHeights: 100
    });

    expect(rowHeight(spec().$container, 0)).toBeAroundValue(100, 1);
    expect(rowHeight(spec().$container, 1)).toBeAroundValue(100, 1);
    expect(rowHeight(spec().$container, 2)).toBeAroundValue(100, 1);

    resizeRow(1, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    mouseDoubleClick($resizer, { clientY: resizerPosition.top });

    await sleep(1000);

    expect(rowHeight(spec().$container, 1)).toBeAroundValue(23, 1);
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

    getLeftClone().find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
    getLeftClone().find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
    getLeftClone().find('tbody tr:eq(3) th:eq(0)').simulate('mouseover');
    getLeftClone().find('tbody tr:eq(3) th:eq(0)').simulate('mousemove');
    getLeftClone().find('tbody tr:eq(3) th:eq(0)').simulate('mouseup');

    await sleep(600);

    mouseDoubleClick($resizer, { clientY: resizerPosition.top });

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
    getLeftClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

    const $rowsHeaders = getLeftClone().find('tr th');

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

  it('should resize proper row after resizing element adjacent to a selection', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      manualRowResize: true
    });

    selectRows(2, 3);

    getLeftClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');
    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
    $resizer.simulate('mouseup');

    expect(getLeftClone().find('tbody tr:eq(1) th:eq(0)').height()).toBe(52);
    expect(getLeftClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(22);
    expect(getLeftClone().find('tbody tr:eq(3) th:eq(0)').height()).toBe(22);
  });

  it('should resize all rows after resize action when selected all cells', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      rowHeaders: true,
      colHeaders: true,
      manualRowResize: true
    });

    expect(getLeftClone().find('tbody tr:eq(0) th:eq(0)').height()).toBe(22);
    expect(getLeftClone().find('tbody tr:eq(1) th:eq(0)').height()).toBe(22);
    expect(getLeftClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(22);

    selectAll();

    getLeftClone().find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
    $resizer.simulate('mouseup');

    expect(getLeftClone().find('tbody tr:eq(0) th:eq(0)').height()).toBe(52);
    expect(getLeftClone().find('tbody tr:eq(1) th:eq(0)').height()).toBe(52);
    expect(getLeftClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(52);
  });

  it('should not throw any errors, when selecting headers partially outside of viewport, when the header renderer' +
    ' is meant to remove all header children and re-render them from scratch', () => {
    const nativeOnError = window.onerror;
    let errors = 0;

    window.onerror = function() {
      errors += 1;

      return true;
    };

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(200, 20),
      colHeaders: true,
      rowHeaders: true,
      manualRowResize: true,
      height: 205,
      width: 590,
      viewportRowRenderingOffset: 0,
      afterGetRowHeaderRenderers(rendererFactoryArray) {

        // custom header renderer -> removes all TH content and re-renders them again.
        rendererFactoryArray[0] = function(index, TH) {
          Handsontable.dom.empty(TH);
          TH.innerHTML = '<div style="width: 100%;"> test </div>';
        };
      },
    });

    const firstHeader = getLeftClone().find('tbody tr:eq(6) th:eq(0) div');

    firstHeader.simulate('mouseover');
    firstHeader.simulate('mousedown');

    const secondHeader = getLeftClone().find('tbody tr:eq(8) th:eq(0) div');

    secondHeader.simulate('mouseover');
    secondHeader.simulate('mouseup');

    expect(errors).withContext('Expected not to throw any errors, but errors were thrown.').toEqual(0);

    // Reassign the native onerror handler.
    window.onerror = nativeOnError;
  });

  describe('handle position in a table positioned using CSS\'s `transform`', () => {
    it('should display the handles in the correct position, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(20, 10),
        colHeaders: true,
        rowHeaders: true,
        manualRowResize: true,
        height: 400,
        width: 200
      });

      const mainHolder = hot.view.wt.wtTable.holder;
      let $rowHeader = getLeftClone().find('tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      $(mainHolder).scrollTop(1); // we have to trigger innerBorderTop before we scroll to correct position
      await sleep(100);
      $(mainHolder).scrollTop(200);
      await sleep(400);

      $rowHeader = getLeftClone().find('tr:eq(13) th:eq(0)');
      $rowHeader.simulate('mouseover');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    });

    it('should display the handles in the correct position, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(80, 10),
        colHeaders: true,
        rowHeaders: true,
        manualRowResize: true,
      });

      let $rowHeader = getLeftClone().find('tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      $(window).scrollTop(600);

      await sleep(400);

      $rowHeader = getLeftClone().find('tr:eq(13) th:eq(0)');
      $rowHeader.simulate('mouseover');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      $(window).scrollTop(0);
    });
  });

  describe('column resizing in a table positioned using CSS\'s `transform`', () => {
    it('should resize (expanding) selected columns, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 10),
        rowHeaders: true,
        manualRowResize: true,
        width: 200,
        height: 400
      });

      const mainHolder = hot.view.wt.wtTable.holder;

      $(mainHolder).scrollTop(200);

      await sleep(400);

      getLeftClone().find('tbody tr:eq(12) th:eq(0)').simulate('mousedown');
      getLeftClone().find('tbody tr:eq(13) th:eq(0)').simulate('mouseover');
      getLeftClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseover');
      getLeftClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getLeftClone().find('tbody tr:eq(12) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(13) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(14) th:eq(0)').height()).toBe(52);
    });

    it('should resize (expanding) selected columns, with window as a scroll parent', () => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      $(window).scrollTop(200);

      getLeftClone().find('tbody tr:eq(12) th:eq(0)').simulate('mousedown');
      getLeftClone().find('tbody tr:eq(13) th:eq(0)').simulate('mouseover');
      getLeftClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseover');
      getLeftClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getLeftClone().find('tbody tr:eq(12) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(13) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(14) th:eq(0)').height()).toBe(52);

      $(window).scrollTop(0);
    });
  });

  describe('contiguous/non-contiguous selected rows resizing in a table', () => {
    it('should resize (expanding) height of selected contiguous rows', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      selectRows(3, 5);
      getLeftClone().find('tbody tr:eq(5) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getLeftClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(22);
      expect(getLeftClone().find('tbody tr:eq(3) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(4) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(5) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(6) th:eq(0)').height()).toBe(22);
    });

    it('should resize (expanding) height of selected non-contiguous rows', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      selectRows(3);
      keyDown('ctrl');
      selectRows(7);
      selectRows(10);
      keyUp('ctrl');
      getLeftClone().find('tbody tr:eq(10) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getLeftClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(22);
      expect(getLeftClone().find('tbody tr:eq(3) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(4) th:eq(0)').height()).toBe(22);
      expect(getLeftClone().find('tbody tr:eq(5) th:eq(0)').height()).toBe(22);
      expect(getLeftClone().find('tbody tr:eq(6) th:eq(0)').height()).toBe(22);
      expect(getLeftClone().find('tbody tr:eq(7) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(8) th:eq(0)').height()).toBe(22);
      expect(getLeftClone().find('tbody tr:eq(9) th:eq(0)').height()).toBe(22);
      expect(getLeftClone().find('tbody tr:eq(10) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(11) th:eq(0)').height()).toBe(22);
    });

    it('should not resize few rows when selected just single cells before resize action', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        manualRowResize: true
      });

      selectCells([[1, 1, 2, 2]]);

      getLeftClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getLeftClone().find('tbody tr:eq(1) th:eq(0)').height()).toBe(52);
      expect(getLeftClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(22);
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
        rowHeaders: true,
        manualRowResize: true
      });

      const $headerTH = getLeftClone().find('tbody tr:eq(1) th:eq(0)');

      $headerTH.simulate('mouseover');

      const $handle = $('.manualRowResizer');

      expect($handle.offset().top)
        .toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - $handle.outerHeight() - 1, 0);
      expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
    });

    it('should display the resize handle in the proper z-index and be greater than left overlay z-index', () => {
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

      const $headerTH = getLeftClone().find('tbody tr:eq(1) th:eq(0)');

      $headerTH.simulate('mouseover');

      const $handle = $('.manualRowResizer');

      expect($handle.css('z-index')).toBeGreaterThan(getLeftClone().css('z-index'));
    });

    it('should call console.warn if the handler is not a part of proper overlay', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 1),
        height: 280,
        fixedRowsBottom: 2,
        manualRowResize: true,
        rowHeaders: true,
      });

      spyOn(console, 'warn');

      const $masterRowHeader = getLeftClone().find('tbody tr:eq(3) th:eq(0)');

      $masterRowHeader.simulate('mouseover');

      const $handler = spec().$container.find('.manualRowResizer');

      $handler.simulate('mouseover');

      // eslint-disable-next-line no-console
      expect(console.warn.calls.mostRecent().args)
        .toEqual(['The provided element is not a child of the bottom_left_corner overlay']);
    });
  });

  describe('hooks', () => {
    it('should run the `beforeRowResize` and `afterRowResize` hooks with numeric values for both the row height and' +
      ' row index', () => {
      const beforeRowResizeCallback = jasmine.createSpy('beforeRowResizeCallback');
      const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true,
        manualRowResize: true,
        beforeRowResize: beforeRowResizeCallback,
        afterRowResize: afterRowResizeCallback
      });

      resizeRow(2, 300);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([300, 2, false]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([300, 2, false]);

      resizeRow(2, -10);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([23, 2, false]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([23, 2, false]);

      resizeRow(2, 100);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([100, 2, false]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([100, 2, false]);

      resizeRow(2, 5);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([23, 2, false]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([23, 2, false]);
    });
  });
});
