describe('MultipleSelectionHandles (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should show selection handles in correct positions', () => {
    handsontable({
      width: 400,
      height: 400
    });

    selectCell(1, 1);

    const topSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:first-child .topSelectionHandle');
    const topSelectionHandleSize = topSelectionHandle.outerWidth();
    const bottomSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:first-child .bottomSelectionHandle');
    const bottomSelectionHandleSize = bottomSelectionHandle.outerWidth();
    const cell = $(getCell(1, 1));
    const cellOffset = cell.offset();
    const cellWidth = cell.outerWidth();
    const cellHeight = cell.outerHeight();

    expect(topSelectionHandle.is(':visible')).toBe(true);
    expect(bottomSelectionHandle.is(':visible')).toBe(true);
    expect(topSelectionHandle.offset()).toEqual({
      top: cellOffset.top - topSelectionHandleSize,
      left: cellOffset.left + cellWidth,
    });
    // -/+1 as the bottom handler is positioned ending in the most bottom-left pixel
    expect(bottomSelectionHandle.offset()).toEqual({
      top: cellOffset.top + cellHeight - 1,
      left: cellOffset.left - bottomSelectionHandleSize + 1,
    });
  });

  it('should show both selection handles in correct position after horizontal drag & drop', async() => {
    handsontable({
      width: 400,
      height: 400
    });

    selectCell(1, 1);

    await sleep(100);

    const cellFrom = $(getCell(1, 1));
    const cellTo = spec().$container.find('tbody tr:eq(1) td:eq(3)');
    const cellToOffset = cellTo.offset();
    const cellToHeight = cellFrom.outerHeight();

    triggerTouchEvent('touchstart', spec().$container.find('.htBorders .bottomSelectionHandle-HitArea')[0]);
    triggerTouchEvent('touchmove', spec().$container.find('tbody tr:eq(1) td:eq(2)')[0]);
    triggerTouchEvent('touchmove', cellTo[0]);
    triggerTouchEvent('touchend', cellTo[0]);

    await sleep(100);

    const topSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:last-child .topSelectionHandle');
    const topSelectionHandleSize = topSelectionHandle.outerWidth();
    const bottomSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:last-child .bottomSelectionHandle');
    const bottomSelectionHandleSize = bottomSelectionHandle.outerWidth();
    const cellFromOffset = cellFrom.offset();
    const cellFromWidth = cellFrom.outerWidth();

    expect(topSelectionHandle.is(':visible')).toBe(true);
    expect(bottomSelectionHandle.is(':visible')).toBe(true);
    expect(topSelectionHandle.offset()).toEqual({
      top: cellFromOffset.top - topSelectionHandleSize,
      left: cellFromOffset.left + cellFromWidth,
    });
    // -/+1 as the bottom handler is positioned ending in the most bottom-left pixel
    expect(bottomSelectionHandle.offset()).toEqual({
      top: cellToOffset.top + cellToHeight - 1,
      left: cellToOffset.left - bottomSelectionHandleSize + 1,
    });
    expect(getSelected()).toEqual([[1, 1, 1, 3]]);
  });

  it('should show both selection handles in correct position after vertical drag & drop', async() => {
    handsontable({
      width: 400,
      height: 400
    });

    selectCell(1, 1);

    await sleep(100);

    const cellFrom = $(getCell(1, 1));
    const cellTo = spec().$container.find('tbody tr:eq(3) td:eq(1)');
    const cellToOffset = cellTo.offset();
    const cellToHeight = cellFrom.outerHeight();

    triggerTouchEvent('touchstart', spec().$container.find('.htBorders .bottomSelectionHandle-HitArea')[0]);
    triggerTouchEvent('touchmove', spec().$container.find('tbody tr:eq(2) td:eq(1)')[0]);
    triggerTouchEvent('touchmove', cellTo[0]);
    triggerTouchEvent('touchend', cellTo[0]);

    await sleep(100);

    const topSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:last-child .topSelectionHandle');
    const topSelectionHandleSize = topSelectionHandle.outerWidth();
    const bottomSelectionHandle = spec().$container
      .find('.ht_master .htBorders div:last-child .bottomSelectionHandle');
    const bottomSelectionHandleSize = bottomSelectionHandle.outerWidth();
    const cellFromOffset = cellFrom.offset();
    const cellFromWidth = cellFrom.outerWidth();

    expect(topSelectionHandle.is(':visible')).toBe(true);
    expect(bottomSelectionHandle.is(':visible')).toBe(true);
    expect(topSelectionHandle.offset()).toEqual({
      top: cellFromOffset.top - topSelectionHandleSize,
      left: cellFromOffset.left + cellFromWidth,
    });
    // -/+1 as the bottom handler is positioned ending in the most bottom-left pixel
    expect(bottomSelectionHandle.offset()).toEqual({
      top: cellToOffset.top + cellToHeight - 1,
      left: cellToOffset.left - bottomSelectionHandleSize + 1,
    });
    expect(getSelected()).toEqual([[1, 1, 3, 1]]);
  });
});
