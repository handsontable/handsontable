describe('TextEditor', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer" style="width: 300px; height: 200px; overflow: hidden;"></div>')
      .appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return true in the `isOpened` after open the text editor', async() => {
    handsontable({
      type: 'text',
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    await keyDownUp('enter');

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the text editor', async() => {
    handsontable({
      type: 'text',
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
          type: 'text',
        }
      ],
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor with proper width when body is a grid element', async() => {
    document.body.style.display = 'grid';

    handsontable({
      columns: [
        {
          type: 'text',
        }
      ],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');

    document.body.style.display = '';
  });

  it('should render an editor with proper width when body is an inline-grid element', async() => {
    document.body.style.display = 'inline-grid';

    handsontable({
      columns: [
        {
          type: 'text',
        }
      ],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');

    document.body.style.display = '';
  });

  it('should render an editor with proper width when body is a flex element', async() => {
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';

    handsontable({
      columns: [
        {
          type: 'text',
        }
      ],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');

    document.body.style.display = '';
    document.body.style.flexDirection = '';
  });

  it('should render an editor in specified position at cell 0, 0 when all headers are selected', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      columns: [
        {
          type: 'text',
        }
      ],
    });

    await listen();

    await selectAll();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('F2');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it.forTheme('classic')('should render an editor in specified position while opening an editor ' +
    'from top to bottom when top and bottom overlays are enabled', async() => {
    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          type: 'text',
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

  it.forTheme('main')('should render an editor in specified position while opening an editor from top to bottom when ' +
    'top and bottom overlays are enabled', async() => {
    spec().$container[0].style.height = '240px';
    spec().$container[0].style.width = '200px';

    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          type: 'text',
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

  it.forTheme('horizon')('should render an editor in specified position while opening an editor ' +
    'from top to bottom when top and bottom overlays are enabled', async() => {
    spec().$container[0].style.height = '306px';
    spec().$container[0].style.width = '200px';

    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          type: 'text',
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
      type: 'text',
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

  it.forTheme('classic')(
    'should render an editor in specified position while opening an editor from top to bottom when ' +
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
            type: 'text',
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

  it.forTheme('main')(
    'should render an editor in specified position while opening an editor from top to bottom when ' +
    'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
      spec().$container[0].style.height = '240px';
      spec().$container[0].style.width = '200px';

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
            type: 'text',
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

  it.forTheme('horizon')(
    'should render an editor in specified position while opening an editor from top to bottom when ' +
    'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
      spec().$container[0].style.height = '306px';
      spec().$container[0].style.width = '200px';

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
            type: 'text',
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
      type: 'text',
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
      editor: 'text'
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should begin editing when enterBeginsEditing equals true', async() => {
    handsontable({
      enterBeginsEditing: true,
      editor: 'text'
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    const selection = getSelected();

    expect(selection).toEqual([[2, 2, 2, 2]]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor, close it and move down after editing when the selection is single', async() => {
    handsontable({
      editor: 'text'
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(isEditorVisible()).toEqual(false);
    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 3,2']);
  });

  it('should not open editor and move down after hit ENTER key when the multiple cells are selected', async() => {
    handsontable({
      editor: 'text'
    });

    await selectCell(2, 2, 3, 2);
    await keyDownUp('enter');

    expect(isEditorVisible()).toEqual(false);
    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 2,2 to: 3,2']);
  });

  it('should open editor and move down after hit F2 key when the multiple cells are selected', async() => {
    handsontable({
      editor: 'text'
    });

    await selectCell(2, 2, 3, 2);
    await keyDownUp('F2');

    expect(isEditorVisible()).toEqual(true);

    await keyDownUp('enter');

    expect(isEditorVisible()).toEqual(false);
    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 2,2 to: 3,2']);
  });

  it('should move down after editing when the selection is single', async() => {
    handsontable({
      editor: 'text'
    });

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp('enter');

    const selection = getSelected();

    expect(selection).toEqual([[3, 2, 3, 2]]);
  });

  it('should move down when enterBeginsEditing equals false', async() => {
    handsontable({
      enterBeginsEditing: false
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    const selection = getSelected();

    expect(selection).toEqual([[3, 2, 3, 2]]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('should create editor holder after cell selection', async() => {
    handsontable({
      editor: 'text',
    });

    const container = spec().$container;

    expect(container.find('.handsontableInputHolder').length).toBe(0);

    await selectCell(0, 0);

    expect(container.find('.handsontableInputHolder').length).toBe(1);
  });

  it('should prepare editor with proper styles after selection', async() => {
    handsontable({
      editor: 'text',
    });

    await selectCell(1, 1);

    const { left, top, position, zIndex } = spec().$container.find('.handsontableInputHolder').css([
      'left',
      'top',
      'position',
      'zIndex'
    ]);

    expect(parseInt(left, 10)).toBe(getCell(1, 1).offsetLeft - 1);
    expect(position).toBe('absolute');
    expect(parseInt(top, 10)).toBe(getCell(1, 1).offsetTop - 1);
    expect(zIndex).toBe('-1');
  });

  it('should change editor\'s CSS properties during switching to being visible', async() => {
    handsontable({
      editor: 'text',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const cell = getCell(0, 0);
    const [cellOffsetTop, cellOffsetLeft] = [cell.offsetTop, cell.offsetLeft];
    const { left, right, position, top, zIndex, overflow } = spec().$container.find('.handsontableInputHolder').css([
      'left',
      'right',
      'position',
      'top',
      'zIndex',
      'overflow',
    ]);

    expect(parseInt(left, 10)).toBeAroundValue(cellOffsetLeft);
    expect(parseInt(right, 10)).not.toBe(document.body.offsetWidth);
    expect(position).toBe('absolute');
    expect(parseInt(top, 10)).toBeAroundValue(cellOffsetTop);
    expect(zIndex).not.toBe('-1');
    expect(overflow).not.toBe('hidden');
  });

  it.forTheme('classic')('should change editor\'s z-index properties during switching to overlay ' +
    'where editor was open', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      editor: 'text',
      fixedRowsBottom: 2,
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
    });

    // .ht_clone_top_inline_start_corner
    await selectCell(0, 0);
    await keyDownUp('enter');

    const handsontableInputHolder = spec().$container.find('.handsontableInputHolder');

    expect(handsontableInputHolder.css('zIndex')).toBe('180');

    // .ht_clone_inline_start
    await selectCell(5, 0);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('120');

    // .ht_clone_bottom_inline_start_corner
    await selectCell(9, 0);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('150');

    // .ht_clone_top
    await selectCell(0, 5);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('160');

    // .ht_clone_master
    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('100');

    // .ht_clone_bottom
    await selectCell(9, 5);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('130');
  });

  it.forTheme('main')('should change editor\'s z-index properties during switching to overlay ' +
    'where editor was open', async() => {
    spec().$container[0].style.height = '252px';

    handsontable({
      data: createSpreadsheetData(10, 10),
      editor: 'text',
      fixedRowsBottom: 2,
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
    });

    // .ht_clone_top_inline_start_corner
    await selectCell(0, 0);
    await keyDownUp('enter');

    const handsontableInputHolder = spec().$container.find('.handsontableInputHolder');

    expect(handsontableInputHolder.css('zIndex')).toBe('180');

    // .ht_clone_inline_start
    await selectCell(5, 0);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('120');

    // .ht_clone_bottom_inline_start_corner
    await selectCell(9, 0);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('150');

    // .ht_clone_top
    await selectCell(0, 5);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('160');

    // .ht_clone_master
    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('100');

    // .ht_clone_bottom
    await selectCell(9, 5);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('130');
  });

  it.forTheme('horizon')('should change editor\'s z-index properties during switching to overlay ' +
    'where editor was open', async() => {
    spec().$container[0].style.height = '322px';

    handsontable({
      data: createSpreadsheetData(10, 10),
      editor: 'text',
      fixedRowsBottom: 2,
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
    });

    // .ht_clone_top_inline_start_corner
    await selectCell(0, 0);
    await keyDownUp('enter');

    const handsontableInputHolder = spec().$container.find('.handsontableInputHolder');

    expect(handsontableInputHolder.css('zIndex')).toBe('180');

    // .ht_clone_inline_start
    await selectCell(5, 0);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('120');

    // .ht_clone_bottom_inline_start_corner
    await selectCell(9, 0);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('150');

    // .ht_clone_top
    await selectCell(0, 5);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('160');

    // .ht_clone_master
    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('100');

    // .ht_clone_bottom
    await selectCell(9, 5);
    await keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('130');
  });

  it('should render string in textarea', async() => {
    handsontable();

    await setDataAtCell(2, 2, 'string');

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('string');
  });

  it('should render proper value after cell coords manipulation', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5)
    });

    rowIndexMapper().setIndexesSequence([1, 2, 3, 4, 0]);
    columnIndexMapper().setIndexesSequence([1, 2, 3, 4, 0]);

    await selectCell(0, 0);

    getActiveEditor().beginEditing();
    getActiveEditor().refreshValue();

    expect(getActiveEditor().originalValue).toEqual('B2');
  });

  it('should render textarea editor with tabindex=-1 attribute', async() => {
    handsontable();

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.getAttribute('tabindex')).toBe('-1');
  });

  it('should render textarea editor in specified size at cell 0, 0 without headers', async() => {
    handsontable();

    await selectCell(0, 0);
    await keyDownUp('enter');

    await sleep(200);

    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main, horizon }) => {
      classic.toBe('24px');
      main.toBe('30px');
      horizon.toBe('38px');
    });
    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');
  });

  it('should render textarea editor in specified size at cell 1, 0 without headers', async() => {
    handsontable();

    await selectCell(1, 1);
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main, horizon }) => {
      classic.toBe('24px');
      main.toBe('30px');
      horizon.toBe('38px');
    });
  });

  it('should render textarea editor in specified size at cell 0, 0 with headers', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main, horizon }) => {
      classic.toBe('24px');
      main.toBe('30px');
      horizon.toBe('38px');
    });
    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');
  });

  it('should render textarea editor in specified size at cell 0, 0 when headers are selected', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true
    });

    await listen();

    await selectAll();
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main, horizon }) => {
      classic.toBe('24px');
      main.toBe('30px');
      horizon.toBe('38px');
    });
    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');
  });

  it('should render textarea editor in specified size at cell 0, 0 with headers defined in columns', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
      columns: [{
        data: 'prop0',
        title: 'Prop 0'
      }, {
        data: 'prop1',
        title: 'Prop 1'
      }, {
        data: 'prop2',
        title: 'Prop 2'
      }, {
        data: 'prop3',
        title: 'Prop 3'
      }],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(parseInt(getActiveEditor().TEXTAREA.style.width, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(51, 1);
      main.toBeAroundValue(60, 1);
      horizon.toBeAroundValue(68, 1);
    });
    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main, horizon }) => {
      classic.toBe('24px');
      main.toBe('30px');
      horizon.toBe('38px');
    });
    expect(getActiveEditor().textareaParentStyle.top).forThemes(({ classic, main, horizon }) => {
      classic.toBe('26px');
      main.toBe('29px');
      horizon.toBe('37px');
    });
  });

  it('should hide whole editor when it is higher then header and TD is not rendered anymore', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    await setDataAtCell(2, 2, 'string\nstring\nstring');

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyUp(['enter']);

    await scrollViewportVertically(500);
    await scrollViewportHorizontally(500);

    expect(parseInt(getActiveEditor().textareaParentStyle.opacity, 10)).toBe(0); // result of textEditor .close()
  });

  it('should hide whole editor when it is higher then header and TD is still rendered', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    await setDataAtCell(2, 2, 'string\nstring\nstring');

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyUp(['enter']);

    await scrollViewportVertically(150);
    await scrollViewportHorizontally(100);

    expect(parseInt(getActiveEditor().textareaParentStyle.opacity, 10)).toBe(1);
    expect(parseInt(getActiveEditor().textareaParentStyle.top, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(-77);
      main.toBeAroundValue(-62);
      horizon.toBeAroundValue(-38);
    });
    expect(parseInt(getActiveEditor().textareaParentStyle.left, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(50);
      main.toBeAroundValue(50);
      horizon.toBeAroundValue(52);
    });
  });

  it('should hide editor when quick navigation by click scrollbar was triggered', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    await setDataAtCell(2, 2, 'string\nstring\nstring');

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyUp(['enter']);
    await scrollViewportTo({ row: 49 });

    expect(isEditorVisible()).toBe(false);
  });

  it('should render textarea editor in specified height (single line)', async() => {
    handsontable();

    await setDataAtCell(2, 2, 'first line');

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main, horizon }) => {
      classic.toBe('24px');
      main.toBe('30px');
      horizon.toBe('38px');
    });
  });

  it('should render textarea editor in specified height (multi line)', async() => {
    handsontable();

    await setDataAtCell(2, 2, 'first line\n second line\n third line...');

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main, horizon }) => {
      classic.toBe('65px');
      main.toBe('70px');
      horizon.toBe('78px');
    });
  });

  it('should render number in textarea', async() => {
    handsontable();
    await setDataAtCell(2, 2, 13);

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('13');
  });

  it('should render boolean true in textarea', async() => {
    handsontable();
    await setDataAtCell(2, 2, true);

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('true');
  });

  it('should render boolean false in textarea', async() => {
    handsontable();
    await setDataAtCell(2, 2, false);

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('false');
  });

  it('should render null in textarea', async() => {
    handsontable();
    await setDataAtCell(2, 2, null);

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('');
  });

  it('should render undefined in textarea', async() => {
    handsontable();
    await setDataAtCell(2, 2);

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('');
  });

  it('should render nested object value in textarea', async() => {
    handsontable({
      data: [{
        name: {
          first: 'Tom',
          last: 'Kowalski',
          obj: {}
        }
      }, {
        name: {
          first: 'John',
          last: 'Cage',
          obj: {
            foo: 'bar'
          }
        }
      }],
      columns: [{
        data: 'name.last'
      }, {
        data: 'name.obj.foo'
      }]
    });
    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('Kowalski');

    await selectCell(1, 1);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('bar');
  });

  it('should render nested object value in textarea after change rows order', async() => {
    handsontable({
      data: [{
        name: {
          first: 'Tom',
          last: 'Kowalski',
          obj: {}
        }
      }, {
        name: {
          first: 'John',
          last: 'Cage',
          obj: {
            foo: 'bar'
          }
        }
      }],
      columns: [{
        data: 'name.last'
      }, {
        data: 'name.obj.foo'
      }],
      manualRowMove: true
    });

    getPlugin('manualRowMove').moveRow(1, 0);
    await render();

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('Cage');

    await keyDownUp('enter');

    expect(getDataAtCell(0, 0)).toEqual('Cage');

    await selectCell(1, 1);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('');

    await keyDownUp('enter');

    expect(getDataAtCell(1, 1)).toEqual('');
  });

  it('should render nested object value in textarea after change columns order', async() => {
    handsontable({
      data: [{
        name: {
          first: 'Tom',
          last: 'Kowalski',
          obj: {}
        }
      }, {
        name: {
          first: 'John',
          last: 'Cage',
          obj: {
            foo: 'bar'
          }
        }
      }],
      columns: [{
        data: 'name.last'
      }, {
        data: 'name.obj.foo'
      }],
      manualColumnMove: true
    });

    getPlugin('manualColumnMove').moveColumn(1, 0);
    await render();

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('');

    await keyDownUp('enter');

    expect(getDataAtCell(0, 0)).toEqual('');

    await selectCell(1, 1);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('Cage');

    await keyDownUp('enter');

    expect(getDataAtCell(1, 1)).toEqual('Cage');
  });

  it('should render array value defined by columns settings in textarea', async() => {
    handsontable({
      data: [
        ['', 'Kia'],
        ['2012', 10],
        ['2013', 10],
      ],
      columns: [{
        data: '1'
      }, {
        data: '0'
      }],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('Kia');

    await selectCell(1, 1);
    await keyDownUp('enter');

    expect(keyProxy().val()).toEqual('2012');
  });

  it('should open editor after hitting F2', async() => {
    handsontable();

    await selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    await keyDownUp('f2');

    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor after hitting any other printable character', async() => {
    handsontable();

    await selectCell(2, 2);

    expect(isEditorVisible()).toBe(false);

    await keyDownUp('z');

    expect(isEditorVisible()).toBe(true);

    await keyDownUp('escape');

    expect(isEditorVisible()).toBe(false);

    await keyDownUp('1');

    expect(isEditorVisible()).toBe(true);
  });

  it('should not open editor after hitting any other printable character when header is highlighted', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
    });

    expect(await selectCell(-1, 2)).toBe(true);
    expect(isEditorVisible()).toBe(false);

    await keyDownUp('z');

    expect(isEditorVisible()).toBe(false);

    expect(await selectCell(2, -1)).toBe(true);
    expect(isEditorVisible()).toBe(false);

    await keyDownUp('1');

    expect(isEditorVisible()).toBe(false);

    expect(await selectCell(-1, -1)).toBe(true);
    expect(isEditorVisible()).toBe(false);

    await keyDownUp('.');

    expect(isEditorVisible()).toBe(false);
  });

  it('should close editor after hitting ESC', async() => {
    handsontable();

    await selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    await keyDownUp('f2');

    expect(isEditorVisible()).toEqual(true);

    await keyDownUp('escape');

    expect(isEditorVisible()).toEqual(false);
  });

  it('should NOT open editor after hitting CapsLock', async() => {
    handsontable();

    await selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    await keyDownUp('capslock');

    expect(isEditorVisible()).toEqual(false);
  });

  it('should open editor after cancelling edit and beginning it again', async() => {
    handsontable();

    await selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    await keyDownUp('f2');

    expect(isEditorVisible()).toEqual(true);

    await keyDownUp('escape');

    expect(isEditorVisible()).toEqual(false);

    await keyDownUp('f2');

    expect(isEditorVisible()).toEqual(true);
  });

  it('loadData should not destroy editor', async() => {
    handsontable();

    await selectCell(2, 2);
    await keyDownUp('f2');

    await loadData(getData());

    expect(isEditorVisible()).toEqual(true);
  });

  it('updateSettings should not destroy editor', async() => {
    handsontable();

    await selectCell(2, 2);
    await keyDownUp('f2');

    await updateSettings({
      data: getData()
    });

    expect(isEditorVisible()).toEqual(true);
  });

  it('textarea should have cell dimensions (after render)', async() => {
    const data = [
      ['a', 'b'],
      ['c', 'd']
    ];

    handsontable({
      data,
      minRows: 4,
      minCols: 4,
      minSpareRows: 4,
      minSpareCols: 4,
      enterMoves: false
    });

    await selectCell(1, 1);

    const $td = getHtCore().find('tbody tr:eq(1) td:eq(1)');

    await keyDownUp('enter');

    expect(keyProxy().width()).toEqual($td.width());

    await keyDownUp('enter');

    data[1][1] = 'dddddddddddddddddddd';
    await render();

    await keyDownUp('enter');

    expect(keyProxy().width()).toEqual($td.width());
  });

  it('global shortcuts (like CTRL+A) should be blocked when cell is being edited', async() => {
    handsontable();

    await selectCell(2, 2);
    await keyDownUp('enter');
    await keyDownUp(['control', 'a']); // CTRL+A should NOT select all table when cell is edited

    const selection = getSelected();

    expect(selection).toEqual([[2, 2, 2, 2]]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor after double clicking on a cell', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2)
    });

    await selectCell(0, 0);

    await simulateClick(getCell(0, 0));
    await sleep(100);

    await simulateClick(getCell(0, 0));
    await sleep(100);

    const editor = getActiveEditor();

    expect(editor.isOpened()).toBe(true);
    expect(editor.isInFullEditMode()).toBe(true);
  });

  it('should not open editor after double clicking on a cell using the middle mouse button', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2)
    });

    await selectCell(0, 0);

    await simulateClick(getCell(0, 0), 'MMB');
    await sleep(100);

    await simulateClick(getCell(0, 0), 'MMB');
    await sleep(100);

    const editor = getActiveEditor();

    expect(editor.isOpened()).toBe(false);
    expect(editor.isInFullEditMode()).toBe(false);
  });

  it('should not open editor after double clicking on a cell using the right mouse button', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2)
    });

    await selectCell(0, 0);

    await simulateClick(getCell(0, 0), 'RMB');
    await sleep(100);

    await simulateClick(getCell(0, 0), 'RMB');
    await sleep(100);

    const editor = getActiveEditor();

    expect(editor.isOpened()).toBe(false);
    expect(editor.isInFullEditMode()).toBe(false);
  });

  it('should call editor focus() method after opening an editor', async() => {
    handsontable();

    await selectCell(2, 2);

    const editor = getActiveEditor();

    spyOn(editor, 'focus');

    expect(editor.isOpened()).toEqual(false);
    expect(editor.focus).not.toHaveBeenCalled();

    await keyDownUp('f2');

    expect(editor.isOpened()).toEqual(true);
    expect(editor.focus).toHaveBeenCalled();
  });

  it('editor size should not exceed the viewport after text edit', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      width: 200,
      height: 200
    });

    await selectCell(2, 2);
    await keyDownUp('enter');

    expect(isEditorVisible()).toEqual(true);

    document.activeElement.value = 'Very very very very very very very very very very very very very ' +
      'very very very very long text';

    await keyDownUp(' '); // space - trigger textarea resize

    const $textarea = $(document.activeElement);
    const $wtHider = spec().$container.find('.wtHider');

    expect($textarea.offset().left + $textarea.outerWidth())
      .not.toBeGreaterThan($wtHider.offset().left + spec().$container.outerWidth());
    expect($textarea.offset().top + $textarea.outerHeight())
      .not.toBeGreaterThan($wtHider.offset().top + $wtHider.outerHeight());
  });

  it('should open editor after selecting cell in another table and hitting enter', async() => {
    spec().$container2 = $('<div id="testContainer-2"></div>').appendTo('body');

    const hot1 = handsontable();
    const hot2 = handsontable2.call(this);

    spec().$container.find('tbody tr:eq(0) td:eq(0)').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(0)').simulate('mouseup');

    // Open editor in HOT1
    await keyDownUp('enter');

    expect(isEditorVisible($(hot1.getActiveEditor().TEXTAREA))).toBe(true);

    // Close editor in HOT1
    await keyDownUp('enter');

    expect(isEditorVisible($(hot1.getActiveEditor().TEXTAREA))).toBe(false);

    spec().$container2.find('tbody tr:eq(0) td:eq(0)').simulate('mousedown');
    spec().$container2.find('tbody tr:eq(0) td:eq(0)').simulate('mouseup');

    expect(hot1.getSelected()).toBeUndefined();
    expect(hot2.getSelected()).toEqual([[0, 0, 0, 0]]);

    // Open editor in HOT2
    await keyDownUp('enter');

    expect(isEditorVisible($(hot2.getActiveEditor().TEXTAREA))).toBe(true);

    spec().$container2.handsontable('destroy');
    spec().$container2.remove();

    function handsontable2(options) {
      const container = spec().$container2;

      container.handsontable(options);
      container[0].focus(); // otherwise TextEditor tests do not pass in IE8

      return container.data('handsontable');
    }
  });

  it('should open editor after pressing a printable character', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3)
    });

    await selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    await keyDownUp('a');

    expect(isEditorVisible()).toBe(true);
  });

  it('should open editor after pressing a printable character with shift key', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3)
    });

    await selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    await keyDownUp(['shift', 'a']);

    expect(isEditorVisible()).toBe(true);
  });

  it('should be able to open editor after clearing cell data with DELETE', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3)
    });

    await selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    await keyDownUp('delete');
    await keyDownUp('a');

    expect(isEditorVisible()).toBe(true);
  });

  it('should be able to open editor after clearing cell data with BACKSPACE', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3)
    });

    await selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    await keyDownUp('backspace');
    await keyDownUp('a');

    expect(isEditorVisible()).toBe(true);
  });

  it('should scroll editor to a cell, if trying to edit cell that is outside of the viewport', async() => {
    handsontable({
      data: createSpreadsheetData(20, 20),
      width: 100,
      height: 50,
    });

    await selectCell(0, 0);

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();

    await scrollViewportTo({ row: 19, col: 19 });

    expect(getCell(0, 0)).toBeNull();
    expect(getCell(19, 19)).not.toBeNull();

    await keyDownUp('enter');

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();
  });

  it('should scroll editor to a cell, if trying to edit cell that is outside of the viewport (multi-cells selection)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 20),
      width: 150,
      height: 100
    });

    await listen();

    await selectCells([[0, 3, 75, 3]]);

    expect(getCell(0, 3)).not.toBeNull();

    await keyDownUp('F2');

    expect(getCell(0, 3)).not.toBeNull();
    expect(isEditorVisible()).toBeTruthy();
  });

  it('should open empty editor after clearing cell value width BACKSPACE', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    await selectCell(0, 0);
    await keyDownUp('backspace');

    expect(getDataAtCell(0, 0)).toEqual(null);
    expect(getActiveEditor().isOpened()).toBe(false);

    await keyDownUp('enter');

    expect(getActiveEditor().isOpened()).toBe(true);
    expect(getActiveEditor().getValue()).toEqual('');
  });

  it('should open empty editor after clearing cell value width DELETE', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    await selectCell(0, 0);
    await keyDownUp('delete');

    expect(getDataAtCell(0, 0)).toEqual(null);
    expect(getActiveEditor().isOpened()).toBe(false);

    await keyDownUp('enter');

    expect(getActiveEditor().isOpened()).toBe(true);
    expect(getActiveEditor().getValue()).toEqual('');
  });

  it('should not open editor after hitting ALT (#1239)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    await selectCell(0, 0);
    await keyDown(['alt']);

    expect(getActiveEditor().isOpened()).toBe(false);

  });

  it('should open editor at the same coordinates as the edited cell', async() => {
    handsontable({
      data: createSpreadsheetData(16, 8),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    // corner
    await selectCell(1, 1);
    await keyDownUp('enter');

    const $inputHolder = $('.handsontableInputHolder');

    expect($(getCell(1, 1)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    await selectCell(1, 4);
    await keyDownUp('enter');

    expect($(getCell(1, 4)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    await selectCell(4, 1);
    await keyDownUp('enter');

    expect($(getCell(4, 1)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    await selectCell(4, 4);
    await keyDownUp('enter');

    expect($(getCell(4, 4)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 4)).offset().top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell if preventOverflow is set as horizontal after the table had been scrolled', async() => {
    spec().$container[0].style = 'width: 400px';

    handsontable({
      data: createSpreadsheetData(30, 30),
      preventOverflow: 'horizontal',
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      rowHeaders: true,
      colHeaders: true,
      height: 500,
    });

    await scrollViewportHorizontally(100);

    await render();

    // corner
    await selectCell(1, 1);
    await keyDownUp('enter');

    const $inputHolder = $('.handsontableInputHolder');

    expect($(getCell(1, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    await selectCell(1, 4);
    await keyDownUp('enter');

    expect($(getCell(1, 4, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    await selectCell(4, 1);
    await keyDownUp('enter');

    expect($(getCell(4, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    await selectCell(10, 6);
    await keyDownUp('enter');

    expect($(getCell(10, 6, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(10, 6, true)).offset().top).toEqual($inputHolder.offset().top + 1);
  });

  // after refactoring that test it turned out that it won't work. The editor does not move after window scroll.
  xit('editor should move with the page when scrolled with fixed rows and horizontal overflow without a set height', async() => {
    spec().$container[0].style = 'width: 400px';

    handsontable({
      data: createSpreadsheetData(300, 300),
      preventOverflow: 'horizontal',
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      rowHeaders: true,
      colHeaders: true,
    });

    await render();
    await sleep(50);

    // corner
    await scrollWindowBy(300, 300);

    await selectCell(1, 1);
    await keyDownUp('enter');

    await scrollWindowBy(-300, -300);

    const $inputHolder = $('.handsontableInputHolder');

    expect($(getCell(1, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // // top
    await scrollWindowBy(0, 300);

    await selectCell(1, 4);
    await keyDownUp('enter');

    await scrollWindowBy(0, -300);

    expect($(getCell(1, 4, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    await scrollWindowBy(300, 0);

    await selectCell(4, 1);
    await keyDownUp('enter');

    await scrollWindowBy(-300, 0);

    expect($(getCell(4, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    await scrollWindowBy(300, 300);

    await selectCell(10, 6);
    await keyDownUp('enter');

    await scrollWindowBy(-300, -300);

    expect($(getCell(10, 6, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(10, 6, true)).offset().top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (corner)', async() => {
    handsontable({
      data: createSpreadsheetData(16, 8),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    await scrollViewportVertically(100);
    await scrollViewportHorizontally(100);

    await render();
    // corner
    await selectCell(1, 1);

    const currentCell = getCell(1, 1, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    await keyDownUp('enter');

    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (top)', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    await scrollViewportVertically(500);
    await scrollViewportHorizontally(500);

    // top
    await selectCell(1, 6);

    const currentCell = getCell(1, 6, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;
    const $inputHolder = $('.handsontableInputHolder');

    await keyDownUp('enter');

    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (left)', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    await scrollViewportVertically(500);
    await scrollViewportHorizontally(500);

    await selectCell(6, 1);

    const currentCell = getCell(6, 1, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    await keyDownUp('enter');

    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (non-fixed)', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    await scrollViewportVertically(500);
    await scrollViewportHorizontally(500);

    await render();

    // non-fixed
    await selectCell(7, 7);

    const currentCell = getCell(7, 7, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    await keyDownUp('enter');

    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same backgroundColor as the edited cell', async() => {
    handsontable({
      data: [
        ['', 5, 12, 13]
      ],
      renderer(hotInstance, td, row, col, prop, value) {
        if (!value || value === '') {
          td.style.background = '#EEE';
        }
      }
    });

    await mouseDoubleClick(getCell(0, 0));

    expect($('.handsontableInput')[0].style.backgroundColor).toEqual('rgb(238, 238, 238)');

    await mouseDoubleClick(getCell(0, 1));

    expect($('.handsontableInput')[0].style.backgroundColor).toEqual('');

    await mouseDoubleClick(getCell(0, 2));

    expect($('.handsontableInput')[0].style.backgroundColor).toEqual('');
  });

  it('should display editor with the proper size, when the edited column is beyond the tables container', async() => {
    spec().$container.css('overflow', '');
    handsontable({
      data: createSpreadsheetData(3, 9)
    });

    await selectCell(0, 7);
    await keyDownUp('enter');

    expect(Handsontable.dom.outerWidth(getActiveEditor().TEXTAREA))
      .toBeAroundValue(Handsontable.dom.outerWidth(getCell(0, 7)));
  });

  it('should display editor with the proper size, when editing a last row after the table is scrolled to the bottom', async() => {
    handsontable({
      data: createSpreadsheetData(3, 8),
      minSpareRows: 1,
      height: 100
    });

    await selectCell(0, 2);
    await keyDownUp('enter');

    const regularHeight = Handsontable.dom.outerHeight(getActiveEditor().TEXTAREA);

    await selectCell(3, 2);
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');

    // lame check, needs investigating why sometimes it leaves 2px error
    if (Handsontable.dom.outerHeight(getActiveEditor().TEXTAREA) === regularHeight) {
      expect(Handsontable.dom.outerHeight(getActiveEditor().TEXTAREA)).toEqual(regularHeight);
    } else {
      expect(Handsontable.dom.outerHeight(getActiveEditor().TEXTAREA)).toEqual(regularHeight - 2);
    }

  });

  it('should insert new line on caret position when pressing ALT + ENTER, CTRL + ENTER or META + ENTER', async() => {
    const data = [
      ['Maserati', 'Mazda'],
      ['Honda', 'Mini']
    ];

    handsontable({
      data
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const $editorInput = $('.handsontableInput');

    Handsontable.dom.setCaretPosition($editorInput[0], 2);

    await keyDownUp(['alt', 'enter']);

    expect(getActiveEditor().TEXTAREA.value).toEqual('Ma\nserati');

    await keyDownUp(['control', 'enter']);

    expect(getActiveEditor().TEXTAREA.value).toEqual('Ma\n\nserati');

    await keyDownUp(['meta', 'enter']);

    expect(getActiveEditor().TEXTAREA.value).toEqual('Ma\n\n\nserati');
  });

  it('should be displayed and resized properly, so it doesn\'t exceed the viewport dimensions', async() => {
    const data = [
      ['', '', '', '', ''],
      ['', 'The Dude abides. I don\'t know about you but I take comfort in that. ' +
            'It\'s good knowin\' he\'s out there. The ' +
           'Dude. Takin\' \'er easy for all us sinners. Shoosh. I sure hope he makes the finals.', '', '', ''],
      ['', '', '', '', '']
    ];

    handsontable({
      data,
      colWidths: 40,
      width: 300,
      height: 200,
      minSpareRows: 20,
      minSpareCols: 20
    });

    await selectCell(1, 1);
    await sleep(10); // for some reason the sleep is needed here
    await keyDownUp('enter');

    const $editorInput = $('.handsontableInput');
    const $editedCell = $(getCell(1, 1));

    expect($editorInput.outerWidth())
      .toEqual(tableView()._wt.wtTable.holder.clientWidth - $editedCell.position().left + 1);

    await scrollViewportTo({ col: 3 });

    expect($editorInput.width() + $editorInput.offset().left)
      .toBeLessThan(tableView()._wt.wtTable.holder.clientWidth);
  });

  it('should resize editor to properly size after focus', async() => {
    const data = [
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', 'sadiasdoadoajdoasjdoij doi ajdoiasjdasoidasoid'],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
    ];

    handsontable({
      data,
      colWidths: 40,
      rowHeights: 25,
      width: 500,
      height: 220
    });

    await selectCell(4, 10);
    await keyDownUp('enter');

    const $editorInput = $('.handsontableInput');

    expect($editorInput.height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(83);
      main.toBe(95);
      horizon.toBe(61);
    });
  });

  it('allow scrolling the editor if its content exceeds the viewport height', async() => {
    spec().$container[0].style.width = '';
    spec().$container[0].style.height = '';
    spec().$container[0].style.overflow = '';

    handsontable({
      data: createSpreadsheetData(4, 4),
      wordWrap: false,
      height: 250
    });

    await setDataAtCell(2, 2, `\
    The Dude abides...

    I don't know about you, but I take
    comfort in that. It's good knowin'
    he's out there, the Dude, takin'
    her easy for all us sinners.
    Shoosh. I sure hope he makes The
    finals. Welp, that about does her,
    wraps her all up. Things seem to've
    worked out pretty good for the
    Dude'n Walter, and it was a purt
    good story, dontcha think? Made me
    laugh to beat the band. Parts,
    anyway. I didn't like seein' Donny
    go. But then, I happen to know that
    there's a little Lebowski on the
    way. I guess that's the way the
    whole durned human comedy keeps
    perpetuatin' it-self, down through
    the generations, westward the
    wagons, across the sands a time
    until we-- aw, look at me, I'm
    ramblin' again. Wal, uh hope you
    folks enjoyed yourselves.
    `);

    await selectCell(2, 2);
    await keyDownUp('enter');

    const textareaElement = document.querySelector('textarea.handsontableInput');

    expect(textareaElement.style.overflowY).toEqual('visible');
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality.
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
    handsontable({
      data: [['']],
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

    getActiveEditor().TEXTAREA.value = 'a';

    await keyDownUp('a');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 'ab';

    await keyDownUp('b');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 'abc';

    await keyDownUp('c');

    expect(document.activeElement).toBe(activeElement);
  });

  it('should not throw an exception when window.attachEvent is defined but the text area does not have attachEvent', async() => {
    handsontable();

    window.attachEvent = true;
    await selectCell(1, 1);

    expect(() => {
      getActiveEditor().autoResize.init(getActiveEditor().TEXTAREA);
    }).not.toThrow();
  });

  it('should keep editor open, focusable and with untouched value when allowInvalid is set as false', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      allowInvalid: false,
      validator(val, cb) {
        cb(false);
      },
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    destroyEditor();
    document.activeElement.value = '999';

    await sleep(10);

    expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor().TEXTAREA.value).toBe('999');

    await keyDownUp('enter');

    expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor().TEXTAREA.value).toBe('999');

    const cell = $(getCell(1, 1));

    await mouseDown(cell);
    await mouseUp(cell);
    await mouseDown(cell);
    await mouseUp(cell);

    expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor().TEXTAREA.value).toBe('999');
  });

  it('should not prepare editor after the close editor and selecting the read-only cell', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      columns: [
        { readOnly: true },
        {}
      ]
    });

    await selectCell(0, 1);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(getActiveEditor()).not.toBe(undefined);

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(getActiveEditor()).toBe(undefined);
  });

  it('should not prepare editor after the close editor and selecting the hidden cell', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(1, true);
    await render();

    await selectCell(0, 0);
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(getActiveEditor()).not.toBe(undefined);

    await selectCell(1, 0); // select hidden row
    await keyDownUp('enter');

    expect(getActiveEditor()).toBe(undefined);
  });

  it('should clear the active editor instance after the cell is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 0);

    expect(getActiveEditor()).not.toBe(undefined);

    // while the editor was prepared hide the editor's cell
    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(1, true);

    await render();
    await keyDownUp('enter');

    expect(getActiveEditor()).toBe(undefined);
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'text',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  it('should be possible to continue editing while the new row above the cell is added', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('insert_row_above', 0, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 3,1 to: 3,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
    expect(getDataAtCell(3, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the new row below the cell is added', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('insert_row_below', 1, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);
    expect(getDataAtCell(1, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the row above the edited cell is deleted', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('remove_row', 0);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getDataAtCell(0, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the row below the edited cell is deleted', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('remove_row', 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getDataAtCell(1, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should close the editor and do not accept the new value when the row of the edited cell is deleted', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('remove_row', 1);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    expect(getActiveEditor().isOpened()).toBe(false);
    expect(getDataAtCell(0, 1)).toBe('B1');
  });

  it('should be possible to continue editing while the new column on the left of the cell is added', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('insert_col_start', 0, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,3']);
    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: 2,3 to: 2,3']);
    expect(getDataAtCell(1, 3)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the new column on the right of the cell is added', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('insert_col_end', 1, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);
    expect(getDataAtCell(1, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the column on the left of the edited cell is removed', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('remove_col', 0);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
    expect(getDataAtCell(1, 0)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the column on the right of the edited cell is removed', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('remove_col', 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);
    expect(getDataAtCell(1, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should close the editor and do not accept the new value when the column of the edited cell is deleted', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(1, 1);
    await keyDownUp('enter');

    getActiveEditor().setValue('test');

    await alter('remove_col', 1);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    expect(getActiveEditor().isOpened()).toBe(false);
    expect(getDataAtCell(1, 0)).toBe('A2');
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        type: 'text',
        imeFastEdit: true,
      });

      await selectCell(0, 0, 0, 0, true, false);

      // The `imeFastEdit` timeout is set to 50ms.
      await sleep(55);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
