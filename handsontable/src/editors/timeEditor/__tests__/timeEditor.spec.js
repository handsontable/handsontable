describe('TimeEditor', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: hidden;"></div>`)
      .appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return true in the `isOpened` after open the time editor', async() => {
    handsontable({
      columns: [
        {
          type: 'time',
        }
      ],
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    await keyDownUp('enter');

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the time editor', async() => {
    handsontable({
      columns: [
        {
          type: 'time',
        }
      ],
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    await keyDownUp('enter');

    expect(editor.isOpened()).toBe(true);

    await selectCell(1, 0);
    await sleep(30);

    expect(editor.isOpened()).toBe(false);
  });

  it('should render an editable editor\'s element with "dir" attribute set as "ltr"', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'time',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBe('ltr');
  });
});
