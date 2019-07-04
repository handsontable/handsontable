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

  it('should not change table height after window is resized and when a handsontable has a parent at any level that has the `overflow: auto`', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 2),
      rowHeaders: true,
      colHeaders: true
    });

    const table = spec().$container.find('.ht_master .wtHolder')[0];
    const initialTableHeight = table.clientHeight;

    refreshDimensions();

    const currentTableHeight = table.clientHeight;
    expect(currentTableHeight).toEqual(initialTableHeight);
    expect(initialTableHeight).toEqual(0);
    expect(currentTableHeight).toEqual(0);
  });
});
