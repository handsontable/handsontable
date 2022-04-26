describe('Comments (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);

      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('Styling', () => {
      it('should display comment indicators in the appropriate cells', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          comments: true,
          cell: [
            { row: 1, col: 1, comment: { value: 'test' } },
            { row: 2, col: 2, comment: { value: 'test' } }
          ]
        });

        expect(getCell(1, 1).classList.contains('htCommentCell')).toBeTrue();
        expect(getComputedStyle(getCell(1, 1), ':after').left).toBe('0px');
        expect(getComputedStyle(getCell(1, 1), ':after').right).toBe('43px');
        expect(getComputedStyle(getCell(1, 1), ':after').borderLeftWidth).toBe('0px');
        expect(getComputedStyle(getCell(1, 1), ':after').borderRightWidth).toBe('6px');
        expect(getCell(2, 2).classList.contains('htCommentCell')).toBeTrue();
        expect(getComputedStyle(getCell(1, 1), ':after').left).toBe('0px');
        expect(getComputedStyle(getCell(1, 1), ':after').right).toBe('43px');
        expect(getComputedStyle(getCell(2, 2), ':after').borderLeftWidth).toBe('0px');
        expect(getComputedStyle(getCell(2, 2), ':after').borderRightWidth).toBe('6px');
      });

      it('should display the comment editor in the correct place when the viewport is not scrolled (the Window object is a scrollable element)', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          comments: true,
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.editor.getInputElement());

        plugin.showAtCell(0, 1);

        const cellOffset = $(getCell(0, 1)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).toBeCloseTo(cellOffset.left - editorWidth, 0);
      });

      it('should display the comment editor in the correct place when the viewport is scrolled (the Window object is a scrollable element)', async() => {
        // For this configuration object "{ htmlDir: 'ltr', layoutDirection: 'rtl' }" it's necessary to force
        // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
        if (htmlDir === 'ltr' && layoutDirection === 'rtl') {
          $('html').attr('dir', 'rtl');
        }

        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(100, 100),
          comments: true,
        });

        scrollViewportTo(countRows() - 1, countCols() - 1);

        const plugin = getPlugin('comments');
        const $editor = $(plugin.editor.getInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 10, countCols() - 10);

        const cellOffset = $(getCell(countRows() - 10, countCols() - 10)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).toBeCloseTo(cellOffset.left - editorWidth, 0);
      });

      it('should display the comment editor in the correct place when the viewport is not scrolled (the Window object is not a scrollable element)', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(30, 20),
          comments: true,
          width: 200,
          height: 200,
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.editor.getInputElement());

        plugin.showAtCell(0, 1);

        const cellOffset = $(getCell(0, 1)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).toBeCloseTo(cellOffset.left - editorWidth, 0);
      });

      it('should display the comment editor in the correct place when the viewport is scrolled (the Window object is not a scrollable element)', async() => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(30, 20),
          comments: true,
          width: 200,
          height: 200,
        });

        scrollViewportTo(countRows() - 1, countCols() - 1);

        const plugin = getPlugin('comments');
        const $editor = $(plugin.editor.getInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 10, countCols() - 10);

        const cellOffset = $(getCell(countRows() - 10, countCols() - 10)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).toBeCloseTo(cellOffset.left - editorWidth, 0);
      });
    });

    describe('Displaying comment after `mouseover` event', () => {
      it('should display in the left position when the table is initialized within the scrollable parent element', async() => {
        const testContainer = $(`
          <div style="width: 250px; height: 200px; overflow: scroll;">
            <div style="width: 2000px; height: 2000px;">
              <div id="hot-container"></div>
            </div>
          </div>
        `).appendTo(spec().$container);

        const hot = new Handsontable(testContainer.find('#hot-container')[0], {
          layoutDirection,
          data: createSpreadsheetData(10, 10),
          width: 200,
          height: 150,
          rowHeaders: true,
          colHeaders: true,
          comments: {
            displayDelay: 1
          },
          cell: [
            { row: 1, col: 1, comment: { value: 'Some comment' } },
          ]
        });

        testContainer
          .scrollLeft(-10)
          .scrollTop(10);

        const cell = $(hot.getCell(1, 1));

        cell.simulate('mouseover', {
          clientX: cell.offset().left + 5,
          clientY: cell.offset().top + 5,
        });

        await sleep(10);

        const commentEditor = $(hot.getPlugin('comments').editor.getInputElement());
        const commentEditorOffset = commentEditor.offset();
        const commentEditorWidth = commentEditor.outerWidth();

        expect({
          top: commentEditorOffset.top,
          left: commentEditorOffset.left + commentEditorWidth,
        }).toEqual(cell.offset());

        hot.destroy();
      });
    });
  });
});
