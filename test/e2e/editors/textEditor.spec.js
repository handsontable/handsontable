describe('TextEditor', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: hidden;"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should begin editing when enterBeginsEditing equals true', () => {
    handsontable({
      enterBeginsEditing: true,
      editor: 'text'
    });
    selectCell(2, 2);

    keyDown('enter');

    const selection = getSelected();

    expect(selection).toEqual([[2, 2, 2, 2]]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should move down after editing', () => {
    handsontable({
      editor: 'text'
    });
    selectCell(2, 2);

    keyDown('enter');
    keyDown('enter');

    const selection = getSelected();
    expect(selection).toEqual([[3, 2, 3, 2]]);
  });

  it('should move down when enterBeginsEditing equals false', () => {
    handsontable({
      enterBeginsEditing: false
    });
    selectCell(2, 2);

    keyDown('enter');

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

  it('should render string in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, 'string');
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual('string');
  });

  it('should render proper value after cell coords manipulation', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      modifyRow(row) { return row === 4 ? 0 : row + 1; },
      modifyCol(column) { return column === 4 ? 0 : column + 1; },
    });

    selectCell(0, 0);
    getActiveEditor().beginEditing();
    getActiveEditor().refreshValue();

    expect(getActiveEditor().originalValue).toEqual('B2');
  });

  it('should render textarea editor with tabindex=-1 attribute', async() => {
    const hot = handsontable();

    selectCell(0, 0);
    keyDown('enter');

    await sleep(10);

    expect(hot.getActiveEditor().TEXTAREA.getAttribute('tabindex')).toBe('-1');
  });

  it('should render textarea editor in specified size at cell 0, 0 without headers', (done) => {
    const hot = handsontable();

    selectCell(0, 0);

    keyDown('enter');

    setTimeout(() => {
      expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('23px');
      expect(hot.getActiveEditor().TEXTAREA.style.width).toBe('40px');
      done();
    }, 200);
  });

  it('should render textarea editor in specified size at cell 1, 0 without headers', (done) => {
    const hot = handsontable();

    selectCell(1, 1);

    keyDown('enter');

    setTimeout(() => {
      expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('23px');
      done();
    }, 200);
  });

  it('should render textarea editor in specified size at cell 0, 0 with headers', (done) => {
    const hot = handsontable({
      rowHeaders: true,
      colHeaders: true
    });

    selectCell(0, 0);

    keyDown('enter');

    setTimeout(() => {
      expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('23px');
      expect(hot.getActiveEditor().TEXTAREA.style.width).toBe('40px');
      expect(hot.getActiveEditor().textareaParentStyle.top).toBe('26px');
      done();
    }, 200);
  });

  it('should render textarea editor in specified size at cell 0, 0 with headers defined in columns', (done) => {
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

    setTimeout(() => {
      expect(hot.getActiveEditor().TEXTAREA.style.height).toBe('23px');
      expect(parseInt(hot.getActiveEditor().TEXTAREA.style.width, 10)).toBeAroundValue(50, 4);
      expect(hot.getActiveEditor().textareaParentStyle.top).toBe('26px');
      done();
    }, 200);
  });

  it('should hide whole editor when it is higher then header and TD is not rendered anymore', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    setDataAtCell(2, 2, 'string\nstring\nstring');
    selectCell(2, 2);

    keyDown('enter');
    keyUp('enter');

    const mainHolder = hot.view.wt.wtTable.holder;

    mainHolder.scrollTop = 150;
    mainHolder.scrollLeft = 150;

    await sleep(200);

    expect(parseInt(hot.getActiveEditor().textareaParentStyle.opacity, 10)).toBe(0); // result of textEditor .close()
  });

  it('should hide whole editor when it is higher then header and TD is still rendered', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      rowHeaders: true,
      colHeaders: true
    });

    setDataAtCell(2, 2, 'string\nstring\nstring');
    selectCell(2, 2);

    keyDown('enter');
    keyUp('enter');

    const mainHolder = hot.view.wt.wtTable.holder;

    mainHolder.scrollTop = 150;
    mainHolder.scrollLeft = 100;

    await sleep(200);

    expect(parseInt(hot.getActiveEditor().textareaParentStyle.opacity, 10)).toBe(1);
    expect(parseInt(hot.getActiveEditor().textareaParentStyle.top, 10)).toBeAroundValue(-77);
    expect(parseInt(hot.getActiveEditor().textareaParentStyle.left, 10)).toBeAroundValue(50);
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

  it('should render number in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, 13);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual('13');
  });

  it('should render boolean true in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, true);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual('true');
  });

  it('should render boolean false in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, false);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual('false');
  });

  it('should render null in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, null);
    selectCell(2, 2);

    keyDown('enter');

    expect(keyProxy().val()).toEqual('');
  });

  it('should render undefined in textarea', () => {
    handsontable();
    setDataAtCell(2, 2, void 0);
    selectCell(2, 2);

    keyDown('enter');

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
    keyDown('enter');

    expect(keyProxy().val()).toEqual('Kowalski');

    selectCell(1, 1);
    keyDown('enter');

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
    keyDown('enter');
    expect(keyProxy().val()).toEqual('Cage');
    keyDown('enter');

    expect(hot.getDataAtCell(0, 0)).toEqual('Cage');

    selectCell(1, 1);
    keyDown('enter');
    expect(keyProxy().val()).toEqual('');
    keyDown('enter');

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
    keyDown('enter');
    expect(keyProxy().val()).toEqual('');
    keyDown('enter');

    expect(hot.getDataAtCell(0, 0)).toEqual('');

    selectCell(1, 1);
    keyDown('enter');
    expect(keyProxy().val()).toEqual('Cage');
    keyDown('enter');

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
    keyDown('enter');

    expect(keyProxy().val()).toEqual('Kia');

    selectCell(1, 1);
    keyDown('enter');

    expect(keyProxy().val()).toEqual('2012');
  });

  it('should open editor after hitting F2', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);
    keyDown('f2');
    expect(isEditorVisible()).toEqual(true);
  });

  it('should close editor after hitting ESC', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);
    keyDown('f2');
    expect(isEditorVisible()).toEqual(true);
    keyDown('esc');
    expect(isEditorVisible()).toEqual(false);
  });

  it('should NOT open editor after hitting CapsLock', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);
    keyDown(Handsontable.helper.KEY_CODES.CAPS_LOCK);
    expect(isEditorVisible()).toEqual(false);
  });

  it('should open editor after cancelling edit and beginning it again', () => {
    handsontable();
    selectCell(2, 2);

    expect(isEditorVisible()).toEqual(false);
    keyDown('f2');
    expect(isEditorVisible()).toEqual(true);
    keyDown('esc');
    expect(isEditorVisible()).toEqual(false);
    keyDown('f2');
    expect(isEditorVisible()).toEqual(true);
  });

  it('loadData should not destroy editor', () => {
    handsontable();
    selectCell(2, 2);

    keyDown('f2');
    loadData(getData());

    expect(isEditorVisible()).toEqual(true);
  });

  it('updateSettings should not destroy editor', () => {
    handsontable();
    selectCell(2, 2);

    keyDown('f2');
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

    keyDown(65, {
      ctrlKey: true
    }); // CTRL+A should NOT select all table when cell is edited

    const selection = getSelected();
    expect(selection).toEqual([[2, 2, 2, 2]]);
    expect(isEditorVisible()).toEqual(true);
  });

  it('should open editor after double clicking on a cell', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2)
    });
    const cell = $(getCell(0, 0));

    selectCell(0, 0);
    window.scrollTo(0, cell.offset().top);

    await sleep(0);

    cell
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    await sleep(100);

    cell
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    await sleep(100);

    const editor = getActiveEditor();

    expect(editor.isOpened()).toBe(true);
    expect(editor.isInFullEditMode()).toBe(true);
  });

  it('should not open editor after double clicking on a cell using the middle mouse button', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2)
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
      data: Handsontable.helper.createSpreadsheetData(5, 2)
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
    keyDown('f2');
    expect(editor.isOpened()).toEqual(true);
    expect(editor.focus).toHaveBeenCalled();
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

    document.activeElement.value = 'Very very very very very very very very very very very very very very very very very long text';
    keyDownUp(32); // space - trigger textarea resize

    const $textarea = $(document.activeElement);
    const $wtHider = spec().$container.find('.wtHider');

    expect($textarea.offset().left + $textarea.outerWidth()).not.toBeGreaterThan($wtHider.offset().left + spec().$container.outerWidth());
    expect($textarea.offset().top + $textarea.outerHeight()).not.toBeGreaterThan($wtHider.offset().top + $wtHider.outerHeight());
  });

  it('should open editor after selecting cell in another table and hitting enter', function() {
    spec().$container2 = $(`<div id="${id}-2"></div>`).appendTo('body');

    const hot1 = handsontable();
    const hot2 = handsontable2.call(this);

    spec().$container.find('tbody tr:eq(0) td:eq(0)').simulate('mousedown');
    spec().$container.find('tbody tr:eq(0) td:eq(0)').simulate('mouseup');

    // Open editor in HOT1
    keyDown('enter');

    expect(isEditorVisible($(hot1.getActiveEditor().TEXTAREA))).toBe(true);

    // Close editor in HOT1
    keyDown('enter');

    expect(isEditorVisible($(hot1.getActiveEditor().TEXTAREA))).toBe(false);

    spec().$container2.find('tbody tr:eq(0) td:eq(0)').simulate('mousedown');
    spec().$container2.find('tbody tr:eq(0) td:eq(0)').simulate('mouseup');

    expect(hot1.getSelected()).toBeUndefined();
    expect(hot2.getSelected()).toEqual([[0, 0, 0, 0]]);

    // Open editor in HOT2
    keyDown('enter');

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
      data: Handsontable.helper.createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    spec().$container.simulate('keydown', {
      keyCode: 'A'.charCodeAt(0)
    });

    expect(isEditorVisible()).toBe(true);
  });

  it('should open editor after pressing a printable character with shift key', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    spec().$container.simulate('keydown', {
      keyCode: 'A'.charCodeAt(0),
      shiftKey: true
    });

    expect(isEditorVisible()).toBe(true);
  });

  it('should be able to open editor after clearing cell data with DELETE', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    spec().$container.simulate('keydown', {
      keyCode: 46
    });
    spec().$container.simulate('keydown', {
      keyCode: 'A'.charCodeAt(0)
    });

    expect(isEditorVisible()).toBe(true);
  });

  it('should be able to open editor after clearing cell data with BACKSPACE', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3)
    });

    selectCell(0, 0);

    expect(isEditorVisible()).toBe(false);

    spec().$container.simulate('keydown', {
      keyCode: 8 // backspace
    });
    spec().$container.simulate('keydown', {
      keyCode: 'A'.charCodeAt(0)
    });

    expect(isEditorVisible()).toBe(true);
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

  it('should open empty editor after clearing cell value width BACKSPACE', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);

    keyDown(Handsontable.helper.KEY_CODES.BACKSPACE);

    expect(getDataAtCell(0, 0)).toEqual(null);
    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toEqual('');
  });

  it('should open empty editor after clearing cell value width DELETE', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);

    keyDown(Handsontable.helper.KEY_CODES.DELETE);

    expect(getDataAtCell(0, 0)).toEqual(null);
    expect(hot.getActiveEditor().isOpened()).toBe(false);

    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    expect(hot.getActiveEditor().isOpened()).toBe(true);
    expect(hot.getActiveEditor().getValue()).toEqual('');
  });

  it('should not open editor after hitting ALT (#1239)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4)
    });

    expect(getDataAtCell(0, 0)).toEqual('A1');

    selectCell(0, 0);

    keyDown(Handsontable.helper.KEY_CODES.ALT);

    expect(hot.getActiveEditor().isOpened()).toBe(false);

  });

  it('should open editor at the same coordinates as the edited cell', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(16, 8),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    const mainHolder = hot.view.wt.wtTable.holder;

    // corner
    selectCell(1, 1);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    const $inputHolder = $('.handsontableInputHolder');
    expect($(getCell(1, 1)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    selectCell(1, 4);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(1, 4)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    selectCell(4, 1);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(4, 1)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    selectCell(4, 4);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(4, 4)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 4)).offset().top).toEqual($inputHolder.offset().top + 1);

    $(mainHolder).scrollTop(1000);
  });

  it('should open editor at the same coordinates as the edited cell if preventOverflow is set as horizontal after the table had been scrolled', async() => {
    spec().$container[0].style = 'width: 400px';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(30, 30),
      preventOverflow: 'horizontal',
      fixedColumnsLeft: 2,
      fixedRowsTop: 2,
      rowHeaders: true,
      colHeaders: true,
      height: 500,
    });

    const $holder = $(hot.view.wt.wtTable.holder);
    $holder.scrollTop(100);
    $holder.scrollLeft(100);

    hot.render();

    await sleep(50);
    // corner
    selectCell(1, 1);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    const $inputHolder = $('.handsontableInputHolder');
    expect($(getCell(1, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    selectCell(1, 4);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(1, 4, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    selectCell(4, 1);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(4, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    selectCell(10, 6);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    expect($(getCell(10, 6, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(10, 6, true)).offset().top).toEqual($inputHolder.offset().top + 1);
  });

  it('editor should move with the page when scrolled with fixed rows and horizontal overflow without a set height', async() => {
    spec().$container[0].style = 'width: 400px';

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(300, 300),
      preventOverflow: 'horizontal',
      fixedColumnsLeft: 2,
      fixedRowsTop: 2,
      rowHeaders: true,
      colHeaders: true,
    });

    hot.render();

    await sleep(50);
    // corner
    window.scrollBy(300, 300);
    selectCell(1, 1);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    window.scrollBy(-300, -300);
    const $inputHolder = $('.handsontableInputHolder');
    expect($(getCell(1, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // top
    window.scrollBy(0, 300);
    selectCell(1, 4);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    window.scrollBy(0, -300);
    expect($(getCell(1, 4, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(1, 4, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // left
    window.scrollBy(300, 0);
    selectCell(4, 1);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    window.scrollBy(-300, 0);
    expect($(getCell(4, 1, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(4, 1, true)).offset().top).toEqual($inputHolder.offset().top + 1);

    // non-fixed
    window.scrollBy(300, 300);
    selectCell(10, 6);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);
    window.scrollBy(-300, -300);
    expect($(getCell(10, 6, true)).offset().left).toEqual($inputHolder.offset().left + 1);
    expect($(getCell(10, 6, true)).offset().top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (corner)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(16, 8),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view.wt.wtTable.holder);

    $holder.scrollTop(100);
    $holder.scrollLeft(100);

    hot.render();

    // corner
    selectCell(1, 1);
    const currentCell = hot.getCell(1, 1, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (top)', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view.wt.wtTable.holder);

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
    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (left)', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view.wt.wtTable.holder);

    $holder.scrollTop(500);
    $holder.scrollLeft(500);

    await sleep(100);

    selectCell(6, 1);

    await sleep(100);

    const currentCell = hot.getCell(6, 1, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same coordinates as the edited cell after the table had been scrolled (non-fixed)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(50, 50),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    const $holder = $(hot.view.wt.wtTable.holder);

    $holder.scrollTop(500);
    $holder.scrollLeft(500);

    hot.render();

    // non-fixed
    selectCell(7, 7);
    const currentCell = hot.getCell(7, 7, true);
    const left = $(currentCell).offset().left;
    const top = $(currentCell).offset().top;

    const $inputHolder = $('.handsontableInputHolder');
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    expect(left).toEqual($inputHolder.offset().left + 1);
    expect(top).toEqual($inputHolder.offset().top + 1);
  });

  it('should open editor at the same backgroundColor as the edited cell', async() => {
    handsontable({
      data: [
        ['', 5, 12, 13]
      ],
      renderer(instance, td, row, col, prop, value) {
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
      data: Handsontable.helper.createSpreadsheetData(3, 9)
    });

    selectCell(0, 7);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    expect(Handsontable.dom.outerWidth(hot.getActiveEditor().TEXTAREA)).toBeAroundValue(Handsontable.dom.outerWidth(hot.getCell(0, 7)));
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

  it('should render the text without trimming out the whitespace, if trimWhitespace is set to false', () => {
    spec().$container.css('overflow', '');
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 9),
      trimWhitespace: false
    });

    selectCell(0, 2);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);
    hot.getActiveEditor().TEXTAREA.value = '       test    of    whitespace      ';
    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    expect(getDataAtCell(0, 2).length).toEqual(37);
  });

  it('should insert new line on caret position when pressing ALT + ENTER', () => {
    const data = [
      ['Maserati', 'Mazda'],
      ['Honda', 'Mini']
    ];

    const hot = handsontable({
      data
    });

    selectCell(0, 0);
    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    const $editorInput = $('.handsontableInput');

    Handsontable.dom.setCaretPosition($editorInput[0], 2);

    $editorInput.simulate('keydown', {
      altKey: true,
      keyCode: Handsontable.helper.KEY_CODES.ENTER
    });

    expect(hot.getActiveEditor().TEXTAREA.value).toEqual('Ma\nserati');
  });

  it('should exceed the editor height only for one line when pressing ALT + ENTER', () => {
    const data = [
      ['Maserati', 'Mazda'],
      ['Honda', 'Mini']
    ];

    const hot = handsontable({
      data
    });

    selectCell(0, 0);
    keyDownUp(Handsontable.helper.KEY_CODES.ENTER);

    const $editorInput = $('.handsontableInput');

    $editorInput.simulate('keydown', {
      altKey: true,
      keyCode: Handsontable.helper.KEY_CODES.ENTER
    });

    const editorTextarea = hot.getActiveEditor().TEXTAREA;
    const editorComputedStyle = getComputedStyle(editorTextarea);
    const editorTextareaLineHeight = parseInt(editorComputedStyle.lineHeight, 10);
    const editorTextareaHeight = parseInt(editorComputedStyle.height, 10);

    expect(editorTextareaHeight).toBe(2 * editorTextareaLineHeight);
  });

  it('should be displayed and resized properly, so it doesn\'t exceed the viewport dimensions', () => {
    const data = [
      ['', '', '', '', ''],
      ['', 'The Dude abides. I don\'t know about you but I take comfort in that. It\'s good knowin\' he\'s out there. The ' +
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
    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    const $editorInput = $('.handsontableInput');
    const $editedCell = $(hot.getCell(1, 1));

    expect($editorInput.outerWidth()).toEqual(hot.view.wt.wtTable.holder.clientWidth - $editedCell.position().left + 1);

    hot.scrollViewportTo(void 0, 3);
    hot.render();

    expect($editorInput.width() + $editorInput.offset().left).toBeLessThan(hot.view.wt.wtTable.holder.clientWidth);
  });

  it('should resize editor to properly size after focus', (done) => {
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
    keyDown(Handsontable.helper.KEY_CODES.ENTER);

    const $editorInput = $('.handsontableInput');

    setTimeout(() => {
      expect([105, 119]).toEqual(jasmine.arrayContaining([$editorInput.height()]));
      done();
    }, 150);
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality.
  it('should not lose the focus on input element while inserting new characters (#839)', async() => {
    let blured = false;
    const listener = () => {
      blured = true;
    };
    const hot = handsontable({
      data: [['']],
    });

    selectCell(0, 0);
    keyDownUp('enter');
    hot.getActiveEditor().TEXTAREA.addEventListener('blur', listener);

    await sleep(200);

    hot.getActiveEditor().TEXTAREA.value = 'a';
    keyDownUp('a'.charCodeAt(0));
    hot.getActiveEditor().TEXTAREA.value = 'ab';
    keyDownUp('b'.charCodeAt(0));
    hot.getActiveEditor().TEXTAREA.value = 'abc';
    keyDownUp('c'.charCodeAt(0));

    expect(blured).toBeFalsy();

    hot.getActiveEditor().TEXTAREA.removeEventListener('blur', listener);
  });

  it('should not throw an exception when window.attachEvent is defined but the text area does not have attachEvent', (done) => {
    const hot = handsontable();
    window.attachEvent = true;
    selectCell(1, 1);

    expect(() => {
      hot.getActiveEditor().autoResize.init(hot.getActiveEditor().TEXTAREA);
    }).not.toThrow();

    done();
  });

  it('should keep editor open, focusable and with untouched value when allowInvalid is set as false', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      allowInvalid: false,
      validator(val, cb) {
        cb(false);
      },
    });
    selectCell(0, 0);

    keyDown('enter');
    destroyEditor();
    document.activeElement.value = '999';

    await sleep(10);

    expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    expect(isEditorVisible()).toBe(true);
    expect(getActiveEditor().TEXTAREA.value).toBe('999');

    keyDown('enter');

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
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      columns: [
        { readOnly: true },
        {}
      ]
    });

    selectCell(0, 1);

    keyDownUp('enter');
    keyDownUp('enter');

    selectCell(0, 0);

    keyDownUp('enter');

    expect(hot.getActiveEditor()).toBe(void 0);
  });

  describe('IME support', () => {
    it('should focus editable element after selecting the cell', async() => {
      handsontable({
        type: 'text',
      });
      selectCell(0, 0, 0, 0, true, false);

      await sleep(10);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });

    it('editor size should change after composition started', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 5),
        width: 400,
        height: 400,
      });

      selectCell(2, 2);
      keyDownUp('enter');

      const textarea = getActiveEditor().TEXTAREA;

      textarea.value = 'test, test, test, test, test, test';
      textarea.dispatchEvent(new CompositionEvent('compositionstart')); // Trigger textarea resize
      textarea.dispatchEvent(new CompositionEvent('compositionupdate')); // Trigger textarea resize
      textarea.dispatchEvent(new CompositionEvent('compositionend')); // Trigger textarea resize

      await sleep(100);

      expect($(textarea).width()).toBe(201);
      expect($(textarea).height()).toBe(23);
    });
  });
});
