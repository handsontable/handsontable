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

  it('should return true in the `isOpened` after open the numeric editor', async() => {
    handsontable({
      type: 'numeric',
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    await keyDownUp('enter');

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the numeric editor', async() => {
    handsontable({
      type: 'numeric'
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
          type: 'numeric'
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
          type: 'numeric'
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
          type: 'numeric'
        },
        {},
      ],
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
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
      type: 'numeric'
    });

    await selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    await selectCell(0, 1);
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await sleep(100); // Caused by async DateEditor close.
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
          type: 'numeric'
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
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

    await keyDownUp('enter');
    await sleep(100); // Caused by async DateEditor close.
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
      type: 'numeric',
    });

    await selectCell(0, 1);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('enter');

    // First renderable column index.
    expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editor.offset().top,
      left: editor.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await sleep(100); // Caused by async DateEditor close.
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should not highlight the input element by browsers native selection', async() => {
    handsontable({
      type: 'numeric',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

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

    await selectCell(2, 0);
    await keyDownUp('enter');

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

    await selectCell(0, 1);
    await keyDownUp('enter');

    document.activeElement.value = '100.000,0';

    destroyEditor();

    await sleep(100);

    await selectCell(1, 1);
    await keyDownUp('enter');

    document.activeElement.value = '200,000.5';

    destroyEditor();

    await sleep(100);

    await selectCell(0, 2);
    await keyDownUp('enter');

    document.activeElement.value = '300,000.5';

    destroyEditor();

    await sleep(100);

    await selectCell(1, 2);
    await keyDownUp('enter');

    document.activeElement.value = '300.000,5';

    destroyEditor();

    await sleep(100);

    await selectCell(0, 3);
    await keyDownUp('enter');

    document.activeElement.value = '400.000,5';

    destroyEditor();

    await sleep(100);

    await selectCell(1, 3);
    await keyDownUp('enter');

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

    await selectCell(2, 0);
    await keyDownUp('enter');

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

    await selectCell(2, 0);
    await keyDownUp('enter');

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

    await selectCell(2, 0);
    await keyDownUp('enter');

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

    await selectCell(0, 0);
    await keyDownUp('delete');

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

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = '12aaa34';

    destroyEditor();

    await sleep(100);

    await selectCell(1, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'aaa34';

    destroyEditor();

    await sleep(100);

    await selectCell(2, 0);
    await keyDownUp('enter');

    document.activeElement.value = '12aaa';

    destroyEditor();

    // Column with specified formatting

    await sleep(100);

    await selectCell(0, 1);
    await keyDownUp('enter');

    document.activeElement.value = '12aaa34';

    destroyEditor();

    await sleep(100);

    await selectCell(1, 1);
    await keyDownUp('enter');

    document.activeElement.value = 'aaa34';

    destroyEditor();

    await sleep(100);

    await selectCell(2, 1);
    await keyDownUp('enter');

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

    await selectCell(2, 0);
    await keyDownUp('enter');

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

    await selectCell(2, 0);
    await keyDownUp('enter');

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

    await selectCell(2, 0);
    await keyDownUp('enter');

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

    await selectCell(2, 0);
    await keyDownUp('enter');

    document.activeElement.value = '2456,220';

    destroyEditor();

    await sleep(100);

    expect(getCell(2, 0).innerHTML).toEqual('2.456,22 €');

    await selectCell(2, 3);
    await keyDownUp('enter');

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

    await selectCell(0, 1);
    await keyDownUp('enter');

    await sleep(100);

    expect(document.activeElement.value).toEqual('222.5');

    // closing editor
    await keyDownUp('enter');
    await sleep(100);

    expect(getDataAtCell(0, 1)).toEqual(222.5);

    await selectCell(0, 2);
    await keyDownUp('enter');
    await sleep(100);

    expect(document.activeElement.value).toEqual('1222.6');

    // closing editor
    await keyDownUp('enter');
    await sleep(100);

    expect(getDataAtCell(0, 2)).toEqual(1222.6);

    await selectCell(0, 3);
    await keyDownUp('enter');
    await sleep(100);

    expect(document.activeElement.value).toEqual('1333.5');

    // closing editor
    await keyDownUp('enter');
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

    await mouseDoubleClick(getCell(0, 1));
    await sleep(100);

    expect(document.activeElement.value).toEqual('222.5');

    // closing editor
    await keyDownUp('enter');
    await sleep(100);

    expect(getDataAtCell(0, 1)).toEqual(222.5);

    await mouseDoubleClick(getCell(0, 2));
    await sleep(100);

    expect(document.activeElement.value).toEqual('1222.6');

    // closing editor
    await keyDownUp('enter');
    await sleep(100);

    expect(getDataAtCell(0, 2)).toEqual(1222.6);

    await mouseDoubleClick(getCell(0, 3));
    await sleep(100);

    expect(document.activeElement.value).toEqual('1333.5');

    // closing editor
    await keyDownUp('enter');
    await sleep(100);

    expect(getDataAtCell(0, 3)).toEqual(1333.5);
  });

  it('should mark text as invalid without removing when using `setDataAtCell`', async() => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name' },
        { data: 'lastName' }
      ],
    });

    await setDataAtCell(0, 0, 'abc');

    await sleep(200);

    expect(getDataAtCell(0, 0)).toEqual('abc');
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

    await selectCell(2, 0);
    await keyDownUp('enter');

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
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id', type: 'numeric', numericFormat: { pattern: '0,0.00', culture: 'en-US' } },
        { data: 'name' },
        { data: 'lastName' }
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

  it('should not throw error on closing editor when column data is defined as \'length\'', async() => {
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

    await selectCell(1, 0);
    await keyDownUp('enter');

    document.activeElement.value = '999';

    expect(() => {
      destroyEditor();
    }).not.toThrow();
  });

  describe('Cell corner is showed properly when changing focused cells #3877', () => {
    const isFocusedCellDisplayingCornerTest = async function(settings) {
      const moveFromRow = settings.moveFromRow;
      const moveFromCol = settings.moveFromCol;
      const moveToRow = settings.moveToRow;
      const moveToCol = settings.moveToCol;
      const $corner = settings.$container.find('.wtBorder.current.corner');

      await selectCell(moveFromRow, moveFromCol);
      await keyDownUp('enter');
      await selectCell(moveToRow, moveToCol);
      await sleep(100);

      expect($corner.css('display')).toEqual('block');
    };

    it('Moving from numeric editor to text editor', async() => {
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

      await isFocusedCellDisplayingCornerTest({
        moveFromRow: 0,
        moveFromCol: 3,
        moveToRow: 0,
        moveToCol: 0,
        $container: spec().$container,
      });
    });

    it('Moving from text editor to numeric editor', async() => {
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

      await isFocusedCellDisplayingCornerTest({
        moveFromRow: 0,
        moveFromCol: 1,
        moveToRow: 0,
        moveToCol: 3,
        $container: spec().$container,
      });
    });
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'numeric',
    });

    await selectCell(0, 0);

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

      await selectCell(0, 0, 0, 0, true, false);

      // The `imeFastEdit` timeout is set to 50ms.
      await sleep(55);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
