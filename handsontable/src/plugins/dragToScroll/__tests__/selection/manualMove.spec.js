describe('DragToScroll selection — manual move interaction', () => {
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

  it('should not extend selection when manualRowMove drag goes outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 5),
      width: 250,
      height: 150,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      manualRowMove: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();

    // Use the double-click pattern to select and then drag the row header,
    // matching how manualRowMove's own tests initiate a move drag.
    const $rowHeader = $(getCell(2, -1));

    // First click selects the row.
    $rowHeader
      .simulate('mousedown')
      .simulate('mouseup')
      // Second mousedown initiates the move drag.
      .simulate('mousedown', {
        clientY: $rowHeader.offset().top,
      });

    const selectedBefore = getSelectedLast();

    expect(selectedBefore[0]).toBe(2);
    expect(selectedBefore[2]).toBe(2);

    // Drag below the viewport.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 30,
      });

    await waitForNextAnimationFrames(8);

    // Check selection during the drag — it should not have been extended by dragToScroll.
    const selectedDuringDrag = getSelectedLast();

    $(document.body).simulate('mouseup');

    // During drag the selection should remain a single row.
    expect(selectedDuringDrag[0]).toBe(selectedDuringDrag[2]);
  });

  it('should not extend selection when manualColumnMove drag goes outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 10),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      manualColumnMove: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();

    // Use the double-click pattern to select and then drag the column header.
    const $colHeader = $(getCell(-1, 2));

    // First click selects the column.
    $colHeader
      .simulate('mousedown')
      .simulate('mouseup')
      // Second mousedown initiates the move drag.
      .simulate('mousedown', {
        clientX: $colHeader.offset().left,
      });

    const selectedBefore = getSelectedLast();

    expect(selectedBefore[1]).toBe(2);
    expect(selectedBefore[3]).toBe(2);

    // Drag to the right outside the viewport.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.right + 30,
        clientY: $colHeader.offset().top + 2,
      });

    await waitForNextAnimationFrames(8);

    // Check selection during the drag — it should not have been extended.
    const selectedDuringDrag = getSelectedLast();

    $(document.body).simulate('mouseup');

    // The selection should remain a single column (not extended by dragToScroll).
    expect(selectedDuringDrag[1]).toBe(selectedDuringDrag[3]);
  });

  it('should still scroll viewport when manualRowMove drag goes outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 5),
      width: 250,
      height: 150,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      manualRowMove: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();
    const initialScrollTop = getMaster().find('.wtHolder').scrollTop();

    expect(initialScrollTop).toBe(0);

    // Use double-click pattern to select and then drag.
    const $rowHeader = $(getCell(2, -1));

    $rowHeader
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('mousedown', {
        clientY: $rowHeader.offset().top,
      });

    // Drag below the viewport.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 30,
      });

    await waitForNextAnimationFrames(12);

    $(document.body).simulate('mouseup');

    const scrollTopAfter = getMaster().find('.wtHolder').scrollTop();

    // Viewport should still scroll even though selection extension is skipped.
    expect(scrollTopAfter).toBeGreaterThan(0);
  });
});
