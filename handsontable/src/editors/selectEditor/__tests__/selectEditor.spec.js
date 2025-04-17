describe('SelectEditor', () => {

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

  it('should render an editor in specified position at cell 0, 0', async() => {
    handsontable({
      columns: [{ editor: 'select' }],
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');
    const editor = $('.htSelectEditor').children('select');

    expect(editorWrapper.length).toEqual(1);
    expect(editor.length).toEqual(1);
    expect(editor.is('select')).toBe(true);
    expect(editorWrapper.is(':visible')).toBe(false);
    expect(editor.is(':visible')).toBe(false);

    await keyDownUp('enter');

    expect(editorWrapper.is(':visible')).toBe(true);
    expect(editor.is(':visible')).toBe(true);
    expect(editorWrapper.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position at cell 0, 0 when all headers are selected', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      columns: [{ editor: 'select' }, {}],
    });

    await listen();

    await selectAll();

    const editorWrapper = $('.htSelectEditor');
    const editor = $('.htSelectEditor').children('select');

    expect(editorWrapper.length).toEqual(1);
    expect(editor.length).toEqual(1);
    expect(editor.is('select')).toBe(true);
    expect(editorWrapper.is(':visible')).toBe(false);
    expect(editor.is(':visible')).toBe(false);

    await keyDownUp('F2');

    expect(editorWrapper.is(':visible')).toBe(true);
    expect(editor.is(':visible')).toBe(true);
    expect(editorWrapper.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it('should render an editor in specified position while opening an editor from top to bottom when ' +
     'top and bottom overlays are enabled', async() => {
    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [{ editor: 'select' }, {}],
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    expect(editorWrapper.offset()).toEqual($(getCell(0, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editorWrapper.offset().top + 1,
      left: editorWrapper.offset().left,
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
    expect(editorWrapper.offset()).toEqual($(getCell(5, 0, true)).offset());

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
      editor: 'select',
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    expect(editorWrapper.offset()).toEqual($(getCell(0, 0, true)).offset());

    await selectCell(0, 1);
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editorWrapper.offset().top,
      left: editorWrapper.offset().left + 1,
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
      columns: [{ editor: 'select' }, {}],
    });

    await selectCell(1, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    // First renderable row index.
    expect(editorWrapper.offset()).toEqual($(getCell(1, 0, true)).offset());

    await keyDownUp('enter');
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editorWrapper.offset().top + 1,
      left: editorWrapper.offset().left,
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
    expect(editorWrapper.offset()).toEqual($(getCell(6, 0, true)).offset());

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
      editor: 'select',
    });

    await selectCell(0, 1);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    // First renderable column index.
    expect(editorWrapper.offset()).toEqual($(getCell(0, 1, true)).offset());

    await selectCell(0, 2);
    await keyDownUp('enter');

    // Cells that do not touch the edges of the table have an additional left border.
    const editorOffset = () => ({
      top: editorWrapper.offset().top,
      left: editorWrapper.offset().left + 1,
    });

    expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

    await selectCell(0, 3);
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

    await selectCell(0, 4);
    await keyDownUp('enter');

    expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
  });

  it('should display and correctly reposition select editor while scrolling', async() => {
    handsontable({
      width: 200,
      height: 200,
      data: createSpreadsheetData(100, 100),
      columns: [
        {
          editor: 'select'
        }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { editor: 'select' }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    await scrollViewportVertically(10);
    await scrollViewportHorizontally(20);

    const editorWrapper = $('.htSelectEditor');

    expect(editorWrapper.css('top')).toEqual('-10px');
    expect(editorWrapper.css('left')).toEqual('-20px');
  });

  it('should not highlight the input element by browsers native selection', async() => {
    handsontable({
      editor: 'select',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editorWrapper = $('.htSelectEditor')[0];

    expect(window.getComputedStyle(editorWrapper, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should populate select with given options (array)', async() => {
    const options = [
      'Misubishi', 'Chevrolet', 'Lamborgini'
    ];

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    const $options = editorWrapper.find('option');

    expect($options.length).toEqual(options.length);
    expect($options.eq(0).val()).toMatch(options[0]);
    expect($options.eq(0).html()).toMatch(options[0]);
    expect($options.eq(1).val()).toMatch(options[1]);
    expect($options.eq(1).html()).toMatch(options[1]);
    expect($options.eq(2).val()).toMatch(options[2]);
    expect($options.eq(2).html()).toMatch(options[2]);
  });

  it('should populate select with given options (object)', async() => {
    const options = {
      mit: 'Misubishi',
      che: 'Chevrolet',
      lam: 'Lamborgini'
    };

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    const $options = editorWrapper.find('option');

    expect($options.eq(0).val()).toMatch('mit');
    expect($options.eq(0).html()).toMatch(options.mit);
    expect($options.eq(1).val()).toMatch('che');
    expect($options.eq(1).html()).toMatch(options.che);
    expect($options.eq(2).val()).toMatch('lam');
    expect($options.eq(2).html()).toMatch(options.lam);
  });

  it('should use visual indexes and property as function\'s argument', async() => {
    const options = jasmine.createSpy('options');

    handsontable({
      data: [
        { a: 'A1', b: 'B1', c: 'C1', d: 'D1' },
        { a: 'A2', b: 'B2', c: 'C2', d: 'D2' },
        { a: 'A3', b: 'B3', c: 'C3', d: 'D3' },
        { a: 'A4', b: 'B4', c: 'C4', d: 'D4' },
      ],
      editor: 'select',
      selectOptions: options
    });

    await selectCell(1, 1);
    await selectCell(0, 2);
    await selectCell(3, 3);

    expect(options).toHaveBeenCalledTimes(3);
    expect(options).toHaveBeenCalledWith(1, 1, 'b');
    expect(options).toHaveBeenCalledWith(0, 2, 'c');
    expect(options).toHaveBeenCalledWith(3, 3, 'd');

  });

  it('should populate select with given options (function:array)', async() => {
    const options = function() {
      return [
        'Misubishi', 'Chevrolet', 'Lamborgini'
      ];
    };

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    const $options = editorWrapper.find('option');

    expect($options.length).toEqual(options().length);
    expect($options.eq(0).val()).toMatch(options()[0]);
    expect($options.eq(0).html()).toMatch(options()[0]);
    expect($options.eq(1).val()).toMatch(options()[1]);
    expect($options.eq(1).html()).toMatch(options()[1]);
    expect($options.eq(2).val()).toMatch(options()[2]);
    expect($options.eq(2).html()).toMatch(options()[2]);
  });

  it('should populate select with given options (function:object)', async() => {
    const options = function() {
      return {
        mit: 'Misubishi',
        che: 'Chevrolet',
        lam: 'Lamborgini'
      };
    };

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    const $options = editorWrapper.find('option');

    expect($options.eq(0).val()).toMatch('mit');
    expect($options.eq(0).html()).toMatch(options().mit);
    expect($options.eq(1).val()).toMatch('che');
    expect($options.eq(1).html()).toMatch(options().che);
    expect($options.eq(2).val()).toMatch('lam');
    expect($options.eq(2).html()).toMatch(options().lam);
  });

  it('should mark option matching cell value as selected', async() => {
    const options = [
      'Misubishi', 'Chevrolet', 'Lamborgini'
    ];

    handsontable({
      data: [
        ['Misubishi'],
        ['Lamborgini'],
        ['Chevrolet']
      ],
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    expect(editorWrapper.find('option:selected').text()).toEqual(getDataAtCell(0, 0));

    await keyDownUp('enter');
    await selectCell(1, 0);
    await keyDownUp('enter');

    expect(editorWrapper.find('option:selected').text()).toEqual(getDataAtCell(1, 0));

    await keyDownUp('enter');
    await selectCell(2, 0);
    await keyDownUp('enter');

    expect(editorWrapper.find('option:selected').text()).toEqual(getDataAtCell(2, 0));
  });

  it('should not prevent the default event action when select is clicked', async() => {

    const options = function() {
      return [
        'Misubishi', 'Chevrolet', 'Lamborgini'
      ];
    };

    handsontable({
      columns: [
        {
          editor: 'select',
          selectOptions: options
        }
      ]
    });

    await selectCell(0, 0);

    const editorWrapper = $('.htSelectEditor');

    await keyDownUp('enter');

    const selectMouseDownListener = jasmine.createSpy('selectMouseDownListener');

    $('body').on('mousedown', selectMouseDownListener);

    editorWrapper.mousedown();

    expect(selectMouseDownListener.calls.count()).toEqual(1);

    const event = selectMouseDownListener.calls.argsFor(0)[0];

    expect(event).toBeDefined();
    expect(event.isDefaultPrevented()).toBe(false);
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'select',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().select;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });
});
