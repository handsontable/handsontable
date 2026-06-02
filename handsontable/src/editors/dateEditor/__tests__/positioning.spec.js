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

  // Datepicker positioning E2E tests have been moved to visual tests.
  // See ./visual-tests/tests/js-only/editors/date/

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
