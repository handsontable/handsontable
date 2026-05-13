describe('The afterOnCellMouseOverOutside hook', () => {
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

    const spy = jasmine.createSpy('afterOnCellMouseOverOutside');

    hot().addHook('afterOnCellMouseOverOutside', spy);

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

  it('should receive the event, visual coords, and TD element as arguments', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const spy = jasmine.createSpy('afterOnCellMouseOverOutside');

    hot().addHook('afterOnCellMouseOverOutside', spy);

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

    const [event, coords, td] = spy.calls.mostRecent().args;

    expect(event).toBeInstanceOf(MouseEvent);
    expect(coords.row).toBeGreaterThanOrEqual(0);
    expect(coords.col).toBeGreaterThanOrEqual(0);
    expect(td).toBeInstanceOf(HTMLElement);
  });

  it('should be triggered once for repeated mousemoves that land on the same edge cell', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const spy = jasmine.createSpy('afterOnCellMouseOverOutside');

    hot().addHook('afterOnCellMouseOverOutside', spy);

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

  it('should NOT be triggered when the beforeOnCellMouseOverOutside hook stops event propagation', async() => {
    const spy = jasmine.createSpy('afterOnCellMouseOverOutside');

    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
      beforeOnCellMouseOverOutside(event) {
        Handsontable.dom.stopImmediatePropagation(event);
      },
      afterOnCellMouseOverOutside: spy,
    });

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

    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should not receive a controller argument (unlike beforeOnCellMouseOverOutside)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 200,
      height: 100,
    });

    const spy = jasmine.createSpy('afterOnCellMouseOverOutside');

    hot().addHook('afterOnCellMouseOverOutside', spy);

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

    expect(spy.calls.mostRecent().args.length).toBe(3);
  });
});
