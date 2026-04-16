describe('DragToScroll selection — down direction', () => {
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

  it('should scroll and extend the selection when dragging below the viewport', async() => {
    handsontable({
      data: createSpreadsheetData(30, 5),
      width: 250,
      height: 150,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const $cell = $(getCell(0, 0));
    const tableRect = getMaster()[0].getBoundingClientRect();
    const initialScrollTop = getMaster().find('.wtHolder').scrollTop();

    expect(initialScrollTop).toBe(0);
    expect(getSelected()).toBeUndefined();

    $cell
      .simulate('mousedown', {
        clientX: $cell.offset().left + 2,
        clientY: $cell.offset().top + 2,
      });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 10,
      });

    await waitForNextAnimationFrames(8);

    $(document.body).simulate('mouseup');

    const scrollTopAfter = getMaster().find('.wtHolder').scrollTop();
    const selectedAfter = getSelectedLast();

    expect(scrollTopAfter).toBeGreaterThan(0);
    expect(selectedAfter).toBeDefined();
    // Anchor stays at row 0; end row should have advanced beyond row 0 because the
    // viewport scrolled and the extension logic should have tracked the new edge cell.
    expect(selectedAfter[0]).toBe(0);
    expect(selectedAfter[2]).toBeGreaterThan(0);
  });

  it('should extend to many rows when the mouse is held below the viewport for a sustained period', async() => {
    handsontable({
      data: createSpreadsheetData(80, 5),
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
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 100,
      });

    await waitForNextAnimationFrames(30);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    expect(selectedAfter[0]).toBe(0);
    expect(selectedAfter[2]).toBeGreaterThan(5);
  });

  it('should shrink the selection when dragging back toward the anchor past the top edge', async() => {
    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
    });

    const tableRect = getMaster()[0].getBoundingClientRect();
    const $cell = $(getCell(0, 0));

    // First, drag downward to build up an extended selection.
    $cell.simulate('mousedown', {
      clientX: $cell.offset().left + 2,
      clientY: $cell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 80,
      });

    await waitForNextAnimationFrames(20);

    const selectedAfterExtend = getSelectedLast();

    expect(selectedAfterExtend[2]).toBeGreaterThan(2);

    // Now drag back up past the top edge of the viewport.
    // NOTE: the updated tableRect after scrolling still has the same .top since the
    // main-table viewport element position on screen is stable; only scrollTop changed.
    $(document.body).simulate('mousemove', {
      clientX: tableRect.left + 20,
      clientY: tableRect.top - 50,
    });

    await waitForNextAnimationFrames(20);

    $(document.body).simulate('mouseup');

    const selectedAfterShrink = getSelectedLast();

    // The end row should now be smaller than when we were dragging down.
    expect(selectedAfterShrink[2]).toBeLessThan(selectedAfterExtend[2]);
  });

  it('should stop auto-scrolling when the viewport reaches the last row', async() => {
    handsontable({
      data: createSpreadsheetData(8, 5),
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
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 200,
      });

    await waitForNextAnimationFrames(25);

    const scrollTopAtMax = getMaster().find('.wtHolder').scrollTop();

    await waitForNextAnimationFrames(15);

    const scrollTopLater = getMaster().find('.wtHolder').scrollTop();

    $(document.body).simulate('mouseup');

    // Once the data bottom is reached, additional time shouldn't change scrollTop.
    expect(scrollTopLater).toBe(scrollTopAtMax);

    // Selection's end row is the last row.
    const selectedAfter = getSelectedLast();

    expect(selectedAfter[2]).toBe(7);
  });

  it('should not extend the selection past the last row (off-by-one guard)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
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

    // Move the mouse far below the viewport to trigger sustained scrolling.
    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left + 20,
        clientY: tableRect.bottom + 300,
      });

    // Wait long enough for the viewport to scroll all the way down.
    await waitForNextAnimationFrames(30);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // The selection end row must be exactly the last data row, not one row beyond it.
    expect(selectedAfter[2]).toBe(countRows() - 1);
    // The selection end column must be within valid bounds.
    expect(selectedAfter[3]).toBeLessThan(countCols());
  });
});
