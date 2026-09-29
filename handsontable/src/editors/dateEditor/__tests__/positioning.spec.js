describe('DateEditor', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // Where the native picker opens is the browser's, not the grid's; this spec asserts the editor's
  // input over the cell, and ./visual-tests/tests/js-only/complex-demo/rtl/open-date-editor.spec.ts
  // keeps one capture of the picker open, on every js variant.

  it('should render the editor TEXTAREA in the correct position when a date cell is opened', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'date',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });
});
