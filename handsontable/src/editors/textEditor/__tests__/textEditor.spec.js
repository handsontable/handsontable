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

  it('should render an editor in specified position at cell 0, 0', () => {
    handsontable({
      columns: [
        {
          type: 'text',
        }
      ],
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor with proper width when body is a grid element', () => {
    document.body.style.display = 'grid';

    handsontable({
      columns: [
        {
          type: 'text',
        }
      ],
    });

    selectCell(0, 0);
    keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');

    document.body.style.display = '';
  });

  it('should render an editor with proper width when body is an inline-grid element', () => {
    document.body.style.display = 'inline-grid';

    handsontable({
      columns: [
        {
          type: 'text',
        }
      ],
    });

    selectCell(0, 0);
    keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');

    document.body.style.display = '';
  });

  it('should render an editor with proper width when body is a flex element', () => {
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';

    handsontable({
      columns: [
        {
          type: 'text',
        }
      ],
    });

    selectCell(0, 0);
    keyDownUp('enter');

    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');

    document.body.style.display = '';
    document.body.style.flexDirection = '';
  });

  it('should render an editor in specified position at cell 0, 0 when all headers are selected', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      columns: [
        {
          type: 'text',
        }
      ],
    });

    selectAll();
    listen();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('F2');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it.forTheme('classic')('should render an editor in specified position while opening an editor ' +
    'from top to bottom when top and bottom overlays are enabled', () => {
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

  it.forTheme('main')('should render an editor in specified position while opening an editor from top to bottom when ' +
    'top and bottom overlays are enabled', () => {
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
      data: createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      type: 'text',
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
      editor: 'text'
    });

    selectCell(0, 0);
    keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should begin editing when enterBeginsEditing equals true', () => {
    handsontable({
      enterBeginsEditing: true,
      editor: 'text'
    });
    selectCell(2, 2);

    keyDownUp('enter');

    const selection = getSelected();

    expect(selection).toEqual([[2, 2, 2, 2]]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor, close it and move down after editing when the selection is single', () => {
    handsontable({
      editor: 'text'
    });
    selectCell(2, 2);

    keyDownUp('enter');
    keyDownUp('enter');

    expect(isEditorVisible()).toEqual(false);
    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 3,2']);
  });

  it('should not open editor and move down after hit ENTER key when the multiple cells are selected', () => {
    handsontable({
      editor: 'text'
    });
    selectCell(2, 2, 3, 2);

    keyDownUp('enter');

    expect(isEditorVisible()).toEqual(false);
    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 2,2 to: 3,2']);
  });

  it('should open editor and move down after hit F2 key when the multiple cells are selected', () => {
    handsontable({
      editor: 'text'
    });
    selectCell(2, 2, 3, 2);

    keyDownUp('F2');

    expect(isEditorVisible()).toEqual(true);

    keyDownUp('enter');

    expect(isEditorVisible()).toEqual(false);
    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 2,2 to: 3,2']);
  });

  it('should move down after editing when the selection is single', () => {
    handsontable({
      editor: 'text'
    });
    selectCell(2, 2);

    keyDownUp('enter');
    keyDownUp('enter');

    const selection = getSelected();

    expect(selection).toEqual([[3, 2, 3, 2]]);
  });

  it('should move down when enterBeginsEditing equals false', () => {
    handsontable({
      enterBeginsEditing: false
    });
    selectCell(2, 2);

    keyDownUp('enter');

    const selection = getSelected();

    expect(selection).toEqual([[3, 2, 3, 2]]);
    expect(isEditorVisible()).toEqual(false);
  });

  it('should create editor holder after cell selection', () => {
    handsontable({
      editor: 'text',
    });

    const container = spec().$container;

    expect(container.find('.handsontableInputHolder').length).toBe(0);

    selectCell(0, 0);

    expect(container.find('.handsontableInputHolder').length).toBe(1);
  });

  it('should prepare editor with proper styles after selection', () => {
    handsontable({
      editor: 'text',
    });

    selectCell(1, 1);

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

  it('should change editor\'s CSS properties during switching to being visible', () => {
    handsontable({
      editor: 'text',
    });

    selectCell(0, 0);
    keyDownUp('enter');

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

  it('should change editor\'s z-index properties during switching to overlay where editor was open', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      editor: 'text',
      fixedRowsBottom: 2,
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
    });

    // .ht_clone_top_inline_start_corner
    selectCell(0, 0);
    keyDownUp('enter');

    const handsontableInputHolder = spec().$container.find('.handsontableInputHolder');

    expect(handsontableInputHolder.css('zIndex')).toBe('180');

    // .ht_clone_inline_start
    selectCell(5, 0);
    keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('120');

    // .ht_clone_bottom_inline_start_corner
    selectCell(9, 0);
    keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('150');

    // .ht_clone_top
    selectCell(0, 5);
    keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('160');

    // .ht_clone_master
    selectCell(2, 2);
    keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('100');

    // .ht_clone_bottom
    selectCell(9, 5);
    keyDownUp('enter');

    expect(handsontableInputHolder.css('zIndex')).toBe('130');
  });

  it('should render string in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, 'string');
    selectCell(2, 2);

    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('string');
  });

  it('should render proper value after cell coords manipulation', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5)
    });

    hot.rowIndexMapper.setIndexesSequence([1, 2, 3, 4, 0]);
    hot.columnIndexMapper.setIndexesSequence([1, 2, 3, 4, 0]);

    selectCell(0, 0);
    getActiveEditor().beginEditing();
    getActiveEditor().refreshValue();

    expect(getActiveEditor().originalValue).toEqual('B2');
  });

  it('should render textarea editor with tabindex=-1 attribute', async() => {
    const hot = handsontable();

    selectCell(0, 0);
    keyDownUp('enter');

    await sleep(10);

    expect(hot.getActiveEditor().TEXTAREA.getAttribute('tabindex')).toBe('-1');
  });

  it('should render textarea editor in specified size at cell 0, 0 without headers', async() => {
    const hot = handsontable();

    selectCell(0, 0);
    keyDownUp('enter');

    await sleep(200);

    expect(hot.getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main }) => {
      classic.toBe('24px');
      main.toBe('29px');
    });
    expect(hot.getActiveEditor().TEXTAREA.style.width).toBe('50px');
  });

  it('should render textarea editor in specified size at cell 1, 0 without headers', async() => {
    const hot = handsontable();

    selectCell(1, 1);
    keyDownUp('enter');

    await sleep(200);

    expect(hot.getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main }) => {
      classic.toBe('24px');
      main.toBe('30px');
    });
  });

  it('should render textarea editor in specified size at cell 0, 0 with headers', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true
    });

    selectCell(0, 0);
    keyDownUp('enter');

    await sleep(200);

    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main }) => {
      classic.toBe('24px');
      main.toBe('30px');
    });
    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');
  });

  it('should render textarea editor in specified size at cell 0, 0 when headers are selected', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true
    });

    selectAll();
    listen();
    keyDownUp('enter');

    await sleep(200);

    expect(getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main }) => {
      classic.toBe('24px');
      main.toBe('30px');
    });
    expect(getActiveEditor().TEXTAREA.style.width).toBe('50px');
  });

  it('should render textarea editor in specified size at cell 0, 0 with headers defined in columns', async() => {
    const hot = handsontable({
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

    selectCell(0, 0);
    keyDownUp('enter');

    await sleep(200);

    expect(parseInt(hot.getActiveEditor().TEXTAREA.style.width, 10)).forThemes(({ classic, main }) => {
      classic.toBeAroundValue(51, 1);
      main.toBeAroundValue(60, 1);
    });
    expect(hot.getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main }) => {
      classic.toBe('24px');
      main.toBe('30px');
    });
    expect(hot.getActiveEditor().textareaParentStyle.top).forThemes(({ classic, main }) => {
      classic.toBe('26px');
      main.toBe('29px');
    });
  });

  it('should hide whole editor when it is higher then header and TD is not rendered anymore', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    setDataAtCell(2, 2, 'string\nstring\nstring');
    selectCell(2, 2);

    keyDownUp('enter');
    keyUp(['enter']);

    const mainHolder = hot.view._wt.wtTable.holder;

    mainHolder.scrollTop = 500;
    mainHolder.scrollLeft = 500;

    await sleep(200);

    expect(parseInt(hot.getActiveEditor().textareaParentStyle.opacity, 10)).toBe(0); // result of textEditor .close()
  });

  it('should hide whole editor when it is higher then header and TD is still rendered', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    setDataAtCell(2, 2, 'string\nstring\nstring');
    selectCell(2, 2);

    keyDownUp('enter');
    keyUp(['enter']);

    const mainHolder = hot.view._wt.wtTable.holder;

    mainHolder.scrollTop = 150;
    mainHolder.scrollLeft = 100;

    await sleep(200);

    expect(parseInt(hot.getActiveEditor().textareaParentStyle.opacity, 10)).toBe(1);
    expect(parseInt(hot.getActiveEditor().textareaParentStyle.top, 10)).forThemes(({ classic, main }) => {
      classic.toBeAroundValue(-77);
      main.toBeAroundValue(-62);
    });
    expect(parseInt(hot.getActiveEditor().textareaParentStyle.left, 10)).toBeAroundValue(50);
  });

  it('should hide editor when quick navigation by click scrollbar was triggered', async() => {
    handsontable({
      data: createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    setDataAtCell(2, 2, 'string\nstring\nstring');
    selectCell(2, 2);

    keyDownUp('enter');
    keyUp(['enter']);
    scrollViewportTo({ row: 49 });

    await sleep(100);

    expect(isEditorVisible()).toBe(false);
  });

  it('should render textarea editor in specified height (single line)', async() => {
    const hot = handsontable();

    setDataAtCell(2, 2, 'first line');
    selectCell(2, 2);

    keyDownUp('enter');

    await sleep(200);

    expect(hot.getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main }) => {
      classic.toBe('24px');
      main.toBe('30px');
    });
  });

  it('should render textarea editor in specified height (multi line)', async() => {
    const hot = handsontable();

    setDataAtCell(2, 2, 'first line\n second line\n third line...');
    selectCell(2, 2);

    keyDownUp('enter');

    await sleep(200);

    expect(hot.getActiveEditor().TEXTAREA.style.height).forThemes(({ classic, main }) => {
      classic.toBe('65px');
      main.toBe('70px');
    });
  });

  it('should render number in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, 13);
    selectCell(2, 2);

    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('13');
  });

  it('should render boolean true in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, true);
    selectCell(2, 2);

    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('true');
  });

  it('should render boolean false in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, false);
    selectCell(2, 2);

    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('false');
  });

  it('should render null in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, null);
    selectCell(2, 2);

    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('');
  });

  it('should render undefined in textarea', () => {
    handsontable();
    setDataAtCell(2, 2);
    selectCell(2, 2);

    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('');
  });

  it('should render nested object value in textarea', () => {
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
    selectCell(0, 0);
    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('Kowalski');

    selectCell(1, 1);
    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('bar');
  });

  it('should render nested object value in textarea after change rows order', () => {
    const hot = handsontable({
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

    hot.getPlugin('manualRowMove').moveRow(1, 0);
    hot.render();

    selectCell(0, 0);
    keyDownUp('enter');
    expect(keyProxy().val()).toEqual('Cage');
    keyDownUp('enter');

    expect(hot.getDataAtCell(0, 0)).toEqual('Cage');

    selectCell(1, 1);
    keyDownUp('enter');
    expect(keyProxy().val()).toEqual('');
    keyDownUp('enter');

    expect(hot.getDataAtCell(1, 1)).toEqual('');
  });

  it('should render nested object value in textarea after change columns order', () => {
    const hot = handsontable({
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

    hot.getPlugin('manualColumnMove').moveColumn(1, 0);
    hot.render();

    selectCell(0, 0);
    keyDownUp('enter');
    expect(keyProxy().val()).toEqual('');
    keyDownUp('enter');

    expect(hot.getDataAtCell(0, 0)).toEqual('');

    selectCell(1, 1);
    keyDownUp('enter');
    expect(keyProxy().val()).toEqual('Cage');
    keyDownUp('enter');

    expect(hot.getDataAtCell(1, 1)).toEqual('Cage');
  });

  it('should render array value defined by columns settings in textarea', () => {
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
    selectCell(0, 0);
    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('Kia');

    selectCell(1, 1);
    keyDownUp('enter');

    expect(keyProxy().val()).toEqual('2012');
  });

  it('should open editor after hitting F2', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    keyDownUp('f2');

    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor after hitting any other printable character', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toBe(false);

    keyDownUp('z');

    expect(isEditorVisible()).toBe(true);

    keyDownUp('escape');

    expect(isEditorVisible()).toBe(false);

    keyDownUp('1');

    expect(isEditorVisible()).toBe(true);
  });

  it('should not open editor after hitting any other printable character when header is highlighted', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
    });

    expect(selectCell(-1, 2)).toBe(true);
    expect(isEditorVisible()).toBe(false);

    keyDownUp('z');

    expect(isEditorVisible()).toBe(false);

    expect(selectCell(2, -1)).toBe(true);
    expect(isEditorVisible()).toBe(false);

    keyDownUp('1');

    expect(isEditorVisible()).toBe(false);

    expect(selectCell(-1, -1)).toBe(true);
    expect(isEditorVisible()).toBe(false);

    keyDownUp('.');

    expect(isEditorVisible()).toBe(false);
  });

  it('should close editor after hitting ESC', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    keyDownUp('f2');

    expect(isEditorVisible()).toEqual(true);

    keyDownUp('escape');

    expect(isEditorVisible()).toEqual(false);
  });

  it('should NOT open editor after hitting CapsLock', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    keyDownUp('capslock');

    expect(isEditorVisible()).toEqual(false);
  });

  it('should open editor after cancelling edit and beginning it again', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);

    keyDownUp('f2');

    expect(isEditorVisible()).toEqual(true);

    keyDownUp('escape');

    expect(isEditorVisible()).toEqual(false);

    keyDownUp('f2');

    expect(isEditorVisible()).toEqual(true);
  });

  it('loadData should not destroy editor', () => {
    handsontable();
    selectCell(2, 2);

    keyDownUp('f2');
    loadData(getData());

    expect(isEditorVisible()).toEqual(true);
  });

  it('updateSettings should not destroy editor', () => {
    handsontable();
    selectCell(2, 2);

    keyDownUp('f2');
    updateSettings({
      data: getData()
    });

    expect(isEditorVisible()).toEqual(true);
  });

  it('textarea should have cell dimensions (after render)', () => {
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

    selectCell(1, 1);
    const $td = getHtCore().find('tbody tr:eq(1) td:eq(1)');

    keyDownUp('enter');
    expect(keyProxy().width()).toEqual($td.width());
    keyDownUp('enter');
    data[1][1] = 'dddddddddddddddddddd';
    render();
    keyDownUp('enter');

    expect(keyProxy().width()).toEqual($td.width());
  });

  it('global shortcuts (like CTRL+A) should be blocked when cell is being edited', () => {
    handsontable();
    selectCell(2, 2);

    keyDownUp('enter');
    keyDownUp(['control', 'a']); // CTRL+A should NOT select all table when cell is edited

    const selection = getSelected();

    expect(selection).toEqual([[2, 2, 2, 2]]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor after double clicking on a cell', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2)
    });
    const cell = $(getCell(0, 0));

    selectCell(0, 0);
    window.scrollTo(0, cell.offset().top);

    await sleep(0);

    cell
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click');

    await sleep(100);

    cell
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click');

    await sleep(100);

    const editor = getActiveEditor();

    expect(editor.isOpened()).toBe(true);
    expect(editor.isInFullEditMode()).toBe(true);
  });

  it('should not open editor after double clicking on a cell using the middle mouse button', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2)
    });
    const cell = $(getCell(0, 0));
    const button = 1;

    selectCell(0, 0);
    window.scrollTo(0, cell.offset().top);

    await sleep(0);

    cell
      .simulate('mousedown', { button })
      .simulate('mouseup', { button })
      .simulate('click', { button })
    ;

    await sleep(100);

    cell
      .simulate('mousedown', { button })
      .simulate('mouseup', { button })
      .simulate('click', { button })
    ;

    await sleep(100);

    const editor = getActiveEditor();

    expect(editor.isOpened()).toBe(false);
    expect(editor.isInFullEditMode()).toBe(false);
  });

  it('should not open editor after double clicking on a cell using the right mouse button', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2)
    });
    const cell = $(getCell(0, 0));
    const button = 2;

    selectCell(0, 0);
    window.scrollTo(0, cell.offset().top);

    await sleep(0);

    cell
      .simulate('mousedown', { button })
      .simulate('mouseup', { button })
      .simulate('click', { button })
    ;

    await sleep(100);

    cell
      .simulate('mousedown', { button })
      .simulate('mouseup', { button })
      .simulate('click', { button })
    ;

    await sleep(100);

    const editor = getActiveEditor();

    expect(editor.isOpened()).toBe(false);
    expect(editor.isInFullEditMode()).toBe(false);
  });

  it('should call editor focus() method after opening an editor', () => {
    const hot = handsontable();

    selectCell(2, 2);

    const editor = hot.getActiveEditor();

    spyOn(editor, 'focus');

    expect(editor.isOpened()).toEqual(false);
    expect(editor.focus).not.toHaveBeenCalled();
    keyDownUp('f2');
    expect(editor.isOpened()).toEqual(true);
    expect(editor.focus).toHaveBeenCalled();
  });

  it('editor size should not exceed the viewport after text edit', () => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      width: 200,
      height: 200
    });

    selectCell(2, 2);

    keyDownUp('enter');

    expect(isEditorVisible()).toEqual(true);

    document.activeElement.value = 'Very very very very very very very very very very very very very ' +
      'very very very very long text';
    keyDownUp(' '); // space - trigger textarea resize

    const $textarea = $(document.activeElement);
    const $wtHider = spec().$container.find('.wtHider');

    expect($textarea.offset().left + $textarea.outerWidth())
      .not.toBeGreaterThan($wtHider.offset().left + spec().$container.outerWidth());
    expect($textarea.offset().top + $textarea.outerHeight())
      .not.toBeGreaterThan($wtHider.offset().top + $wtHider.outerHeight());
  });

  it('should open editor after selecting cell in another table and hitting enter', () => {
    spec().$container2 = $('<div id="testContainer-2"></div>').appendTo('body');

    const hot1 = handsontable();
    const hot2 = handsontable2.call(this);

    spec().$container.find('tbody tr:eq(0) td:eq(0)').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(0)').simulate('mouseup');

    // Open editor in HOT1
    keyDownUp('enter');

    expect(isEditorVisible($(hot1.getActiveEditor().TEXTAREA))).toBe(true);

    // Close editor in HOT1
    keyDownUp('enter');

    expect(isEditorVisible($(hot1.getActiveEditor().TEXTAREA))).toBe(false);

    spec().$container2.find('tbody tr:eq(0) td:eq(0)').simulate('mousedown');
    spec().$container2.find('tbody tr:eq(0) td:eq(0)').simulate('mouseup');

    expect(hot1.getSelected()).toBeUndefined();
    expect(hot2.getSelected()).toEqual([[0, 0, 0, 0]]);

    // Open editor in HOT2
    keyDownUp('enter');

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

  it('should open editor after pressing a printable character', () => {
    handsontable({
      data: createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    keyDownUp('a');

    expect(isEditorVisible()).toBe(true);
  });

  it('should open editor after pressing a printable character with shift key', () => {
    handsontable({
      data: createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    keyDownUp(['shift', 'a']);

    expect(isEditorVisible()).toBe(true);
  });

  it('should be able to open editor after clearing cell data with DELETE', () => {
    handsontable({
      data: createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    keyDownUp('delete');
    keyDownUp('a');

    expect(isEditorVisible()).toBe(true);
  });

  it('should be able to open editor after clearing cell data with BACKSPACE', () => {
    handsontable({
      data: createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    keyDownUp('backspace');
    keyDownUp('a');

    expect(isEditorVisible()).toBe(true);
  });

  it('should scroll editor to a cell, if trying to edit cell that is outside of the viewport', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(20, 20),
      width: 100,
      height: 50,
    });

    selectCell(0, 0);

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();

    hot.view.scrollViewport({ row: 19, col: 19 });
    render();

    expect(getCell(0, 0)).toBeNull();
    expect(getCell(19, 19)).not.toBeNull();

    keyDownUp('enter');
    await sleep(50);

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();
  });

  it('should scroll editor to a cell, if trying to edit cell that is outside of the viewport (multi-cells selection)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 20),
      width: 150,
      height: 100
    });

    selectCells([[0, 3, 75, 3]]);
    listen();

    expect(getCell(0, 3)).toBeNull();

    keyDownUp('F2');

    expect(getCell(0, 3)).not.toBeNull();
    expect(isEditorVisible()).toBeTruthy();
  });

  it('should open empty editor after clearing cell value width BACKSPACE', () => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);

    keyDownUp('backspace');

    expect(getDataAtCell(0, 0)).toEqual(null);
    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDownUp('enter');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toEqual('');
  });

  it('should open empty editor after clearing cell value width DELETE', () => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);

    keyDownUp('delete');

    expect(getDataAtCell(0, 0)).toEqual(null);
    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDownUp('enter');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toEqual('');
  });

  it('should not open editor after hitting ALT (#1239)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);

    keyDown(['alt']);

    expect(hot.getActiveEditor().isOpened()).toBe(false);

  });

  it('should open editor at the same coordinates as the edited cell', () => {
    const hot = handsontable({
      data: createSpreadsheetData(16, 8),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const mainHolder = hot.view._wt.wtTable.holder;

    // corner
    selectCell(1, 1);
    keyDownUp('enter');
    const $inputHolder = $('.handsontableInputHolder');

    expect($(getCell(1, 1)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    selectCell(1, 4);
    keyDownUp('enter');
    expect($(getCell(1, 4)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    selectCell(4, 1);
    keyDownUp('enter');
    expect($(getCell(4, 1)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    selectCell(4, 4);
    keyDownUp('enter');
    expect($(getCell(4, 4)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 4)).offset().top).toEqual($inputHolder.offset().top + 1);

    $(mainHolder).scrollTop(1000);
  });

  it('should open editor at the same coordinates as the edited cell if preventOverflow is set as horizontal after the table had been scrolled', async() => {
    spec().$container[0].style = 'width: 400px';

    const hot = handsontable({
      data: createSpreadsheetData(30, 30),
      preventOverflow: 'horizontal',
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      rowHeaders: true,
      colHeaders: true,
      height: 500,
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder.scrollTop(100);
    $holder.scrollLeft(100);

    hot.render();

    await sleep(50);
    // corner
    selectCell(1, 1);
    keyDownUp('enter');
    const $inputHolder = $('.handsontableInputHolder');

    expect($(getCell(1, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    selectCell(1, 4);
    keyDownUp('enter');
    expect($(getCell(1, 4, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    selectCell(4, 1);
    keyDownUp('enter');
    expect($(getCell(4, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    selectCell(10, 6);
    keyDownUp('enter');
    expect($(getCell(10, 6, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(10, 6, true)).offset().top).toEqual($inputHolder.offset().top + 1);
  });

  it('editor should move with the page when scrolled with fixed rows and horizontal overflow without a set height', async() => {
    spec().$container[0].style = 'width: 400px';

    const hot = handsontable({
      data: createSpreadsheetData(300, 300),
      preventOverflow: 'horizontal',
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      rowHeaders: true,
      colHeaders: true,
    });

    hot.render();

    await sleep(50);
    // corner
    window.scrollBy(300, 300);
    selectCell(1, 1);
    keyDownUp('enter');
    window.scrollBy(-300, -300);
    const $inputHolder = $('.handsontableInputHolder');

    expect($(getCell(1, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    window.scrollBy(0, 300);
    selectCell(1, 4);
    keyDownUp('enter');
    window.scrollBy(0, -300);
    expect($(getCell(1, 4, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    window.scrollBy(300, 0);
    selectCell(4, 1);
    keyDownUp('enter');
    window.scrollBy(-300, 0);
    expect($(getCell(4, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    window.scrollBy(300, 300);
    selectCell(10, 6);
    keyDownUp('enter');
    window.scrollBy(-300, -300);
    expect($(getCell(10, 6, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(10, 6, true)).offset().top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (corner)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(16, 8),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder.scrollTop(100);
    $holder.scrollLeft(100);

    hot.render();

    // corner
    selectCell(1, 1);
    const currentCell = hot.getCell(1, 1, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    keyDownUp('enter');
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (top)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder[0].scrollTop = 500;
    await sleep(100);
    $holder[0].scrollLeft = 500;

    await sleep(100);
    // top
    selectCell(1, 6);

    await sleep(100);

    const currentCell = hot.getCell(1, 6, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;
    const $inputHolder = $('.handsontableInputHolder');

    keyDownUp('enter');

    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (left)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder.scrollTop(500);
    $holder.scrollLeft(500);

    await sleep(100);

    selectCell(6, 1);

    await sleep(100);

    const currentCell = hot.getCell(6, 1, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    keyDownUp('enter');
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (non-fixed)', () => {
    const hot = handsontable({
      data: createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder.scrollTop(500);
    $holder.scrollLeft(500);

    hot.render();

    // non-fixed
    selectCell(7, 7);
    const currentCell = hot.getCell(7, 7, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    keyDownUp('enter');
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

    mouseDoubleClick(getCell(0, 0));

    await sleep(100);

    expect($('.handsontableInput')[0].style.backgroundColor).toEqual('rgb(238, 238, 238)');

    mouseDoubleClick(getCell(0, 1));

    await sleep(100);

    expect($('.handsontableInput')[0].style.backgroundColor).toEqual('');

    mouseDoubleClick(getCell(0, 2));

    await sleep(100);

    expect($('.handsontableInput')[0].style.backgroundColor).toEqual('');
  });

  it('should display editor with the proper size, when the edited column is beyond the tables container', () => {
    spec().$container.css('overflow', '');
    const hot = handsontable({
      data: createSpreadsheetData(3, 9)
    });

    selectCell(0, 7);
    keyDownUp('enter');

    expect(Handsontable.dom.outerWidth(hot.getActiveEditor().TEXTAREA))
      .toBeAroundValue(Handsontable.dom.outerWidth(hot.getCell(0, 7)));
  });

  it('should display editor with the proper size, when editing a last row after the table is scrolled to the bottom', () => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 8),
      minSpareRows: 1,
      height: 100
    });

    selectCell(0, 2);
    keyDownUp('enter');
    const regularHeight = Handsontable.dom.outerHeight(hot.getActiveEditor().TEXTAREA);

    selectCell(3, 2);
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');

    // lame check, needs investigating why sometimes it leaves 2px error
    if (Handsontable.dom.outerHeight(hot.getActiveEditor().TEXTAREA) === regularHeight) {
      expect(Handsontable.dom.outerHeight(hot.getActiveEditor().TEXTAREA)).toEqual(regularHeight);
    } else {
      expect(Handsontable.dom.outerHeight(hot.getActiveEditor().TEXTAREA)).toEqual(regularHeight - 2);
    }

  });

  it('should insert new line on caret position when pressing ALT + ENTER, CTRL + ENTER or META + ENTER', () => {
    const data = [
      ['Maserati', 'Mazda'],
      ['Honda', 'Mini']
    ];

    const hot = handsontable({
      data
    });

    selectCell(0, 0);
    keyDownUp('enter');

    const $editorInput = $('.handsontableInput');

    Handsontable.dom.setCaretPosition($editorInput[0], 2);

    keyDownUp(['alt', 'enter']);

    expect(hot.getActiveEditor().TEXTAREA.value).toEqual('Ma\nserati');

    keyDownUp(['control', 'enter']);

    expect(hot.getActiveEditor().TEXTAREA.value).toEqual('Ma\n\nserati');

    keyDownUp(['meta', 'enter']);

    expect(hot.getActiveEditor().TEXTAREA.value).toEqual('Ma\n\n\nserati');
  });

  it('should be displayed and resized properly, so it doesn\'t exceed the viewport dimensions', () => {
    const data = [
      ['', '', '', '', ''],
      ['', 'The Dude abides. I don\'t know about you but I take comfort in that. ' +
            'It\'s good knowin\' he\'s out there. The ' +
           'Dude. Takin\' \'er easy for all us sinners. Shoosh. I sure hope he makes the finals.', '', '', ''],
      ['', '', '', '', '']
    ];

    const hot = handsontable({
      data,
      colWidths: 40,
      width: 300,
      height: 200,
      minSpareRows: 20,
      minSpareCols: 20
    });

    selectCell(1, 1);
    keyDownUp('enter');

    const $editorInput = $('.handsontableInput');
    const $editedCell = $(hot.getCell(1, 1));

    expect($editorInput.outerWidth())
      .toEqual(hot.view._wt.wtTable.holder.clientWidth - $editedCell.position().left + 1);

    scrollViewportTo({ col: 3 });
    render();

    expect($editorInput.width() + $editorInput.offset().left)
      .toBeLessThan(hot.view._wt.wtTable.holder.clientWidth);
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

    selectCell(4, 10);
    keyDownUp('enter');

    const $editorInput = $('.handsontableInput');

    await sleep(150);

    expect($editorInput.height()).forThemes(({ classic, main }) => {
      classic.toBe(83);
      main.toBe(95);
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

    setDataAtCell(2, 2, `\
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

    selectCell(2, 2);

    await sleep(150);

    keyDownUp('enter');

    const textareaElement = document.querySelector('textarea.handsontableInput');

    await sleep(150);

    expect(textareaElement.style.overflowY).toEqual('visible');
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality.
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
    const hot = handsontable({
      data: [['']],
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

    hot.getActiveEditor().TEXTAREA.value = 'a';
    keyDownUp('a');

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = 'ab';
    keyDownUp('b');

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = 'abc';
    keyDownUp('c');

    expect(document.activeElement).toBe(activeElement);
  });

  it('should not throw an exception when window.attachEvent is defined but the text area does not have attachEvent', () => {
    const hot = handsontable();

    window.attachEvent = true;
    selectCell(1, 1);

    expect(() => {
      hot.getActiveEditor().autoResize.init(hot.getActiveEditor().TEXTAREA);
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
    selectCell(0, 0);

    keyDownUp('enter');
    destroyEditor();
    document.activeElement.value = '999';

    await sleep(10);

    expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor().TEXTAREA.value).toBe('999');

    keyDownUp('enter');

    expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor().TEXTAREA.value).toBe('999');

    const cell = $(getCell(1, 1));

    mouseDown(cell);
    mouseUp(cell);
    mouseDown(cell);
    mouseUp(cell);

    await sleep(10);

    expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor().TEXTAREA.value).toBe('999');
  });

  it('should not prepare editor after the close editor and selecting the read-only cell', () => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      columns: [
        { readOnly: true },
        {}
      ]
    });

    selectCell(0, 1);

    keyDownUp('enter');
    keyDownUp('enter');

    expect(getActiveEditor()).not.toBe(undefined);

    selectCell(0, 0);

    keyDownUp('enter');

    expect(getActiveEditor()).toBe(undefined);
  });

  it('should not prepare editor after the close editor and selecting the hidden cell', () => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
    });

    const hidingMap = hot.rowIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(1, true);
    render();

    selectCell(0, 0);

    keyDownUp('enter');
    keyDownUp('enter');

    expect(getActiveEditor()).not.toBe(undefined);

    selectCell(1, 0); // select hidden row

    keyDownUp('enter');

    expect(getActiveEditor()).toBe(undefined);
  });

  it('should clear the active editor instance after the cell is hidden', () => {
    const hot = handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 0);

    expect(getActiveEditor()).not.toBe(undefined);

    // while the editor was prepared hide the editor's cell
    const hidingMap = hot.rowIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(1, true);
    render();

    keyDownUp('enter');

    expect(getActiveEditor()).toBe(undefined);
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', () => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'text',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  it('should be possible to continue editing while the new row above the cell is added', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('insert_row_above', 0, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 3,1 to: 3,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
    expect(getDataAtCell(3, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the new row below the cell is added', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('insert_row_below', 1, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);
    expect(getDataAtCell(1, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the row above the edited cell is deleted', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('remove_row', 0);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getDataAtCell(0, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the row below the edited cell is deleted', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('remove_row', 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getDataAtCell(1, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should close the editor and do not accept the new value when the row of the edited cell is deleted', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('remove_row', 1);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    expect(getActiveEditor().isOpened()).toBe(false);
    expect(getDataAtCell(0, 1)).toBe('B1');
  });

  it('should be possible to continue editing while the new column on the left of the cell is added', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('insert_col_start', 0, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,3']);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: 2,3 to: 2,3']);
    expect(getDataAtCell(1, 3)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the new column on the right of the cell is added', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('insert_col_end', 1, 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);
    expect(getDataAtCell(1, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the column on the left of the edited cell is removed', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('remove_col', 0);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
    expect(getDataAtCell(1, 0)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should be possible to continue editing while the column on the right of the edited cell is removed', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('remove_col', 2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(getActiveEditor().isOpened()).toBe(true);

    keyDownUp('enter');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);
    expect(getDataAtCell(1, 1)).toBe('test');
    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should close the editor and do not accept the new value when the column of the edited cell is deleted', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    selectCell(1, 1);
    keyDownUp('enter');
    getActiveEditor().setValue('test');

    alter('remove_col', 1);

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

      selectCell(0, 0, 0, 0, true, false);

      // The `imeFastEdit` timeout is set to 50ms.
      await sleep(55);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
