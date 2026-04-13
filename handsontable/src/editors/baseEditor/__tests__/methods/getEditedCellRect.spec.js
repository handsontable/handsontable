describe('BaseEditor methods - getEditedCellRect', () => {
  Handsontable.editors.registerEditor('my-editor', class BaseEditor extends Handsontable.editors.BaseEditor {
    open() {}
    close() {}
    getValue() {}
    setValue() {}
    focus() {}
  });

  using('configuration object', [
    { htmlDir: 'ltr', layoutDirection: 'inherit' },
    { htmlDir: 'rtl', layoutDirection: 'ltr' },
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

    describe('should return an object with provided correct information about size and position of the cell', () => {
      describe('for top overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_9fd0838eca());
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_0c1f70547f(document.documentElement.clientWidth, document.documentElement.clientHeight));
        });
      });

      describe('for top overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(1, countRows() - 1);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_654f08c592());
        });

        it('and the scrollable element is the Window object', async() => {
          // For this configuration object "{ htmlDir: 'rtl', layoutDirection: 'ltr'}" it's necessary to force
          // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
          if (htmlDir === 'rtl' && layoutDirection === 'ltr') {
            $('html').attr('dir', 'ltr');
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(1, countCols() - 1);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_394b62538f(document.documentElement.clientWidth, document.documentElement.clientHeight));
        });
      });

      describe('for top-left corner overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_9fd0838eca());
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_0c1f70547f(document.documentElement.clientWidth, document.documentElement.clientHeight));
        });
      });

      describe('for top-left corner overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(1, 1);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_1812746652());
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(1, 1);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_59a39f83a8(document.documentElement.clientWidth, document.documentElement.clientHeight));
        });
      });

      describe('for left overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_9fd0838eca());
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_0c1f70547f(document.documentElement.clientWidth, document.documentElement.clientHeight));
        });
      });

      describe('for left overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(countRows() - 1, 1);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_63d4e50227());
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(countRows() - 1, 1);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_f1418f56a2(document.documentElement.clientWidth));
        });
      });

      describe('for bottom-left corner overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
          });

          await selectCell(8, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_e9a5ab9a7a());
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
          });

          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_4ef37f8511(document.documentElement.clientWidth, document.documentElement.clientHeight));
        });
      });

      describe('for bottom-left corner overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_e9a5ab9a7a());
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_5ac91379aa(document.documentElement.clientWidth));
        });
      });

      describe('for bottom overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedRowsBottom: 2,
          });

          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_660b0bbbb1());
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsBottom: 2,
          });

          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_578ee2338a(document.documentElement.clientWidth, document.documentElement.clientHeight));
        });
      });

      describe('for bottom overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedRowsBottom: 2,
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(countRows() - 1, countCols() - 1);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_be63e8af58());
        });

        it('and the scrollable element is the Window object', async() => {
          // For this configuration object "{ htmlDir: 'rtl', layoutDirection: 'ltr'}" it's necessary to force
          // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
          if (htmlDir === 'rtl' && layoutDirection === 'ltr') {
            $('html').attr('dir', 'ltr');
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsBottom: 2,
            // Disabling `autoColumnSize` to prevent pixel-length differences in the spreader width dependent
            // on window size
            autoColumnSize: false
          });

          await scrollViewportTo({
            row: countRows() - 1,
            col: countCols() - 1,
            verticalSnap: 'top',
            horizontalSnap: 'start',
          });
          await selectCell(countRows() - 1, countCols() - 1);

          expectGetEditedCellRectFromPartial((L) => L.e2eGcr_1e686ee3a6());
        });
      });
    });
  });
});
