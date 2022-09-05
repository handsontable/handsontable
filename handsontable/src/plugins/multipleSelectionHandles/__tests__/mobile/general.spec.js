describe('MultipleSelectionHandles', () => {
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

  it('should not stretch the container of the scrollable element (#9475)', () => {
    handsontable({
      data: createSpreadsheetData(5, 8),
      width: 400,
      height: 200
    });

    // try to scroll the viewport max to the right
    getMaster().find('.wtHolder').scrollLeft(9999);

    // there should be no scroll as the 8 columns fit to the table's width
    expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);
  });

  it('should not stretch the container of the scrollable element when the edge cells are selected (#9621)', () => {
    handsontable({
      data: createSpreadsheetData(5, 8),
      width: 400,
      height: 116
    });

    // select the top bottom-right cell
    selectCell(4, 7);

    // try to scroll the viewport max to the bottom-right position
    getMaster().find('.wtHolder').scrollLeft(999);
    getMaster().find('.wtHolder').scrollTop(999);

    expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);
    expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);

    loadData([['X']]);

    // try to scroll the viewport max to the bottom-right position
    getMaster().find('.wtHolder').scrollLeft(999);
    getMaster().find('.wtHolder').scrollTop(999);

    expect(getMaster().find('.wtHolder').scrollLeft()).toBe(0);
    expect(getMaster().find('.wtHolder').scrollTop()).toBe(0);
  });
});
