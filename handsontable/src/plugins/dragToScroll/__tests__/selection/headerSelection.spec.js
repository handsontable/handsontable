describe('DragToScroll selection — header selection', () => {
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

  it('should preserve whole-row selection when dragging row header down outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 8),
      width: 400,
      height: 150,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();

    // Click the row header for row 0 to select the entire row.
    const $rowHeader = $(getCell(0, -1));

    $rowHeader.simulate('mousedown', {
      clientX: $rowHeader.offset().left + 2,
      clientY: $rowHeader.offset().top + 2,
    });

    // Drag below the viewport to trigger auto-scroll.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 30,
      });

    await waitForNextAnimationFrames(12);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter).toBeDefined();
    // Anchor row at 0, selection extended downward.
    expect(selectedAfter[0]).toBe(0);
    expect(selectedAfter[2]).toBeGreaterThan(0);
    // The selection must span all columns (whole-row semantics preserved).
    // Row-header selections include col -1 as the start.
    expect(selectedAfter[3]).toBe(countCols() - 1);
  });

  it('should preserve whole-row selection when dragging row header up outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 8),
      width: 400,
      height: 150,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();

    // Scroll down first so we have room to scroll up.
    await scrollViewportTo({ row: 20 });

    await sleep(50);

    // Click a visible row header.
    const $rowHeader = $(getCell(20, -1));

    $rowHeader.simulate('mousedown', {
      clientX: $rowHeader.offset().left + 2,
      clientY: $rowHeader.offset().top + 2,
    });

    // Drag above the viewport.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.top - 30,
      });

    await waitForNextAnimationFrames(12);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter).toBeDefined();
    // Anchor row at 20, selection extended upward.
    expect(selectedAfter[0]).toBe(20);
    expect(selectedAfter[2]).toBeLessThan(20);
    // All columns selected (whole-row semantics preserved).
    expect(selectedAfter[3]).toBe(countCols() - 1);
  });

  it('should preserve whole-column selection when dragging column header down outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 8),
      width: 400,
      height: 150,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();

    // Click the column header for column 0 to select the entire column.
    const $colHeader = $(getCell(-1, 0));

    $colHeader.simulate('mousedown', {
      clientX: $colHeader.offset().left + 2,
      clientY: $colHeader.offset().top + 2,
    });

    // Drag below the viewport to trigger vertical auto-scroll.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 30,
      });

    await waitForNextAnimationFrames(12);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter).toBeDefined();
    // All rows selected (whole-column semantics preserved).
    // Column-header selections include row -1 as the start.
    expect(selectedAfter[2]).toBe(countRows() - 1);
    // Column range stays at column 0.
    expect(selectedAfter[1]).toBe(0);
    expect(selectedAfter[3]).toBe(0);
  });

  it('should preserve whole-column selection when dragging column header right outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 15),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();

    // Click the column header for column 0.
    const $colHeader = $(getCell(-1, 0));

    $colHeader.simulate('mousedown', {
      clientX: $colHeader.offset().left + 2,
      clientY: $colHeader.offset().top + 2,
    });

    // Drag to the right outside the viewport.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.right + 30,
        clientY: $colHeader.offset().top + 2,
      });

    await waitForNextAnimationFrames(12);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter).toBeDefined();
    // All rows selected (whole-column semantics preserved).
    expect(selectedAfter[2]).toBe(countRows() - 1);
    // Column range: anchor at 0, end extended right.
    expect(selectedAfter[1]).toBe(0);
    expect(selectedAfter[3]).toBeGreaterThan(0);
  });

  it('should not break row selection when mouse moves horizontally outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 15),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();

    // Click the row header for row 2.
    const $rowHeader = $(getCell(2, -1));

    $rowHeader.simulate('mousedown', {
      clientX: $rowHeader.offset().left + 2,
      clientY: $rowHeader.offset().top + 2,
    });

    // Drag to the right outside the viewport (horizontal direction from a row header drag).
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.right + 30,
        clientY: $rowHeader.offset().top + 2,
      });

    await waitForNextAnimationFrames(8);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter).toBeDefined();
    // Selection must still span all columns (whole-row semantics not broken).
    expect(selectedAfter[3]).toBe(countCols() - 1);
  });

  it('should not break column selection when mouse moves vertically outside viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 15),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();

    // Click the column header for column 2.
    const $colHeader = $(getCell(-1, 2));

    $colHeader.simulate('mousedown', {
      clientX: $colHeader.offset().left + 2,
      clientY: $colHeader.offset().top + 2,
    });

    // Drag below the viewport (vertical direction from a column header drag).
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: $colHeader.offset().left + 2,
        clientY: tableRect.bottom + 30,
      });

    await waitForNextAnimationFrames(8);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter).toBeDefined();
    // Selection must still span all rows (whole-column semantics not broken).
    expect(selectedAfter[2]).toBe(countRows() - 1);
  });
});
