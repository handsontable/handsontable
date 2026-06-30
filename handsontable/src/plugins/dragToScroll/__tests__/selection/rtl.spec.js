describe('DragToScroll selection — RTL', () => {
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

  it('should scroll and extend the selection when dragging past the end edge (visually left) in RTL', async() => {
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      layoutDirection: 'rtl',
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
        clientX: tableRect.left - 20,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(10);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // In RTL the "end" edge is visually on the left. Selection should extend
    // to higher column indexes (scrolling reveals columns beyond the viewport).
    expect(selectedAfter[1]).toBe(0);
    expect(selectedAfter[3]).toBeGreaterThan(0);
  });

  it('should scroll and extend the selection when dragging past the start edge (visually right) in RTL', async() => {
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      layoutDirection: 'rtl',
    });

    await scrollViewportTo({
      row: 0,
      col: countCols() - 1,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    const lastCol = countCols() - 1;
    const $cell = $(getCell(0, lastCol, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.right + 20,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(10);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[1]).toBe(lastCol);
    // End should have moved toward lower column indexes (visually rightward scroll in RTL).
    expect(selectedAfter[3]).toBeLessThan(lastCol);
  });

  it('should scroll and extend vertically independent of RTL direction', async() => {
    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      layoutDirection: 'rtl',
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
        clientX: tableRect.left + 50,
        clientY: tableRect.bottom + 20,
      });

    await waitForNextAnimationFrames(8);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[0]).toBe(0);
    expect(selectedAfter[2]).toBeGreaterThan(0);
  });
});
