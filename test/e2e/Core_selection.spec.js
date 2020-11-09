describe('Core_selection', () => {
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

  it('should correctly render the selection using event simulation', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(9, 8),
      selectionMode: 'multiple',
      colHeaders: true,
      rowHeaders: true,
    });

    $(getCell(5, 4)).simulate('mousedown');
    $(getCell(1, 1)).simulate('mouseover');
    $(getCell(1, 1)).simulate('mouseup');

    keyDown('ctrl');

    $(getCell(0, 2)).simulate('mousedown');
    $(getCell(8, 2)).simulate('mouseover');
    $(getCell(7, 2)).simulate('mouseup');

    $(getCell(2, 4)).simulate('mousedown');
    $(getCell(2, 4)).simulate('mouseover');
    $(getCell(2, 4)).simulate('mouseup');

    $(getCell(7, 6)).simulate('mousedown');
    $(getCell(8, 7)).simulate('mouseover');
    $(getCell(8, 7)).simulate('mouseup');

    expect(`
      |   ║   : - : - : - : - :   : - : - |
      |===:===:===:===:===:===:===:===:===|
      | - ║   :   : 0 :   :   :   :   :   |
      | - ║   : 0 : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 1 : 0 : 1 :   :   :   |
      | - ║   : 0 : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 1 : 0 : 0 :   :   :   |
      | - ║   :   : 0 :   :   :   :   :   |
      | - ║   :   : 0 :   :   :   : A : 0 |
      | - ║   :   : 0 :   :   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
  });

  it('should focus external textarea when clicked during editing', () => {
    const textarea = $('<input type="text">').prependTo($('body'));

    handsontable();
    selectCell(0, 0);

    keyDown('enter');
    // $("html").triggerHandler('mouseup');
    $('html').simulate('mouseup');
    textarea.focus();

    expect(document.activeElement).toBe(textarea[0]);
    textarea.remove();
  });

  it('should deselect currently selected cell', () => {
    handsontable();
    selectCell(0, 0);

    $('html').simulate('mousedown');

    expect(getSelected()).toBeUndefined();
    expect(`
    |   :   :   :   :   |
    |   :   :   :   :   |
    |   :   :   :   :   |
    |   :   :   :   :   |
    |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should fix start range if provided is out of bounds (to the left)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      autoWrapCol: false,
      autoWrapRow: false
    });
    selectCell(0, 0);
    keyDownUp('arrow_left');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    | - ║ # :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should fix start range if provided is out of bounds (to the top)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      autoWrapCol: false,
      autoWrapRow: false
    });
    selectCell(0, 0);
    keyDownUp('arrow_up');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    | - ║ # :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should fix start range if provided is out of bounds (to the right)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      autoWrapCol: false,
      autoWrapRow: false
    });
    selectCell(0, 4);
    keyDownUp('arrow_right');

    expect(getSelected()).toEqual([[0, 4, 0, 4]]);
    expect(`
    |   ║   :   :   :   : - |
    |===:===:===:===:===:===|
    | - ║   :   :   :   : # |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should fix start range if provided is out of bounds (to the bottom)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      autoWrapCol: false,
      autoWrapRow: false
    });
    selectCell(4, 0);
    keyDownUp('arrow_down');

    expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║ # :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should fix end range if provided is out of bounds (to the left)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 1);
    keyDownUp('shift+arrow_left');
    keyDownUp('shift+arrow_left');

    expect(getSelected()).toEqual([[0, 1, 0, 0]]);
    expect(`
    |   ║ - : - :   :   :   |
    |===:===:===:===:===:===|
    | - ║ 0 : A :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should fix end range if provided is out of bounds (to the top)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });
    selectCell(1, 0);
    keyDownUp('shift+arrow_up');
    keyDownUp('shift+arrow_up');

    expect(getSelected()).toEqual([[1, 0, 0, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    | - ║ 0 :   :   :   :   |
    | - ║ A :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should fix end range if provided is out of bounds (to the right)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });
    selectCell(0, 3);
    keyDownUp('shift+arrow_right');
    keyDownUp('shift+arrow_right');

    expect(getSelected()).toEqual([[0, 3, 0, 4]]);
    expect(`
    |   ║   :   :   : - : - |
    |===:===:===:===:===:===|
    | - ║   :   :   : A : 0 |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should fix end range if provided is out of bounds (to the bottom)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });
    selectCell(3, 0);
    keyDownUp('shift+arrow_down');
    keyDownUp('shift+arrow_down');
    keyDownUp('shift+arrow_down');

    expect(getSelected()).toEqual([[3, 0, 4, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║ A :   :   :   :   |
    | - ║ 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select multiple cells', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });
    selectCell(3, 0, 4, 1);

    expect(getSelected()).toEqual([[3, 0, 4, 1]]);
    expect(`
    |   ║ - : - :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║ A : 0 :   :   :   |
    | - ║ 0 : 0 :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should call onSelectionEnd as many times as onSelection when `selectCell` is called', () => {
    let tick = 0;
    let tickEnd = 0;

    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelection() {
        tick += 1;
      },
      afterSelectionEnd() {
        tickEnd += 1;
      }
    });
    selectCell(3, 0);
    selectCell(1, 1);

    expect(tick).toEqual(2);
    expect(tickEnd).toEqual(2);
  });

  it('should call onSelectionEnd when user finishes selection by releasing SHIFT key (3 times)', () => {
    let tick = 0;

    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      afterSelectionEnd() {
        tick += 1;
      }
    });
    selectCell(3, 0); // makes tick++
    keyDownUp('shift+arrow_down'); // makes tick++
    keyDownUp('shift+arrow_down'); // makes tick++
    keyDownUp('shift+arrow_down'); // makes tick++

    expect(getSelected()).toEqual([[3, 0, 4, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║ A :   :   :   :   |
    | - ║ 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(tick).toEqual(4);
  });

  it('should call onSelectionEnd when user finishes selection by releasing SHIFT key (1 time)', () => {
    let tick = 0;

    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      afterSelectionEnd() {
        tick += 1;
      }
    });
    selectCell(3, 0); // makes tick++
    keyDown('shift+arrow_down');
    keyDown('shift+arrow_down');
    keyDownUp('shift+arrow_down'); // makes tick++

    expect(getSelected()).toEqual([[3, 0, 4, 0]]);
    expect(`
    |   ║ - :   :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║ A :   :   :   :   |
    | - ║ 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(tick).toEqual(2);
  });

  it('should select columns by click on header with SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(2)').simulate('mousedown');
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(2)').simulate('mouseup');

    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 1, 4, 4]]);
    expect(`
    |   ║   : * : * : * : * |
    |===:===:===:===:===:===|
    | - ║   : A : 0 : 0 : 0 |
    | - ║   : 0 : 0 : 0 : 0 |
    | - ║   : 0 : 0 : 0 : 0 |
    | - ║   : 0 : 0 : 0 : 0 |
    | - ║   : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should select rows by click on header with SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    spec().$container.find('.ht_clone_left tr:eq(2) th:eq(0)').simulate('mousedown');
    spec().$container.find('.ht_clone_left tr:eq(2) th:eq(0)').simulate('mouseup');

    spec().$container.find('.ht_clone_left tr:eq(5) th:eq(0)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_left tr:eq(5) th:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[1, 0, 4, 4]]);
    expect(`
    |   ║ - : - : - : - : - |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    | * ║ A : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should change selection after click on column header with SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    selectCell(1, 1, 3, 3);

    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 1, 4, 4]]);
    expect(`
    |   ║   : * : * : * : * |
    |===:===:===:===:===:===|
    | - ║   : A : 0 : 0 : 0 |
    | - ║   : 0 : 0 : 0 : 0 |
    | - ║   : 0 : 0 : 0 : 0 |
    | - ║   : 0 : 0 : 0 : 0 |
    | - ║   : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should change selection after click on row header with SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    selectCell(1, 1, 3, 3);

    spec().$container.find('.ht_clone_left tr:eq(5) th:eq(0)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_left tr:eq(5) th:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[1, 0, 4, 4]]);
    expect(`
    |   ║ - : - : - : - : - |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    | * ║ A : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should call onSelection while user selects cells with mouse; onSelectionEnd when user finishes selection', () => {
    let tick = 0;
    let tickEnd = 0;

    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      afterSelection() {
        tick += 1;
      },
      afterSelectionEnd() {
        tickEnd += 1;
      }
    });

    spec().$container.find('tr:eq(1) td:eq(0)').simulate('mousedown');
    spec().$container.find('tr:eq(1) td:eq(1)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(3)').simulate('mouseover');

    spec().$container.find('tr:eq(2) td:eq(3)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 0, 1, 3]]);
    expect(`
    |   ║ - : - : - : - :   |
    |===:===:===:===:===:===|
    | - ║ A : 0 : 0 : 0 :   |
    | - ║ 0 : 0 : 0 : 0 :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(tick).toEqual(3);
    expect(tickEnd).toEqual(1);
  });

  it('should properly select columns, when the user moves the cursor over column headers across two overlays', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      fixedColumnsLeft: 2
    });

    spec().$container.find('.ht_clone_left tr:eq(0) th:eq(2)').simulate('mousedown');
    spec().$container.find('.ht_clone_left tr:eq(0) th:eq(2)').simulate('mouseover');
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(3)').simulate('mouseover');
    spec().$container.find('.ht_clone_left tr:eq(0) th:eq(2)').simulate('mouseover');
    spec().$container.find('.ht_clone_left tr:eq(0) th:eq(2)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 1, 4, 1]]);
    expect(`
    |   ║   : * |   :   :   |
    |===:===:===:===:===:===|
    | - ║   : A |   :   :   |
    | - ║   : 0 |   :   :   |
    | - ║   : 0 |   :   :   |
    | - ║   : 0 |   :   :   |
    | - ║   : 0 |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should move focus to selected cell', () => {
    const $input = $('<input>').appendTo(document.body);

    handsontable({
      startRows: 5,
      startCols: 5
    });
    $input[0].focus();
    selectCell(0, 0);

    keyDownUp('enter');
    expect(isEditorVisible()).toEqual(true);
    $input.remove();
  });

  // This test should cover the #893 case, but it always passes. It seems like the keydown event (with CTRL key pressed) isn't delivered.
  it('should not move focus from outside elements on CTRL keydown event, when no cell is selected', () => {
    const $input = $('<input type="text"/>');

    $('body').append($input);
    handsontable();
    selectCell(0, 0);

    expect(document.activeElement.nodeName).toBeInArray(['TEXTAREA', 'BODY', 'HTML']);

    $input.focus();
    expect(document.activeElement.nodeName).toBe('INPUT');

    $input.simulate('keydown', { ctrlKey: true, metaKey: true });
    expect(document.activeElement.nodeName).toBe('INPUT');

    $input.remove();
  });

  it('should select the entire column after column header is clicked', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 10,
      startCols: 5,
      colHeaders: true
    });

    spec().$container.find('thead th:eq(0)').simulate('mousedown');

    expect(getSelected()).toEqual([[0, 0, 9, 0]]);
    expect(`
      | * :   :   :   :   |
      |===:===:===:===:===|
      | A :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should select the entire column and row after column header and row header is clicked', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 10,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
    });

    spec().$container.find('thead th:eq(3)').simulate('mousedown');
    keyDown('ctrl');
    spec().$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');

    expect(`
      |   ║ - : - : * : - : - |
      |===:===:===:===:===:===|
      | - ║   :   : 0 :   :   |
      | * ║ A : 0 : 1 : 0 : 0 |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should select the entire column and row after column header and row header is clicked when cell editor is open', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(0, 0);
    keyDownUp('enter');

    expect(getActiveEditor()).not.toBeUndefined();

    keyDown('ctrl');
    spec().$container.find('thead th:eq(3)').simulate('mousedown');
    spec().$container.find('tr:eq(3) th:eq(0)').simulate('mousedown');

    expect(`
      |   ║ - : - : * : - : - |
      |===:===:===:===:===:===|
      | - ║ 0 :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | * ║ A : 0 : 1 : 0 : 0 |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not overwrite background color of the cells with custom CSS classes', () => {
    handsontable({
      width: 300,
      height: 150,
      startRows: 5,
      startCols: 5,
      cells: (row, col) => (row === 1 && col === 1 ? { className: 'red-background' } : void 0)
    });

    $(getCell(0, 0)).simulate('mousedown');
    $(getCell(4, 4)).simulate('mouseover');
    $(getCell(4, 4)).simulate('mouseup');

    expect(window.getComputedStyle(getCell(1, 1))['background-color']).toBe('rgb(255, 0, 0)');
  });

  it('should select the entire column after column header is clicked (in fixed rows/cols corner)', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 10,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsLeft: 2
    });

    spec().$container.find('.ht_clone_top_left_corner thead th:eq(1)').simulate('mousedown');

    expect(getSelected()).toEqual([[0, 0, 9, 0]]);
    expect(`
      |   ║ * :   |   :   :   |
      |===:===:===:===:===:===|
      | - ║ A :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      |---:---:---:---:---:---|
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should select the entire fixed column after column header is clicked, after scroll horizontally', () => {
    const hot = handsontable({
      width: 200,
      height: 100,
      startRows: 10,
      startCols: 10,
      colHeaders: true,
      rowHeaders: true,
      fixedColumnsLeft: 2
    });

    hot.render();
    hot.scrollViewportTo(void 0, hot.countCols() - 1);

    spec().$container.find('.ht_master thead th:eq(2)').simulate('mousedown');
    spec().$container.find('.ht_master thead th:eq(2)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 1, 9, 1]]);
    expect(`
      |   ║   : * |   :   :   :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      | - ║   : A |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should scroll viewport after partially visible column\'s header is clicked, without vertical scroll manipulation', () => {
    const hot = handsontable({
      width: 200,
      height: 100,
      startRows: 40,
      startCols: 40,
      colWidths: 73,
      colHeaders: true,
      rowHeaders: true,
    });

    const mainHolder = hot.view.wt.wtTable.holder;

    mainHolder.scrollTop = 200;

    const firstLastVisibleColumn = hot.view.wt.wtTable.getLastVisibleColumn();
    const headerElement = hot.view.wt.wtTable.getColumnHeader(firstLastVisibleColumn + 1);

    $(headerElement).simulate('mousedown');

    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toBe(firstLastVisibleColumn + 1);
    expect(mainHolder.scrollTop).toBe(200);
  });

  it('should set the selection end to the first visible row, when dragging the selection from a cell to a column header', async() => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    hot.scrollViewportTo(10, 10);
    hot.render();

    await sleep(30);

    $(getCell(12, 11)).simulate('mousedown');
    spec().$container.find('.ht_clone_top thead th:eq(2)').simulate('mouseover');

    await sleep(30);

    expect(getSelected()).toEqual([[12, 11, 10, 11]]);
    expect(`
    |   ║   : - :   :   :   :   :   :   :   :   |
    |===:===:===:===:===:===:===:===:===:===:===|
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    | - ║   : 0 :   :   :   :   :   :   :   :   |
    | - ║   : 0 :   :   :   :   :   :   :   :   |
    | - ║   : A :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should render selection borders with set proper z-indexes', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    hot.selectCell(1, 1, 2, 2);

    expect(Handsontable.dom.getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .current')).zIndex).toBe('10');
    expect(Handsontable.dom.getComputedStyle(hot.rootElement.querySelector('.ht_master .htBorders .area')).zIndex).toBe('8');
  });

  it('should set the selection end to the first visible column, when dragging the selection from a cell to a row header', async() => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    hot.scrollViewportTo(10, 10);
    hot.render();

    await sleep(30);

    $(getCell(12, 11)).simulate('mousedown');
    spec().$container.find('.ht_clone_left tbody th:eq(12)').simulate('mouseover');

    await sleep(30);

    expect(getSelected()).toEqual([[12, 11, 12, 10]]);
    expect(`
    |   ║ - : - :   :   :   :   :   :   :   :   |
    |===:===:===:===:===:===:===:===:===:===:===|
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    | - ║ 0 : A :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
    |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should allow to scroll the table when a whole column is selected and table is longer than it\'s container', async() => {
    let errCount = 0;

    $(window).on('error.selectionTest', () => {
      errCount += 1;
    });

    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');

    const hot = handsontable({
      height: 100,
      width: 300,
      startRows: 100,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      afterScrollVertically: onAfterScrollVertically
    });

    const mainHolder = hot.view.wt.wtTable.holder;

    mainHolder.scrollTop = 0;

    spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousedown');
    spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseup');

    mainHolder.scrollTop = 120;

    await sleep(100);

    expect(errCount).toEqual(0); // expect no errors to be thrown

    $(window).off('error.selectionTest');
  });

  it('should scroll to the end of the selection, when selecting cells using the keyboard', () => {
    const hot = handsontable({
      height: 300,
      width: 300,
      startRows: 50,
      startCols: 50,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsLeft: 2
    });

    const mainHolder = hot.view.wt.wtTable.holder;

    mainHolder.scrollTop = 100;
    selectCell(1, 3);
    keyDownUp('arrow_down');
    expect(mainHolder.scrollTop).toEqual(0);

    mainHolder.scrollTop = 100;
    selectCell(1, 3);
    keyDownUp('shift+arrow_down');
    expect(mainHolder.scrollTop).toEqual(0);

    mainHolder.scrollLeft = 100;
    selectCell(3, 1);
    keyDownUp('arrow_right');
    expect(mainHolder.scrollLeft).toEqual(0);

    mainHolder.scrollLeft = 100;
    selectCell(3, 1);
    keyDownUp('shift+arrow_right');
    expect(mainHolder.scrollLeft).toEqual(0);

    const lastVisibleColumn = hot.view.wt.wtTable.getLastVisibleColumn();
    selectCell(3, lastVisibleColumn);
    keyDownUp('arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 1);

    keyDownUp('arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 2);

    keyDownUp('shift+arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 3);

    const lastVisibleRow = hot.view.wt.wtTable.getLastVisibleRow();
    selectCell(lastVisibleRow, 3);
    keyDownUp('arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 1);

    keyDownUp('arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 2);

    keyDownUp('shift+arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 3);
  });

  it('should scroll to the last selected row or column of the selection, when user uses the keyboard', () => {
    const hot = handsontable({
      height: 300,
      width: 300,
      startRows: 50,
      startCols: 50,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsLeft: 2
    });

    const mainHolder = hot.view.wt.wtTable.holder;
    const lastVisibleColumn = hot.view.wt.wtTable.getLastVisibleColumn();
    const lastVisibleRow = hot.view.wt.wtTable.getLastVisibleRow();
    const rowHeader = hot.view.wt.wtTable.getRowHeader(lastVisibleRow);
    const columnHeader = hot.view.wt.wtTable.getColumnHeader(lastVisibleColumn);

    $(columnHeader).simulate('mousedown');
    $(columnHeader).simulate('mouseup');
    keyDownUp('shift+arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 1);

    keyDownUp('shift+arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 2);

    keyDownUp('shift+arrow_right');
    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toEqual(lastVisibleColumn + 3);

    const scrollLeft = mainHolder.scrollLeft;
    expect(scrollLeft).toBeGreaterThan(0);
    expect(mainHolder.scrollTop).toBe(0);

    $(rowHeader).simulate('mousedown');
    $(rowHeader).simulate('mouseup');
    keyDownUp('shift+arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 1);

    keyDownUp('shift+arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 2);

    keyDownUp('shift+arrow_down');
    expect(hot.view.wt.wtTable.getLastVisibleRow()).toEqual(lastVisibleRow + 3);
    expect(mainHolder.scrollLeft).toBe(scrollLeft);
    expect(mainHolder.scrollTop).toBeGreaterThan(0);
  });

  it('should select the entire row after row header is clicked', () => {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true
    });

    spec().$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');

    expect(getSelected()).toEqual([[1, 0, 1, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should scroll viewport after partially visible row\'s header is clicked, without horizontal scroll manipulation', () => {
    const hot = handsontable({
      width: 200,
      height: 100,
      startRows: 40,
      startCols: 40,
      rowHeights: 27,
      colHeaders: true,
      rowHeaders: true,
    });

    const mainHolder = hot.view.wt.wtTable.holder;

    mainHolder.scrollLeft = 200;

    const firstLastVisibleRow = hot.view.wt.wtTable.getLastVisibleRow();
    const headerElement = hot.view.wt.wtTable.getRowHeader(firstLastVisibleRow + 1);

    $(headerElement).simulate('mousedown');

    expect(hot.view.wt.wtTable.getLastVisibleRow()).toBe(firstLastVisibleRow + 1);
    expect(mainHolder.scrollLeft).toBe(200);
  });

  it('should select the entire row of a partially fixed table after row header is clicked', () => {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsLeft: 2
    });

    spec().$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([[1, 0, 1, 4]]);
    expect(`
    |   ║ - : - | - : - : - |
    |===:===:===:===:===:===|
    |   ║   :   |   :   :   |
    | * ║ A : 0 | 0 : 0 : 0 |
    |---:---:---:---:---:---|
    |   ║   :   |   :   :   |
    |   ║   :   |   :   :   |
    |   ║   :   |   :   :   |
    `).toBeMatchToSelectionPattern();

    spec().$container.find('tr:eq(3) th:eq(0)').simulate('mousedown');
    expect(getSelected()).toEqual([[2, 0, 2, 4]]);
    expect(`
    |   ║ - : - | - : - : - |
    |===:===:===:===:===:===|
    |   ║   :   |   :   :   |
    |   ║   :   |   :   :   |
    |---:---:---:---:---:---|
    | * ║ A : 0 | 0 : 0 : 0 |
    |   ║   :   |   :   :   |
    |   ║   :   |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select a cell in a newly added row after automatic row adding, triggered by editing a cell in the last row with minSpareRows > 0, ' +
    'unless editing happened within the fixed bottom rows', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 2,
      minSpareRows: 1
    });

    await sleep(10);
    selectCell(4, 0);
    keyDownUp('enter');

    await sleep(90);
    keyDownUp('enter');

    await sleep(100);
    expect(countRows()).toEqual(6);
    expect(getSelected()).toEqual([[5, 0, 5, 0]]);
    expect(`
    |   ║ - :   |
    |===:===:===|
    |   ║   :   |
    |   ║   :   |
    |   ║   :   |
    |   ║   :   |
    |   ║   :   |
    | - ║ # :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select a cell which one was added automatically by minSpareCols', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 5),
      minSpareCols: 1,
    });

    selectCell(0, 5);
    keyDownUp('tab');

    expect(countCols()).toEqual(7);
    expect(getSelected()).toEqual([[0, 6, 0, 6]]);
    expect(`
    |   :   :   :   :   :   : # |
    `).toBeMatchToSelectionPattern();
    expect(getDataAtCell(0, 0)).toEqual('A1');
    expect(getDataAtCell(0, 1)).toEqual('B1');
    expect(getDataAtCell(0, 2)).toEqual('C1');
    expect(getDataAtCell(0, 3)).toEqual('D1');
    expect(getDataAtCell(0, 4)).toEqual('E1');
    expect(getDataAtCell(0, 5)).toBeNull();
    expect(getDataAtCell(0, 6)).toBeNull();
  });

  it('should change selected coords by modifying coords object via `modifyTransformStart` hook', () => {
    const hot = handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });

    selectCell(0, 0);

    hot.addHook('modifyTransformStart', (coords) => {
      coords.col += 1;
      coords.row += 1;
    });
    keyDown('arrow_down');

    expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    expect(`
    |   ║   : - :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║   : # :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should change selected coords by modifying coords object via `modifyTransformEnd` hook', () => {
    const hot = handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });

    selectCell(0, 0);

    hot.addHook('modifyTransformEnd', (coords) => {
      coords.col += 2;
      coords.row += 1;
    });
    keyDown('shift+arrow_down');

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(`
    |   ║ - : - : - :   :   |
    |===:===:===:===:===:===|
    | - ║ A : 0 : 0 :   :   |
    | - ║ 0 : 0 : 0 :   :   |
    | - ║ 0 : 0 : 0 :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should indicate is coords is out of bounds via `afterModifyTransformStart` hook', () => {
    const spy = jasmine.createSpy();
    const hot = handsontable({
      startRows: 5,
      startCols: 5,
      autoWrapCol: false,
      autoWrapRow: false
    });

    hot.addHook('afterModifyTransformStart', spy);
    selectCell(2, 0);
    keyDownUp('arrow_left');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(-1);

    spy.calls.reset();
    selectCell(2, 4);
    keyDownUp('arrow_right');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(1);

    spy.calls.reset();
    selectCell(4, 2);
    keyDownUp('arrow_down');

    expect(spy.calls.mostRecent().args[1]).toBe(1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);

    spy.calls.reset();
    selectCell(0, 2);
    keyDownUp('arrow_up');

    expect(spy.calls.mostRecent().args[1]).toBe(-1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);
  });

  it('should indicate is coords is out of bounds via `afterModifyTransformEnd` hook', () => {
    const spy = jasmine.createSpy();
    const hot = handsontable({
      startRows: 5,
      startCols: 5
    });

    hot.addHook('afterModifyTransformEnd', spy);
    selectCell(2, 0);
    keyDownUp('shift+arrow_left');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(-1);

    spy.calls.reset();
    selectCell(2, 4);
    keyDownUp('shift+arrow_right');

    expect(spy.calls.mostRecent().args[1]).toBe(0);
    expect(spy.calls.mostRecent().args[2]).toBe(1);

    spy.calls.reset();
    selectCell(4, 2);
    keyDownUp('shift+arrow_down');

    expect(spy.calls.mostRecent().args[1]).toBe(1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);

    spy.calls.reset();
    selectCell(0, 2);
    keyDownUp('shift+arrow_up');

    expect(spy.calls.mostRecent().args[1]).toBe(-1);
    expect(spy.calls.mostRecent().args[2]).toBe(0);
  });

  it('should change selection after left mouse button on one of selected cell', () => {
    const hot = handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });
    const cells = $('.ht_master.handsontable td');

    cells.eq(6).simulate('mousedown');
    cells.eq(18).simulate('mouseover');
    cells.eq(18).simulate('mouseup');

    expect(hot.getSelected()).toEqual([[1, 1, 3, 3]]);
    expect(`
    |   ║   : - : - : - :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    | - ║   : A : 0 : 0 :   |
    | - ║   : 0 : 0 : 0 :   |
    | - ║   : 0 : 0 : 0 :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    cells.eq(16).simulate('mousedown');
    cells.eq(16).simulate('mouseup');

    expect(hot.getSelected()).toEqual([[3, 1, 3, 1]]);
    expect(`
    |   ║   : - :   :   :   |
    |===:===:===:===:===:===|
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    |   ║   :   :   :   :   |
    | - ║   : # :   :   :   |
    |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select all cells when corner header is clicked', () => {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true
    });

    spec().$container.find('thead').find('th').eq(0).simulate('mousedown');

    expect(getSelected()).toEqual([[0, 0, 4, 4]]);
    expect(`
    |   ║ * : * : * : * : * |
    |===:===:===:===:===:===|
    | * ║ A : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should redraw selection when option `colHeaders` is set and user scrolled', async() => {
    const hot = handsontable({
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true,
      width: 400,
      height: 200
    });
    let cell;
    const borderOffsetInPixels = 1;
    let currentSelection;

    selectCell(5, 5);
    hot.view.wt.wtOverlays.topOverlay.scrollTo(2);

    await sleep(100);

    cell = hot.getCell(5, 5);
    currentSelection = $('.wtBorder.current')[0];
    expect(currentSelection.offsetTop).toEqual(cell.offsetHeight + cell.offsetTop - (currentSelection.offsetHeight / 2) - borderOffsetInPixels);
    hot.view.wt.wtOverlays.topOverlay.scrollTo(0);

    await sleep(100);
    cell = hot.getCell(5, 5);
    currentSelection = $('.wtBorder.current')[0];
    expect(currentSelection.offsetTop).toEqual(cell.offsetHeight + cell.offsetTop - (currentSelection.offsetHeight / 2) - borderOffsetInPixels);
  });

  it('should redraw selection on `leftOverlay` when options `colHeaders` and `fixedColumnsLeft` are set, and user scrolled', async() => {
    const hot = handsontable({
      fixedColumnsLeft: 2,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true,
      width: 400,
      height: 200
    });
    let cell;
    const borderOffsetInPixels = 1;
    let currentSelection;

    selectCell(1, 0);
    hot.view.wt.wtOverlays.topOverlay.scrollTo(5);

    await sleep(100);
    cell = hot.getCell(1, 0);
    currentSelection = $('.wtBorder.current')[0];
    expect(currentSelection.offsetTop).toEqual(cell.offsetHeight + cell.offsetTop - (currentSelection.offsetHeight / 2) - borderOffsetInPixels);
    hot.view.wt.wtOverlays.topOverlay.scrollTo(0);

    await sleep(100);
    cell = hot.getCell(1, 0);
    currentSelection = $('.wtBorder.current')[0];
    expect(currentSelection.offsetTop).toEqual(cell.offsetHeight + cell.offsetTop - (currentSelection.offsetHeight / 2) - borderOffsetInPixels);
  });

  it('should scroll viewport properly when selecting singe cell beyond the table boundaries (when some columns are hidden)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      hiddenColumns: {
        columns: [0, 1, 2]
      }
    });

    selectCell(0, 15);

    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  it('should scroll viewport properly when selecting multiple cells beyond the table boundaries (when some columns are hidden)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      hiddenColumns: {
        columns: [0, 1, 2]
      }
    });

    selectCells([[0, 4], [0, 15]]);

    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  it('should scroll viewport properly when selecting singe column beyond the table boundaries (when some columns are hidden)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      hiddenColumns: {
        columns: [0, 1, 2]
      }
    });

    selectColumns(15);

    expect(hot.view.wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  describe('multiple selection mode', () => {
    it('should select cells by using two layers when CTRL key is pressed (default mode of the selectionMode option)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 10
      });

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(4, 4)).simulate('mouseover');
      $(getCell(4, 4)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);
      expect(`
      |   ║   : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      keyDown('ctrl');

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(5, 6)).simulate('mouseover');
      $(getCell(5, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 4, 4], [3, 3, 5, 6]]);
      expect(`
      |   ║   : - : - : - : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : B : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 0 : 1 : 1 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be disallowed to select non-consecutive cells when selectionMode is set as `single`', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 10,
        selectionMode: 'single',
      });

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(4, 4)).simulate('mouseover');
      $(getCell(4, 4)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
      expect(`
      |   ║   : - :   :   :   :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : # :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      keyDown('ctrl');

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(5, 6)).simulate('mouseover');
      $(getCell(5, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[3, 3, 3, 3]]);
      expect(`
      |   ║   :   :   : - :   :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   :   :   : # :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be allowed to select consecutive cells when selectionMode is set as `range`', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 10,
        selectionMode: 'range',
      });

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(4, 4)).simulate('mouseover');
      $(getCell(4, 4)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);
      expect(`
      |   ║   : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(5, 6)).simulate('mouseover');
      $(getCell(5, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[3, 3, 5, 6]]);
      expect(`
      |   ║   :   :   : - : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   :   :   : A : 0 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should be disallowed to select non-consecutive cells when selectionMode is set as `range`', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 10,
        selectionMode: 'range',
      });

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(4, 4)).simulate('mouseover');
      $(getCell(4, 4)).simulate('mouseup');

      expect(getSelected()).toEqual([[1, 1, 4, 4]]);
      expect(`
      |   ║   : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      keyDown('ctrl');

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(5, 6)).simulate('mouseover');
      $(getCell(5, 6)).simulate('mouseup');

      expect(getSelected()).toEqual([[3, 3, 5, 6]]);
      expect(`
      |   ║   :   :   : - : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   :   :   : A : 0 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should properly colorize selection layers including layer intersections', () => {
      handsontable({
        startRows: 21,
        startCols: 30,
        selectionMode: 'multiple',
        colHeaders: true,
        rowHeaders: true,
      });

      $(getCell(0, 0)).simulate('mousedown');
      $(getCell(20, 15)).simulate('mouseover');
      $(getCell(20, 15)).simulate('mouseup');

      keyDown('ctrl');

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(19, 16)).simulate('mouseover');
      $(getCell(19, 16)).simulate('mouseup');

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(18, 17)).simulate('mouseover');
      $(getCell(18, 17)).simulate('mouseup');

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(17, 18)).simulate('mouseover');
      $(getCell(17, 18)).simulate('mouseup');

      $(getCell(4, 4)).simulate('mousedown');
      $(getCell(16, 19)).simulate('mouseover');
      $(getCell(16, 19)).simulate('mouseup');

      $(getCell(5, 5)).simulate('mousedown');
      $(getCell(15, 20)).simulate('mouseover');
      $(getCell(15, 20)).simulate('mouseup');

      $(getCell(6, 6)).simulate('mousedown');
      $(getCell(14, 21)).simulate('mouseover');
      $(getCell(14, 21)).simulate('mouseup');

      $(getCell(7, 7)).simulate('mousedown');
      $(getCell(13, 22)).simulate('mouseover');
      $(getCell(13, 22)).simulate('mouseup');

      $(getCell(8, 8)).simulate('mousedown');
      $(getCell(12, 23)).simulate('mouseover');
      $(getCell(12, 23)).simulate('mouseup');

      $(getCell(9, 9)).simulate('mousedown');
      $(getCell(11, 24)).simulate('mouseover');
      $(getCell(11, 24)).simulate('mouseup');

      $(getCell(10, 10)).simulate('mousedown');
      $(getCell(10, 25)).simulate('mouseover');
      $(getCell(10, 25)).simulate('mouseup');

      expect(`
        |   ║ - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - : - :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : H : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 7 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 6 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 5 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 4 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 3 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 2 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 1 : 0 :   :   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should call afterSelection and afterSelectionEnd hooks with proper arguments', () => {
      const hooks = jasmine.createSpyObj('hooks', ['afterSelection', 'afterSelectionEnd']);
      handsontable({
        startRows: 21,
        startCols: 30,
        selectionMode: 'multiple',
        afterSelection: hooks.afterSelection,
        afterSelectionEnd: hooks.afterSelectionEnd,
      });

      $(getCell(0, 0)).simulate('mousedown');
      $(getCell(20, 15)).simulate('mouseover');
      $(getCell(20, 15)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([0, 0, 0, 0, jasmine.any(Object), 0]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([0, 0, 20, 15, jasmine.any(Object), 0]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([0, 0, 20, 15, 0, void 0]);

      keyDown('ctrl');
      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(19, 16)).simulate('mouseover');
      $(getCell(19, 16)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([1, 1, 1, 1, jasmine.any(Object), 1]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([1, 1, 19, 16, jasmine.any(Object), 1]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([1, 1, 19, 16, 1, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(18, 17)).simulate('mouseover');
      $(getCell(18, 17)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([2, 2, 2, 2, jasmine.any(Object), 2]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([2, 2, 18, 17, jasmine.any(Object), 2]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([2, 2, 18, 17, 2, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(17, 18)).simulate('mouseover');
      $(getCell(17, 18)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([3, 3, 3, 3, jasmine.any(Object), 3]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([3, 3, 17, 18, jasmine.any(Object), 3]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([3, 3, 17, 18, 3, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(4, 4)).simulate('mousedown');
      $(getCell(16, 19)).simulate('mouseover');
      $(getCell(16, 19)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([4, 4, 4, 4, jasmine.any(Object), 4]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([4, 4, 16, 19, jasmine.any(Object), 4]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([4, 4, 16, 19, 4, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(5, 5)).simulate('mousedown');
      $(getCell(15, 20)).simulate('mouseover');
      $(getCell(15, 20)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([5, 5, 5, 5, jasmine.any(Object), 5]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([5, 5, 15, 20, jasmine.any(Object), 5]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([5, 5, 15, 20, 5, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(6, 6)).simulate('mousedown');
      $(getCell(14, 21)).simulate('mouseover');
      $(getCell(14, 21)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([6, 6, 6, 6, jasmine.any(Object), 6]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([6, 6, 14, 21, jasmine.any(Object), 6]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([6, 6, 14, 21, 6, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(7, 7)).simulate('mousedown');
      $(getCell(13, 22)).simulate('mouseover');
      $(getCell(13, 22)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([7, 7, 7, 7, jasmine.any(Object), 7]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([7, 7, 13, 22, jasmine.any(Object), 7]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([7, 7, 13, 22, 7, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(8, 8)).simulate('mousedown');
      $(getCell(12, 23)).simulate('mouseover');
      $(getCell(12, 23)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([8, 8, 8, 8, jasmine.any(Object), 8]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([8, 8, 12, 23, jasmine.any(Object), 8]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([8, 8, 12, 23, 8, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(9, 9)).simulate('mousedown');
      $(getCell(11, 24)).simulate('mouseover');
      $(getCell(11, 24)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([9, 9, 9, 9, jasmine.any(Object), 9]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([9, 9, 11, 24, jasmine.any(Object), 9]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([9, 9, 11, 24, 9, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(10, 10)).simulate('mousedown');
      $(getCell(10, 25)).simulate('mouseover');
      $(getCell(10, 25)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([10, 10, 10, 10, jasmine.any(Object), 10]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([10, 10, 10, 25, jasmine.any(Object), 10]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([10, 10, 10, 25, 10, void 0]);
    });

    it('should call afterSelectionByProp and afterSelectionEndByProp hooks with proper arguments', () => {
      const hooks = jasmine.createSpyObj('hooks', ['afterSelection', 'afterSelectionEnd']);
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(21, 30),
        selectionMode: 'multiple',
        afterSelectionByProp: hooks.afterSelection,
        afterSelectionEndByProp: hooks.afterSelectionEnd,
      });

      $(getCell(0, 0)).simulate('mousedown');
      $(getCell(20, 15)).simulate('mouseover');
      $(getCell(20, 15)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([0, 'prop0', 0, 'prop0', jasmine.any(Object), 0]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([0, 'prop0', 20, 'prop15', jasmine.any(Object), 0]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([0, 'prop0', 20, 'prop15', 0, void 0]);

      keyDown('ctrl');
      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(1, 1)).simulate('mousedown');
      $(getCell(19, 16)).simulate('mouseover');
      $(getCell(19, 16)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([1, 'prop1', 1, 'prop1', jasmine.any(Object), 1]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([1, 'prop1', 19, 'prop16', jasmine.any(Object), 1]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([1, 'prop1', 19, 'prop16', 1, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(2, 2)).simulate('mousedown');
      $(getCell(18, 17)).simulate('mouseover');
      $(getCell(18, 17)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([2, 'prop2', 2, 'prop2', jasmine.any(Object), 2]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([2, 'prop2', 18, 'prop17', jasmine.any(Object), 2]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([2, 'prop2', 18, 'prop17', 2, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(3, 3)).simulate('mousedown');
      $(getCell(17, 18)).simulate('mouseover');
      $(getCell(17, 18)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([3, 'prop3', 3, 'prop3', jasmine.any(Object), 3]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([3, 'prop3', 17, 'prop18', jasmine.any(Object), 3]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([3, 'prop3', 17, 'prop18', 3, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(4, 4)).simulate('mousedown');
      $(getCell(16, 19)).simulate('mouseover');
      $(getCell(16, 19)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([4, 'prop4', 4, 'prop4', jasmine.any(Object), 4]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([4, 'prop4', 16, 'prop19', jasmine.any(Object), 4]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([4, 'prop4', 16, 'prop19', 4, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(5, 5)).simulate('mousedown');
      $(getCell(15, 20)).simulate('mouseover');
      $(getCell(15, 20)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([5, 'prop5', 5, 'prop5', jasmine.any(Object), 5]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([5, 'prop5', 15, 'prop20', jasmine.any(Object), 5]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([5, 'prop5', 15, 'prop20', 5, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(6, 6)).simulate('mousedown');
      $(getCell(14, 21)).simulate('mouseover');
      $(getCell(14, 21)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([6, 'prop6', 6, 'prop6', jasmine.any(Object), 6]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([6, 'prop6', 14, 'prop21', jasmine.any(Object), 6]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([6, 'prop6', 14, 'prop21', 6, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(7, 7)).simulate('mousedown');
      $(getCell(13, 22)).simulate('mouseover');
      $(getCell(13, 22)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([7, 'prop7', 7, 'prop7', jasmine.any(Object), 7]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([7, 'prop7', 13, 'prop22', jasmine.any(Object), 7]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([7, 'prop7', 13, 'prop22', 7, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(8, 8)).simulate('mousedown');
      $(getCell(12, 23)).simulate('mouseover');
      $(getCell(12, 23)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([8, 'prop8', 8, 'prop8', jasmine.any(Object), 8]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([8, 'prop8', 12, 'prop23', jasmine.any(Object), 8]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([8, 'prop8', 12, 'prop23', 8, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(9, 9)).simulate('mousedown');
      $(getCell(11, 24)).simulate('mouseover');
      $(getCell(11, 24)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([9, 'prop9', 9, 'prop9', jasmine.any(Object), 9]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([9, 'prop9', 11, 'prop24', jasmine.any(Object), 9]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([9, 'prop9', 11, 'prop24', 9, void 0]);

      hooks.afterSelection.calls.reset();
      hooks.afterSelectionEnd.calls.reset();

      $(getCell(10, 10)).simulate('mousedown');
      $(getCell(10, 25)).simulate('mouseover');
      $(getCell(10, 25)).simulate('mouseup');

      expect(hooks.afterSelection.calls.count()).toBe(2);
      expect(hooks.afterSelection.calls.argsFor(0)).toEqual([10, 'prop10', 10, 'prop10', jasmine.any(Object), 10]);
      expect(hooks.afterSelection.calls.argsFor(1)).toEqual([10, 'prop10', 10, 'prop25', jasmine.any(Object), 10]);
      expect(hooks.afterSelectionEnd.calls.count()).toBe(1);
      expect(hooks.afterSelectionEnd.calls.argsFor(0)).toEqual([10, 'prop10', 10, 'prop25', 10, void 0]);
    });
  });

  describe('selectionStyle configuration', () => {
    const builtins = {
      cell: { borderWidth: 2, borderColor: '#4b89ff', _borderColorRgb: 'rgb(75, 137, 255)' },
      area: { borderWidth: 1, borderColor: '#4b89ff', _borderColorRgb: 'rgb(75, 137, 255)' },
      fill: { borderWidth: 1, borderColor: '#ff0000', _borderColorRgb: 'rgb(255, 0, 0)' },
    };

    const customs = {
      cell: { borderWidth: 3, borderColor: 'pink', _borderColorRgb: 'rgb(255, 192, 203)' },
      area: { borderWidth: 2, borderColor: 'rgb(11, 22, 33)', _borderColorRgb: 'rgb(11, 22, 33)' },
      fill: { borderWidth: 2, borderColor: 'hsl(120, 100%, 75%)', _borderColorRgb: 'rgb(128, 255, 128)' },
    };

    const mobileBrowserUAS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B411 Safari/600.1.4';

    const pathOfWidthAndColor = (width, color) => {
      return spec().$container.find(`path[stroke-width='${width}'][stroke='${color}']`)[0];
    };

    const borderOfSelector = (selector) => {
      return spec().$container.find(selector).css('border-top-color');
    };

    const backgroundOfSelector = (selector) => {
      return spec().$container.find(selector).css('background-color');
    };

    describe('disabling', () => {
      it('should revert to default configuration if selectionStyle is changed to an empty object in updateSettings', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: customs
        });
        updateSettings({ selectionStyle: {} });
        selectCell(1, 1);

        spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
        spec().$container.find('tbody tr:eq(2) td:eq(1)').simulate('mouseover');

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, builtins.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(backgroundOfSelector('.wtBorder.current.corner')).withContext('fill handle').toBe(builtins.cell._borderColorRgb);
        expect(pathOfWidthAndColor(builtins.fill.borderWidth, builtins.fill.borderColor)).withContext('fill').toBeNonEmptySVGPath();
      });
    });

    describe('desktop, single selection', () => {
      it('should use default configuration if selectionStyle is not provided', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        });
        selectCell(1, 1);

        spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
        spec().$container.find('tbody tr:eq(2) td:eq(1)').simulate('mouseover');

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, builtins.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(backgroundOfSelector('.wtBorder.current.corner')).withContext('fill handle').toBe(builtins.cell._borderColorRgb);
        expect(pathOfWidthAndColor(builtins.fill.borderWidth, builtins.fill.borderColor)).withContext('fill').toBeNonEmptySVGPath();
      });

      it('should fall back to default configuration if selectionStyle is partially provided', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: {
            cell: {
              borderColor: customs.cell.borderColor
            }
          }
        });
        selectCell(1, 1);

        spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
        spec().$container.find('tbody tr:eq(2) td:eq(1)').simulate('mouseover');

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, customs.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(backgroundOfSelector('.wtBorder.current.corner')).withContext('fill handle').toBe(customs.cell._borderColorRgb);
        expect(pathOfWidthAndColor(builtins.fill.borderWidth, builtins.fill.borderColor)).withContext('fill').toBeNonEmptySVGPath();
      });

      it('should use selectionStyle if all properties are provided', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: customs
        });
        selectCell(1, 1);

        spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
        spec().$container.find('tbody tr:eq(2) td:eq(1)').simulate('mouseover');

        expect(pathOfWidthAndColor(customs.cell.borderWidth, customs.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(backgroundOfSelector('.wtBorder.current.corner')).withContext('fill handle').toBe(customs.cell._borderColorRgb);
        expect(pathOfWidthAndColor(customs.fill.borderWidth, customs.fill.borderColor)).withContext('fill').toBeNonEmptySVGPath();
      });
    });

    describe('mobile, single single selection', () => {
      it('should use default configuration if selectionStyle is not provided', () => {
        Handsontable.helper.setBrowserMeta({
          userAgent: mobileBrowserUAS
        });

        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        });
        selectCell(1, 1);

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, builtins.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(borderOfSelector('.topLeftSelectionHandle'))
          .withContext('top left selection handle').toBe(builtins.cell._borderColorRgb);
        expect(borderOfSelector('.bottomRightSelectionHandle'))
          .withContext('bottom right selection handle').toBe(builtins.cell._borderColorRgb);

        Handsontable.helper.setBrowserMeta(); // reset to original value from the current browser
      });

      it('should fall back to default configuration if selectionStyle is partially provided', () => {
        Handsontable.helper.setBrowserMeta({
          userAgent: mobileBrowserUAS
        });

        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: {
            cell: {
              borderColor: customs.cell.borderColor
            }
          }
        });
        selectCell(1, 1);

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, customs.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(borderOfSelector('.topLeftSelectionHandle'))
          .withContext('top left selection handle').toBe(customs.cell._borderColorRgb);
        expect(borderOfSelector('.bottomRightSelectionHandle'))
          .withContext('bottom right selection handle').toBe(customs.cell._borderColorRgb);

        Handsontable.helper.setBrowserMeta(); // reset to original value from the current browser
      });

      it('should use selectionStyle if all properties are provided', () => {
        Handsontable.helper.setBrowserMeta({
          userAgent: mobileBrowserUAS
        });

        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: customs
        });
        selectCell(1, 1);

        expect(pathOfWidthAndColor(customs.cell.borderWidth, customs.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(borderOfSelector('.topLeftSelectionHandle'))
          .withContext('top left selection handle').toBe(customs.cell._borderColorRgb);
        expect(borderOfSelector('.bottomRightSelectionHandle'))
          .withContext('bottom right selection handle').toBe(customs.cell._borderColorRgb);

        Handsontable.helper.setBrowserMeta(); // reset to original value from the current browser
      });
    });

    describe('desktop, multiple selection', () => {
      it('should use default configuration if selectionStyle is not provided', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        });
        selectCell(0, 0, 1, 1);

        spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
        spec().$container.find('tbody tr:eq(2) td:eq(1)').simulate('mouseover');

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, builtins.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(pathOfWidthAndColor(builtins.area.borderWidth, builtins.area.borderColor)).withContext('area').toBeNonEmptySVGPath();
        expect(backgroundOfSelector('.wtBorder.area.corner')).withContext('fill handle').toBe(builtins.area._borderColorRgb);
        expect(pathOfWidthAndColor(builtins.fill.borderWidth, builtins.fill.borderColor)).withContext('fill').toBeNonEmptySVGPath();
      });

      it('should fall back to default configuration if selectionStyle is partially provided', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: {
            cell: {
              borderColor: customs.cell.borderColor
            }
          }
        });
        selectCell(0, 0, 1, 1);

        spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
        spec().$container.find('tbody tr:eq(2) td:eq(1)').simulate('mouseover');

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, customs.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(pathOfWidthAndColor(builtins.area.borderWidth, builtins.area.borderColor)).withContext('area').toBeNonEmptySVGPath();
        expect(backgroundOfSelector('.wtBorder.area.corner')).withContext('fill handle').toBe(builtins.area._borderColorRgb);
        expect(pathOfWidthAndColor(builtins.fill.borderWidth, builtins.fill.borderColor)).withContext('fill').toBeNonEmptySVGPath();
      });

      it('should use selectionStyle if all properties are provided', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: customs
        });
        selectCell(0, 0, 1, 1);

        spec().$container.find('.wtBorder.area.corner').simulate('mousedown');
        spec().$container.find('tbody tr:eq(2) td:eq(1)').simulate('mouseover');

        expect(pathOfWidthAndColor(customs.cell.borderWidth, customs.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(pathOfWidthAndColor(customs.area.borderWidth, customs.area.borderColor)).withContext('area').toBeNonEmptySVGPath();
        expect(backgroundOfSelector('.wtBorder.area.corner')).withContext('fill handle').toBe(customs.area._borderColorRgb);
        expect(pathOfWidthAndColor(customs.fill.borderWidth, customs.fill.borderColor)).withContext('fill').toBeNonEmptySVGPath();
      });
    });

    describe('mobile, multiple selection', () => {
      it('should use default configuration if selectionStyle is not provided', () => {
        Handsontable.helper.setBrowserMeta({
          userAgent: mobileBrowserUAS
        });

        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        });
        selectCell(0, 0, 1, 1);

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, builtins.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(pathOfWidthAndColor(builtins.area.borderWidth, builtins.area.borderColor)).withContext('area').toBeNonEmptySVGPath();
        expect(borderOfSelector('.topLeftSelectionHandle'))
          .withContext('top left selection handle').toBe(builtins.area._borderColorRgb);
        expect(borderOfSelector('.bottomRightSelectionHandle'))
          .withContext('bottom right selection handle').toBe(builtins.area._borderColorRgb);

        Handsontable.helper.setBrowserMeta(); // reset to original value from the current browser
      });

      it('should fall back to default configuration if selectionStyle is partially provided', () => {
        Handsontable.helper.setBrowserMeta({
          userAgent: mobileBrowserUAS
        });

        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: {
            cell: {
              borderColor: customs.cell.borderColor
            }
          }
        });
        selectCell(0, 0, 1, 1);

        expect(pathOfWidthAndColor(builtins.cell.borderWidth, customs.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(pathOfWidthAndColor(builtins.area.borderWidth, builtins.area.borderColor)).withContext('area').toBeNonEmptySVGPath();
        expect(borderOfSelector('.topLeftSelectionHandle'))
          .withContext('top left selection handle').toBe(customs.cell._borderColorRgb);
        expect(borderOfSelector('.bottomRightSelectionHandle'))
          .withContext('bottom right selection handle').toBe(customs.cell._borderColorRgb);

        Handsontable.helper.setBrowserMeta(); // reset to original value from the current browser
      });

      it('should use selectionStyle if all properties are provided', () => {
        Handsontable.helper.setBrowserMeta({
          userAgent: mobileBrowserUAS
        });

        handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
          selectionStyle: customs
        });
        selectCell(0, 0, 1, 1);

        expect(pathOfWidthAndColor(customs.cell.borderWidth, customs.cell.borderColor)).withContext('current').toBeNonEmptySVGPath();
        expect(pathOfWidthAndColor(customs.area.borderWidth, customs.area.borderColor)).withContext('area').toBeNonEmptySVGPath();
        expect(borderOfSelector('.topLeftSelectionHandle'))
          .withContext('top left selection handle').toBe(customs.cell._borderColorRgb);
        expect(borderOfSelector('.bottomRightSelectionHandle'))
          .withContext('bottom right selection handle').toBe(customs.cell._borderColorRgb);

        Handsontable.helper.setBrowserMeta(); // reset to original value from the current browser
      });
    });
  });
});
