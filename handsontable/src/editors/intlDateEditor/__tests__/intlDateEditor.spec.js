describe('IntlDateEditor', () => {
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

  function getDates() {
    return [
      ['2006-01-14'],
      ['2008-12-01'],
      ['2011-11-19'],
      ['2004-02-02'],
      ['2011-07-24']
    ];
  }

  it('should return true in the `isOpened` after open the date editor', async() => {
    handsontable({
      type: 'intl-date'
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the date editor', async() => {
    handsontable({
      type: 'intl-date'
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
      columns: [{ type: 'intl-date' }],
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
      columns: [{ type: 'intl-date' }],
    });

    await listen();

    await selectAll();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('F2');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should not highlight the input element by browsers native selection', async() => {
    handsontable({
      type: 'intl-date',
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
          type: 'intl-date',
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
      data: getDates(),
      type: 'intl-date',
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

    expect(getDataAtCell(0, 0)).toEqual('2006-01-14');
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'intl-date',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  it('should display the correct date in the date picker', async() => {
    handsontable({
      data: [['2006-01-14']],
      editor: 'intl-date',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editorValue = hot().getActiveEditor().TEXTAREA.value;

    expect(editorValue).toEqual('2006-01-14');
  });

  it('should not display date in the date picker when the value is not valid', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2006-01']],
      editor: 'intl-date',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editorValue = hot().getActiveEditor().TEXTAREA.value;

    expect(editorValue).toEqual('');
    expect(warnSpy).toHaveBeenCalledWith('IntlDateEditor: value must be in ISO date format ("YYYY-MM-DD")' +
      ' required by the native date input. Received:', '2006-01');
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        columns: [
          {
            editor: 'intl-date',
          }
        ],
        imeFastEdit: true,
      });

      await selectCell(0, 0, 0, 0, true, false);
      // The `imeFastEdit` timeout is set to 50ms.
      await sleep(100);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
