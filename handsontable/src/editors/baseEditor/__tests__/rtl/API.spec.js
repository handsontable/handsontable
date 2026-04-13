describe('BaseEditor API (RTL mode)', () => {
  Handsontable.editors.registerEditor('my-editor', class BaseEditor extends Handsontable.editors.BaseEditor {
    open() {}
    close() {}
    getValue() {}
    setValue() {}
    focus() {}
  });

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

    describe('getEditedCellRect()', () => {
      describe('should return an object with provided correct information about size and position of the cell', () => {
        describe('for top overlay when viewport is scrolled to the top-right edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsTop: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
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
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await selectCell(0, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_0c1f70547f(document.documentElement.clientWidth, document.documentElement.clientHeight));
          });
        });

        describe('for top overlay when viewport is scrolled to the bottom-left edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsTop: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(1, countRows() - 1);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_8b522d5d5b());
          });

          it('and the scrollable element is the Window object', async() => {
            // For this configuration object "{ htmlDir: 'ltr', layoutDirection: 'rtl' }" it's necessary to force
            // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
            if (htmlDir === 'ltr' && layoutDirection === 'rtl') {
              $('html').attr('dir', 'rtl');
            }

            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsTop: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(1, countCols() - 1);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_e5142224f2(document.documentElement.clientWidth, document.documentElement.clientHeight));
          });
        });

        describe('for top-right corner overlay when viewport is scrolled to the top-right edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
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
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await selectCell(0, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_0c1f70547f(document.documentElement.clientWidth, document.documentElement.clientHeight));
          });
        });

        describe('for top-right corner overlay when viewport is scrolled to the bottom-left edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(1, 1);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_d4ea38684b());
          });

          it('and the scrollable element is the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(1, 1);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_065fabb134(document.documentElement.clientWidth, document.documentElement.clientHeight));
          });
        });

        describe('for right overlay when viewport is scrolled to the top-right edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
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
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await selectCell(0, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_0c1f70547f(document.documentElement.clientWidth, document.documentElement.clientHeight));
          });
        });

        describe('for right overlay when viewport is scrolled to the bottom-left edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 1, 1);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_b03e660972());
          });

          it('and the scrollable element is the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 1, 1);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_3acc8a5880());
          });
        });

        describe('for bottom-right corner overlay when viewport is scrolled to the top-right edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await selectCell(8, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_62100eec40());
          });

          it('and the scrollable element is the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await selectCell(countRows() - 2, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_a7dd654d16(document.documentElement.clientWidth, document.documentElement.clientHeight));
          });
        });

        describe('for bottom-right corner overlay when viewport is scrolled to the bottom-left edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 2, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_3866422adb());
          });

          it('and the scrollable element is the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 2, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_901bb6925b());
          });
        });

        describe('for bottom overlay when viewport is scrolled to the top-right edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsBottom: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await selectCell(countRows() - 2, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_62100eec40());
          });

          it('and the scrollable element is the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsBottom: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await selectCell(countRows() - 2, 0);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_69029d1636(document.documentElement.clientWidth, document.documentElement.clientHeight));
          });
        });

        describe('for bottom overlay when viewport is scrolled to the bottom-left edge', () => {
          it('and the scrollable element is not the Window object', async() => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsBottom: 2,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 1, countCols() - 1);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_230de5a9f7());
          });

          it('and the scrollable element is the Window object', async() => {
            // For this configuration object "{ htmlDir: 'ltr', layoutDirection: 'rtl' }" it's necessary to force
            // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
            if (htmlDir === 'ltr' && layoutDirection === 'rtl') {
              $('html').attr('dir', 'rtl');
            }

            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsBottom: 2,
              // Disabling `autoColumnSize` to prevent pixel-length differences in the spreader width dependent
              // on window size
              autoColumnSize: false,
              viewportColumnRenderingOffset: 10,
              viewportRowRenderingOffset: 10,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 1, countCols() - 1);

            expectGetEditedCellRectFromPartial((L) => L.e2eGcr_3dc880f3f2());
          });
        });
      });
    });
  });
});
