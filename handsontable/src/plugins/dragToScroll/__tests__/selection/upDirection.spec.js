describe('DragToScroll selection — up direction', () => {
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

  it('should scroll up and extend the selection when dragging above the viewport', async() => {
    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 250,
      height: 200,
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

    const initialScrollTop = getMaster().find('.wtHolder').scrollTop();

    expect(initialScrollTop).toBeGreaterThan(0);

    const lastRow = countRows() - 1;
    const $cell = $(getCell(lastRow, 0, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.top - 20,
      });

    await waitForNextAnimationFrames(8);

    $(document.body).simulate('mouseup');

    const scrollTopAfter = getMaster().find('.wtHolder').scrollTop();
    const selectedAfter = getSelectedLast();

    expect(scrollTopAfter).toBeLessThan(initialScrollTop);
    // Anchor stays at lastRow; end row should be smaller (i.e. upward extension).
    expect(selectedAfter[0]).toBe(lastRow);
    expect(selectedAfter[2]).toBeLessThan(lastRow);
  });

  it('should extend upward through many rows when the mouse is held above for a sustained period', async() => {
    handsontable({
      data: createSpreadsheetData(80, 5),
      width: 250,
      height: 150,
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
    const tableRect = getMaster()[0].getBoundingClientRect();

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.top - 100,
      });

    await waitForNextAnimationFrames(30);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[0]).toBe(lastRow);
    // Should have extended many rows upward.
    expect(selectedAfter[2]).toBeLessThan(lastRow - 5);
  });

  it.flaky('should stop auto-scrolling when the viewport reaches the first row', async() => {
    handsontable({
      data: createSpreadsheetData(20, 5),
      width: 250,
      height: 150,
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
    const tableRect = getMaster()[0].getBoundingClientRect();

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.top - 200,
      });

    await waitForNextAnimationFrames(30);

    const scrollTopAtMin = getMaster().find('.wtHolder').scrollTop();

    await waitForNextAnimationFrames(15);

    const scrollTopLater = getMaster().find('.wtHolder').scrollTop();

    $(document.body).simulate('mouseup');

    expect(scrollTopAtMin).toBe(0);
    expect(scrollTopLater).toBe(0);

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[2]).toBe(0);
  });
});
