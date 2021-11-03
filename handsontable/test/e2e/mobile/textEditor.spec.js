const id = 'testContainer';

describe('Text Editor', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should save text value after click "Done" on iOS (focusout event)', async() => {
    const hot = handsontable({
      columns: [
        {
          type: 'text',
        }
      ]
    });

    const cell = hot.getCell(0, 0);

    selectCell(0, 0);

    keyDown('enter');

    const editor = getActiveEditor();

    editor.setValue('test');

    // simulate "Done" click on iOS keyboard
    editor.eventManager.fireEvent(editor.TEXTAREA, 'focusout');

    expect(cell.textContent).toBe('test');
  });

});
