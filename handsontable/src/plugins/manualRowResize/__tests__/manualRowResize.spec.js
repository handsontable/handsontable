describe('manualRowResize', () => {
  const id = 'test';
  const defaultRowHeight = getDefaultRowHeight();

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change row heights at init', async() => {
    handsontable({
      rowHeaders: true,
      manualRowResize: [50, 40, 100]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(50);
    expect(rowHeight(spec().$container, 1)).toEqual(40);
    expect(rowHeight(spec().$container, 2)).toEqual(100);
  });

  it('should be enabled after specifying it in updateSettings config', async() => {
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

    await updateSettings({ manualRowResize: true });

    getInlineStartClone().find('tbody tr:eq(0) th:eq(0)').simulate('mouseover');

    expect($('.manualRowResizer').size()).toBeGreaterThan(0);
  });

  it('should change the default row height with updateSettings', async() => {
    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight);

    await updateSettings({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);
  });

  it('should change the row height with updateSettings', async() => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    await updateSettings({
      manualRowResize: [30, 80, 100]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(Math.max(30, getThemeLayout().firstRenderedRowDefaultHeight));
    expect(rowHeight(spec().$container, 1)).toEqual(80);
    expect(rowHeight(spec().$container, 2)).toEqual(100);
  });

  it('should not change the row height when `true` is passing', async() => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    await updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);
  });

  it('should change the row height to defaults when undefined is passed', async() => {
    handsontable({
      manualRowResize: [60, 50, 80]
    });

    expect(rowHeight(spec().$container, 0)).toEqual(60);
    expect(rowHeight(spec().$container, 1)).toEqual(50);
    expect(rowHeight(spec().$container, 2)).toEqual(80);

    await updateSettings({
      manualRowResize: undefined
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1); // + Single border
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight);
  });

  it('should reset row height', async() => {
    handsontable({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight);

    await updateSettings({
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toEqual(defaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight);
  });

  it('should keep proper row heights after inserting row', async() => {
    handsontable({
      manualRowResize: [undefined, undefined, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight);

    await alter('insert_row_above', 0);

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(defaultRowHeight);
    expect(rowHeight(spec().$container, 3)).toBe(120);
  });

  it('should keep proper row heights after removing row', async() => {
    handsontable({
      manualRowResize: [undefined, undefined, 120]
    });

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toBe(defaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(120);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight);

    await alter('remove_row', 0);

    expect(rowHeight(spec().$container, 0)).toBe(defaultRowHeight + 1);
    expect(rowHeight(spec().$container, 1)).toBe(120);
    expect(rowHeight(spec().$container, 2)).toBe(defaultRowHeight);
    expect(rowHeight(spec().$container, 3)).toBe(defaultRowHeight);
  });

  it('should trigger beforeRowResize event after row height changes', async() => {
    const beforeRowResizeCallback = jasmine.createSpy('beforeRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      beforeRowResize: beforeRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);

    await resizeRow(0, 100);

    expect(beforeRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(100);
  });

  it('should appropriate resize rowHeight after beforeRowResize call a few times', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true
    });

    expect(rowHeight(spec().$container, 0)).toEqual(getThemeLayout().firstRenderedRowDefaultHeight);

    addHook('beforeRowResize', () => 100);
    addHook('beforeRowResize', () => 200);
    addHook('beforeRowResize', () => undefined);

    const $th = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });

    await waitForNextAnimationFrames(44);

    expect(rowHeight(spec().$container, 0)).toEqual(200);
  });

  it('should trigger afterRowResize event after row height changes', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);

    await resizeRow(0, 100);
    expect(afterRowResizeCallback).toHaveBeenCalledWith(100, 0, false);
    expect(rowHeight(spec().$container, 0)).toEqual(100);
  });

  it(`should not trigger afterRowResize event if row height
 does not change (delta = 0)`, async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);

    await resizeRow(0, defaultRowHeight + 1);
    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);
  });

  it('should not trigger afterRowResize event after if row height does not change ' +
    '(no mousemove event)', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);
  });

  it('should trigger an afterRowResize after row size changes, after double click', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      autoRowSize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await waitForNextAnimationFrames(63);

    expect(afterRowResizeCallback.calls.count()).toEqual(1);
    expect(afterRowResizeCallback.calls.argsFor(0)[1]).toEqual(2);
    expect(afterRowResizeCallback.calls.argsFor(0)[0]).toEqual(defaultRowHeight);
    expect(rowHeight(spec().$container, 2)).toEqual(defaultRowHeight);
  });

  it('should resize appropriate rows to calculated autoRowSize height after double click on row handler after ' +
    'updateSettings usage with new `rowHeights` values', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
    });

    await setDataAtCell(1, 0, 'Longer\ntext');

    await waitForNextAnimationFrames(4);

    await updateSettings({
      rowHeights: [45, 120, 160, 60, 80],
    });

    const $rowHeaders = getInlineStartClone().find('tbody tr th');

    {
      const $th = $rowHeaders.eq(0); // resize the first row.

      $th.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
      await waitForNextAnimationFrames(63);

      expect($rowHeaders.eq(0).height()).toBe(getThemeLayout().cellContentHeight);
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

      await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
      await waitForNextAnimationFrames(63);

      expect($rowHeaders.eq(0).height()).toBe(getThemeLayout().cellContentHeight);
      expect($rowHeaders.eq(1).height())
        .toBe(getThemeLayout().e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize());
      expect($rowHeaders.eq(2).height()).toBe(159);
      expect($rowHeaders.eq(3).height()).toBe(59);
      expect($rowHeaders.eq(4).height()).toBe(79);
    }
  });

  it('should not trigger afterRowResize event after if row height does not change ' +
    '(no dblclick event)', async() => {
    const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      manualRowResize: true,
      afterRowResize: afterRowResizeCallback
    });

    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);

    const $th = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

    $th.simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await simulateClick($resizer, { clientY: resizerPosition.top });

    expect(afterRowResizeCallback).not.toHaveBeenCalled();
    expect(rowHeight(spec().$container, 0)).toEqual(defaultRowHeight + 1);
  });

  it('should autosize row after double click (when initial height is not defined)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true
    });

    await resizeRow(2, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await waitForNextAnimationFrames(63);

    expect(rowHeight(spec().$container, 2)).toBeAroundValue(
      getThemeLayout().defaultDataRowHeight,
      3);
  });

  it('should autosize row after double click (when initial height is defined by the `rowHeights` option)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      manualRowResize: true,
      rowHeights: 100
    });

    expect(rowHeight(spec().$container, 0)).toBeAroundValue(100, 1);
    expect(rowHeight(spec().$container, 1)).toBeAroundValue(100, 1);
    expect(rowHeight(spec().$container, 2)).toBeAroundValue(100, 1);

    await resizeRow(1, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await waitForNextAnimationFrames(63);

    expect(rowHeight(spec().$container, 1)).toBeAroundValue(getThemeLayout().defaultDataRowHeight, 1);
  });

  it('should autosize selected rows after double click on handler', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      rowHeaders: true,
      manualRowResize: true,
    });

    await resizeRow(2, 300);

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
    getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
    getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').simulate('mouseover');
    getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').simulate('mousemove');
    getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').simulate('mouseup');

    await waitForNextAnimationFrames(38);
    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    await waitForNextAnimationFrames(63);

    expect(rowHeight(spec().$container, 1)).toBeAroundValue(getThemeLayout().defaultDataRowHeight);
    expect(rowHeight(spec().$container, 2)).toBeAroundValue(getThemeLayout().defaultDataRowHeight);
    expect(rowHeight(spec().$container, 3)).toBeAroundValue(getThemeLayout().defaultDataRowHeight);
  });

  it('should autosize selected rows after double click on handler and move mouse to the next row', async() => {
    handsontable({
      data: createSpreadsheetData(9, 9),
      rowHeaders: true,
      manualRowResize: true,
    });

    await resizeRow(1, 100);

    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await waitForNextAnimationFrames(38);
    await mouseDoubleClick($resizer, { clientY: resizerPosition.top });
    getInlineStartClone().find('tr:eq(2) th:eq(0)').simulate('mouseover');
    await waitForNextAnimationFrames(38);

    expect(rowHeight(spec().$container, 1)).toBeAroundValue(getThemeLayout().defaultDataRowHeight);
  });

  it('should resize (expanding and narrowing) selected rows', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      rowHeaders: true,
      manualRowResize: true
    });

    await resizeRow(2, 60);

    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

    const $rowsHeaders = getInlineStartClone().find('tr th');

    $rowsHeaders.eq(1).simulate('mousedown');
    $rowsHeaders.eq(2).simulate('mouseover');
    $rowsHeaders.eq(3).simulate('mouseover');
    $rowsHeaders.eq(3).simulate('mousemove');
    $rowsHeaders.eq(3).simulate('mouseup');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    await waitForNextAnimationFrames(38);

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top - $rowsHeaders.eq(3).height() + 80 });
    $resizer.simulate('mouseup');

    expect($rowsHeaders.eq(1).height()).toEqual(80);
    expect($rowsHeaders.eq(2).height()).toEqual(80);
    expect($rowsHeaders.eq(3).height()).toEqual(80);

    await waitForNextAnimationFrames(75);

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top - $rowsHeaders.eq(3).height() + 35 });
    $resizer.simulate('mouseup');

    expect($rowsHeaders.eq(1).height()).toEqual(Math.max(35, getThemeLayout().cellContentHeight));
    expect($rowsHeaders.eq(2).height()).toEqual(Math.max(35, getThemeLayout().cellContentHeight));
    expect($rowsHeaders.eq(3).height()).toEqual(Math.max(35, getThemeLayout().cellContentHeight));
  });

  it('should show resizer for fixed top rows', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      manualRowResize: true
    });

    getInlineStartClone()
      .find('tbody tr:eq(3) th:eq(0)')
      .simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');

    expect($resizer.position()).toEqual(getThemeLayout().e2eManualRowResizerPositionFixedTopMasterFourthRow());

    // after hovering over fixed row, resizer should be moved to the fixed row
    getTopInlineStartClone()
      .find('tbody tr:eq(1) th:eq(0)')
      .simulate('mouseover');

    expect($resizer.position()).toEqual(getThemeLayout().e2eManualRowResizerPositionFixedTopOverlaySecondRow());
  });

  it('should show resizer for fixed bottom rows', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      colHeaders: true,
      rowHeaders: true,
      fixedRowsBottom: 2,
      manualRowResize: true
    });

    getInlineStartClone()
      .find('tbody tr:eq(3) th:eq(0)')
      .simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');

    expect($resizer.position()).toEqual(getThemeLayout().e2eManualRowResizerPositionFixedTopMasterFourthRow());

    // after hovering over fixed row, resizer should be moved to the fixed row
    getBottomInlineStartClone()
      .find('tbody tr:eq(0) th:eq(0)')
      .simulate('mouseover');

    expect($resizer.position()).toEqual(getThemeLayout().e2eManualRowResizerPositionFixedBottomOverlayFirstRow());
  });

  it('should resize proper row after resizing element adjacent to a selection', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      manualRowResize: true
    });

    await selectRows(2, 3);

    getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');
    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
    $resizer.simulate('mouseup');

    // The drag moved the resizer by 30px, producing a final row height of
    // `defaultDataRowHeight + 29` (29 = 30px drag - 1px resizer snap). This +29
    // offset recurs across the following drag-resize assertions.
    expect(getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').height()).toBe(
      getThemeLayout().defaultDataRowHeight + 29);
    expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(
      getThemeLayout().cellContentHeight);
    expect(getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').height()).toBe(
      getThemeLayout().cellContentHeight);
  });

  it('should resize all rows after resize action when selected all cells', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      colHeaders: true,
      manualRowResize: true
    });

    expect(getInlineStartClone().find('tbody tr:eq(0) th:eq(0)').height()).toBe(getThemeLayout().cellContentHeight);
    expect(getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').height()).toBe(getThemeLayout().cellContentHeight);
    expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(getThemeLayout().cellContentHeight);

    await selectAll();

    getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');

    const $resizer = spec().$container.find('.manualRowResizer');
    const resizerPosition = $resizer.position();

    $resizer.simulate('mousedown', { clientY: resizerPosition.top });
    $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
    $resizer.simulate('mouseup');

    expect(getInlineStartClone().find('tbody tr:eq(0) th:eq(0)').height()).toBe(
      getThemeLayout().defaultDataRowHeight + 28);
    expect(getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').height()).toBe(
      getThemeLayout().defaultDataRowHeight + 29);
    expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(
      getThemeLayout().defaultDataRowHeight + 29);
  });

  it('should not throw any errors, when selecting headers partially outside of viewport, when the header renderer' +
    ' is meant to remove all header children and re-render them from scratch', async() => {
    const nativeOnError = window.onerror;
    let errors = 0;

    window.onerror = function() {
      errors += 1;

      return true;
    };

    handsontable({
      data: createSpreadsheetData(200, 20),
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

    const firstHeader = getInlineStartClone().find('tbody tr:eq(6) th:eq(0) div');

    firstHeader.simulate('mouseover');
    firstHeader.simulate('mousedown');

    const secondHeader = getInlineStartClone().find('tbody tr:eq(8) th:eq(0) div');

    secondHeader.simulate('mouseover');
    secondHeader.simulate('mouseup');

    expect(errors).withContext('Expected not to throw any errors, but errors were thrown.').toEqual(0);

    // Reassign the native onerror handler.
    window.onerror = nativeOnError;
  });

  it('should not throw any errors, when the cell renderers use HTML table to present the value (#dev-1298)', async() => {
    const onErrorSpy = spyOn(window, 'onerror').and.returnValue(true);

    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      manualRowResize: true,
      renderer(hot, td, row, column, value) {
        td.innerHTML = `
          <table>
            <thead>
              <tr>
                <th>${value}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>${value}</th>
              </tr>
            </tbody>
          </table>`;
      }
    });

    const rendererTH = $(getCell(0, 0).querySelector('tbody th'));

    rendererTH
      .simulate('mouseover')
      .simulate('mousedown')
      .simulate('click');

    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  describe('handle position in a table positioned using CSS\'s `transform`', () => {
    it('should display the handles in the correct position, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(20, 10),
        colHeaders: true,
        rowHeaders: true,
        manualRowResize: true,
        height: 400,
        width: 200,
        viewportColumnRenderingOffset: 10,
        viewportRowRenderingOffset: 10,
      });

      let $rowHeader = getInlineStartClone().find('tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      await scrollViewportVertically(1); // we have to trigger innerBorderTop before we scroll to correct position
      await scrollViewportVertically(200);

      $rowHeader = getInlineStartClone().find('tr:eq(13) th:eq(0)');
      $rowHeader.simulate('mouseover');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    });

    it('should display the handles in the correct position, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(80, 10),
        colHeaders: true,
        rowHeaders: true,
        manualRowResize: true,
      });

      let $rowHeader = getInlineStartClone().find('tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);

      await scrollViewportVertically(600);

      $rowHeader = getInlineStartClone().find('tr:eq(13) th:eq(0)');
      $rowHeader.simulate('mouseover');

      expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
    });
  });

  describe('column resizing in a table positioned using CSS\'s `transform`', () => {
    it('should resize (expanding) selected columns, with holder as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(30, 10),
        rowHeaders: true,
        manualRowResize: true,
        width: 200,
        height: 400,
        viewportColumnRenderingOffset: 10,
        viewportRowRenderingOffset: 10,
      });

      await scrollViewportVertically(200);

      getInlineStartClone().find('tbody tr:eq(12) th:eq(0)').simulate('mousedown');
      getInlineStartClone().find('tbody tr:eq(13) th:eq(0)').simulate('mouseover');
      getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseover');
      getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(12) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(13) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
    });

    it('should resize (expanding) selected columns, with window as a scroll parent', async() => {
      spec().$container.css('transform', 'translate(50px, 120px)');

      handsontable({
        data: createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      await scrollViewportVertically(200);

      getInlineStartClone().find('tbody tr:eq(12) th:eq(0)').simulate('mousedown');
      getInlineStartClone().find('tbody tr:eq(13) th:eq(0)').simulate('mouseover');
      getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseover');
      getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').simulate('mouseup');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(12) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(13) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(14) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
    });

    it('should display the handle and resize by unscaled height when parent is scaled', async() => {
      spec().$container.css({
        transform: 'scale(0.5)',
        transformOrigin: 'top left',
      });

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        manualRowResize: true,
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const handleBox = $resizer[0].getBoundingClientRect();
      const thBox = $rowHeader[0].getBoundingClientRect();

      expect(handleBox.top).toBeCloseTo(thBox.top + thBox.height - (handleBox.height / 2) - 1, 0);

      $resizer.simulate('mousedown', { clientY: handleBox.top });
      const guide = spec().$container.find('.manualRowResizerGuide')[0];
      const guideBoxBeforeMove = guide.getBoundingClientRect();

      $resizer.simulate('mousemove', { clientY: handleBox.top + 25 });
      const guideBoxAfterMove = guide.getBoundingClientRect();

      $resizer.simulate('mouseup');

      expect(guideBoxAfterMove.top - guideBoxBeforeMove.top).toBeCloseTo(25, 0);
      expect(rowHeight(spec().$container, 1)).toBeGreaterThan(70);
    });
  });

  describe('contiguous/non-contiguous selected rows resizing in a table', () => {
    it('should resize (expanding) height of selected contiguous rows', async() => {
      handsontable({
        data: createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      await selectRows(3, 5);
      getInlineStartClone().find('tbody tr:eq(5) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
      expect(getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(4) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(5) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(6) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
    });

    it('should resize (expanding) height of selected non-contiguous rows', async() => {
      handsontable({
        data: createSpreadsheetData(50, 10),
        rowHeaders: true,
        manualRowResize: true
      });

      // After changes introduced in Handsontable 12.0.0 we handle shortcuts only by listening Handsontable.
      // Please keep in mind that selectColumns/selectRows doesn't set instance to listening (see #7290).
      await listen();
      await selectRows(3);

      await keyDown('control/meta');

      await selectRows(7);
      await selectRows(10);

      await keyUp('control/meta');
      getInlineStartClone().find('tbody tr:eq(10) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
      expect(getInlineStartClone().find('tbody tr:eq(3) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(4) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
      expect(getInlineStartClone().find('tbody tr:eq(5) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
      expect(getInlineStartClone().find('tbody tr:eq(6) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
      expect(getInlineStartClone().find('tbody tr:eq(7) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(8) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
      expect(getInlineStartClone().find('tbody tr:eq(9) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
      expect(getInlineStartClone().find('tbody tr:eq(10) th:eq(0)').height())
        .toBe(getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(11) th:eq(0)').height())
        .toBe(getThemeLayout().cellContentHeight);
    });

    it('should not resize few rows when selected just single cells before resize action', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        manualRowResize: true
      });

      await selectCells([[1, 1, 2, 2]]);

      getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + 30 });
      $resizer.simulate('mouseup');

      expect(getInlineStartClone().find('tbody tr:eq(1) th:eq(0)').height()).toBe(
        getThemeLayout().defaultDataRowHeight + 29);
      expect(getInlineStartClone().find('tbody tr:eq(2) th:eq(0)').height()).toBe(
        getThemeLayout().cellContentHeight);
    });
  });

  describe('handle and guide', () => {
    using('configuration object', [
      { htmlDir: 'ltr', layoutDirection: 'inherit' },
      { htmlDir: 'rtl', layoutDirection: 'ltr' },
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
          rowHeaders: true,
          manualRowResize: true
        });

        const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

        $headerTH.simulate('mouseover');

        const $handle = $('.manualRowResizer');

        expect($handle.offset().top)
          .toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - ($handle.outerHeight() / 2) - 1, 0);
        expect($handle.offset().left).toBeCloseTo($headerTH.offset().left, 0);
        expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
      });

      it('should display the resize handle in the proper z-index and be greater than left overlay z-index', async() => {
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

        expect($handle.css('z-index')).toBeGreaterThan(getInlineStartClone().css('z-index'));
      });

      it('should call console.warn if the handler is not a part of proper overlay', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, 1),
          height: 280,
          fixedRowsBottom: 2,
          manualRowResize: true,
          rowHeaders: true,
        });

        spyOn(console, 'warn');

        const $masterRowHeader = getInlineStartClone().find('tbody tr:eq(3) th:eq(0)');

        $masterRowHeader.simulate('mouseover');

        const $handler = spec().$container.find('.manualRowResizer');

        $handler.simulate('mouseover');

        // eslint-disable-next-line no-console
        expect(console.warn.calls.mostRecent().args)
          .toEqual(['The provided element is not a child of the bottom_inline_start_corner overlay']);
      });

      it('should display the resize handle in the correct place after the table has been scrolled', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(20, 20),
          rowHeaders: true,
          manualRowResize: true,
          height: 100,
          width: 200,
          viewportColumnRenderingOffset: 10,
          viewportRowRenderingOffset: 10,
        });

        let $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

        $rowHeader.simulate('mouseover');

        const $handle = spec().$container.find('.manualRowResizer');

        $handle[0].style.background = 'red';

        expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
        expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);

        await scrollViewportVertically(200);

        $rowHeader = getInlineStartClone().find('tbody tr:eq(10) th:eq(0)');
        $rowHeader.simulate('mouseover');

        expect($rowHeader.offset().left).toBeCloseTo($handle.offset().left, 0);
        expect($rowHeader.offset().top + $rowHeader.height() - 5).toBeCloseTo($handle.offset().top, 0);
      });

      it('should display the resize guide in the correct size', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(20, 20),
          rowHeaders: true,
          manualRowResize: true,
          height: 100,
          width: 200
        });
        const tableWidth = parseInt(tableView().getTableWidth(), 10);
        const $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

        $rowHeader.simulate('mouseover');

        const $resizer = spec().$container.find('.manualRowResizer');
        const resizerPosition = $resizer.position();

        $resizer.simulate('mousedown', { clientY: resizerPosition.top });

        const $guide = spec().$container.find('.manualRowResizerGuide');

        $resizer.simulate('mouseup');

        expect($guide.width()).toBeCloseTo(tableWidth - $resizer.width(), 0);
      });
    });

    it('should remove resize handler when user clicks RMB', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        manualRowResize: true
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $handle = spec().$container.find('.manualRowResizer');
      const resizerPosition = $handle.position();

      $handle.simulate('mousedown', { clientY: resizerPosition.top });

      // To watch whether opacity has changed.
      expect(getComputedStyle($handle[0]).opacity).toBe('1');

      $handle.simulate('contextmenu');

      await waitForNextAnimationFrames(0);

      expect(getComputedStyle($handle[0]).opacity).not.toBe('1');
    });
  });

  describe('hooks', () => {
    it('should run the `beforeRowResize` and `afterRowResize` hooks with numeric values for both the row height and' +
      ' row index', async() => {
      const beforeRowResizeCallback = jasmine.createSpy('beforeRowResizeCallback');
      const afterRowResizeCallback = jasmine.createSpy('afterRowResizeCallback');

      handsontable({
        data: createSpreadsheetData(5, 1),
        rowHeaders: true,
        manualRowResize: true,
        beforeRowResize: beforeRowResizeCallback,
        afterRowResize: afterRowResizeCallback
      });

      await resizeRow(2, 300);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([300, 2, false]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([300, 2, false]);

      await waitForNextAnimationFrames(32);
      await resizeRow(2, -10);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([
        getThemeLayout().defaultDataRowHeight,
        2,
        false,
      ]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([
        getThemeLayout().defaultDataRowHeight,
        2,
        false,
      ]);

      await waitForNextAnimationFrames(32);
      await resizeRow(2, 100);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([100, 2, false]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([100, 2, false]);

      await waitForNextAnimationFrames(32);
      await resizeRow(2, 5);

      expect(beforeRowResizeCallback.calls.mostRecent().args).toEqual([
        getThemeLayout().defaultDataRowHeight,
        2,
        false,
      ]);
      expect(afterRowResizeCallback.calls.mostRecent().args).toEqual([
        getThemeLayout().defaultDataRowHeight,
        2,
        false,
      ]);
    });

    it('should be able to get the last desired row height from the ' +
      '`getLastDesiredRowHeight` method in the `afterRowResize` hook callback', async() => {
      const desiredHeightsLog = [];

      handsontable({
        data: [['value \n value \n value \n value \n value']],
        rowHeaders: true,
        manualRowResize: true,
        // eslint-disable-next-line object-shorthand
        afterRowResize: function() {
          desiredHeightsLog.push(this.getPlugin('manualRowResize').getLastDesiredRowHeight());
        },
      });

      const $rowHeader = getInlineStartClone().find('tbody tr:eq(0) th:eq(0)');

      $rowHeader.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      await waitForNextAnimationFrames(7);

      const mousemoveDelta = ($resizer.height() / 2) - 50;
      const expectedBump = 6;

      $resizer.simulate('mousedown', { clientY: resizerPosition.top });
      $resizer.simulate('mousemove', { clientY: resizerPosition.top + mousemoveDelta });
      $resizer.simulate('mouseup');

      expect(desiredHeightsLog).toEqual([$rowHeader.height() + 1 - 50 + expectedBump]);
    });
  });

  describe('with the AutoRowSize plugin', () => {
    it('should not cause row misalignment when manualRowResize is enabled via `updateSettings` ' +
      'after autoRowSize initialization', async() => {
      const data = createSpreadsheetData(3, 5);

      data[0][4] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas hendrerit elit sed quam porta ' +
        'tempus. Quisque eget vulputate metus. Cras pulvinar diam ipsum, eget rhoncus dolor lacinia a. ' +
        'Aliquam vitae eros varius, feugiat nibh id, auctor lorem. Phasellus vulputate odio diam, sed interdum ' +
        'elit consectetur ut. Fusce vulputate ligula tincidunt lectus tempor, ac elementum nulla tempus. Fusce ' +
        'rutrum lorem et eros euismod fermentum. Aenean varius dui vel nunc tristique, vel finibus tortor gravida. ' +
        'Ut molestie nisl a velit ultricies, gravida volutpat lectus pulvinar. Nulla sed purus sit amet justo ' +
        'ullamcorper vel non nisl. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia ' +
        'curae; Cras auctor, lacus non euismod venenatis, augue nulla auctor risus, placerat porta dui enim eu odio. ' +
        'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.';

      handsontable({
        data,
        fixedColumnsStart: 1,
        rowHeaders: true,
        autoRowSize: true,
        colWidths: 100,
      });

      await waitForNextAnimationFrames(7);

      await updateSettings({
        manualRowResize: [50, 50, 50],
      });

      expect(getInlineStartClone().find('table').height()).toBe(getMaster().find('table').height());
    });
  });
});
