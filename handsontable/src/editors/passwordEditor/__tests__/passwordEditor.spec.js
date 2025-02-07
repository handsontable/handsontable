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

  it('should render an editor in specified position at cell 0, 0', () => {
    handsontable({
      columns: [
        {
          type: 'password',
        }
      ],
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position at cell 0, 0 when all headers are selected', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      columns: [
        {
          type: 'password',
        }
      ],
    });

    selectAll();
    listen();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('F2');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
     'top and bottom overlays are enabled', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 2),
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

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      type: 'password',
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    selectCell(0, 1);
    keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

    selectCell(0, 2);
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    selectCell(0, 3);
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    selectCell(0, 4);
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
       'top and bottom overlays are enabled and the first row of the both overlays are hidden', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 2),
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

    selectCell(1, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    // First renderable row index.
    expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled and the first column of the overlay is hidden', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      hiddenColumns: {
        indicators: true,
        columns: [0],
      },
      type: 'password',
    });

    selectCell(0, 1);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    // First renderable column index.
    expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

    selectCell(0, 2);
    keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    selectCell(0, 3);
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    selectCell(0, 4);
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should not highlight the input element by browsers native selection', () => {
    handsontable({
      type: 'password',
    });

    selectCell(0, 0);
    keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
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
    keyDownUp('enter');

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

    selectCell(0, 0);
    keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    editor.value = 'wwwwwwwwwwwwwwwwww'; // "w" is wider than password dots
    keyDownUp('w'); // trigger editor autoresize

    await sleep(10);

    expect(editor.style.width).forThemes(({ classic, main }) => {
      classic.toBe('93px');
      main.toBe('107px');
    });
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
    keyDownUp('enter');

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
    keyDownUp('enter');

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

    keyDownUp('enter');

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
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
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
      imeFastEdit: true,
    });

    selectCell(0, 0);

    // The `imeFastEdit` timeout is set to 50ms.
    await sleep(55);

    const activeElement = hot.getActiveEditor().TEXTAREA;

    expect(activeElement).toBeDefined();
    expect(activeElement).not.toBe(null);
    expect(document.activeElement).toBe(activeElement);

    keyDownUp('enter');

    expect(document.activeElement).toBe(activeElement);

    await sleep(200);

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = '1';
    keyDownUp('1');

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = '12';
    keyDownUp('2');

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = '123';
    keyDownUp('3');

    expect(document.activeElement).toBe(activeElement);
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      editor: 'password',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        type: 'password',
        imeFastEdit: true,
      });

      selectCell(0, 0, 0, 0, true, false);

      // The `imeFastEdit` timeout is set to 50ms.
      await sleep(55);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
