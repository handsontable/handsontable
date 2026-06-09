describe('DragToScroll selection — right direction', () => {
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

  it('should scroll right and extend the selection when dragging past the right edge', async() => {
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const $cell = $(getCell(0, 0));
    const tableRect = getMaster()[0].getBoundingClientRect();
    const initialScrollLeft = getMaster().find('.wtHolder').scrollLeft();

    expect(initialScrollLeft).toBe(0);

    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.right + 10,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(8);

    $(document.body).simulate('mouseup');

    const scrollLeftAfter = getMaster().find('.wtHolder').scrollLeft();
    const selectedAfter = getSelectedLast();

    expect(scrollLeftAfter).toBeGreaterThan(0);
    expect(selectedAfter[1]).toBe(0);
    expect(selectedAfter[3]).toBeGreaterThan(0);
  });

  it('should extend to many columns when the mouse is held right for a sustained period', async() => {
    handsontable({
      data: createSpreadsheetData(5, 60),
      width: 250,
      height: 150,
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
        clientX: tableRect.right + 100,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(30);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[1]).toBe(0);
    expect(selectedAfter[3]).toBeGreaterThan(5);
  });

  it('should stop auto-scrolling when the viewport reaches the last column', async() => {
    handsontable({
      data: createSpreadsheetData(5, 6),
      width: 250,
      height: 150,
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
        clientX: tableRect.right + 200,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(30);

    const scrollLeftAtMax = getMaster().find('.wtHolder').scrollLeft();

    await waitForNextAnimationFrames(15);

    const scrollLeftLater = getMaster().find('.wtHolder').scrollLeft();

    $(document.body).simulate('mouseup');

    expect(scrollLeftLater).toBe(scrollLeftAtMax);

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[3]).toBe(5);
  });

  it('should not extend the selection past the last column (off-by-one guard)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 10),
      width: 250,
      height: 200,
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

    // Move the mouse far to the right to trigger sustained scrolling.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.right + 300,
        clientY: tableRect.top + 20,
      });

    await waitForNextAnimationFrames(30);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // The selection end column must be exactly the last data column, not one beyond it.
    expect(selectedAfter[3]).toBe(countCols() - 1);
    // The selection end row must be within valid bounds.
    expect(selectedAfter[2]).toBeLessThan(countRows());
  });
});
