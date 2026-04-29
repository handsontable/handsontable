describe('DragToScroll selection — left direction', () => {
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

  it('should scroll left and extend the selection when dragging past the left edge', async() => {
    spec().$container.css('margin-left', '100px');

    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
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

    const initialScrollLeft = getMaster().find('.wtHolder').scrollLeft();

    expect(initialScrollLeft).toBeGreaterThan(0);

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
        clientX: tableRect.left - 20,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(8);

    $(document.body).simulate('mouseup');

    const scrollLeftAfter = getMaster().find('.wtHolder').scrollLeft();
    const selectedAfter = getSelectedLast();

    expect(scrollLeftAfter).toBeLessThan(initialScrollLeft);
    expect(selectedAfter[1]).toBe(lastCol);
    expect(selectedAfter[3]).toBeLessThan(lastCol);
  });

  it('should extend to many columns leftward when the mouse is held left for a sustained period', async() => {
    spec().$container.css('margin-left', '100px');

    handsontable({
      data: createSpreadsheetData(5, 60),
      width: 250,
      height: 150,
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
    const tableRect = getMaster()[0].getBoundingClientRect();

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left - 80,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(30);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[1]).toBe(lastCol);
    expect(selectedAfter[3]).toBeLessThan(lastCol - 5);
  });

  it('should stop auto-scrolling when the viewport reaches the first column', async() => {
    spec().$container.css('margin-left', '100px');

    handsontable({
      data: createSpreadsheetData(5, 10),
      width: 250,
      height: 150,
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
    const tableRect = getMaster()[0].getBoundingClientRect();

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left - 200,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(30);

    const scrollLeftAtMin = getMaster().find('.wtHolder').scrollLeft();

    await waitForNextAnimationFrames(15);

    const scrollLeftLater = getMaster().find('.wtHolder').scrollLeft();

    $(document.body).simulate('mouseup');

    expect(scrollLeftAtMin).toBe(0);
    expect(scrollLeftLater).toBe(0);

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[3]).toBe(0);
  });
});
