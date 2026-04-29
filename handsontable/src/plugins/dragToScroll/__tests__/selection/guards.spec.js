describe('DragToScroll selection — guards', () => {
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

  it('should not scroll or extend when the plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(30, 5),
      width: 250,
      height: 150,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: false,
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

    await waitForNextAnimationFrames(10);

    $(document.body).simulate('mouseup');

    const scrollTopAfter = getMaster().find('.wtHolder').scrollTop();

    // With dragToScroll disabled, the viewport should not scroll past the
    // first visible rows. A small offset (< one row height) is acceptable
    // as Walkontable may adjust alignment, but the viewport must not
    // advance by multiple rows as DragToScroll would do.
    expect(scrollTopAfter).toBeLessThan(getDefaultRowHeight());
  });

  it('should not scroll or extend the selection when selectionMode is single', async() => {
    handsontable({
      data: createSpreadsheetData(30, 5),
      width: 250,
      height: 150,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      selectionMode: 'single',
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

    await waitForNextAnimationFrames(10);

    $(document.body).simulate('mouseup');

    // Viewport should not scroll — single mode disables cell-drag scroll entirely.
    expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);
    // Selection should still be the single cell the user clicked.
    const selectedAfter = getSelectedLast();

    expect(selectedAfter).toEqual([0, 0, 0, 0]);
  });

  it('should not emit redundant setRangeEnd calls when the edge cell has not changed', async() => {
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
    const afterSelectionSpy = jasmine.createSpy('afterSelection');

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

    // Wait for a few ticks then attach the spy so we can count post-saturation calls.
    await waitForNextAnimationFrames(4);

    addHook('afterSelection', afterSelectionSpy);

    // The selection should keep extending while the viewport keeps scrolling;
    // each scroll tick either moves to a new edge cell (new afterSelection)
    // or hits the same edge (no afterSelection). This test doesn't prescribe
    // an exact number of firings, but it asserts the plugin doesn't fire
    // afterSelection on every single afterScroll — dedup against the current
    // selection end suppresses redundant calls.
    await waitForNextAnimationFrames(10);

    $(document.body).simulate('mouseup');

    const scrollCallsCount = afterSelectionSpy.calls.count();
    const selectedAfter = getSelectedLast();
    const rowsAdvanced = selectedAfter[2];

    // Number of afterSelection firings should not dramatically exceed the
    // number of new rows added to the selection (a little overhead is OK but
    // a factor of 2x+ indicates duplicate fires).
    expect(scrollCallsCount).toBeLessThanOrEqual(rowsAdvanced + 2);
  });
});
