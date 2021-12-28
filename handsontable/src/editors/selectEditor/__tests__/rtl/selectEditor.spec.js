describe('SelectEditor (RTL mode)', () => {

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

  it('should render an editable editor\'s element without messing with "dir" attribute', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      editor: 'select',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().select;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });
});
