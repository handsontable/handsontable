describe('HandsontableEditor', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function getManufacturerData() {
    return [
      { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
      { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
      { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
      { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
      { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
      { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' }
    ];
  }

  it('should return true in the `isOpened` after open the handsontable editor', async() => {
    handsontable({
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        data: getManufacturerData()
      }
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    await keyDownUp('enter');

    expect(editor.isOpened()).toBe(true);
  });

  it('should return false in the `isOpened` after close the handsontable editor', async() => {
    handsontable({
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        data: getManufacturerData()
      }
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
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
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
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
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
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
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
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        data: getManufacturerData()
      }
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
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
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
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        data: getManufacturerData()
      }
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
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        data: getManufacturerData()
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  it('should create an editor that is a Handsontable instance', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    await selectCell(2, 0);
    await keyDownUp('enter');

    expect(spec().$container.find('.handsontableEditor:visible').length).toEqual(1);
  });

  it('should prepare the editor only once per instance', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(spec().$container.find('.handsontableEditor').length).toEqual(1);
  });

  it('should reuse the container and display them after select the same or different cell', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    let container = spec().$container.find('.handsontableEditor')[0];

    expect(container.clientHeight).toBeGreaterThan(2);

    await selectCell(0, 0);
    await keyDownUp('enter');

    container = spec().$container.find('.handsontableEditor')[0];

    expect(container.clientHeight).toBeGreaterThan(2);

    await selectCell(1, 0);
    await keyDownUp('enter');

    container = spec().$container.find('.handsontableEditor')[0];

    expect(container.clientHeight).toBeGreaterThan(2);

    await selectCell(1, 0);
    await keyDownUp('enter');

    container = spec().$container.find('.handsontableEditor')[0];

    expect(container.clientHeight).toBeGreaterThan(2);
  });

  it('should change container z-index after open editor to 200', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const container = spec().$container.find('.handsontableInputHolder');

    expect(container.css('zIndex')).toBe('200');
  });

  it('should destroy the editor when Esc is pressed', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    await selectCell(2, 0);
    await keyDownUp('enter');
    await keyDownUp('escape');

    expect(spec().$container.find('.handsontableEditor:visible').length).toEqual(0);
  });

  // see https://github.com/handsontable/handsontable/issues/3380
  it('should not throw error while selecting the next cell by hitting enter key', async() => {
    const spy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    window.onerror = function() {
      spy.test();
    };
    handsontable({
      columns: [{
        type: 'handsontable',
        handsontable: {
          data: [['Marque'], ['Country'], ['Parent company']]
        }
      }]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');

    expect(spy.test.calls.count()).toBe(0);

    window.onerror = prevError;
  });

  it('should not throw error while close no open editor by hitting delete key and `beforeChange` return false', async() => {
    const spy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    window.onerror = function() {
      spy.test();
    };
    handsontable({
      columns: [{
        type: 'handsontable',
        handsontable: {
          data: [['Marque'], ['Country'], ['Parent company']]
        }
      }],
      beforeChange: () => false
    });

    await selectCell(0, 0);
    await keyDownUp('delete');

    expect(spy.test.calls.count()).toBe(0);
    expect(async() => {
      await keyDownUp('delete');
    }).not.toThrowWithCause('Uncaught TypeError: Cannot read property "rootElement" of undefined', { handsontable: true });

    window.onerror = prevError;
  });

  it('should not throw an error while closing editor that is not visible in the viewport', async() => {
    const spy = jasmine.createSpyObj('error', ['test']);
    const prevError = window.onerror;

    window.onerror = function() {
      spy.test();

      return true;
    };
    handsontable({
      data: createSpreadsheetData(100, 1),
      width: 300,
      height: 200,
      columns: [{
        type: 'handsontable',
        handsontable: {
          data: [['Marque'], ['Country'], ['Parent company']]
        }
      }],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');
    await scrollViewportTo({ row: 95 });

    expect(spy.test.calls.count()).toBe(0);

    window.onerror = prevError;
  });

  it('Enter pressed in nested HT should set the value and hide the editor', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    await selectCell(2, 0);
    await keyDownUp('enter');
    await keyDownUp('arrowdown');
    await keyDownUp('enter');

    expect(spec().$container.find('.handsontableEditor:visible').length).toEqual(0);
    expect(getDataAtCell(2, 0)).toEqual('BMW');
  });

  it('should keep focus on textarea after arrow is pressed', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    await selectCell(2, 0);
    await keyDownUp('enter');
    await keyDownUp('arrowdown');

    expect(document.activeElement).toEqual(getActiveEditor().TEXTAREA);
  });

  it('should focus the TD after HT editor is prepared and destroyed', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ]
    });

    await selectCell(2, 0);
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');

    expect(getSelected()).toEqual([[4, 0, 4, 0]]);
  });

  it('should focus the TD after HT editor is prepared, finished (by keyboard) and destroyed', async() => {
    const selections = [];

    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData(),
            afterSelection(row) {
              selections.push(['inner', row]);
            }
          }
        }
      ],
      afterSelection(row) {
        selections.push(['outer', row]);
      }
    });

    expect(selections.length).toBe(0);

    await selectCell(1, 0);

    expect(selections[0]).toEqual(['outer', 1]);

    await keyDownUp('arrowdown');

    expect(selections[1]).toEqual(['outer', 2]);

    await keyDownUp('enter');
    await keyDownUp('arrowdown');

    expect(selections[2]).toEqual(['inner', 0]);

    await keyDownUp('escape');
    await keyDownUp('arrowdown');

    expect(selections[3]).toEqual(['outer', 3]);
    expect(selections.length).toBe(4);
  });

  describe('strict mode', () => {
    it('should open editor and select cell (0, 0) in inner HOT', async() => {
      handsontable({
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            },
            strict: true
          }
        ]
      });

      await selectCell(2, 0);
      await keyDownUp('enter');

      const ht = getActiveEditor();
      const innerHot = ht.htEditor;

      expect(innerHot.getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  describe('non strict mode', () => {
    it('should open editor and DO NOT select any cell in inner HOT', async() => {
      handsontable({
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            }
          }
        ]
      });

      await selectCell(2, 0);
      await keyDownUp('enter');

      const ht = getActiveEditor();
      const innerHot = ht.htEditor;

      expect(innerHot.getSelected()).toBeUndefined();
    });

    it('should show textarea', async() => {
      handsontable({
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            }
          }
        ]
      });

      await selectCell(2, 0);
      await keyDownUp('enter');

      expect(getActiveEditor().TEXTAREA.parentElement.style.zIndex).toEqual('');
      expect(getActiveEditor().TEXTAREA.style.visibility).toEqual('');
    });
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'handsontable',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  it('should inherit the actual layout direction option from the root Handsontable instance', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      editor: 'handsontable',
      layoutDirection: 'inherit',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(getActiveEditor().htEditor.getSettings().layoutDirection).toBe('ltr');
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        columns: [
          {
            type: 'handsontable',
            handsontable: {
              colHeaders: ['Marque', 'Country', 'Parent company'],
              data: getManufacturerData()
            }
          }
        ],
        imeFastEdit: true,
      });

      await selectCell(0, 0, 0, 0, true, false);

      // The `imeFastEdit` timeout is set to 50ms.
      await sleep(55);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });

  it('should open editors properly and handle keydown event properly (does not close editor)', async() => {
    handsontable({
      data: [
        ['Tesla', 2017, 'black', 'black'],
        ['Nissan', 2018, 'blue', 'blue'],
        ['Chrysler', 2019, 'yellow', 'black'],
        ['Volvo', 2020, 'white', 'gray']
      ],
      colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        },
        {},
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        },
        {},
      ]
    });

    $(getCell(2, 0)).find('.htAutocompleteArrow').simulate('mousedown');
    $(getCell(2, 0)).find('.htAutocompleteArrow').simulate('mouseup');
    $(getCell(1, 2)).find('.htAutocompleteArrow').simulate('mousedown');
    $(getCell(1, 2)).find('.htAutocompleteArrow').simulate('mouseup');

    await keyDownUp('arrowup');

    expect(getSelected()).toEqual([[1, 2, 1, 2]]);

    await keyDownUp('arrowright');

    expect(getSelected()).toEqual([[1, 2, 1, 2]]);

    await keyDownUp('arrowleft');

    expect(getSelected()).toEqual([[1, 2, 1, 2]]);

    await keyDownUp('arrowdown');

    expect(getSelected()).toEqual([[1, 2, 1, 2]]);
  });

  it('should close the handsontable editor after call `useTheme`', async() => {
    const hot = handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData()
          }
        }
      ],
    });

    await selectCell(0, 0);

    const editor = getActiveEditor();

    await keyDownUp('enter');

    expect(editor.isOpened()).toBe(true);

    hot.useTheme(undefined);

    expect(editor.isOpened()).toBe(false);
  });

  it('should open editor with the correct size', async() => {
    handsontable({
      colWidths: 120,
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData(),
            autoColumnSize: true,
          }
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const container = getActiveEditor().htContainer;

    expect(container.clientWidth).forThemes(({ classic, main, horizon }) => {
      classic.toBe(288);
      main.toBe(360);
      horizon.toBe(384);
    });
    expect(container.clientHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(166);
      main.toBe(212);
      horizon.toBe(260);
    });
  });

  it('should open editor with the correct size after other handsontable editor was open beforehand (#dev-2112)', async() => {
    handsontable({
      columns: [
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            data: getManufacturerData(),
            autoColumnSize: true,
          }
        },
        {
          type: 'handsontable',
          handsontable: {
            data: [['Red'], ['Green'], ['Blue']],
          }
        }
      ]
    });

    await selectCell(0, 1);
    await keyDownUp('enter');
    await keyDownUp('escape');

    await selectCell(0, 0);
    await keyDownUp('enter');

    const container = getActiveEditor().htContainer;

    expect(container.clientWidth).forThemes(({ classic, main, horizon }) => {
      classic.toBe(288);
      main.toBe(360);
      horizon.toBe(384);
    });
    expect(container.clientHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(166);
      main.toBe(212);
      horizon.toBe(260);
    });
  });
});
