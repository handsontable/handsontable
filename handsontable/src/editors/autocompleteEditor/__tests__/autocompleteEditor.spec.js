describe('AutocompleteEditor', () => {
  const choices = ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black',
    'white', 'purple', 'lime', 'olive', 'cyan'];

  beforeEach(function() {
    this.$container = $('<div id="testContainer" style="width: 300px; height: 200px; overflow: auto"></div>')
      .appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render an editor in specified position at cell 0, 0', async() => {
    handsontable({
      editor: 'autocomplete',
      source: choices,
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
          editor: 'autocomplete',
          source: choices,
        }
      ],
    });

    await listen();

    await selectAll();

    const editor = $(getActiveEditor().TEXTAREA_PARENT);

    await keyDownUp('F2');

    expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
  });

  it.forTheme('classic')('should render an editor in specified position while opening an ' +
    'editor from top to bottom when top and bottom overlays are enabled', async() => {
    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          editor: 'autocomplete',
          source: choices,
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
    spec().$container.css('height', '245px');

    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          editor: 'autocomplete',
          source: choices,
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
    spec().$container.css('height', '313px');

    handsontable({
      data: createSpreadsheetData(8, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsTop: 3,
      fixedRowsBottom: 3,
      columns: [
        {
          editor: 'autocomplete',
          source: choices,
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
      editor: 'autocomplete',
      source: choices,
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
    spec().$container.css('overflow', '').css('width', '').css('height', '');

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
          editor: 'autocomplete',
          source: choices,
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
      editor: 'autocomplete',
      source: choices,
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
      editor: 'autocomplete',
      source: choices,
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const editor = getActiveEditor().TEXTAREA;

    expect(window.getComputedStyle(editor, 'focus').getPropertyValue('outline-style')).toBe('none');
  });

  describe('open editor', () => {
    it('should display editor (after hitting ENTER)', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      expect(isEditorVisible()).toBe(false);

      await keyDownUp('enter');

      expect(isEditorVisible()).toBe(true);
    });

    it('should display editor (after hitting F2)', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      expect(isEditorVisible()).toBe(false);

      await keyDownUp('f2');

      expect(isEditorVisible()).toBe(true);
    });

    it('should display editor (after doubleclicking)', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      expect(isEditorVisible()).toBe(false);

      await mouseDoubleClick($(getCell(0, 0)));

      expect(isEditorVisible()).toBe(true);
    });

    it('should not throw error while selecting the next cell by hitting enter key (#3380)', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();
      };
      handsontable({
        columns: [{
          editor: 'autocomplete',
          source: choices
        }]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should open editor with the correct size when there is no scrollbar on the list', async() => {
      handsontable({
        colWidths: 120,
        columns: [
          {
            editor: 'autocomplete',
            source: choices.slice(0, 5),
            visibleRows: 5,
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(100);

      const container = getActiveEditor().htContainer;

      expect(container.clientWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(120);
        main.toBe(118);
        horizon.toBe(133);
      });
      expect(container.clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(118);
        main.toBe(146);
        horizon.toBe(148);
      });
    });

    it('should open editor with the correct size when there is no scrollbar on the list (trimDropdown: false)', async() => {
      handsontable({
        colWidths: 120,
        columns: [
          {
            editor: 'autocomplete',
            source: choices.slice(0, 5),
            visibleRows: 5,
            trimDropdown: false,
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(100);

      const container = getActiveEditor().htContainer;

      expect(container.clientWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(52);
        main.toBe(62);
        horizon.toBe(85);
      });
      expect(container.clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(118);
        main.toBe(146);
        horizon.toBe(148);
      });
    });

    it('should open editor with the correct size when there is scrollbar on the list', async() => {
      handsontable({
        colWidths: 120,
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            visibleRows: 3,
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(100);

      const container = getActiveEditor().htContainer;

      expect(container.clientWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(120 + Handsontable.dom.getScrollbarWidth());
        main.toBe(118 + Handsontable.dom.getScrollbarWidth());
        horizon.toBe(118 + Handsontable.dom.getScrollbarWidth());
      });
      expect(container.clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(72);
        main.toBe(88);
        horizon.toBe(112);
      });
    });

    it('should open editor with the correct size when there is scrollbar on the list and table overflow is hidden', async() => {
      handsontable({
        colWidths: 120,
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            visibleRows: choices.length,
          }
        ],
        height: 'auto'
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(100);

      const container = getActiveEditor().htContainer;

      expect(container.clientWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(120 + Handsontable.dom.getScrollbarWidth());
        main.toBe(118 + Handsontable.dom.getScrollbarWidth());
        horizon.toBe(118 + Handsontable.dom.getScrollbarWidth());
      });
      expect(container.clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(69);
        main.toBe(87);
        horizon.toBe(111);
      });
    });

    it('should open editor with the correct size when there is scrollbar on the list (trimDropdown: false)', async() => {
      handsontable({
        colWidths: 120,
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            visibleRows: 3,
            trimDropdown: false,
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(100);

      const container = getActiveEditor().htContainer;

      expect(container.clientWidth).forThemes(({ classic, main, horizon }) => {
        classic.toBe(52 + Handsontable.dom.getScrollbarWidth());
        main.toBe(62 + Handsontable.dom.getScrollbarWidth());
        horizon.toBe(70 + Handsontable.dom.getScrollbarWidth());
      });
      expect(container.clientHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(72);
        main.toBe(88);
        horizon.toBe(112);
      });
    });

    it('should not take excessive time to open the editor if the choice list is very long (dev-handsontable#2313)', async() => {
      const options = new Array(50000).fill().map(() => Math.random());
      let startTime;
      let endTime;

      handsontable({
        data: [[], [], [], [], []],
        columns: [
          {
            type: 'autocomplete',
            source: options,
          },
        ],
        afterBeginEditing() {
          startTime = performance.now();

          this.getActiveEditor().htEditor.addHookOnce('afterRender', async() => {
            endTime = performance.now();
          });
        },
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(10);

      const $editor = $('.autocompleteEditor').eq(0);

      expect(endTime - startTime).toBeLessThan(500);
      expect($editor.find('.ht_master tbody tr').size()).toBeGreaterThan(0);
    });
  });

  describe('choices', () => {
    it('should display given choices (array)', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      const editor = $('.autocompleteEditor');

      await keyDownUp('enter');
      await sleep(100);

      expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
      expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
      expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
      expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
      expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
    });

    it('should call source function with context set as cellProperties', async() => {
      const source = jasmine.createSpy('source');
      let context;

      source.and.callFake(function(query, process) {
        process(choices);
        context = this;
      });

      const hot = handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source
          }
        ]
      });

      await selectCell(0, 0);

      source.calls.reset();

      await keyDownUp('enter');
      await sleep(200);

      expect(context.instance).toBe(hot);
      expect(context.row).toBe(0);
      expect(context.col).toBe(0);
    });

    it('should display given choices (sync function)', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);

      const editor = $('.autocompleteEditor');

      syncSources.calls.reset();

      await keyDownUp('enter');
      await sleep(200);

      expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
      expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
      expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
      expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
      expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
    });

    it('should display given choices (async function)', async() => {
      const asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.and.callFake((process) => {
        process(choices);
      });
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source(query, process) {
              setTimeout(() => {
                asyncSources(process);
              }, 0);
            }
          }
        ]
      });

      await selectCell(0, 0);

      const editor = $('.autocompleteEditor');

      await keyDownUp('enter');
      await sleep(200);

      expect(asyncSources.calls.count()).toEqual(1);
      expect(editor.find('tbody td:eq(0)').text()).toEqual(choices[0]);
      expect(editor.find('tbody td:eq(1)').text()).toEqual(choices[1]);
      expect(editor.find('tbody td:eq(2)').text()).toEqual(choices[2]);
      expect(editor.find('tbody td:eq(3)').text()).toEqual(choices[3]);
      expect(editor.find('tbody td:eq(4)').text()).toEqual(choices[4]);
    });

    it('should NOT update choices list, after cursor leaves and enters the list (#1330)', async() => {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').and.callThrough();
      const updateChoicesList = Handsontable.editors.AutocompleteEditor.prototype.updateChoicesList;

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      const editor = getActiveEditor();

      await keyDownUp('enter');
      await sleep(200);

      updateChoicesList.calls.reset();
      $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseenter();
      $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseleave();
      $(editor.htContainer).find('.htCore tr:eq(0) td:eq(0)').mouseenter();

      await sleep(100);

      expect(updateChoicesList).not.toHaveBeenCalled();
    });

    it('should update choices list exactly once after a key is pressed (#1330)', async() => {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').and.callThrough();
      const updateChoicesList = Handsontable.editors.AutocompleteEditor.prototype.updateChoicesList;

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      const editor = getActiveEditor();

      updateChoicesList.calls.reset();

      await keyDownUp('enter');
      await sleep(200);

      updateChoicesList.calls.reset();
      editor.TEXTAREA.value = 'red';

      await keyDownUp('d', {}, editor.TEXTAREA);
      await sleep(100);

      expect(updateChoicesList.calls.count()).toEqual(1);
    });

    it('should hide the list when there is no entries to choose (#dev-92)', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      const editor = getActiveEditor();

      await keyDownUp('enter');
      await sleep(200);

      editor.TEXTAREA.value = 'none';

      await keyDownUp('e', {}, editor.TEXTAREA);
      await sleep(100);

      expect(editor.htEditor.rootElement.style.display).toBe('none');

      // the editor's list should be visible for the next cell
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(editor.htEditor.rootElement.style.display).toBe('');
    });

    it('should not initialize the dropdown with unneeded scrollbars (scrollbar causing a scrollbar issue)', async() => {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').and.callThrough();
      const updateChoicesList = Handsontable.editors.AutocompleteEditor.prototype.updateChoicesList;

      handsontable({
        data: [
          [
            'blue'
          ],
          [],
          [],
          []
        ],
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      const editor = getActiveEditor();

      updateChoicesList.calls.reset();

      await keyDownUp('enter');
      await sleep(200);

      expect(editor.htContainer.scrollWidth).toEqual(editor.htContainer.clientWidth);
    });

    it('autocomplete list should have textarea dimensions', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        colWidths: [200],
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);

      const editor = $('.handsontableInputHolder');

      syncSources.calls.reset();

      await keyDownUp('enter');
      await sleep(200);

      // -2 for transparent borders
      expect(editor.find('.autocompleteEditor .htCore td').width())
        .toEqual(editor.find('.handsontableInput').width() - 2);
      expect(editor.find('.autocompleteEditor .htCore td').width()).forThemes(({ classic, main, horizon }) => {
        classic.toBeGreaterThan(187);
        main.toEqual(180);
        horizon.toEqual(172);
      });
    });

    it('should display the autocomplete list with correct dimensions, after updating the choice list from no match' +
    'to a match', async() => {
      handsontable({
        columns: [
          {
            type: 'autocomplete',
            trimDropdown: false,
            source: choices
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const autocompleteEditor = $('.autocompleteEditor');
      const inputHolder = $('.handsontableInputHolder');

      await sleep(50);

      autocompleteEditor.siblings('textarea').first().val('ab');

      await keyDownUp('a');
      await keyDownUp('b');
      await sleep(50);

      autocompleteEditor.siblings('textarea').first().val('a');

      await keyDownUp('backspace');
      await sleep(50);

      expect(
        inputHolder.find('.autocompleteEditor .ht_master').eq(0).width()
      ).toBeGreaterThan(inputHolder.find('.handsontableInput').width());

    });

    it('autocomplete list should have the suggestion table dimensions, when trimDropdown option is set to false', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(['long text', 'even longer text', 'extremely long text in the suggestion list',
          'short text', 'text', 'another', 'yellow', 'black']);
      });

      handsontable({
        colWidths: [200],
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ],
        trimDropdown: false,
      });

      await selectCell(0, 0);

      const editor = $('.handsontableInputHolder');

      syncSources.calls.reset();

      await keyDownUp('enter');
      await sleep(200);

      expect(editor.find('.autocompleteEditor .htCore td').eq(0).width())
        .toBeGreaterThan(editor.find('.handsontableInput').width());
    });

    // TODO: This test never properly tests the case of refreshing editor after re-render the table. Previously this
    // test passes because sleep timeout was small enough to read the valid width before the editor element was resized.
    // Related issue #5103
    xit('autocomplete textarea should have cell dimensions (after render)', async() => {
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
        cells() {
          return {
            type: Handsontable.AutocompleteCell
          };
        }
      });

      await selectCell(1, 1);
      await keyDownUp('enter');
      await sleep(10);

      data[1][1] = 'dddddddddddddddddddd';
      await render();

      await sleep(10);

      const $td = spec().$container.find('.htCore tbody tr:eq(1) td:eq(1)');

      expect(autocompleteEditor().width()).toEqual($td.width());
    });

    it('should invoke beginEditing only once after doubleclicking on a cell (#1011)', async() => {
      handsontable({
        columns: [
          {},
          {},
          {
            type: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 2);

      spyOn(getActiveEditor(), 'beginEditing');

      expect(getActiveEditor().beginEditing.calls.count()).toBe(0);

      await mouseDoubleClick(getCell(0, 2));

      expect(getActiveEditor().beginEditing.calls.count()).toBe(1);

      await mouseDoubleClick(getCell(1, 2));

      expect(getActiveEditor().beginEditing.calls.count()).toBe(2);

      await mouseDoubleClick(getCell(2, 2));

      expect(getActiveEditor().beginEditing.calls.count()).toBe(3);
    });

    it('should not display all the choices from a long source list and not leave any unused space in the dropdown', async() => {
      handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: [
              'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Citroen',
              'Dodge', 'Eagle', 'Ferrari', 'Ford', 'General Motors', 'GMC', 'Honda', 'Hummer',
              'Hyundai', 'Infiniti', 'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover',
              'Lexus', 'Lincoln', 'Lotus', 'Mazda', 'Mercedes-Benz', 'Mercury', 'Mitsubishi',
              'Nissan', 'Oldsmobile', 'Peugeot', 'Pontiac', 'Porsche', 'Regal', 'Renault',
              'Saab', 'Saturn', 'Seat', 'Skoda', 'Subaru', 'Suzuki', 'Toyota', 'Volkswagen', 'Volvo'
            ]
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      const $autocomplete = autocomplete();
      const $autocompleteHolder = $autocomplete.find('.ht_master .wtHolder').first();

      await sleep(100);

      expect($autocomplete.find('td').first().text()).toEqual('Acura');

      $autocompleteHolder.scrollTop($autocompleteHolder[0].scrollHeight);

      await sleep(100);

      expect($autocomplete.find('td').last().text()).toEqual('Volvo');
    });

    it('should display the choices, regardless if they\'re declared as string or numeric', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: ['1', '2', 3, '4', 5, 6]
          }
        ]
      });

      await selectCell(0, 0);

      const editor = $('.autocompleteEditor');

      await keyDownUp('enter');
      await sleep(100);

      expect(editor.find('tbody td:eq(0)').text()).toEqual('1');
      expect(editor.find('tbody td:eq(1)').text()).toEqual('2');
      expect(editor.find('tbody td:eq(2)').text()).toEqual('3');
      expect(editor.find('tbody td:eq(3)').text()).toEqual('4');
      expect(editor.find('tbody td:eq(4)').text()).toEqual('5');
      expect(editor.find('tbody td:eq(5)').text()).toEqual('6');
    });

    it('should display the choices, regardless if they\'re declared as string or numeric, when data is present', async() => {
      handsontable({
        data: createSpreadsheetData(10, 1),
        columns: [
          {
            editor: 'autocomplete',
            source: ['1', '2', 3, '4', 5, 6]
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('backspace');

      const editor = $('.autocompleteEditor');

      await keyDownUp('enter');
      await sleep(100);

      expect(editor.find('tbody td:eq(0)').text()).toEqual('1');
      expect(editor.find('tbody td:eq(1)').text()).toEqual('2');
      expect(editor.find('tbody td:eq(2)').text()).toEqual('3');
      expect(editor.find('tbody td:eq(3)').text()).toEqual('4');
      expect(editor.find('tbody td:eq(4)').text()).toEqual('5');
      expect(editor.find('tbody td:eq(5)').text()).toEqual('6');
    });

    it('should display the dropdown above the editor, when there is not enough space below (table has defined size)', async() => {
      spec().$container.css('overflow', '');

      handsontable({
        data: createEmptySpreadsheetData(30, 30),
        editor: 'autocomplete',
        source: choices,
        width: 400,
        // set the height of the table so that 9 rows are always visible - no matter what theme is being tested
        height: getDefaultRowHeight() * 9,
      });

      await mouseDoubleClick($(getCell(6, 0)));
      await sleep(50);

      const container = $(getActiveEditor().htContainer);

      expect(container.offset()).toEqual({ top: getDefaultRowHeight(), left: 0 });
    });

    it('should display the dropdown once above and once below the editor after the choices list is changed (table has defined size)', async() => {
      spec().$container.css('overflow', '');

      handsontable({
        data: createEmptySpreadsheetData(30, 5),
        editor: 'autocomplete',
        source: choices,
        width: 400,
        // set the height of the table so that 9 rows are always visible - no matter what theme is being tested
        height: getDefaultRowHeight() * 9,
      });

      await mouseDoubleClick($(getCell(5, 0)));
      await sleep(50);

      const editor = getActiveEditor();
      const container = $(editor.htContainer);

      editor.TEXTAREA.value = 'r';

      await keyDownUp('r');
      await sleep(50);

      expect(container.offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 23, left: 0 });
        main.toEqual({ top: 29, left: 0 });
        horizon.toEqual({ top: 37, left: 0 });
      });

      editor.TEXTAREA.value = 're';

      await keyDownUp('e');
      await sleep(50);

      expect(container.offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 139, left: 0 });
        main.toEqual({ top: 175, left: 0 });
        horizon.toEqual({ top: 223, left: 0 });
      });
    });

    it('should limit the list to the space size left below the editor (table has defined size)', async() => {
      handsontable({
        data: createEmptySpreadsheetData(30, 30),
        editor: 'autocomplete',
        source: choices,
        visibleRows: 20,
        width: 400,
        // set the height of the table so that 9 rows are always visible - no matter what theme is being tested
        height: getDefaultRowHeight() * 9,
      });

      await mouseDoubleClick($(getCell(2, 0)));
      await sleep(50);

      expect(getActiveEditor().htContainer.offsetHeight).forThemes(({ classic, main, horizon }) => {
        classic.toEqual(115);
        main.toEqual(147);
        horizon.toEqual(185);
      });
    });

    it('should limit the list to the space size left above the editor (table has defined size)', async() => {
      handsontable({
        data: createEmptySpreadsheetData(30, 30),
        editor: 'autocomplete',
        source: choices,
        visibleRows: 20,
        width: 400,
        // set the height of the table so that 9 rows are always visible - no matter what theme is being tested
        height: getDefaultRowHeight() * 9,
      });

      await mouseDoubleClick($(getCell(6, 0)));
      await sleep(50);

      expect(getActiveEditor().htContainer.offsetHeight).forThemes(({ classic, main, horizon }) => {
        classic.toEqual(115);
        main.toEqual(147);
        horizon.toEqual(185);
      });
    });

    it('should display the dropdown above the editor, when there is not enough space below (table has not defined size)', async() => {
      spec().$container
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      handsontable({
        data: createEmptySpreadsheetData(40, 30),
        editor: 'autocomplete',
        source: choices,
      });

      const cell = document.elementsFromPoint(
        0, document.documentElement.clientHeight - (getDefaultRowHeight() * 4))[0];

      await mouseDoubleClick($(cell));
      await sleep(50);

      const container = $(getActiveEditor().htContainer);

      expect(container.offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 365, left: 0 });
        main.toEqual({ top: 287, left: 0 });
        horizon.toEqual({ top: 184, left: 0 });
      });
    });

    it('should display the dropdown once above and once below the editor after the choices list is changed (table has not defined size)', async() => {
      spec().$container
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      handsontable({
        data: createEmptySpreadsheetData(40, 30),
        editor: 'autocomplete',
        source: choices,
      });

      const cell = document.elementsFromPoint(
        0, document.documentElement.clientHeight - (getDefaultRowHeight() * 4))[0];

      await mouseDoubleClick($(cell));
      await sleep(50);

      const editor = getActiveEditor();
      const container = $(editor.htContainer);

      editor.TEXTAREA.value = 'r';

      await keyDownUp('r');
      await sleep(50);

      expect(container.offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 480, left: 0 });
        main.toEqual({ top: 432, left: 0 });
        horizon.toEqual({ top: 369, left: 0 });
      });

      editor.TEXTAREA.value = 're';

      await keyDownUp('e');
      await sleep(50);

      expect(container.offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 622, left: 0 });
        main.toEqual({ top: 610, left: 0 });
        horizon.toEqual({ top: 593, left: 0 });
      });
    });

    it('should display the dropdown once above and once below the editor after the choices list is changed (table has not defined size, scrolled viewport)', async() => {
      spec().$container
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      handsontable({
        data: createEmptySpreadsheetData(100, 30),
        editor: 'autocomplete',
        source: choices,
      });

      await scrollWindowTo(0, 10000); // scroll to the bottom
      await mouseDoubleClick($(getCell(96, 0)));
      await sleep(50);

      const editor = getActiveEditor();
      const container = $(editor.htContainer);

      editor.TEXTAREA.value = 'r';

      await keyDownUp('r');
      await sleep(50);

      expect(container.offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 2090, left: 0 });
        main.toEqual({ top: 2636, left: 0 });
        horizon.toEqual({ top: 3366, left: 0 });
      });

      editor.TEXTAREA.value = 're';

      await keyDownUp('e');
      await sleep(50);

      expect(container.offset()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ top: 2232, left: 0 });
        main.toEqual({ top: 2814, left: 0 });
        horizon.toEqual({ top: 3590, left: 0 });
      });
    });

    it('should not sort the choices list, when the `sortByRelevance` option is set to `true`', async() => {
      handsontable({
        editor: 'autocomplete',
        source: choices,
        sortByRelevance: true,
        height: 1000
      });

      await selectCell(0, 0);

      const editor = $('.autocompleteEditor');

      await keyDownUp('enter');
      await sleep(200);

      for (let i = 0; i < choices.length; i++) {
        expect(editor.find(`tbody td:eq(${i})`).text()).toEqual(choices[i]);
      }
    });

    it('should sort alphabetically the choices list, when the `sortByRelevance` option is set to `false`', async() => {
      handsontable({
        editor: 'autocomplete',
        source: choices,
        sortByRelevance: false,
        height: 1000
      });

      await selectCell(0, 0);

      const editor = $('.autocompleteEditor');

      await keyDownUp('enter');
      await sleep(200);

      const sortedChoices = choices.toSorted();

      for (let i = 0; i < choices.length; i++) {
        expect(editor.find(`tbody td:eq(${i})`).text()).toEqual(sortedChoices[i]);
      }
    });
  });

  describe('closing editor', () => {
    it('should destroy editor when value change with mouse click on suggestion', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      autocomplete().find('tbody td:eq(3)').simulate('mousedown');

      expect(getDataAtCell(0, 0)).toEqual('green');
    });

    it('should not change value type from `numeric` to `string` after mouse click suggestion - ' +
      'test no. 1 #4143', async() => {

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: [1, 2, 3, 4, 5, 11, 14]
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      autocomplete().find('tbody td:eq(0)').simulate('mousedown');

      expect(typeof getDataAtCell(0, 0)).toEqual('number');
    });

    it('should not change value type from `numeric` to `string` after mouse click on suggestion - ' +
      'test no. 2 #4143', async() => {
      const syncSources = jasmine.createSpy('syncSources');
      const source = [1, 2, 3, 4, 5, 11, 14];

      syncSources.and.callFake((query, process) => {
        process(source);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      autocomplete().find('tbody td:eq(0)').simulate('mousedown');

      expect(typeof getDataAtCell(0, 0)).toEqual('number');
    });

    it('should call `afterChange` hook with proper value types - test no. 1 #4143', async() => {
      let changesInside;

      const afterChange = (changes, source) => {
        if (source !== 'loadData') {
          changesInside = changes;
        }
      };

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: [1, 2, 3, 4, 5, 11, 14]
          }
        ],
        afterChange
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      autocomplete().find('tbody td:eq(1)').simulate('mousedown');

      expect(changesInside[0]).toEqual([0, 0, null, 2]);
    });

    it('should call `afterChange` hook with proper value types - test no. 2 #4143', async() => {
      let changesInside;

      const afterChange = (changes, source) => {
        if (source !== 'loadData') {
          changesInside = changes;
        }
      };

      const syncSources = jasmine.createSpy('syncSources');
      const source = [1, 2, 3, 4, 5, 11, 14];

      syncSources.and.callFake((query, process) => {
        process(source);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ],
        afterChange
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      autocomplete().find('tbody td:eq(1)').simulate('mousedown');

      expect(changesInside[0]).toEqual([0, 0, null, 2]);
    });

    it('should not change value type from `numeric` to `string` when written down value from set of suggestions #4143', async() => {
      const syncSources = jasmine.createSpy('syncSources');
      const source = [1, 2, 3, 4, 5, 11, 14];

      syncSources.and.callFake((query, process) => {
        process(source);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await keyDownUp('backspace');

      document.activeElement.value = '1';

      await keyUp('1');
      await sleep(200);
      await keyDownUp('enter');

      expect(getDataAtCell(0, 0)).toEqual(1);
    });

    it('should destroy editor when value change with Enter on suggestion', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      await keyDownUp('arrowdown');
      await keyDownUp('arrowdown');
      await keyDownUp('arrowdown');
      await keyDownUp('arrowdown');
      await keyDownUp('enter');

      expect(getDataAtCell(0, 0)).toEqual('green');
    });

    it('should destroy editor when pressed Enter then Esc', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      expect(isEditorVisible(autocompleteEditor())).toBe(true);

      await keyDownUp('escape');

      expect(isEditorVisible(autocompleteEditor())).toBe(false);
    });

    it('should destroy editor when mouse double clicked then Esc', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await mouseDoubleClick(getCell(0, 0));
      await sleep(200);

      expect(isEditorVisible(autocompleteEditor())).toBe(true);

      await keyDownUp('escape');

      expect(isEditorVisible(autocompleteEditor())).toBe(false);
    });

    it('cancel editing (Esc) should restore the previous value', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await setDataAtCell(0, 0, 'black');

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      autocomplete().siblings('.handsontableInput').val('ye');

      await keyDownUp('e'); // e
      await keyDownUp('escape');

      expect(getDataAtCell(0, 0)).toEqual('black');
    });

    it('should destroy editor when clicked outside the table', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await mouseDoubleClick(getCell(0, 0));
      await sleep(200);

      expect(isEditorVisible(autocompleteEditor())).toBe(true);

      $('body').simulate('mousedown');

      expect(isEditorVisible(autocompleteEditor())).toBe(false);
    });

    it('should show fillHandle element again after close editor', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.plan = function(query, process) {
        process(choices.filter(choice => choice.indexOf(query) !== -1));
      };

      handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: syncSources,
            strict: false
          },
          {}
        ]
      });

      await selectCell(1, 0);
      await keyDownUp('x'); // Trigger quick edit mode
      await keyDownUp('enter');
      await sleep(200);

      expect($('#testContainer .handsontable > .handsontable .wtBorder.current.corner:visible').length).toEqual(1);
    });
  });

  describe('non strict mode', () => {
    it('should allow any value in non strict mode (close editor with ENTER)', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      const editor = $('.handsontableInput');

      editor.val('foo');

      await keyDownUp('enter');

      expect(getDataAtCell(0, 0)).toEqual('foo');
    });

    it('should not save the value in non strict mode, when closing the editor by clicking on the table', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(50);

      const editor = $('.handsontableInput');

      editor.val('foo');
      spec().$container.find('tbody tr:eq(1) td:eq(0)').simulate('mousedown');

      expect(getDataAtCell(0, 0)).toEqual(null);
    });

    it('should not save the value in non strict mode, when closing the editor by clicking outside of the table', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(50);

      const editor = $('.handsontableInput');

      editor.val('foo');
      $('body').simulate('mousedown');

      expect(getDataAtCell(0, 0)).toEqual(null);
    });

    it('should save the value from textarea after hitting ENTER', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices.filter(choice => choice.indexOf(query) !== -1));
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      syncSources.calls.reset();

      editorInput.val('b');

      await keyDownUp('b');
      await sleep(200);

      const ac = getActiveEditor();
      const innerHot = ac.htEditor;

      expect(innerHot.getData()).toEqual([
        ['blue'],
        ['black']
      ]);

      const selected = innerHot.getSelected();

      expect(selected).toBeUndefined();

      await keyDownUp('enter');

      expect(getDataAtCell(0, 0)).toEqual('b');
    });
  });

  describe('strict mode', () => {
    it('strict mode should NOT use value if it DOES NOT match the list (sync response is empty)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      const onAfterChange = jasmine.createSpy('onAfterChange');
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process([]); // hardcoded empty result
      });

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: syncSources,
            allowInvalid: false,
            strict: true
          },
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      await setDataAtCell(0, 0, 'unexistent');

      await sleep(200);

      expect(getData()).toEqual([
        ['one', 'two'],
        ['three', 'four']
      ]);

      expect(syncSources.calls.count()).toEqual(1);
      expect(onAfterValidate.calls.count()).toEqual(1);
      expect(onAfterChange.calls.count()).toEqual(1); // 1 for loadData (it is not called after failed edit)
    });

    it('strict mode should use value if it DOES match the list (sync response is not empty)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      const onAfterChange = jasmine.createSpy('onAfterChange');
      const syncSources = jasmine.createSpy('asyncSources');

      syncSources.and.callFake((query, process) => {
        process(choices); // hardcoded empty result
      });

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: syncSources,
            allowInvalid: false,
            strict: true
          },
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      await setDataAtCell(0, 0, 'yellow');

      await sleep(200);

      expect(getData()).toEqual([
        ['yellow', 'two'],
        ['three', 'four']
      ]);

      expect(syncSources.calls.count()).toEqual(1);
      expect(onAfterValidate.calls.count()).toEqual(1);
      expect(onAfterChange.calls.count()).toEqual(2); // 1 for loadData and 1 for setDataAtCell
    });

    it('strict mode should NOT use value if it DOES NOT match the list (async response is empty)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      const onAfterChange = jasmine.createSpy('onAfterChange');
      const asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.and.callFake((query, process) => {
        setTimeout(() => {
          process([]); // hardcoded empty result
        });
      });

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: asyncSources,
            allowInvalid: false,
            strict: true
          },
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      await setDataAtCell(0, 0, 'unexistent');

      await sleep(200);

      expect(getData()).toEqual([
        ['one', 'two'],
        ['three', 'four']
      ]);

      expect(asyncSources.calls.count()).toEqual(1);
      expect(onAfterValidate.calls.count()).toEqual(1);
      expect(onAfterChange.calls.count()).toEqual(1); // 1 for loadData (it is not called after failed edit)
    });

    it('strict mode should use value if it DOES match the list (async response is not empty)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      const onAfterChange = jasmine.createSpy('onAfterChange');
      const asyncSources = jasmine.createSpy('asyncSources');

      asyncSources.and.callFake((query, process) => {
        setTimeout(() => {
          process(choices); // hardcoded empty result
        });
      });

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: asyncSources,
            allowInvalid: false,
            strict: true
          },
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      await setDataAtCell(0, 0, 'yellow');

      await sleep(200);

      expect(getData()).toEqual([
        ['yellow', 'two'],
        ['three', 'four']
      ]);

      expect(asyncSources.calls.count()).toEqual(1);
      expect(onAfterValidate.calls.count()).toEqual(1);
      expect(onAfterChange.calls.count()).toEqual(2); // 1 for loadData and 1 for setDataAtCell
    });

    it('strict mode mark value as invalid if it DOES NOT match the list (sync response is empty)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      const onAfterChange = jasmine.createSpy('onAfterChange');
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process([]); // hardcoded empty result
      });

      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: syncSources,
            allowInvalid: true,
            strict: true
          },
          {}
        ],
        afterValidate: onAfterValidate,
        afterChange: onAfterChange
      });

      expect(getCellMeta(0, 0).valid).not.toBe(false);
      expect($(getCell(0, 0)).hasClass('htInvalid')).toBe(false);

      await setDataAtCell(0, 0, 'unexistent');

      await sleep(200);

      expect(getData()).toEqual([
        ['unexistent', 'two'],
        ['three', 'four']
      ]);

      expect(getCellMeta(0, 0).valid).toBe(false);
      expect($(getCell(0, 0)).hasClass('htInvalid')).toBe(true);
    });

    it('should select the best matching option after hitting ENTER', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices.filter(choice => choice.indexOf(query) !== -1));
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            strict: true
          }
        ],
        afterValidate: onAfterValidate
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      syncSources.calls.reset();

      editorInput.val('b');

      await keyDownUp('b');
      await sleep(200);

      const ac = getActiveEditor();
      const innerHot = ac.htEditor;

      expect(innerHot.getData()).toEqual([
        ['blue'],
        ['black']
      ]);

      const selected = innerHot.getSelected()[0];
      const selectedData = innerHot.getDataAtCell(selected[0], selected[1]);

      expect(selectedData).toEqual('blue');

      onAfterValidate.calls.reset();

      await keyDownUp('enter');
      await sleep(200);

      expect(getDataAtCell(0, 0)).toEqual('blue');
    });

    it('should select the best matching option after hitting TAB', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices.filter(choice => choice.indexOf(query) !== -1));
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            strict: true
          }
        ],
        afterValidate: onAfterValidate
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      syncSources.calls.reset();

      editorInput.val('b');

      await keyDownUp('b');
      await sleep(200);

      const ac = getActiveEditor();
      const innerHot = ac.htEditor;

      expect(innerHot.getData()).toEqual([
        ['blue'],
        ['black']
      ]);

      const selected = innerHot.getSelected()[0];
      const selectedData = innerHot.getDataAtCell(selected[0], selected[1]);

      expect(selectedData).toEqual('blue');

      onAfterValidate.calls.reset();

      await keyDownUp('tab');
      await sleep(200);

      expect(getDataAtCell(0, 0)).toEqual('blue');
    });

    it('should mark list item corresponding to current cell value as selected', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(['red', 'dark-yellow', 'yellow', 'light-yellow', 'black']);
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            strict: true
          }
        ],
        data: [
          ['yellow'],
          ['red'],
          ['blue']
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      expect(autocomplete().find('.current').text()).toEqual(getDataAtCell(0, 0));
    });
  });

  describe('filtering', () => {
    it('typing in textarea should filter the lookup list', async() => {
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choices.filter(choice => choice.indexOf(query) !== -1));
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      syncSources.calls.reset();
      editorInput.val('e');

      await keyDownUp('e'); // e
      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['yellow'],
          ['red'],
          ['orange'],
          ['green'],
          ['blue'],
          ['white'],
          ['purple'],
          ['lime'],
          ['olive'],
        ]);

        syncSources.calls.reset();
        editorInput.val('ed');

        await keyDownUp('d'); // d
      }

      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['red']
        ]);
      }
    });

    it('default filtering should be case insensitive', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');

      editorInput.val('e');

      await keyDownUp('e'); // e
      await sleep(50);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['yellow'],
          ['red'],
          ['orange'],
          ['green'],
          ['blue'],
          ['white'],
          ['purple'],
          ['lime'],
          ['olive'],
        ]);

        editorInput.val('e');

        await keyDownUp('e'); // E (same as 'e')
      }

      await sleep(50);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['yellow'],
          ['red'],
          ['orange'],
          ['green'],
          ['blue'],
          ['white'],
          ['purple'],
          ['lime'],
          ['olive'],
        ]);
      }
    });

    it('default filtering should be case sensitive when filteringCaseSensitive is true', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            filteringCaseSensitive: true
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');

      editorInput.val('e');

      await keyDownUp('e'); // e
      await sleep(100);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['yellow'],
          ['red'],
          ['orange'],
          ['green'],
          ['blue'],
          ['white'],
          ['purple'],
          ['lime'],
          ['olive'],
        ]);

        editorInput.val('E');

        await keyDownUp('e'); // E (same as 'e')
      }

      await sleep(100);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([]);
        expect(innerHot.getSourceData()).toEqual([]);
      }
    });

    it('typing in textarea should NOT filter the lookup list when filtering is disabled', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            filter: false
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(20);

      editorInput.val('e');

      await keyDownUp('e'); // e
      await sleep(20);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual(Handsontable.helper.pivot([choices]));

        editorInput.val('ed');

        await keyDownUp('d'); // d
      }

      await sleep(20);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual(Handsontable.helper.pivot([choices]));
      }
    });

    it('typing in textarea should highlight the matching phrase', async() => {
      const choicesList = ['Male', 'Female'];
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choicesList.filter(choice => choice.search(new RegExp(query, 'i')) !== -1));
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            filter: false
          }
        ]
      });

      await selectCell(0, 0);
      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      syncSources.calls.reset();

      editorInput.val('Male');

      await keyDownUp('e'); // e
      await sleep(200);

      const ac = getActiveEditor();
      const innerHot = ac.htEditor;
      const autocompleteList = $(innerHot.rootElement);

      expect(autocompleteList.find('td:eq(0)').html()).toMatch(/<(strong|STRONG)>Male<\/(strong|STRONG)>/); // IE8 makes the tag names UPPERCASE
      expect(autocompleteList.find('td:eq(1)').html()).toMatch(/Fe<(strong|STRONG)>male<\/(strong|STRONG)>/);
    });

    it('text in textarea should not be interpreted as regexp', async() => {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'queryChoices').and.callThrough();
      const queryChoices = Handsontable.editors.AutocompleteEditor.prototype.queryChoices;

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
          }
        ]
      });

      await selectCell(0, 0);
      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      queryChoices.calls.reset();
      editorInput.val('yellow|red');

      await keyDownUp('d');
      await sleep(200);

      const ac = getActiveEditor();
      const innerHot = ac.htEditor;

      expect(innerHot.getData().length).toEqual(0);
    });

    it('text in textarea should not be interpreted as regexp when highlighting the matching phrase', async() => {
      const choicesList = ['Male', 'Female'];
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choicesList.filter(choice => choice.search(new RegExp(query, 'i')) !== -1));
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            filter: false
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      syncSources.calls.reset();
      editorInput.val('M|F');

      await keyDownUp('F');
      await sleep(200);

      const ac = getActiveEditor();
      const innerHot = ac.htEditor;

      const autocompleteList = $(innerHot.rootElement);

      expect(autocompleteList.find('td:eq(0)').html()).toEqual('Male');
      expect(autocompleteList.find('td:eq(1)').html()).toEqual('Female');
    });

    it('should allow any value if filter === false and allowInvalid === true', async() => {
      spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'queryChoices').and.callThrough();
      const queryChoices = Handsontable.editors.AutocompleteEditor.prototype.queryChoices;

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices,
            filter: false,
            strict: true,
            allowInvalid: true
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('f');
      await sleep(10);

      queryChoices.calls.reset();
      editorInput.val('foobar');

      await keyDownUp('r');
      await sleep(200);
      await keyDownUp('enter');

      expect(getDataAtCell(0, 0)).toEqual('foobar');
    });

    it('typing in textarea should highlight best choice, if strict === true', async() => {
      const choicesList = ['Male', 'Female'];
      const syncSources = jasmine.createSpy('syncSources');

      syncSources.and.callFake((query, process) => {
        process(choicesList.filter(choice => choice.search(new RegExp(query, 'i')) !== -1));
      });

      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: syncSources,
            filter: false,
            strict: true
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      syncSources.calls.reset();
      editorInput.val('e');

      await keyDownUp('e'); // e
      await sleep(200);

      const ac = getActiveEditor();
      const innerHot = ac.htEditor;

      expect(innerHot.getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  it('should restore the old value when hovered over a autocomplete menu item and then clicked outside of the table', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices);
    });

    handsontable({
      columns: [
        {
          editor: 'autocomplete',
          source: syncSources
        }
      ]
    });

    await selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toBeNull();

    await keyDownUp('enter');
    await sleep(200);

    autocomplete().find('tbody td:eq(1)').simulate('mouseenter');
    autocomplete().find('tbody td:eq(1)').simulate('mouseleave');

    spec().$container.simulate('mousedown');

    expect(getDataAtCell(0, 0)).toEqual(null);
  });

  it('should be able to use empty value ("")', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(['', 'BMW', 'Bentley']);
    });

    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          editor: 'autocomplete',
          source: syncSources,
          filter: false
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');
    await sleep(200);

    expect(getDataAtCell(0, 0)).toEqual('one');

    autocomplete().find('tbody td:eq(0)').simulate('mousedown');

    expect(getDataAtCell(0, 0)).toEqual('');
  });

  describe('allow html mode', () => {
    it('should allow inject html items (async mode)', async() => {
      handsontable({
        columns: [
          {
            type: 'autocomplete',
            source(query, cb) {
              cb(['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>']);
            },
            allowHtml: true,
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      editorInput.val('b');

      await keyDownUp('b');
      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['<i>bar</i>'],
          ['<strong>baz</strong>'],
        ]);

        editorInput.val('bar');

        await keyDownUp('a');
        await keyDownUp('r');
      }

      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['<i>bar</i>']
        ]);

        await keyDownUp('arrowdown');
        await keyDownUp('enter');
      }

      await sleep(100);

      expect(getCell(0, 0).querySelector('i').textContent).toBe('bar');
    });

    it('should allow inject html items (sync mode)', async() => {
      handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: ['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>'],
            allowHtml: true,
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      editorInput.val('b');

      await keyDownUp('b');
      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['<i>bar</i>'],
          ['<strong>baz</strong>'],
        ]);

        editorInput.val('bar');

        await keyDownUp('a');
        await keyDownUp('r');
      }

      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['<i>bar</i>']
        ]);

        await keyDownUp('arrowdown');
        await keyDownUp('enter');
      }

      await sleep(100);

      expect(getCell(0, 0).querySelector('i').textContent).toBe('bar');
    });

    it('should allow render the html items without sanitizing the content', async() => {
      handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: [
              '<b>foo <span>zip</span></b>',
              '<i>bar</i><img src onerror="__xssTestInjection = true">',
              '<strong>baz</strong>'
            ],
            allowHtml: true,
          }
        ]
      });

      await selectCell(0, 0);
      await keyDownUp('enter');
      await sleep(200);

      const ac = getActiveEditor();
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
    it('should be disabled by default', async() => {
      handsontable({
        columns: [
          {
            type: 'autocomplete',
            source(query, cb) {
              cb(['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>']);
            },
            allowHtml: false,
          }
        ]
      });

      expect(getCellMeta(0, 0).allowHtml).toBeFalsy();
    });

    it('should strip html from strings provided in source (async mode)', async() => {
      handsontable({
        columns: [
          {
            type: 'autocomplete',
            source(query, cb) {
              cb(['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>']);
            },
            allowHtml: false,
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      editorInput.val('b');

      await keyDownUp('b');
      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['bar'],
          ['baz'],
        ]);

        editorInput.val('bar');

        await keyDownUp('a');
        await keyDownUp('r');
      }

      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['bar']
        ]);

        await keyDownUp('arrowdown');
        await keyDownUp('enter');
      }

      await sleep(200);

      expect(getCell(0, 0).querySelector('i')).toBeNull();
      expect(getCell(0, 0).textContent).toMatch('bar');
    });

    it('should strip html from strings provided in source (sync mode)', async() => {
      handsontable({
        columns: [
          {
            type: 'autocomplete',
            source: ['<b>foo <span>zip</span></b>', '<i>bar</i>', '<strong>baz</strong>'],
            allowHtml: false,
          }
        ]
      });

      await selectCell(0, 0);

      const editorInput = $('.handsontableInput');

      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('enter');
      await sleep(200);

      editorInput.val('b');

      await keyDownUp('b');
      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['bar'],
          ['baz'],
        ]);
      }

      editorInput.val('bar');

      await keyDownUp('a');
      await keyDownUp('r');
      await sleep(200);

      {
        const ac = getActiveEditor();
        const innerHot = ac.htEditor;

        expect(innerHot.getData()).toEqual([
          ['bar']
        ]);
      }

      await keyDownUp('arrowdown');
      await keyDownUp('enter');
      await sleep(100);

      expect(getCell(0, 0).querySelector('i')).toBeNull();
      expect(getCell(0, 0).textContent).toMatch('bar');
    });
  });

  it('should not modify the suggestion lists\' order, when the `sortByRelevance` option is set to `true`', async() => {
    const choicesList = [
      'Wayne', 'Draven', 'Banner', 'Stark', 'Parker', 'Kent', 'Gordon', 'Kyle', 'Simmons'
    ];

    handsontable({
      columns: [
        {
          editor: 'autocomplete',
          source: choicesList,
          sortByRelevance: true
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const $editorInput = $('.handsontableInput');

    $editorInput.val('a');

    await keyDownUp('a');

    Handsontable.dom.setCaretPosition($editorInput[0], 1);

    await sleep(30);

    let dropdownList = $('.autocompleteEditor tbody').first();
    let $trs = dropdownList.find('tr');
    let listLength = $trs.size();

    expect($trs.eq(0).text()).toBe('Wayne');
    expect($trs.eq(1).text()).toBe('Draven');
    expect($trs.eq(2).text()).toBe('Banner');
    expect($trs.eq(3).text()).toBe('Stark');
    expect($trs.eq(4).text()).toBe('Parker');
    expect(listLength).toBe(5);

    await keyDownUp('escape');
    await keyDownUp('enter');

    $editorInput.val('o');

    await keyDownUp('o');

    Handsontable.dom.setCaretPosition($editorInput[0], 1);

    await sleep(30);

    dropdownList = $('.autocompleteEditor tbody').first();
    $trs = dropdownList.find('tr');
    listLength = $trs.size();

    expect($trs.eq(0).text()).toBe('Gordon');
    expect($trs.eq(1).text()).toBe('Simmons');
    expect(listLength).toBe(2);

    await keyDownUp('escape');
    await keyDownUp('enter');

    $editorInput.val('er');

    await keyDownUp('e');
    await keyDownUp('r');

    Handsontable.dom.setCaretPosition($editorInput[0], 1);

    await sleep(30);

    dropdownList = $('.autocompleteEditor tbody').first();
    $trs = dropdownList.find('tr');
    listLength = $trs.size();

    expect($trs.eq(0).text()).toBe('Banner');
    expect($trs.eq(1).text()).toBe('Parker');
    expect(listLength).toBe(2);
  });

  it('should fire one afterChange event when value is changed', async() => {
    const onAfterChange = jasmine.createSpy('onAfterChange');
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices);
    });

    handsontable({
      columns: [
        {
          editor: 'autocomplete',
          source: syncSources
        }
      ],
      afterChange: onAfterChange
    });

    await selectCell(0, 0);
    await keyDownUp('enter');
    await sleep(200);

    onAfterChange.calls.reset();
    autocomplete().find('tbody td:eq(1)').simulate('mousedown');

    expect(getDataAtCell(0, 0)).toEqual('red');
    expect(onAfterChange.calls.count()).toEqual(1);
    expect(onAfterChange).toHaveBeenCalledWith([[0, 0, null, 'red']], 'edit');
  });

  it('should not affect other cell values after clicking on autocomplete cell (#1021)', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices);
    });

    handsontable({
      columns: [
        {},
        {},
        {
          editor: 'autocomplete',
          source: syncSources
        },
        {}
      ],
      data: [
        [null, null, 'yellow', null],
        [null, null, 'red', null],
        [null, null, 'blue', null]
      ]
    });

    expect($(getCell(0, 2)).text()).toMatch('yellow');

    await mouseDoubleClick(getCell(0, 2));

    expect($(getCell(1, 2)).text()).toMatch('red');

    await mouseDoubleClick(getCell(1, 2));

    expect($(getCell(2, 2)).text()).toMatch('blue');

    await mouseDoubleClick(getCell(2, 2));
    await sleep(200);

    expect(getDataAtCol(2)).toEqual(['yellow', 'red', 'blue']);
  });

  it('should handle editor if cell data is a function', async() => {
    spyOn(Handsontable.editors.AutocompleteEditor.prototype, 'updateChoicesList').and.callThrough();
    const afterValidateCallback = jasmine.createSpy('afterValidateCallbak');

    handsontable({
      data: [
        new Model({
          id: 1,
          name: 'Ted Right',
          address: ''
        }),
        new Model({
          id: 2,
          name: 'Frank Honest',
          address: ''
        }),
        new Model({
          id: 3,
          name: 'Joan Well',
          address: ''
        })],
      dataSchema: Model,
      colHeaders: ['ID', 'Name', 'Address'],
      columns: [
        {
          data: createAccessorForProperty('id'),
          type: 'autocomplete',
          source: ['1', '2', '3'],
          filter: false,
          strict: true
        },
        {
          data: createAccessorForProperty('name')
        },
        {
          data: createAccessorForProperty('address')
        }
      ],
      minSpareRows: 1,
      afterValidate: afterValidateCallback
    });

    await selectCell(0, 0);

    expect(getActiveEditor().isOpened()).toBe(false);

    await keyDownUp('enter');
    await sleep(200);

    expect(getActiveEditor().isOpened()).toBe(true);

    afterValidateCallback.calls.reset();
    $(getActiveEditor().htContainer).find('tr:eq(1) td:eq(0)').simulate('mousedown');

    await sleep(200);

    expect(getDataAtCell(0, 0)).toEqual('2');
  });

  // Input element should be focused on cell selection otherwise it breaks IME editor functionality for Asian users.
  it('should not lose the focus on input element while inserting new characters when `imeFastEditing` is enabled  (#839)', async() => {
    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: 'autocomplete',
          source: choices,
        },
        {},
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

    await sleep(50);
    await keyDownUp('enter');

    expect(document.activeElement).toBe(activeElement);

    await sleep(200);

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 't';

    await keyDownUp('t');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 'te';

    await keyDownUp('e');

    expect(document.activeElement).toBe(activeElement);

    getActiveEditor().TEXTAREA.value = 'teo';

    await keyDownUp('o');

    expect(document.activeElement).toBe(activeElement);
  });

  it('should not lose the focus from the editor after selecting items from the choice list', async() => {
    handsontable({
      data: [
        ['', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: 'autocomplete',
          source: ['brown', 'yellow', 'green'],
        },
        {},
      ],
    });

    await selectCell(0, 0);
    await keyDownUp('enter');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');

    getActiveEditor().TEXTAREA.value = 'r';

    await keyDownUp('r');
    // Check if ESCAPE key is responsive.
    await keyDownUp('escape');

    expect(isListening()).toBeTruthy();
    expect(isEditorVisible($(getActiveEditor().htEditor.rootElement))).toBeFalsy();
  });

  it('should not call the `source` has been selected', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process([]); // hardcoded empty result
    });

    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          allowInvalid: false,
          strict: true
        },
        {}
      ],
      cells(row, col) {
        const cellProperties = {};

        if (row === 0 && col === 0) {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      }
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(syncSources).not.toHaveBeenCalled();

    await selectCell(0, 0);

    expect(syncSources).not.toHaveBeenCalled();
    expect(getCellMeta(1, 0).readOnly).toBeFalsy();

    await selectCell(1, 0);

    expect(syncSources).not.toHaveBeenCalled();
  });

  it('should not call the `source` method if cell is read only and the arrow has been clicked', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process([]); // hardcoded empty result
    });

    handsontable({
      data: [
        ['one', 'two'],
        ['three', 'four']
      ],
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          allowInvalid: false,
          strict: true
        },
        {}
      ],
      cells(row, col) {
        const cellProperties = {};

        if (row === 0 && col === 0) {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      }
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect(syncSources).not.toHaveBeenCalled();

    await selectCell(0, 0);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    await sleep(150);

    expect(syncSources).not.toHaveBeenCalled();

    syncSources.calls.reset();

    expect(getCellMeta(1, 0).readOnly).toBeFalsy();

    await selectCell(1, 0);

    $(getCell(1, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    await sleep(150);

    expect(syncSources).toHaveBeenCalled();
    expect(syncSources.calls.count()).toEqual(1);
  });

  it('should add a scrollbar to the autocomplete dropdown, only if number of displayed choices exceeds 10', async() => {
    handsontable({
      data: [
        ['', 'two', 'three'],
        ['four', 'five', 'six']
      ],
      columns: [
        {
          type: 'autocomplete',
          source: choices,
          allowInvalid: false,
          strict: false
        },
        {},
        {}
      ]
    });

    spec().$container.css({
      height: 600
    });

    expect(choices.length).toBeGreaterThan(10);

    await selectCell(0, 0);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    const dropdownHolder = getActiveEditor().htEditor.view._wt.wtTable.holder;

    await sleep(30);

    expect(dropdownHolder.scrollHeight).toBeGreaterThan(dropdownHolder.clientHeight);

    await keyDownUp('escape');

    getSettings().columns[0].source = getSettings().columns[0].source.slice(0).splice(3);
    await updateSettings({});

    await selectCell(0, 0);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    await sleep(30);

    expect(dropdownHolder.scrollHeight > dropdownHolder.clientHeight).toBe(false);
  });

  it('should not close editor on scrolling', async() => {
    handsontable({
      data: createEmptySpreadsheetData(100, 3),
      columns: [
        {
          type: 'autocomplete',
          source: choices,
          allowInvalid: false,
          strict: false
        },
        {},
        {}
      ]
    });

    expect(choices.length).toBeGreaterThan(10);

    await selectCell(0, 0);
    await mouseDoubleClick(getCell(0, 0));
    await sleep(50);

    const dropdown = getActiveEditor().htContainer;

    await scrollViewportVertically(1);

    expect($(dropdown).is(':visible')).toBe(true);

    await selectCell(0, 0);
    await sleep(50);
    await mouseDoubleClick(getCell(0, 0));

    await scrollViewportVertically(3);

    expect($(dropdown).is(':visible')).toBe(true);
  });

  it('should keep textarea caret position, after moving the selection to the suggestion list (pressing down arrow)', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const $editorInput = $('.handsontableInput');

    $editorInput.val('an');

    await keyDownUp('a'); // a
    await keyDownUp('n'); // n

    Handsontable.dom.setCaretPosition($editorInput[0], 1);

    await sleep(200);
    await keyDownUp('arrowdown');

    expect(Handsontable.dom.getCaretPosition($editorInput[0])).toEqual(1);

    await keyDownUp('arrowdown');

    expect(Handsontable.dom.getCaretPosition($editorInput[0])).toEqual(1);
  });

  it('should keep textarea selection, after moving the selection to the suggestion list (pressing down arrow)', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        }
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const $editorInput = $('.handsontableInput');

    $editorInput.val('an');

    await keyDownUp('a'); // a
    await keyDownUp('n'); // n

    Handsontable.dom.setCaretPosition($editorInput[0], 1, 2);

    await sleep(200);
    await keyDownUp('arrowdown');

    expect(Handsontable.dom.getCaretPosition($editorInput[0])).toEqual(1);
    expect(Handsontable.dom.getSelectionEndPosition($editorInput[0])).toEqual(2);

    await keyDownUp('arrowdown');

    expect(Handsontable.dom.getCaretPosition($editorInput[0])).toEqual(1);
    expect(Handsontable.dom.getSelectionEndPosition($editorInput[0])).toEqual(2);
  });

  it('should jump to the sibling cell, after pressing up key in quick edit mode', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // trigger quick edit mode

    const $editorInput = $('.handsontableInput');

    $editorInput.val('an');

    await keyDownUp('a'); // a
    await keyDownUp('n'); // n
    await sleep(200);
    await keyDownUp('arrowup');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('should jump to the next cell, after pressing right key in quick edit mode', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.plan = function(query, process) {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    };

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // trigger quick edit mode

    const $editorInput = $('.handsontableInput');

    $editorInput.val('an');

    await keyDownUp('a'); // a
    await keyDownUp('n'); // n
    await sleep(200);
    await keyDownUp('arrowright');

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  it('should jump to the next cell, after pressing left key in quick edit mode', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {},
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        }
      ]
    });

    await selectCell(1, 1);
    await keyDownUp('x'); // trigger quick edit mode

    const $editorInput = $('.handsontableInput');

    $editorInput.val('an');

    await keyDownUp('a'); // a
    await keyDownUp('n'); // n

    // put caret on the end of the text to ensure that editor will be closed after hit left arrow key
    Handsontable.dom.setCaretPosition($editorInput[0], 2, 2);

    await sleep(200);
    await keyDownUp('arrowleft');

    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  it('should jump to the next cell, after pressing down key in quick edit mode', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // trigger quick edit mode

    const $editorInput = $('.handsontableInput');

    $editorInput.val('an');

    await keyDownUp('a'); // a
    await keyDownUp('n'); // n
    await sleep(200);
    await keyDownUp('arrowdown');

    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  it('should jump to the next cell, after pressing down key in quick edit mode when no matching option list found', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // trigger quick edit mode

    const $editorInput = $('.handsontableInput');

    $editorInput.val('anananan');

    await keyDownUp('a'); // a
    await keyDownUp('n'); // n
    await keyDownUp('a'); // a
    await keyDownUp('n'); // n
    await keyDownUp('a'); // a
    await keyDownUp('n'); // n
    await keyDownUp('a'); // a
    await keyDownUp('n'); // n
    await sleep(200);
    await keyDownUp('arrowdown');

    expect(getSelected()).toEqual([[2, 0, 2, 0]]);
  });

  it('should not jump to the next cell, after pressing down key in quick edit mode when options list was opened', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // trigger quick edit mode

    const $editorInput = $('.handsontableInput');

    $editorInput.val('an');

    await keyDownUp('a'); // a
    await keyDownUp('n'); // n
    await sleep(200);
    await keyDownUp('arrowdown');

    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  it('should select option in opened editor after pressing down key in quick edit mode', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // Trigger quick edit mode
    await sleep(200);
    await keyDownUp('arrowdown');

    expect(getActiveEditor().htEditor.getSelected()).toEqual([[0, 0, 0, 0]]);

    await keyDownUp('arrowdown');

    expect(getActiveEditor().htEditor.getSelected()).toEqual([[1, 0, 1, 0]]);

    await keyDownUp('arrowdown');

    expect(getActiveEditor().htEditor.getSelected()).toEqual([[2, 0, 2, 0]]);
  });

  it('should select option in opened editor after pressing up key in quick edit mode', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ],
      autoWrapCol: false,
      autoWrapRow: false
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // Trigger quick edit mode
    await sleep(200);

    getActiveEditor().htEditor.selectCell(2, 0);

    expect(getActiveEditor().htEditor.getSelected()).toEqual([[2, 0, 2, 0]]);

    await keyDownUp('arrowup');

    expect(getActiveEditor().htEditor.getSelected()).toEqual([[1, 0, 1, 0]]);

    await keyDownUp('arrowup');

    expect(getActiveEditor().htEditor.getSelected()).toEqual([[0, 0, 0, 0]]);

    await keyDownUp('arrowup');

    expect(getActiveEditor().htEditor.getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('should not close editor in quick edit mode after pressing down key when last option is selected', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // Trigger quick edit mode
    await sleep(200);

    getActiveEditor().htEditor.selectCell(7, 0);
    await listen();

    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');
    await keyDownUp('arrowdown');

    expect(getActiveEditor().isOpened()).toBe(true);
  });

  it('should close editor in quick edit mode after pressing up key when no option is selected', async() => {
    const syncSources = jasmine.createSpy('syncSources');

    syncSources.and.callFake((query, process) => {
      process(choices.filter(choice => choice.indexOf(query) !== -1));
    });

    handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: syncSources,
          strict: false
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // Trigger quick edit mode
    await sleep(200);

    getActiveEditor().htEditor.selectCell(1, 0);
    await listen();

    await keyDownUp('arrowup');
    await keyDownUp('arrowup');
    await keyDownUp('arrowup');

    expect(getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      editor: 'autocomplete',
    });

    await selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  it('should update the suggestion list after minimal delay (FF issue, see #9077)', async() => {
    const hot = handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: choices,
        },
        {}
      ]
    });

    await selectCell(1, 0);
    await keyDownUp('x'); // Trigger quick edit mode
    await sleep(100);

    spyOn(hot, '_registerTimeout');

    await keyDownUp('x');

    expect(hot._registerTimeout).toHaveBeenCalledTimes(1);
    expect(hot._registerTimeout).toHaveBeenCalledWith(jasmine.anything(), 10);
  });

  it('should close the autocomplete editor after call `useTheme`', async() => {
    const hot = handsontable({
      columns: [
        {
          type: 'autocomplete',
          source: choices
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

  describe('IME support', () => {
    it('should focus the editable element after a timeout when selecting the cell if `imeFastEdit` is' +
      ' enabled', async() => {
      handsontable({
        columns: [
          {
            editor: 'autocomplete',
            source: choices
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
});
