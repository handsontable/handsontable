describe('DropdownEditor', () => {
  const id = 'testContainer';
  const choices = ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black',
    'white', 'purple', 'lime', 'olive', 'cyan'];

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: auto"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should have correct meta options set when defines as a type', () => {
    handsontable({
      type: 'dropdown',
      source: choices,
    });

    selectCell(0, 0);

    expect(getCellMeta(0, 0).filter).toBe(false);
    expect(getCellMeta(0, 0).strict).toBe(true);
  });

  it('should have correct meta options set when defines as an editor', () => {
    handsontable({
      editor: 'dropdown',
      source: choices,
    });

    selectCell(0, 0);

    expect(getCellMeta(0, 0).filter).toBe(false);
    expect(getCellMeta(0, 0).strict).toBe(true);
  });

  it('should render an editor in specified position at cell 0, 0', () => {
    handsontable({
      columns: [
        {
          editor: 'dropdown',
          source: choices,
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
          editor: 'dropdown',
          source: choices,
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
      data: Handsontable.helper.createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          editor: 'dropdown',
          source: choices,
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
    'top and bottom overlays are enabled', async() => {
    spec().$container[0].style.height = '252px';

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          editor: 'dropdown',
          source: choices,
        },
        {},
      ],
    });

    selectCell(0, 0);

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    keyDownUp('enter');
    await sleep(50);

    expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');
    await sleep(50);

    // Cells that do not touch the edges of the table have an additional top border.
    const editorOffset = () => ({
      top: editor.offset().top + 1,
      left: editor.offset().left,
    });

    expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');
    await sleep(50);

    expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');
    await sleep(50);

    expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');
    await sleep(50);

    expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');
    await sleep(50);

    // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
    expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');
    await sleep(50);

    expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

    keyDownUp('enter');
    keyDownUp('enter');
    await sleep(50);

    expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
  });

  it('should render an editor in specified position while opening an editor from left to right when ' +
     'left overlay is enabled', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      editor: 'dropdown',
      source: choices,
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
    spec().$container.css('overflow', '').css('width', '').css('height', '');

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
          editor: 'dropdown',
          source: choices,
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
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      fixedColumnsStart: 3,
      hiddenColumns: {
        indicators: true,
        columns: [0],
      },
      editor: 'dropdown',
      source: choices,
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
      editor: 'dropdown',
      source: choices,
    });

    selectCell(0, 0);
    keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  describe('open editor', () => {
    // see https://github.com/handsontable/handsontable/issues/3380
    it('should not throw error while selecting the next cell by hitting enter key', () => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();
      };
      handsontable({
        columns: [{
          editor: 'dropdown',
          source: choices
        }]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      keyDownUp('enter');
      keyDownUp('enter');

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    // https://github.com/handsontable/dev-handsontable/issues/1724
    it('should not throw any errors after opening the editor, when the saved value is represented by a option-cell ' +
    'outside of the editor\'s initially loaded viewport', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();
      };

      handsontable({
        data: [['49']],
        columns: [
          {
            editor: 'dropdown',
            source: (() => {
              const arr = [];

              for (let i = 0; i < 50; i++) {
                arr.push(`${i}`);
              }

              return arr;
            })(),
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');
      await sleep(100);

      expect(spy.test).not.toHaveBeenCalled();

      window.onerror = prevError;
    });

    it('should open editor with the correct size when there is no scrollbar on the list', async() => {
      handsontable({
        colWidths: 120,
        columns: [
          {
            editor: 'dropdown',
            source: choices.slice(0, 5),
            visibleRows: 5,
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');

      await sleep(100);

      const container = getActiveEditor().htContainer;

      expect(container.clientWidth).forThemes(({ classic, main }) => {
        classic.toBe(120);
        main.toBe(118);
      });
      expect(container.clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(118);
        main.toBe(146);
      });
    });

    it('should open editor with the correct size when there is scrollbar on the list', async() => {
      handsontable({
        colWidths: 120,
        columns: [
          {
            editor: 'dropdown',
            source: choices,
            visibleRows: 3,
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');

      await sleep(100);

      const container = getActiveEditor().htContainer;

      expect(container.clientWidth).forThemes(({ classic, main }) => {
        classic.toBe(120 + Handsontable.dom.getScrollbarWidth());
        main.toBe(118 + Handsontable.dom.getScrollbarWidth());
      });
      expect(container.clientHeight).forThemes(({ classic, main }) => {
        classic.toBe(72);
        main.toBe(88);
      });
    });
  });

  describe('closing the editor', () => {
    it('should not close editor on scrolling', async() => {
      const hot = handsontable({
        data: [
          ['', 'two', 'three'],
          ['four', 'five', 'six']
        ],
        columns: [
          {
            type: 'dropdown',
            source: choices
          },
          {},
          {}
        ]
      });

      selectCell(0, 0);
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');

      hot.view._wt.wtOverlays.topOverlay.scrollTo(1);
      const dropdown = hot.getActiveEditor();

      await sleep(50);

      expect($(dropdown.htContainer).is(':visible')).toBe(true);

      selectCell(0, 0);
      await sleep(50);

      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');
      $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mouseup');
      hot.view._wt.wtOverlays.topOverlay.scrollTo(3);

      await sleep(50);

      expect($(dropdown.htContainer).is(':visible')).toBe(true);
    });
  });

  it('should mark all invalid values as invalid, after pasting them into dropdown-type cells', (done) => {
    handsontable({
      data: [
        ['', 'two', 'three'],
        ['four', 'five', 'six']
      ],
      columns: [
        {
          type: 'dropdown',
          source: choices
        },
        {},
        {}
      ]
    });

    populateFromArray(0, 0, [['invalid'], ['input']], null, null, 'paste');

    setTimeout(() => {
      expect(Handsontable.dom.hasClass(getCell(0, 0), 'htInvalid')).toBe(true);
      expect(Handsontable.dom.hasClass(getCell(1, 0), 'htInvalid')).toBe(true);
      done();
    }, 40);
  });

  // Input element can not lose the focus while entering new characters. It breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters if `imeFastEdit` is enabled (#839)', async() => {
    const hot = handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: 'dropdown',
          source: choices,
        },
        {},
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

    hot.getActiveEditor().TEXTAREA.value = 't';
    keyDownUp('t');

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = 'te';
    keyDownUp('e');

    expect(document.activeElement).toBe(activeElement);

    hot.getActiveEditor().TEXTAREA.value = 'teo';
    keyDownUp('o');

    expect(document.activeElement).toBe(activeElement);
  });

  describe('allow html mode', () => {
    it('should allow render the html items without sanitizing the content', async() => {
      const hot = handsontable({
        columns: [
          {
            type: 'dropdown',
            source: [
              '<b>foo <span>zip</span></b>',
              '<i>bar</i><img src onerror="__xssTestInjection = true">',
              '<strong>baz</strong>'
            ],
            allowHtml: true,
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');

      await sleep(200);

      const ac = hot.getActiveEditor();
      const innerHot = ac.htEditor;

      expect(window.__xssTestInjection).toBe(true);
      expect(innerHot.getData()).toEqual([
        ['<b>foo <span>zip</span></b>'],
        ['<i>bar</i><img src onerror="__xssTestInjection = true">'],
        ['<strong>baz</strong>'],
      ]);

      delete window.__xssTestInjection;
    });
  });

  describe('disallow html mode', () => {
    it('should strip HTML content', async() => {
      const hot = handsontable({
        columns: [
          {
            type: 'dropdown',
            source: [
              '<b>foo <span>zip</span></b>',
              '<i>bar</i><img src onerror="__xssTestInjection = true">',
              '<strong>baz</strong>'
            ],
            allowHtml: false,
          }
        ]
      });

      selectCell(0, 0);
      keyDownUp('enter');

      await sleep(200);

      const ac = hot.getActiveEditor();
      const innerHot = ac.htEditor;

      expect(window.__xssTestInjection).toBeUndefined();
      expect(innerHot.getData()).toEqual([
        ['foo zip'],
        ['bar'],
        ['baz'],
      ]);

      delete window.__xssTestInjection;
    });
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      editor: 'dropdown',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  describe('IME support', () => {
    it('should focus editable element after a timeout when selecting the cell if `imeFastEdit` is enabled', async() => {
      handsontable({
        columns: [
          {
            type: 'dropdown',
            source: choices,
          }
        ],
        imeFastEdit: true,
      });

      selectCell(0, 0, 0, 0, true, false);

      // The `imeFastEdit` timeout is set to 50ms.
      await sleep(55);

      expect(document.activeElement).toBe(getActiveEditor().TEXTAREA);
    });
  });
});
