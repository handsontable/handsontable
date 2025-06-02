describe('TextEditor (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
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

    it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(2, 5),
        editor: 'text',
      });

      await selectCell(0, 0);

      const editableElement = getActiveEditor().TEXTAREA;

      expect(editableElement.getAttribute('dir')).toBeNull();
    });

    it('should render an editor in specified position at cell 0, 0', async() => {
      handsontable({
        layoutDirection,
        columns: [
          {
            type: 'text',
          }
        ],
      });

      await selectCell(0, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      await keyDown('enter');

      expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
    });

    it('should render an editor in specified position at cell 0, 0 when all headers are selected', async() => {
      handsontable({
        layoutDirection,
        rowHeaders: true,
        colHeaders: true,
        columns: [
          {
            type: 'text',
          }
        ],
      });

      await listen();

      await selectAll();

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      await keyDown('F2');

      expect(editor.offset()).toEqual($(getCell(0, 0)).offset());
    });

    it.forTheme('classic')('should render an editor in specified position while opening an editor ' +
      'from top to bottom when top and bottom overlays are enabled', async() => {
      handsontable({
        layoutDirection,
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

      await selectCell(0, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      await keyDown('enter');

      expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      // Cells that do not touch the edges of the table have an additional top border.
      const editorOffset = () => ({
        top: editor.offset().top + 1,
        left: editor.offset().left,
      });

      expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
      expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
    });

    it.forTheme('main')('should render an editor in specified position while opening an editor ' +
      'from top to bottom when top and bottom overlays are enabled', async() => {
      spec().$container[0].style.height = '240px';
      spec().$container[0].style.width = '200px';

      handsontable({
        layoutDirection,
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

      await selectCell(0, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      await keyDown('enter');

      expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      // Cells that do not touch the edges of the table have an additional top border.
      const editorOffset = () => ({
        top: editor.offset().top + 1,
        left: editor.offset().left,
      });

      expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
      expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
    });

    it.forTheme('horizon')('should render an editor in specified position while opening an editor ' +
      'from top to bottom when top and bottom overlays are enabled', async() => {
      spec().$container[0].style.height = '306px';
      spec().$container[0].style.width = '200px';

      handsontable({
        layoutDirection,
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

      await selectCell(0, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      await keyDown('enter');

      expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      // Cells that do not touch the edges of the table have an additional top border.
      const editorOffset = () => ({
        top: editor.offset().top + 1,
        left: editor.offset().left,
      });

      expect(editorOffset()).toEqual($(getCell(1, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
      expect(editor.offset()).toEqual($(getCell(5, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(6, 0, true)).offset());

      await keyDown('enter');
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
    });

    it('should render an editor in specified position while opening an editor from left to right when ' +
      'left overlay is enabled', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(2, 5),
        rowHeaders: true,
        colHeaders: true,
        fixedColumnsStart: 3,
        type: 'text',
      });

      await selectCell(0, 0);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      await keyDown('enter');

      expect(editor.offset()).toEqual($(getCell(0, 0, true)).offset());

      await selectCell(0, 1);
      await keyDown('enter');

      // Cells that do not touch the edges of the table have an additional left border.
      const editorOffset = () => ({
        top: editor.offset().top,
        left: editor.offset().left,
      });

      expect(editorOffset()).toEqual($(getCell(0, 1, true)).offset());

      await selectCell(0, 2);
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

      await selectCell(0, 3);
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

      await selectCell(0, 4);
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
    });

    it.forTheme('classic')(
      'should render an editor in specified position while opening an editor from top to bottom when ' +
      'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
        handsontable({
          layoutDirection,
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

        await selectCell(1, 0);

        const editor = $(getActiveEditor().TEXTAREA_PARENT);

        await keyDown('enter');

        // First renderable row index.
        expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        // Cells that do not touch the edges of the table have an additional top border.
        const editorOffset = () => ({
          top: editor.offset().top + 1,
          left: editor.offset().left,
        });

        expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
        expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
      });

    it.forTheme('main')(
      'should render an editor in specified position while opening an editor from top to bottom when ' +
      'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
        spec().$container[0].style.height = '240px';
        spec().$container[0].style.width = '200px';

        handsontable({
          layoutDirection,
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

        await selectCell(1, 0);

        const editor = $(getActiveEditor().TEXTAREA_PARENT);

        await keyDown('enter');

        // First renderable row index.
        expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        // Cells that do not touch the edges of the table have an additional top border.
        const editorOffset = () => ({
          top: editor.offset().top + 1,
          left: editor.offset().left,
        });

        expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
        expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
      });

    it.forTheme('horizon')(
      'should render an editor in specified position while opening an editor from top to bottom when ' +
      'top and bottom overlays are enabled and the first row of the both overlays are hidden', async() => {
        spec().$container[0].style.height = '306px';
        spec().$container[0].style.width = '200px';

        handsontable({
          layoutDirection,
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

        await selectCell(1, 0);

        const editor = $(getActiveEditor().TEXTAREA_PARENT);

        await keyDown('enter');

        // First renderable row index.
        expect(editor.offset()).toEqual($(getCell(1, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        // Cells that do not touch the edges of the table have an additional top border.
        const editorOffset = () => ({
          top: editor.offset().top + 1,
          left: editor.offset().left,
        });

        expect(editorOffset()).toEqual($(getCell(2, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(3, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(4, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        // The first row of the bottom overlay has different position, influenced by `innerBorderTop` CSS class.
        expect(editor.offset()).toEqual($(getCell(6, 0, true)).offset());

        await keyDown('enter');
        await keyDown('enter');

        expect(editorOffset()).toEqual($(getCell(7, 0, true)).offset());
      });

    it('should render an editor in specified position while opening an editor from left to right when ' +
      'right overlay is enabled and the first column of the overlay is hidden', async() => {
      handsontable({
        layoutDirection,
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

      await selectCell(0, 1);

      const editor = $(getActiveEditor().TEXTAREA_PARENT);

      await keyDown('enter');

      // First renderable column index.
      expect(editor.offset()).toEqual($(getCell(0, 1, true)).offset());

      await selectCell(0, 2);
      await keyDown('enter');

      // Cells that do not touch the edges of the table have an additional left border.
      const editorOffset = () => ({
        top: editor.offset().top,
        left: editor.offset().left,
      });

      expect(editorOffset()).toEqual($(getCell(0, 2, true)).offset());

      await selectCell(0, 3);
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(0, 3, true)).offset());

      await selectCell(0, 4);
      await keyDown('enter');

      expect(editorOffset()).toEqual($(getCell(0, 4, true)).offset());
    });

    it('should change editor\'s CSS properties during switching to being visible', async() => {
      handsontable({
        layoutDirection,
        editor: 'text',
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

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

    it('should hide editor when quick navigation by click scrollbar was triggered', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 50),
        rowHeaders: true,
        colHeaders: true
      });

      await setDataAtCell(2, 2, 'string\nstring\nstring');

      await selectCell(2, 2);
      await keyDown('enter');
      await keyUp('enter');
      await scrollViewportTo({ row: 49 });

      expect(isEditorVisible()).toBe(false);
    });

    it('should scroll editor to a cell, if trying to edit cell that is outside of the viewport', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(20, 20),
        width: 100,
        height: 50
      });

      await selectCell(0, 0);

      expect(getCell(0, 0)).not.toBeNull();
      expect(getCell(19, 19)).toBeNull();

      await scrollViewportTo({ row: 19, col: 19 });

      expect(getCell(0, 0)).toBeNull();
      expect(getCell(19, 19)).not.toBeNull();

      await keyDown('enter');

      expect(getCell(0, 0)).not.toBeNull();
      expect(getCell(19, 19)).toBeNull();
    });
  });
});
