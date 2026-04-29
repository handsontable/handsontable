describe('DragToScroll selection — fixed overlays', () => {
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

  it('should scroll and extend the selection up when dragging over the top fixed-rows overlay', async() => {
    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 250,
      height: 200,
      fixedRowsTop: 2,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    await scrollViewportTo({
      row: countRows() - 1,
      col: 0,
      verticalSnap: 'bottom',
      horizontalSnap: 'start',
    });

    const lastRow = countRows() - 1;
    const $cell = $(getCell(lastRow, 0, true));
    const topOverlayCell = $(getCell(0, 0, true));

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: topOverlayCell.offset().left + 20,
        clientY: topOverlayCell.offset().top - 1,
      });

    await waitForNextAnimationFrames(10);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // Anchor stays at lastRow; end row should be smaller (we scrolled up).
    expect(selectedAfter[0]).toBe(lastRow);
    expect(selectedAfter[2]).toBeLessThan(lastRow);
  });

  it('should scroll and extend the selection right when dragging toward the fixed-columns-start overlay', async() => {
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      fixedColumnsStart: 2,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    await scrollViewportTo({
      row: 0,
      col: countCols() - 1,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    const lastCol = countCols() - 1;
    const $cell = $(getCell(0, lastCol, true));
    const leftOverlayCell = $(getCell(0, 0, true));

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: leftOverlayCell.offset().left - 1,
        clientY: leftOverlayCell.offset().top + 20,
      });

    await waitForNextAnimationFrames(10);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[1]).toBe(lastCol);
    expect(selectedAfter[3]).toBeLessThan(lastCol);
  });

  it('should scroll and extend the selection down when dragging toward the bottom fixed-rows overlay', async() => {
    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 250,
      height: 200,
      fixedRowsBottom: 2,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const $cell = $(getCell(0, 0));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 20,
      });

    await waitForNextAnimationFrames(10);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[0]).toBe(0);
    expect(selectedAfter[2]).toBeGreaterThan(0);
  });
});
