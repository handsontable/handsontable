describe('TimeEditor (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: hidden;"></div>`)
      .appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render an editor with "dir" attribute set as "ltr"', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsLeft: 3,
      type: 'time',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.dir).toBe('ltr');
  });
});
