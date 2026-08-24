describe('IntlTimeEditor', () => {
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

  function getTimes() {
    return [
      ['12:00'],
      ['13:10'],
      ['14:20'],
      ['15:30'],
      ['16:55']
    ];
  }

  it('should return true in the `isOpened` after open the time editor', async() => {
    handsontable({
      type: 'intl-time'
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the time editor', async() => {
    handsontable({
      type: 'intl-time'
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.finishEditing();

    await waitForNextAnimationFrames(2);

    expect(editor.isOpened()).toBe(false);
  });

  it('should render an editor in specified position at cell 0, 0', async() => {
    handsontable({
      columns: [{ type: 'intl-time' }],
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position at cell 0, 0 when all headers are selected', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      columns: [{ type: 'intl-time' }],
    });

    await listen();

    await selectAll();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('F2');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should not highlight the input element by browsers native selection', async() => {
    handsontable({
      type: 'intl-time',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: 'intl-time',
        },
        {},
      ],
      imeFastEdit: true,
    });

    await selectCell(0, 0);

    // The `imeFastEdit` timeout is set to 50ms.
    await waitForNextAnimationFrames(2);

    const activeElement = getActiveEditor().TEXTAREA;

    expect(activeElement).toBeDefined();
    expect(activeElement).not.toBe(null);
    expect(document.activeElement).toBe(activeElement);

    await keyDownUp('enter');

    expect(document.activeElement).toBe(activeElement);

    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 't';

    await keyDownUp('t');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 'te';

    await keyDownUp('e');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 'teo';

    await keyDownUp('o');

    expect(document.activeElement).toBe(activeElement);
  });

  it('should restore original when edited and pressed ESC ', async() => {
    handsontable({
      data: getTimes(),
      type: 'intl-time',
      editor: 'text',
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = 'foo';

    expect(editor.getValue()).toEqual('foo');

    await keyDownUp('escape'); // cancel editing

    editor.finishEditing();

    expect(getDataAtCell(0, 0)).toEqual('12:00');
  });

  it('should render an editable editor\'s element with "dir" attribute set as "ltr"', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'intl-time',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBe('ltr');
  });

  it('should display the correct time in the time picker', async() => {
    handsontable({
      data: [['12:01']],
      editor: 'intl-time',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editorValue = hot().getActiveEditor().TEXTAREA.value;

    expect(editorValue).toEqual('12:01');
  });

  it('should not display time in the time picker when the value is not valid', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['12:010']],
      editor: 'intl-time',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editorValue = hot().getActiveEditor().TEXTAREA.value;

    expect(editorValue).toEqual('');
    expect(warnSpy).toHaveBeenCalledWith('TimeEditor: value must be in 24-hour time format ' +
      '("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS")' +
      ' required by the native time input. Received:', '12:010');
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        columns: [
          {
            editor: 'intl-time',
          }
        ],
        imeFastEdit: true,
      });

      await selectCell(0, 0, 0, 0, true, false);
      // The `imeFastEdit` timeout is set to 50ms.
      await waitForNextAnimationFrames(2);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
