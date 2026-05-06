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

  it('should return true in the `isOpened` after open the password editor', async() => {
    handsontable({
      type: 'password',
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    await keyDownUp('enter');

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the password editor', async() => {
    handsontable({
      type: 'password',
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    await keyDownUp('enter');

    expect(editor.isOpened()).toBe(true);

    await selectCell(1, 0);
    await waitForNextAnimationFrames(2);

    expect(editor.isOpened()).toBe(false);
  });

  it('should render an editor in specified position at cell 0, 0', async() => {
    handsontable({
      columns: [
        {
          type: 'password',
        }
      ],
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
      columns: [
        {
          type: 'password',
        }
      ],
    });

    await listen();

    await selectAll();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('F2');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
     'top and bottom overlays are enabled', async() => {
    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          type: 'password',
        },
        {},
      ],
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      type: 'password',
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    await selectCell(0, 1);
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
       'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      hiddenRows: {
        indicators: true,
        rows: [0, 5],
      },
      columns: [
        {
          type: 'password',
        },
        {},
      ],
    });

    await selectCell(1, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    // First renderable row index.
    expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled and the first column of the overlay is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      hiddenColumns: {
        indicators: true,
        columns: [0],
      },
      type: 'password',
    });

    await selectCell(0, 1);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    // First renderable column index.
    expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should not highlight the input element by browsers native selection', async() => {
    handsontable({
      type: 'password',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should display editor as password field', async() => {
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

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = $('.handsontableInput');

    expect(editor.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it('should correctly calculate the input width based on typed values', async() => {
    handsontable({
      columns: [
        {
          editor: 'password'
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    editor.value = 'wwwwwwwwwwwwwwwwww'; // "w" is wider than password dots

    await keyDownUp('w'); // trigger editor autoresize
    await waitForNextAnimationFrames(1);

    // The editor should have expanded beyond the default column width to fit password dots.
    expect(parseInt(editor.style.width, 10)).toBeGreaterThan(getDefaultColumnWidth());
  });

  it('should set passwordEditor using \'password\' alias', async() => {
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

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = $('.handsontableInput');

    expect(editor.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it('should set passwordEditor using column type \'password\' ', async() => {
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

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editorHolder = $('.handsontableInputHolder');
    const editor = editorHolder.find('.handsontableInput');

    expect(editorHolder.is(':visible')).toBe(true);
    expect(editor.is(':password')).toBe(true);

  });

  it('should save values typed in passwordEditor', async() => {
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

    await selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toMatch('Joe');
    expect(getRenderedValue(0, 0)).toMatch('Joe');

    await keyDownUp('enter');

    const editorHolder = $('.handsontableInputHolder');
    const editor = editorHolder.find('.handsontableInput');

    expect(parseInt(editorHolder.css('z-index'), 10)).toBeGreaterThan(0);

    editor.val('Edgar');

    await selectCell(1, 0); // closes editor and saves current value

    expect(editorHolder.css('z-index')).toBe('-1');

    expect(getDataAtCell(0, 0)).toMatch('Edgar');
    expect(getRenderedValue(0, 0)).toMatch('Edgar');
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
    handsontable({
      data: [
        ['Joe'],
        ['Timothy'],
        ['Margaret'],
        ['Jerry']
      ],
      columns: [
        { data: 'id', type: 'password' },
      ],
      imeFastEdit: true,
    });

    await selectCell(0, 0);

    // The `imeFastEdit` timeout is set to 50ms.
    await waitForNextAnimationFrames(4);

    const activeElement = getActiveEditor().TEXTAREA;

    expect(activeElement).toBeDefined();
    expect(activeElement).not.toBe(null);
    expect(document.activeElement).toBe(activeElement);

    await keyDownUp('enter');

    expect(document.activeElement).toBe(activeElement);

    await waitForNextAnimationFrames(13);

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = '1';

    await keyDownUp('1');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = '12';

    await keyDownUp('2');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = '123';

    await keyDownUp('3');

    expect(document.activeElement).toBe(activeElement);
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'password',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  it('should render an editable editor\'s element with "tabindex" attribute set to "-1"', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'password',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('tabindex')).toBe('-1');
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        type: 'password',
        imeFastEdit: true,
      });

      await selectCell(0, 0, 0, 0, true, false);

      // The `imeFastEdit` timeout is set to 50ms.
      await waitForNextAnimationFrames(4);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });

  describe('hashRevealDelay', () => {
    it('should use a text input (not password) when hashRevealDelay is set', async() => {
      handsontable({
        data: [['secret']],
        columns: [{ type: 'password', hashRevealDelay: 1000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      expect(editor.getAttribute('type')).toBe('text');
    });

    it('should show the last typed character in the input while delay has not elapsed', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 1000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      editor.value = 'a';
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      expect(editor.value).toBe('a');
    });

    it('should replace the typed character with the hash symbol after the delay elapses', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 50 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      editor.value = 'a';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      expect(editor.value).toBe('a');

      await sleep(150);

      expect(editor.value).toBe('*');
    });

    it('should mask previous characters with hash symbol and show only the last typed one', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 50 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      editor.value = 'a';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      await sleep(150);

      editor.value = '*b';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      expect(editor.value).toBe('*b');
    });

    it('should return the real value from getValue(), not the masked display value', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 50 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const activeEditor = getActiveEditor();
      const editor = activeEditor.TEXTAREA;

      editor.value = 'a';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      await sleep(150);

      editor.value = '*b';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      await sleep(150);

      expect(activeEditor.getValue()).toBe('ab');
    });

    it('should use a custom hashSymbol when masking delayed characters', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 50, hashSymbol: '#' }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      editor.value = 'a';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      await sleep(150);

      expect(editor.value).toBe('#');
    });

    it('should restore the cursor to the deletion point after deleting a still-visible character', async() => {
      handsontable({
        data: [['']],
        // Long delay so both typed characters remain visible when we delete.
        columns: [{ type: 'password', hashRevealDelay: 5000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      // Type 'a' then 'b'. Both are still visible (delay is 5 s) so display = 'ab'.
      editor.value = 'a';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'a' }));
      editor.value = 'ab';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'b' }));

      // Forward-delete 'a' at position 0. Browser sets value='b', cursor stays at 0.
      // Handler must replace 'b' with '*' (masked). The value CHANGES, so without
      // setSelectionRange the cursor would jump to end (position 1).
      editor.value = 'b';
      editor.selectionStart = 0;
      editor.selectionEnd = 0;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentForward' }));

      expect(editor.selectionStart).toBe(0);
    });

    it('should fall back to length-based reconciliation when a plain Event (no inputType) is dispatched', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 1000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const activeEditor = getActiveEditor();
      const editor = activeEditor.TEXTAREA;

      editor.value = 'a';
      // Plain Event has inputType === undefined; must not throw and must reach the fallback path.
      editor.dispatchEvent(new Event('input', { bubbles: true }));

      expect(activeEditor.getValue()).toBe('a');
    });

    it('should preserve cursor position when the reveal timer masks the last typed character', async() => {
      handsontable({
        data: [['b']],
        columns: [{ type: 'password', hashRevealDelay: 50 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      // Insert 'a' before the masked 'b'. Browser sets value='a*', cursor at 1.
      editor.value = 'a*';
      editor.selectionStart = 1;
      editor.selectionEnd = 1;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'a' }));

      // When the reveal timer fires it replaces 'a*' with '**'. Without setSelectionRange the
      // cursor would jump to end (position 2).
      await sleep(150);

      expect(editor.selectionStart).toBe(1);
    });

    it('should correctly update the stored value when all text is selected and replaced', async() => {
      handsontable({
        data: [['abc']],
        columns: [{ type: 'password', hashRevealDelay: 1000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const activeEditor = getActiveEditor();
      const editor = activeEditor.TEXTAREA;

      // Simulate: select all ('***' for real 'abc'), type 'x'. Browser sets value='x', cursor at 1.
      editor.value = 'x';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'x' }));

      expect(activeEditor.getValue()).toBe('x');
    });

    it('should use only the first character of hashSymbol when masking characters in the editor input', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 50, hashSymbol: '##' }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      editor.value = 'a';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'a' }));

      await sleep(150);

      expect(editor.value).toBe('#');
    });

    it('should set privacy-protecting attributes on the input when hashRevealDelay is active', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 1000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      expect(editor.getAttribute('autocomplete')).toBe('off');
      expect(editor.getAttribute('spellcheck')).toBe('false');
      expect(editor.getAttribute('autocapitalize')).toBe('off');
      expect(editor.getAttribute('autocorrect')).toBe('off');
    });

    it('should remove privacy-protecting attributes when the editor is closed', async() => {
      handsontable({
        data: [[''], ['']],
        columns: [{ type: 'password', hashRevealDelay: 1000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      await selectCell(1, 0);

      expect(editor.getAttribute('autocomplete')).toBeNull();
      expect(editor.getAttribute('spellcheck')).toBeNull();
      expect(editor.getAttribute('autocapitalize')).toBeNull();
      expect(editor.getAttribute('autocorrect')).toBeNull();
    });

    it('should not crash and should use the default mask when hashSymbol is an empty string', async() => {
      handsontable({
        data: [['']],
        columns: [{ type: 'password', hashRevealDelay: 50, hashSymbol: '' }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const activeEditor = getActiveEditor();
      const editor = activeEditor.TEXTAREA;

      editor.value = 'a';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'a' }));

      expect(activeEditor.getValue()).toBe('a');

      await sleep(150);

      expect(editor.value).toBe('*');
    });

    it('should correctly handle paste inserted mid-string', async() => {
      handsontable({
        data: [['abc']],
        columns: [{ type: 'password', hashRevealDelay: 1000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const activeEditor = getActiveEditor();
      const editor = activeEditor.TEXTAREA;

      // Simulate paste of 'XY' at position 1. Browser sets value='*XY**', cursor at 3.
      editor.value = '*XY**';
      editor.selectionStart = 3;
      editor.selectionEnd = 3;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: 'XY' }));

      expect(activeEditor.getValue()).toBe('aXYbc');
    });

    it('should correctly handle paste that replaces a selection', async() => {
      handsontable({
        data: [['abc']],
        columns: [{ type: 'password', hashRevealDelay: 1000 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const activeEditor = getActiveEditor();
      const editor = activeEditor.TEXTAREA;

      // Simulate paste of 'XY' replacing positions 1-3. Browser sets value='*XY', cursor at 3.
      editor.value = '*XY';
      editor.selectionStart = 3;
      editor.selectionEnd = 3;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: 'XY' }));

      expect(activeEditor.getValue()).toBe('aXY');
    });

    it('should save the real (unmasked) value to the data source on close', async() => {
      handsontable({
        data: [[''], ['']],
        columns: [{ type: 'password', hashRevealDelay: 50 }],
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const editor = getActiveEditor().TEXTAREA;

      editor.value = 'a';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      await sleep(150);

      editor.value = '*b';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

      await sleep(150);

      await selectCell(1, 0);

      expect(getDataAtCell(0, 0)).toBe('ab');
    });
  });
});
