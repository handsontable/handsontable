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
          ],
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

      it('should display the comment editor on the left of the cell when the viewport is not scrolled (the Window object is a scrollable element)', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(4, 10),
          comments: true,
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        plugin.showAtCell(0, 1);

        const cellOffset = $(getCell(0, 1)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left - editorWidth, 0);
          main.toBeCloseTo(cellOffset.left - editorWidth - 1, 0); // border compensation?
        });
      });

      it('should display the comment editor on the left of the cell when the viewport is scrolled (the Window object is a scrollable element)', async() => {
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

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 10, countCols() - 10);

        const cellOffset = $(getCell(countRows() - 10, countCols() - 10)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left - editorWidth, 0);
          main.toBeCloseTo(cellOffset.left - editorWidth - 1, 0); // border compensation?
        });
      });

      it('should display the comment editor on the left of the cell when the viewport is not scrolled (the Window object is not a scrollable element)', () => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(30, 20),
          comments: true,
          width: 400,
          height: 200,
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        plugin.showAtCell(0, 1);

        const cellOffset = $(getCell(0, 1)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left - editorWidth, 0);
          main.toBeCloseTo(cellOffset.left - editorWidth - 1, 0); // border compensation?
        });
      });

      it('should display the comment editor on the left of the cell when the viewport is scrolled (the Window object is not a scrollable element)', async() => {
        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(30, 20),
          comments: true,
          width: 200,
          height: 200,
        });

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 10, countCols() - 10);

        const cellOffset = $(getCell(countRows() - 10, countCols() - 10)).offset();
        const editorOffset = $editor.offset();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left - editorWidth, 0);
          main.toBeCloseTo(cellOffset.left - editorWidth - 1, 0); // border compensation?
        });
      });

      it('should display the comment editor on the right of the cell when there is not enough space of the left', async() => {
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

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 5, countCols() - 2);

        const cellOffset = $(getCell(countRows() - 5, countCols() - 3)).offset();
        const editorOffset = $editor.offset();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left + 1, 0);
          main.toBeCloseTo(cellOffset.left, 0); // border compensation?
        });
      });

      it('should display the comment editor on the top-right of the cell when there is not enough space of the' +
        ' bottom-left', async() => {
        // For this configuration object "{ htmlDir: 'rtl', layoutDirection: 'ltr'}" it's necessary to force
        // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
        if (htmlDir === 'ltr' && layoutDirection === 'rtl') {
          $('html').attr('dir', 'rtl');
        }

        handsontable({
          layoutDirection,
          data: Handsontable.helper.createSpreadsheetData(100, 100),
          comments: true,
        });

        scrollViewportTo({
          row: countRows() - 1,
          col: countCols() - 1,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 2, countCols() - 2);

        const $cell = $(getCell(countRows() - 2, countCols() - 2));
        const cellOffset = $cell.offset();
        const editorOffset = $editor.offset();
        const cellHeight = $cell.outerHeight();
        const cellWidth = $cell.outerWidth();
        const editorHeight = $editor.outerHeight();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top - editorHeight + cellHeight - 1, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left + cellWidth + 1, 0);
          main.toBeCloseTo(cellOffset.left + cellWidth, 0); // border compensation?
        });
      });

      it('should display the comment editor on the top-left of the cell when on the bottom there is no left space', async() => {
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

        scrollViewportTo({
          row: countRows() - 1,
          col: 0,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        const plugin = getPlugin('comments');
        const $editor = $(plugin.getEditorInputElement());

        await sleep(10);

        plugin.showAtCell(countRows() - 1, 0);

        const cell = $(getCell(countRows() - 1, 0));
        const cellOffset = cell.offset();
        const cellHeight = cell.outerHeight();
        const editorOffset = $editor.offset();
        const editorHeight = $editor.outerHeight();
        const editorWidth = $editor.outerWidth();

        expect(editorOffset.top).toBeCloseTo(cellOffset.top - editorHeight + cellHeight - 1, 0);
        expect(editorOffset.left).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.left - editorWidth, 0);
          main.toBeCloseTo(cellOffset.left - editorWidth - 1, 0); // border compensation?
        });
      });
    });

    describe('Displaying comment after `mouseover` event', () => {
      it('should display on the left position when the table is initialized within the scrollable parent element', async() => {
        const testContainer = $(`
          <div style="width: 450px; height: 200px; overflow: scroll;">
            <div style="width: 2000px; height: 2000px;">
              <div id="hot-container"></div>
            </div>
          </div>
        `).appendTo(spec().$container);

        const hot = new Handsontable(testContainer.find('#hot-container')[0], {
          layoutDirection,
          data: createSpreadsheetData(20, 10),
          width: 400,
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
          .scrollLeft(htmlDir === 'rtl' ? -10 : 10)
          .scrollTop(10);

        const cell = $(hot.getCell(1, 1));

        cell.simulate('mouseover', {
          clientX: cell.offset().left + 5,
          clientY: cell.offset().top + 5,
        });

        await sleep(10);

        const commentEditor = $(hot.getPlugin('comments').getEditorInputElement());
        const commentEditorOffset = commentEditor.offset();
        const commentEditorWidth = commentEditor.outerWidth();

        expect({
          top: commentEditorOffset.top,
          left: commentEditorOffset.left + commentEditorWidth,
        }).forThemes(({ classic, main }) => {
          classic.toEqual(cell.offset());
          main.toEqual({
            top: cell.offset().top,
            left: cell.offset().left - 1, // border compensation?
          });
        });

        hot.destroy();
      });
    });
  });
});
