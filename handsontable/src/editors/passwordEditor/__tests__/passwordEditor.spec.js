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
    await sleep(30);

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
    await sleep(10);

    expect(editor.style.width).forThemes(({ classic, main, horizon }) => {
      classic.toBe('93px');
      main.toBe('107px');
      horizon.toBe('115px');
    });
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
    await sleep(55);

    const activeElement = getActiveEditor().TEXTAREA;

    expect(activeElement).toBeDefined();
    expect(activeElement).not.toBe(null);
    expect(document.activeElement).toBe(activeElement);

    await keyDownUp('enter');

    expect(document.activeElement).toBe(activeElement);

    await sleep(200);

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
      await sleep(55);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
