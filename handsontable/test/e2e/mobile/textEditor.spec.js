describe('Text Editor', () => {
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

  it('should save text value after click "Done" on iOS (focusout event)', async() => {
    if (!Handsontable.helper.isIOS()) {
      expect(true).toBe(true);

      return;
    }

    handsontable({
      columns: [
        {
          type: 'text',
        }
      ]
    });

    const cell = hot.getCell(0, 0);

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor();

    editor.setValue('test');

    // simulate "Done" click on iOS keyboard
    editor.eventManager.fireEvent(editor.TEXTAREA, 'focusout');

    expect(cell.textContent).toBe('test');
  });

  it('should have correct border radius value in editor textarea', async() => {
    handsontable({
      columns: [
        {
          type: 'text',
        }
      ]
    });

    hot.getCell(0, 0);

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor();
    const compStyle = getComputedStyle(editor.TEXTAREA);

    expect(compStyle.borderRadius).toBe('0px');
  });

  it('should open an editor on double tap', async() => {
    handsontable({});

    await selectCell(0, 0);

    const cell = getCell(0, 0);

    await triggerTouchEvent('touchstart', cell);
    await triggerTouchEvent('touchend', cell);
    await triggerTouchEvent('touchstart', cell);
    await triggerTouchEvent('touchend', cell);

    expect(getActiveEditor().isOpened()).toBe(true);
  });
});
