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

    expect(getMaster()[0].getBoundingClientRect().height).withContext('master').toBe(0);
    expect(getTopClone()[0].getBoundingClientRect().height).withContext('topClone').toBe(0);
    expect(getBottomClone()[0].getBoundingClientRect().height).withContext('bottomClone').toBe(1); // 1 comes from the width of the frozen line
    expect(getLeftClone()[0].getBoundingClientRect().height).withContext('leftClone').toBe(0);
    expect(getBottomLeftClone()[0].getBoundingClientRect().height).withContext('bottomLeftClone').toBe(1); // 1 comes from the width of the frozen line
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

    expect(getMaster()[0].getBoundingClientRect().height).withContext('master').toBe(0);
    expect(getTopClone()[0].getBoundingClientRect().height).withContext('topClone').toBe(0);
    expect(getBottomClone()[0].getBoundingClientRect().height).withContext('bottomClone').toBe(1); // 1 comes from the width of the frozen line
    expect(getLeftClone()[0].getBoundingClientRect().height).withContext('leftClone').toBe(0);
    expect(getBottomLeftClone()[0].getBoundingClientRect().height).withContext('bottomLeftClone').toBe(1); // 1 comes from the width of the frozen line
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

    expect(getMaster()[0].getBoundingClientRect().height).withContext('master before refresh').toBe(200);
    expect(getTopClone()[0].getBoundingClientRect().height).withContext('topClone before refresh').toBe(26);
    expect(getBottomClone()[0].getBoundingClientRect().height).withContext('bottomClone before refresh').toBe(24);
    expect(getLeftClone()[0].getBoundingClientRect().height).withContext('leftClone before refresh').toBe(200);
    expect(getBottomLeftClone()[0].getBoundingClientRect().height).withContext('bottomLeftClone before refresh').toBe(24);

    refreshDimensions();

    expect(getMaster()[0].getBoundingClientRect().height).withContext('master after refresh').toBe(200);
    expect(getTopClone()[0].getBoundingClientRect().height).withContext('topClone after refresh').toBe(26);
    expect(getBottomClone()[0].getBoundingClientRect().height).withContext('bottomClone after refresh').toBe(24);
    expect(getLeftClone()[0].getBoundingClientRect().height).withContext('leftClone after refresh').toBe(200);
    expect(getBottomLeftClone()[0].getBoundingClientRect().height).withContext('bottomLeftClone after refresh').toBe(24);
  });
});
