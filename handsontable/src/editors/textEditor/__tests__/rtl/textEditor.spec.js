describe('TextEditor (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: hidden;"></div>`)
      .appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      editor: 'text',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
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

    keyDown('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
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

    keyDown('enter');

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
          type: 'text',
        },
        {},
      ],
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDown('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      type: 'text',
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDown('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    selectCell(0, 1);
    keyDown('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

    selectCell(0, 2);
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    selectCell(0, 3);
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    selectCell(0, 4);
    keyDown('enter');

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
          type: 'text',
        },
        {},
      ],
    });

    selectCell(1, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDown('enter');

    // First renderable row index.
    expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

    keyDown('enter');
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'right overlay is enabled and the first column of the overlay is hidden', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
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

    keyDown('enter');

    // First renderable column index.
    expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

    selectCell(0, 2);
    keyDown('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    selectCell(0, 3);
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    selectCell(0, 4);
    keyDown('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should change editor\'s CSS properties during switching to being visible', () => {
    handsontable({
      editor: 'text',
    });

    selectCell(0, 0);
    keyDownUp('enter');

    const cell = getCell(0, 0);
    const master = getMaster();
    const cellOffsetTop = cell.offsetTop;
    const cellOffsetLeft = cell.offsetLeft + master.find('.wtHider').position().left;
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

  it('should render textarea editor in specified size at cell 0, 0 without headers', async() => {
    const hot = handsontable();

    selectCell(0, 0);
    keyDown('enter');

    await sleep(200);

    expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('23px');
    expect(hot.getActiveEditor().TEXTAREA.style.width).toBe('40px');
  });

  it('should render textarea editor in specified size at cell 1, 0 without headers', async() => {
    const hot = handsontable();

    selectCell(1, 1);
    keyDown('enter');

    await sleep(200);

    expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('23px');
  });

  it('should render textarea editor in specified size at cell 0, 0 with headers', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true
    });

    selectCell(0, 0);
    keyDown('enter');

    await sleep(200);

    expect(getActiveEditor().TEXTAREA.style.height).toBe('23px');
    expect(getActiveEditor().TEXTAREA.style.width).toBe('40px');
  });

  it('should render textarea editor in specified size at cell 0, 0 when headers are selected', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true
    });

    selectAll();
    listen();
    keyDown('enter');

    await sleep(200);

    expect(getActiveEditor().TEXTAREA.style.height).toBe('23px');
    expect(getActiveEditor().TEXTAREA.style.width).toBe('40px');
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
    keyDown('enter');

    await sleep(200);

    expect(parseInt(hot.getActiveEditor().TEXTAREA.style.width, 10)).toBeAroundValue(41, 1);
    expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('23px');
    expect(hot.getActiveEditor().textareaParentStyle.top).toBe('26px');
  });

  it('should hide editor when quick navigation by click scrollbar was triggered', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    setDataAtCell(2, 2, 'string\nstring\nstring');
    selectCell(2, 2);

    keyDown('enter');
    keyUp('enter');
    hot.scrollViewportTo(49);

    await sleep(100);

    expect(isEditorVisible()).toBe(false);
  });

  it('should render textarea editor in specified height (single line)', (done) => {
    const hot = handsontable();

    setDataAtCell(2, 2, 'first line');
    selectCell(2, 2);

    keyDown('enter');

    setTimeout(() => {
      expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('23px');
      done();
    }, 200);
  });

  it('should render textarea editor in specified height (multi line)', (done) => {
    const hot = handsontable();

    setDataAtCell(2, 2, 'first line\n second line\n third line...');
    selectCell(2, 2);

    keyDown('enter');

    setTimeout(() => {
      expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('64px');
      done();
    }, 200);
  });

  it('editor size should not exceed the viewport after text edit', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 5),
      width: 200,
      height: 200
    });

    selectCell(2, 2);

    keyDown('enter');

    expect(isEditorVisible()).toEqual(true);

    document.activeElement.value = 'Very very very very very very very very very very very very very ' +
      'very very very very long text';
    keyDownUp(32); // space - trigger textarea resize

    const $textarea = $(document.activeElement);
    const $wtHider = spec().$container.find('.wtHider');

    expect($textarea.offset().left + $textarea.outerWidth())
      .not.toBeGreaterThan($wtHider.offset().left + spec().$container.outerWidth());
    expect($textarea.offset().top + $textarea.outerHeight())
      .not.toBeGreaterThan($wtHider.offset().top + $wtHider.outerHeight());
  });

  it('should scroll editor to a cell, if trying to edit cell that is outside of the viewport', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(20, 20),
      width: 100,
      height: 50
    });

    selectCell(0, 0);

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();

    hot.view.scrollViewport({ row: 19, col: 19 });
    hot.render();

    expect(getCell(0, 0)).toBeNull();
    expect(getCell(19, 19)).not.toBeNull();

    keyDown('enter');

    expect(getCell(0, 0)).not.toBeNull();
    expect(getCell(19, 19)).toBeNull();
  });

  it('should open editor at the same coordinates as the edited cell', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(16, 8),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const mainHolder = hot.view._wt.wtTable.holder;

    // corner
    selectCell(1, 1);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    const $inputHolder = $('.handsontableInputHolder');

    expect($(getCell(1, 1)).offset().left).toEqual($inputHolder.offset().left);
    expect($(getCell(1, 1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    selectCell(1, 4);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(1, 4)).offset().left).toEqual($inputHolder.offset().left);
    expect($(getCell(1, 4)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    selectCell(4, 1);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(4, 1)).offset().left).toEqual($inputHolder.offset().left);
    expect($(getCell(4, 1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    selectCell(4, 4);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(4, 4)).offset().left).toEqual($inputHolder.offset().left);
    expect($(getCell(4, 4)).offset().top).toEqual($inputHolder.offset().top + 1);

    $(mainHolder).scrollTop(1000);
  });

  it('should open editor at the same coordinates as the edited cell if preventOverflow is set as horizontal after the table had been scrolled', async() => {
    spec().$container[0].style = 'width: 400px';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(30, 30),
      preventOverflow: 'horizontal',
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      rowHeaders: true,
      colHeaders: true,
      height: 500,
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder.scrollTop(100);
    $holder.scrollLeft(-100);

    hot.render();

    await sleep(50);
    // corner
    selectCell(1, 1);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    const $inputHolder = $('.handsontableInputHolder');

    expect($(getCell(1, 1, true)).offset().left).toEqual($inputHolder.offset().left);
    expect($(getCell(1, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    selectCell(1, 4);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(1, 4, true)).offset().left).toEqual($inputHolder.offset().left);
    expect($(getCell(1, 4, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    selectCell(4, 1);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(4, 1, true)).offset().left).toEqual($inputHolder.offset().left);
    expect($(getCell(4, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    selectCell(10, 6);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(10, 6, true)).offset().left).toEqual($inputHolder.offset().left);
    expect($(getCell(10, 6, true)).offset().top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (corner)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(16, 8),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder.scrollTop(100);
    $holder.scrollLeft(-100);

    hot.render();

    // corner
    selectCell(1, 1);
    const currentCell = hot.getCell(1, 1, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect(left).toEqual($inputHolder.offset().left);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (top)', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder[0].scrollTop = 500;
    await sleep(100);
    $holder[0].scrollLeft = -500;

    await sleep(100);
    // top
    selectCell(1, 6);

    await sleep(100);

    const currentCell = hot.getCell(1, 6, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;
    const $inputHolder = $('.handsontableInputHolder');

    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    expect(left).toEqual($inputHolder.offset().left);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (right)', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder.scrollTop(500);
    $holder.scrollLeft(-500);

    await sleep(100);

    selectCell(6, 1);

    await sleep(100);

    const currentCell = hot.getCell(6, 1, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect(left).toEqual($inputHolder.offset().left);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (non-fixed)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsStart: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view._wt.wtTable.holder);

    $holder.scrollTop(500);
    $holder.scrollLeft(-500);

    hot.render();

    // non-fixed
    selectCell(7, 7);
    const currentCell = hot.getCell(7, 7, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');

    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect(left).toEqual($inputHolder.offset().left);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should display editor with the proper size, when the edited column is beyond the tables container', () => {
    spec().$container.css('overflow', '');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 9)
    });

    selectCell(0, 7);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    expect(Handsontable.dom.outerWidth(hot.getActiveEditor().TEXTAREA))
      .toBeAroundValue(Handsontable.dom.outerWidth(hot.getCell(0, 7)));
  });

  it('should display editor with the proper size, when editing a last row after the table is scrolled to the bottom', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 8),
      minSpareRows: 1,
      height: 100
    });

    selectCell(0, 2);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    const regularHeight = Handsontable.dom.outerHeight(hot.getActiveEditor().TEXTAREA);

    selectCell(3, 2);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    // lame check, needs investigating why sometimes it leaves 2px error
    if (Handsontable.dom.outerHeight(hot.getActiveEditor().TEXTAREA) === regularHeight) {
      expect(Handsontable.dom.outerHeight(hot.getActiveEditor().TEXTAREA)).toEqual(regularHeight);
    } else {
      expect(Handsontable.dom.outerHeight(hot.getActiveEditor().TEXTAREA)).toEqual(regularHeight - 2);
    }

  });
});
