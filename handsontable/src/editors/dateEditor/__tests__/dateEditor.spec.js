describe('DateEditor', () => {
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

  it('should return true in the `isOpened` after open the date editor', async() => {
    handsontable({
      type: 'date'
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the date editor', async() => {
    handsontable({
      type: 'date'
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.finishEditing();

    await waitForNextAnimationFrames(2);

    expect(editor.isOpened()).toBe(false);
  });

  it('should render an input element with type="date"', async() => {
    handsontable({
      type: 'date',
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    expect(editor.TEXTAREA.getAttribute('type')).toBe('date');
  });

  it('should render an editor in specified position at cell 0, 0', async() => {
    handsontable({
      columns: [{ type: 'date' }],
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
      columns: [{ type: 'date' }],
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
      columns: [{ type: 'date' }, {}],
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
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
      type: 'date',
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    await selectCell(0, 1);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
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
      columns: [{ type: 'date' }, {}],
    });

    await selectCell(1, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    // First renderable row index.
    expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

    await keyDownUp('enter');
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
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
      type: 'date',
    });

    await selectCell(0, 1);
    await keyDownUp('enter');

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    // First renderable column index.
    expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await waitForNextAnimationFrames(2); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should not highlight the input element by browsers native selection', async() => {
    handsontable({
      type: 'date',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should set a valid ISO date value on the native input', async() => {
    handsontable({
      data: [['2023-05-15']],
      columns: [{ type: 'date' }],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor();

    expect(editor.TEXTAREA.value).toBe('2023-05-15');
  });

  it('should emit a console warn when setValue receives a non-ISO date value', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: [['foo']],
      columns: [{ type: 'date' }],
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(warnSpy).toHaveBeenCalled();
  });

  it('should enable to input a valid ISO date value', async() => {
    handsontable({
      data: [['2023-01-01']],
      columns: [
        {
          type: 'date'
        }
      ]
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = '2023-06-15';

    await keyDownUp('5');

    expect(editor.getValue()).toEqual('2023-06-15');

    editor.finishEditing();

    await waitForNextAnimationFrames(2);

    expect(getDataAtCell(0, 0)).toEqual('2023-06-15');
  });

  it('should not close editor when inserting wrong value and allowInvalid is set to false, (#5419)', async() => {
    handsontable({
      data: [['2023-01-01']],
      allowInvalid: false,
      allowEmpty: false,
      columns: [
        {
          type: 'date'
        }
      ]
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    // The native date input rejects non-ISO strings: assigning an invalid value results in an empty string.
    editor.TEXTAREA.value = '2023-13-01'; // invalid month → rejected by native input

    expect(editor.getValue()).toEqual('');

    editor.finishEditing();

    await waitForNextAnimationFrames(2);

    expect(editor.isOpened()).toBe(true);
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
    handsontable({
      data: [
        ['2023-01-01', 'two'],
        ['2023-06-15', 'four']
      ],
      columns: [
        {
          type: 'date',
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
  });

  it('should restore original when edited and pressed ESC', async() => {
    handsontable({
      data: [['2023-01-01']],
      columns: [
        {
          type: 'date'
        }
      ]
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    editor.TEXTAREA.value = '2023-06-15';

    expect(editor.getValue()).toEqual('2023-06-15');

    await keyDownUp('escape'); // cancel editing

    editor.finishEditing();

    expect(getDataAtCell(0, 0)).toEqual('2023-01-01');
  });

  it('should not modify the edited date when opening the editor', async() => {
    handsontable({
      data: [['2015-02-02']],
      columns: [
        {
          type: 'date',
        }
      ]
    });

    const cellValue = getDataAtCell(0, 0);

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor();

    expect(editor.TEXTAREA.value).toEqual(cellValue);
  });

  it('should close the date editor after call `useTheme`', async() => {
    const hotInstance = handsontable({
      columns: [{ type: 'date' }],
    });

    await selectCell(0, 0);
    const editor = getActiveEditor();

    editor.beginEditing();

    expect(editor.isOpened()).toBe(true);

    hotInstance.useTheme(undefined);

    expect(editor.isOpened()).toBe(false);
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'date',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  describe('empty values (issue #3927)', () => {
    it('should keep `null` when opening and closing the editor without typing', async() => {
      handsontable({
        data: [['2019-01-01'], [null]],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true }],
      });

      await selectCell(1, 0);
      await keyDownUp('enter'); // open

      const editor = getActiveEditor();

      editor.finishEditing(); // confirm without typing
      await sleep(30);

      expect(getSourceDataAtCell(1, 0)).toBe(null);
    });

    it('should store `null` (not "") when setting an empty string via `setDataAtCell`', async() => {
      handsontable({
        data: [['2019-01-01']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true }],
      });

      await setDataAtCell(0, 0, '');

      expect(getSourceDataAtCell(0, 0)).toBe(null);
    });

    it('should store `null` (not "") when populating an empty value', async() => {
      handsontable({
        data: [['2019-01-01']],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true }],
      });

      await populateFromArray(0, 0, [['']]);

      expect(getSourceDataAtCell(0, 0)).toBe(null);
    });
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        columns: [
          {
            editor: 'date',
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

  describe('Cleaning up after the editor', () => {
    it('should not leave any editor containers after destroying the Handsontable instance', async() => {
      handsontable({
        data: [['2015-02-02']],
        columns: [
          {
            type: 'date'
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('enter');

      destroy();

      expect($('.htDatepickerHolder').size()).toEqual(0);
    });
  });
});
