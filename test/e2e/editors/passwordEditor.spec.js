describe('PasswordEditor', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 300px;"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should display editor as password field', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          editor: Handsontable.editors.PasswordEditor
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    const editor = $('.handsontableInput');

    expect(editor.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it('should set passwordEditor using \'password\' alias', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          editor: 'password'
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    const editor = $('.handsontableInput');

    expect(editor.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it('should set passwordEditor using column type \'password\' ', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          type: 'password'
        }
      ]
    });

    selectCell(0, 0);
    keyDown('enter');

    const editorHolder = $('.handsontableInputHolder');
    const editor = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it('should save values typed in passwordEditor', () => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        {
          editor: 'password'
        }
      ]
    });

    selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toMatch('Joe');
    expect(getRenderedValue(0, 0)).toMatch('Joe');

    keyDown('enter');

    const editorHolder = $('.handsontableInputHolder');
    const editor = editorHolder.find('.handsontableInput');

    expect(parseInt(editorHolder.css('z-index'), 10)).toBeGreaterThan(0);

    editor.val('Edgar');

    selectCell(1, 0); // closes editor and saves current value

    expect(editorHolder.css('z-index')).toBe('-1');

    expect(getDataAtCell(0, 0)).toMatch('Edgar');
    expect(getRenderedValue(0, 0)).toMatch('Edgar');
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters (#839)', async() => {
    let blured = false;
    const listener = () => {
      blured = true;
    };
    const hot = handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        { data: 'id', type: 'password' },
      ],
    });

    selectCell(0, 0);
    keyDownUp('enter');
    hot.getActiveEditor().TEXTAREA.addEventListener('blur', listener);

    await sleep(200);

    hot.getActiveEditor().TEXTAREA.value = '1';
    keyDownUp('1'.charCodeAt(0));
    hot.getActiveEditor().TEXTAREA.value = '12';
    keyDownUp('2'.charCodeAt(0));
    hot.getActiveEditor().TEXTAREA.value = '123';
    keyDownUp('3'.charCodeAt(0));

    expect(blured).toBeFalsy();

    hot.getActiveEditor().TEXTAREA.removeEventListener('blur', listener);
  });

  describe('IME support', () => {
    it('should focus editable element after selecting the cell', async() => {
      handsontable({
        type: 'password',
      });
      selectCell(0, 0, 0, 0, true, false);

      await sleep(10);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
