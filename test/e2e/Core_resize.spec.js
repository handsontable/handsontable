describe('Core resize', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$wrapper = $('<div style=""></div>').css({ overflow: 'auto' });
    this.$container = $(`<div id="${id}"></div>`);

    this.$wrapper.append(this.$container);
    this.$wrapper.appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    if (this.$wrapper) {
      destroy();
      this.$wrapper.remove();
    }
  });

  it('should not change table height after window is resized when a handsontable parent elements have not defined height', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsBottom: 1,
    });

    refreshDimensions();

    expect(getMaster().height()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getBottomClone().height()).toBe(0);
    expect(getLeftClone().height()).toBe(0);
    expect(getBottomLeftClone().height()).toBe(0);
  });

  it('should not change table height after window is resized when a handsontable parent elements have not defined height and has overflow scroll', () => {
    spec().$wrapper.css({ overflow: 'scroll' });

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsBottom: 1,
    });

    refreshDimensions();

    expect(getMaster().height()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getBottomClone().height()).toBe(0);
    expect(getLeftClone().height()).toBe(0);
    expect(getBottomLeftClone().height()).toBe(0);
  });

  it('should change table height after changing parent element height', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsBottom: 1,
    });

    spec().$wrapper.css('height', 200);
    hot().render();

    expect(getMaster().height()).toBe(200);
    expect(getTopClone().height()).toBe(30);
    expect(getBottomClone().height()).toBe(24);
    expect(getLeftClone().height()).toBe(200);
    expect(getBottomLeftClone().height()).toBe(24);

    refreshDimensions();

    expect(getMaster().height()).toBe(200);
    expect(getTopClone().height()).toBe(30);
    expect(getBottomClone().height()).toBe(24);
    expect(getLeftClone().height()).toBe(200);
    expect(getBottomLeftClone().height()).toBe(24);
  });
});
