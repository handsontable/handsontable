describe('NumericEditor', () => {
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

  const arrayOfObjects = function() {
    return [
      { id: 1, name: 'Ted', lastName: 'Right' },
      { id: 2, name: 'Frank', lastName: 'Honest' },
      { id: 3, name: 'Joan', lastName: 'Well' },
      { id: 4, name: 'Sid', lastName: 'Strong' },
      { id: 5, name: 'Jane', lastName: 'Neat' },
      { id: 6, name: 'Chuck', lastName: 'Jackson' },
      { id: 7, name: 'Meg', lastName: 'Jansen' },
      { id: 8, name: 'Rob', lastName: 'Norris' },
      { id: 9, name: 'Sean', lastName: 'O\'Hara' },
      { id: 10, name: 'Eve', lastName: 'Branson' }
    ];
  };

  it('should render an editor in specified position at cell 0, 0', () => {
    handsontable({
      columns: [
        {
          type: 'numeric'
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
          type: 'numeric'
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
     'top and bottom overlays are enabled', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          type: 'numeric'
        },
        {},
      ],
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      type: 'numeric'
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    selectCell(0, 1);
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

    selectCell(0, 2);
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    selectCell(0, 3);
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    selectCell(0, 4);
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
       'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
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
          type: 'numeric'
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
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

    keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled and the first column of the overlay is hidden', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      hiddenColumns: {
        indicators: true,
        columns: [0],
      },
      type: 'numeric',
    });

    selectCell(0, 1);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');

    // First renderable column index.
    expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

    selectCell(0, 2);
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    selectCell(0, 3);
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    selectCell(0, 4);
    await sleep(100); // Caused by async DateEditor close.
    keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should not highlight the input element by browsers native selection', () => {
    handsontable({
      type: 'numeric',
    });

    selectCell(0, 0);
    keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should convert "integer like" input value to number (object data source)', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
        { data: 'lastName' }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '999';

    destroyEditor();

    await sleep(100);

    expect(typeof getDataAtCell(2, 0)).toEqual('number');
    expect(getDataAtCell(2, 0)).toEqual(999);
  });

  it('should not convert formatted "float like" input value to number (object data source) #4706', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id' },
        { data: 'price_eur', type: 'numeric' },
        { data: 'price_pln', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } },
        { data: 'price_aud', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'de-DE' } }
      ]
    });

    selectCell(0, 1);
    keyDownUp('enter');

    document.activeElement.value = '100.000,0';

    destroyEditor();

    await sleep(100);

    selectCell(1, 1);
    keyDownUp('enter');

    document.activeElement.value = '200,000.5';

    destroyEditor();

    await sleep(100);

    selectCell(0, 2);
    keyDownUp('enter');

    document.activeElement.value = '300,000.5';

    destroyEditor();

    await sleep(100);

    selectCell(1, 2);
    keyDownUp('enter');

    document.activeElement.value = '300.000,5';

    destroyEditor();

    await sleep(100);

    selectCell(0, 3);
    keyDownUp('enter');

    document.activeElement.value = '400.000,5';

    destroyEditor();

    await sleep(100);

    selectCell(1, 3);
    keyDownUp('enter');

    document.activeElement.value = '400,000.5';

    destroyEditor();

    await sleep(100);

    expect(getDataAtCell(0, 1)).toEqual('100.000,0');
    expect(getDataAtCell(1, 1)).toEqual('200,000.5');
    expect(getDataAtCell(0, 2)).toEqual('300,000.5');
    expect(getDataAtCell(1, 2)).toEqual('300.000,5');
    expect(getDataAtCell(0, 3)).toEqual('400.000,5');
    expect(getDataAtCell(1, 3)).toEqual('400,000.5');
  });

  it('should convert "float like" input value with dot as determiner to number (object data source)', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'price' },
        { data: 'lastName' }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '77.70';

    destroyEditor();

    await sleep(100);

    expect(typeof getDataAtCell(2, 0)).toEqual('number');
    expect(getDataAtCell(2, 0)).toEqual(77.7);
  });

  it('should convert "float like" input value with comma as determiner to number (object data source)', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
        { data: 'lastName' }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '77,70';

    destroyEditor();

    await sleep(100);

    expect(typeof getDataAtCell(2, 0)).toEqual('number');
    expect(getDataAtCell(2, 0)).toEqual(77.7);
  });

  it('should convert "float like" input without leading zero to a float', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
        { data: 'lastName' }
      ]
    });

    selectCell(2, 0);
    keyDownUp('enter');

    document.activeElement.value = '.74';

    destroyEditor();

    await sleep(100);

    expect(getDataAtCell(2, 0)).toEqual(0.74);
  });

  it('should apply changes to editor after validation', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
      ]
    });

    selectCell(0, 0);
    keyDownUp('delete');

    await sleep(100);

    expect(getActiveEditor().originalValue).toEqual(null);
  });

  it('should not validate string input data containing numbers ', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'price', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'de-DE' } },
        { data: 'lastName' }
      ]
    });

    // Column with default formatting

    selectCell(0, 0);
    keyDownUp('enter');

    document.activeElement.value = '12aaa34';

    destroyEditor();

    await sleep(100);

    selectCell(1, 0);
    keyDownUp('enter');

    document.activeElement.value = 'aaa34';

    destroyEditor();

    await sleep(100);

    selectCell(2, 0);
    keyDownUp('enter');

    document.activeElement.value = '12aaa';

    destroyEditor();

    // Column with specified formatting

    await sleep(100);

    selectCell(0, 1);
    keyDownUp('enter');

    document.activeElement.value = '12aaa34';

    destroyEditor();

    await sleep(100);

    selectCell(1, 1);
    keyDownUp('enter');

    document.activeElement.value = 'aaa34';

    destroyEditor();

    await sleep(100);

    selectCell(2, 1);
    keyDownUp('enter');

    document.activeElement.value = '12aaa';

    destroyEditor();

    await sleep(100);

    expect($(getCell(0, 0)).hasClass('htInvalid')).toBe(true);
    expect(getDataAtCell(0, 0)).toEqual('12aaa34');

    expect($(getCell(1, 0)).hasClass('htInvalid')).toBe(true);
    expect(getDataAtCell(1, 0)).toEqual('aaa34');

    expect($(getCell(2, 0)).hasClass('htInvalid')).toBe(true);
    expect(getDataAtCell(2, 0)).toEqual('12aaa');

    expect($(getCell(0, 1)).hasClass('htInvalid')).toBe(true);
    expect(getDataAtCell(0, 1)).toEqual('12aaa34');

    expect($(getCell(1, 1)).hasClass('htInvalid')).toBe(true);
    expect(getDataAtCell(1, 1)).toEqual('aaa34');

    expect($(getCell(2, 1)).hasClass('htInvalid')).toBe(true);
    expect(getDataAtCell(2, 1)).toEqual('12aaa');
  });

  it('should display a string in a format \'$X,XXX.XX\' when using language=en, appropriate format in column settings and \'XXXX.XX\' as ' +
     'an input string', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } },
        { data: 'name' },
        { data: 'lastName' }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');

    document.activeElement.value = '2456.22';

    destroyEditor();

    await sleep(100);

    expect(getCell(2, 0).innerHTML).toEqual('$2,456.22');
  });

  it('should display a string in a format \'X.XXX,XX €\' when using language=de, appropriate format in column settings and \'XXXX,XX\' as an ' +
     'input string (that comes from manual input)', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric', numericFormat: { pattern: '0,0.00 $', culture: 'de-DE' } },
        { data: 'name' },
        { data: 'lastName' }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');

    document.activeElement.value = '2456,22';

    destroyEditor();

    await sleep(100);

    expect(getCell(2, 0).innerHTML).toEqual('2.456,22 €');
  });

  it('should display a string in a format \'X.XXX,XX €\' when using language=de, appropriate format in column settings and \'XXXX.XX\' as an ' +
     'input string (that comes from paste)', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric', numericFormat: { pattern: '0,0.00 $', culture: 'de-DE' } },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });
    selectCell(2, 0);

    keyDownUp('enter');

    document.activeElement.value = '2456.22';

    destroyEditor();

    await sleep(100);

    expect(getCell(2, 0).innerHTML).toEqual('2.456,22 €');
  });

  it('should display a string in a format \'X XXX,XX €\' when using language=de, appropriate format in column settings and \'XXXX,XX\' as an ' +
     'input string and ignore not needed zeros at the end', async() => {
    handsontable({
      data: [
        { id: 1, name: 'Ted', lastName: 'Right', money: 0 },
        { id: 2, name: 'Frank', lastName: 'Honest', money: 0 },
        { id: 3, name: 'Joan', lastName: 'Well', money: 0 },
        { id: 4, name: 'Sid', lastName: 'Strong', money: 0 },
        { id: 5, name: 'Jane', lastName: 'Neat', money: 0 },
        { id: 6, name: 'Chuck', lastName: 'Jackson', money: 0 },
        { id: 7, name: 'Meg', lastName: 'Jansen', money: 0 },
        { id: 8, name: 'Rob', lastName: 'Norris', money: 0 },
        { id: 9, name: 'Sean', lastName: 'O\'Hara', money: 0 },
        { id: 10, name: 'Eve', lastName: 'Branson', money: 0 }
      ],
      columns: [
        { data: 'id', type: 'numeric', numericFormat: { pattern: '0,0.00 $', culture: 'de-DE' } },
        { data: 'name' },
        { data: 'lastName' },
        { data: 'money', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } }
      ]
    });

    selectCell(2, 0);

    keyDownUp('enter');

    document.activeElement.value = '2456,220';

    destroyEditor();

    await sleep(100);

    expect(getCell(2, 0).innerHTML).toEqual('2.456,22 €');

    selectCell(2, 3);

    keyDownUp('enter');

    document.activeElement.value = '2456.220';

    destroyEditor();

    await sleep(100);

    expect(getCell(2, 3).innerHTML).toEqual('$2,456.22');
  });

  it('should display values as "float like" string with dot as determiner after pressing enter ' +
    'and not change value after closing editor', async() => {
    handsontable({
      data: [
        { id: 1, price_eur: 222.5, price_pln: 1222.6, price_aud: 1333.5 }
      ],
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'price_eur', type: 'numeric' },
        { data: 'price_pln', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } },
        { data: 'price_aud', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'de-DE' } }
      ]
    });

    selectCell(0, 1);
    keyDownUp('enter');

    await sleep(100);

    expect(document.activeElement.value).toEqual('222.5');

    // closing editor
    keyDownUp('enter');

    await sleep(100);

    expect(getDataAtCell(0, 1)).toEqual(222.5);

    selectCell(0, 2);
    keyDownUp('enter');

    await sleep(100);

    expect(document.activeElement.value).toEqual('1222.6');

    // closing editor
    keyDownUp('enter');

    await sleep(100);

    expect(getDataAtCell(0, 2)).toEqual(1222.6);

    selectCell(0, 3);
    keyDownUp('enter');

    await sleep(100);

    expect(document.activeElement.value).toEqual('1333.5');

    // closing editor
    keyDownUp('enter');

    await sleep(100);

    expect(getDataAtCell(0, 3)).toEqual(1333.5);
  });

  it('should display values as "float like" string with dot as determiner after double click ' +
    'and not change value after closing editor', async() => {
    handsontable({
      data: [
        { id: 1, price_eur: 222.5, price_pln: 1222.6, price_aud: 1333.5 }
      ],
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'price_eur', type: 'numeric' },
        { data: 'price_pln', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } },
        { data: 'price_aud', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'de-DE' } }
      ]
    });

    mouseDoubleClick(getCell(0, 1));

    await sleep(100);

    expect(document.activeElement.value).toEqual('222.5');

    // closing editor
    keyDownUp('enter');

    await sleep(100);

    expect(getDataAtCell(0, 1)).toEqual(222.5);

    mouseDoubleClick(getCell(0, 2));

    await sleep(100);

    expect(document.activeElement.value).toEqual('1222.6');

    // closing editor
    keyDownUp('enter');

    await sleep(100);

    expect(getDataAtCell(0, 2)).toEqual(1222.6);

    mouseDoubleClick(getCell(0, 3));

    await sleep(100);

    expect(document.activeElement.value).toEqual('1333.5');

    // closing editor
    keyDownUp('enter');

    await sleep(100);

    expect(getDataAtCell(0, 3)).toEqual(1333.5);
  });

  it('should mark text as invalid without removing when using `setDataAtCell`', async() => {
    const hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
        { data: 'lastName' }
      ],
    });

    hot.setDataAtCell(0, 0, 'abc');

    await sleep(200);

    expect(hot.getDataAtCell(0, 0)).toEqual('abc');
    expect($(getCell(0, 0)).hasClass('htInvalid')).toBe(true);
  });

  it('should allow custom validator', async() => {
    handsontable({
      data: arrayOfObjects(),
      allowInvalid: false,
      columns: [
        {
          data: 'id',
          type: 'numeric',
          validator(val, cb) {
            cb(parseInt(val, 10) > 100);
          }
        },
        { data: 'name' },
        { data: 'lastName' }
      ]
    });
    selectCell(2, 0);

    keyDownUp('enter');
    document.activeElement.value = '99';

    destroyEditor();

    await sleep(100);

    expect(getDataAtCell(2, 0)).not.toEqual(99); // should be ignored

    document.activeElement.value = '999';

    destroyEditor();

    await sleep(100);

    expect(getDataAtCell(2, 0)).toEqual(999);
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
    const hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric', numericFormat: { pattern: '0,0.00', culture: 'en-US' } },
        { data: 'name' },
        { data: 'lastName' }
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

  it('should not throw error on closing editor when column data is defined as \'length\'', () => {
    handsontable({
      data: [
        { length: 4 },
        { length: 5 },
      ],
      columns: [
        {
          data: 'length', type: 'numeric'
        },
        {},
        {}
      ]
    });

    selectCell(1, 0);
    keyDownUp('enter');
    document.activeElement.value = '999';

    expect(() => {
      destroyEditor();
    }).not.toThrow();
  });

  describe('Cell corner is showed properly when changing focused cells #3877', () => {
    const isFocusedCellDisplayingCornerTest = function(settings) {
      const moveFromRow = settings.moveFromRow;
      const moveFromCol = settings.moveFromCol;
      const moveToRow = settings.moveToRow;
      const moveToCol = settings.moveToCol;
      const doneFunc = settings.doneFunc;
      const $corner = settings.$container.find('.wtBorder.current.corner');

      selectCell(moveFromRow, moveFromCol);
      keyDownUp('enter');
      selectCell(moveToRow, moveToCol);

      setTimeout(() => {
        expect($corner.css('display')).toEqual('block');
        doneFunc();
      }, 100);
    };

    it('Moving from numeric editor to text editor', (done) => {
      handsontable({
        data: [
          { id: 1, name: 'Ted', lastName: 'Right', money: 0 }
        ],
        columns: [
          { data: 'id' },
          { data: 'name' },
          { data: 'lastName' },
          { data: 'money', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } }
        ]
      });

      isFocusedCellDisplayingCornerTest({
        moveFromRow: 0,
        moveFromCol: 3,
        moveToRow: 0,
        moveToCol: 0,
        $container: spec().$container,
        doneFunc: done
      });
    });

    it('Moving from text editor to numeric editor', (done) => {
      handsontable({
        data: [
          { id: 1, name: 'Ted', lastName: 'Right', money: 0 }
        ],
        columns: [
          { data: 'id' },
          { data: 'name' },
          { data: 'lastName' },
          { data: 'money', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } }
        ]
      });

      isFocusedCellDisplayingCornerTest({
        moveFromRow: 0,
        moveFromCol: 1,
        moveToRow: 0,
        moveToCol: 3,
        $container: spec().$container,
        doneFunc: done
      });
    });
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      editor: 'numeric',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        type: 'numeric',
        numericFormat: {
          pattern: '$0,0.00',
          culture: 'en-US'
        },
        imeFastEdit: true,
      });

      selectCell(0, 0, 0, 0, true, false);

      // The `imeFastEdit` timeout is set to 50ms.
      await sleep(55);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
