describe('The beforeOnCellMouseOverOutside hook', () => {
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

  it('should be triggered when the mouse moves outside the viewport during a drag', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const spy = jasmine.createSpy('beforeOnCellMouseOverOutside');

    hot().addHook('beforeOnCellMouseOverOutside', spy);

    const $anchorCell = $(getCell(0, 0, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    $(document.body).simulate('mousemove', {
      clientX: tableRect.right + 30,
      clientY: tableRect.top + 10,
    });

    $(document.body).simulate('mouseup');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should receive the event, visual coords, TD element, and controller as arguments', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const spy = jasmine.createSpy('beforeOnCellMouseOverOutside');

    hot().addHook('beforeOnCellMouseOverOutside', spy);

    const $anchorCell = $(getCell(0, 0, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    $(document.body).simulate('mousemove', {
      clientX: tableRect.right + 30,
      clientY: tableRect.top + 10,
    });

    $(document.body).simulate('mouseup');

    expect(spy).toHaveBeenCalledTimes(1);

    const [event, coords, td, controller] = spy.calls.mostRecent().args;

    expect(event).toBeInstanceOf(MouseEvent);
    expect(coords.row).toBeGreaterThanOrEqual(0);
    expect(coords.col).toBeGreaterThanOrEqual(0);
    expect(td).toBeInstanceOf(HTMLElement);
    expect(controller).toEqual({ row: false, column: false, cell: false });
  });

  it('should be triggered once for repeated mousemoves that land on the same edge cell', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const spy = jasmine.createSpy('beforeOnCellMouseOverOutside');

    hot().addHook('beforeOnCellMouseOverOutside', spy);

    const $anchorCell = $(getCell(0, 0, true));
    const tableRect = getMaster()[0].getBoundingClientRect();
    const outsideX = tableRect.right + 30;
    const outsideY = tableRect.top + 10;

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    $(document.body).simulate('mousemove', { clientX: outsideX, clientY: outsideY });
    $(document.body).simulate('mousemove', { clientX: outsideX, clientY: outsideY });
    $(document.body).simulate('mousemove', { clientX: outsideX, clientY: outsideY });

    $(document.body).simulate('mouseup');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call setRangeEnd only once for repeated mousemoves on the same edge cell (dedup regression)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const setRangeEndSpy = jasmine.createSpy('afterSetRangeEnd');

    selection().addLocalHook('afterSetRangeEnd', setRangeEndSpy);

    const $anchorCell = $(getCell(0, 0, true));
    const tableRect = getMaster()[0].getBoundingClientRect();
    const outsideX = tableRect.right + 30;
    const outsideY = tableRect.top + 10;

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    const callsAfterMousedown = setRangeEndSpy.calls.count();

    $(document.body).simulate('mousemove', { clientX: outsideX, clientY: outsideY });
    $(document.body).simulate('mousemove', { clientX: outsideX, clientY: outsideY });
    $(document.body).simulate('mousemove', { clientX: outsideX, clientY: outsideY });

    $(document.body).simulate('mouseup');

    expect(setRangeEndSpy.calls.count() - callsAfterMousedown).toBe(1);
  });

  it('should call setRangeEnd again when the mouse moves to a different edge cell', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const setRangeEndSpy = jasmine.createSpy('afterSetRangeEnd');

    selection().addLocalHook('afterSetRangeEnd', setRangeEndSpy);

    const $anchorCell = $(getCell(0, 0, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    const callsAfterMousedown = setRangeEndSpy.calls.count();

    // First outside position: past the right edge.
    $(document.body).simulate('mousemove', {
      clientX: tableRect.right + 30,
      clientY: tableRect.top + 10,
    });

    // Second outside position: past the bottom edge.
    $(document.body).simulate('mousemove', {
      clientX: tableRect.left + 10,
      clientY: tableRect.bottom + 30,
    });

    $(document.body).simulate('mouseup');

    expect(setRangeEndSpy.calls.count() - callsAfterMousedown).toBe(2);
  });

  it('should allow stopping propagation to prevent the selection from being extended', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
      beforeOnCellMouseOverOutside(event) {
        Handsontable.dom.stopImmediatePropagation(event);
      },
    });

    const $anchorCell = $(getCell(0, 0, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    await selectCell(0, 0);

    $(document.body).simulate('mousemove', {
      clientX: tableRect.right + 30,
      clientY: tableRect.top + 10,
    });

    $(document.body).simulate('mouseup');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
  });

  it('should reset dedup state on a new mousedown so the first outside cell of the next drag always triggers setRangeEnd', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const setRangeEndSpy = jasmine.createSpy('afterSetRangeEnd');

    selection().addLocalHook('afterSetRangeEnd', setRangeEndSpy);

    const $anchorCell = $(getCell(0, 0, true));
    const tableRect = getMaster()[0].getBoundingClientRect();
    const outsideX = tableRect.right + 30;
    const outsideY = tableRect.top + 10;

    // First drag.
    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    $(document.body).simulate('mousemove', { clientX: outsideX, clientY: outsideY });
    $(document.body).simulate('mouseup');

    const callsAfterFirstDrag = setRangeEndSpy.calls.count();

    // Second drag starting from the same anchor.
    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    $(document.body).simulate('mousemove', { clientX: outsideX, clientY: outsideY });
    $(document.body).simulate('mouseup');

    expect(setRangeEndSpy.calls.count() - callsAfterFirstDrag).toBeGreaterThanOrEqual(1);
  });
});
