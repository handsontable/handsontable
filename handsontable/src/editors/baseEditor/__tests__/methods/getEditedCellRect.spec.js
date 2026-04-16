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
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 0,
            width: 50,
            maxWidth: 285,
            height: 30,
            maxHeight: 185,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 0,
            width: 51,
            maxWidth: document.documentElement.clientWidth,
            height: 30,
            maxHeight: document.documentElement.clientHeight,
          }));
        });
      });

      describe('for top overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => ({
            start: 234,
            top: 29,
            width: 51,
            maxWidth: 51,
            height: 30,
            maxHeight: 156,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => {
            const v = getE2eDocumentViewport();

            return {
              start: v.scrollLeft + v.clientWidth - 62,
              top: v.offsetHeight - v.clientHeight + 29,
              width: 62,
              maxWidth: 62,
              height: 30,
              maxHeight: v.clientHeight - 29,
            };
          });
        });
      });

      describe('for top-left corner overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 0,
            width: 50,
            maxWidth: 285,
            height: 30,
            maxHeight: 185,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 0,
            width: 51,
            maxWidth: document.documentElement.clientWidth,
            height: 30,
            maxHeight: document.documentElement.clientHeight,
          }));
        });
      });

      describe('for top-left corner overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => ({
            start: 49,
            top: 29,
            width: 51,
            maxWidth: 236,
            height: 30,
            maxHeight: 156,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => {
            const v = getE2eDocumentViewport();

            return {
              start: v.scrollLeft + 50,
              top: v.offsetHeight - v.clientHeight + 29,
              width: 52,
              maxWidth: v.clientWidth - 50,
              height: 30,
              maxHeight: v.clientHeight - 29,
            };
          });
        });
      });

      describe('for left overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 0,
            width: 50,
            maxWidth: 285,
            height: 30,
            maxHeight: 185,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 0,
            width: 51,
            maxWidth: document.documentElement.clientWidth,
            height: 30,
            maxHeight: document.documentElement.clientHeight,
          }));
        });
      });

      describe('for left overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => ({
            start: 49,
            top: 155,
            width: 51,
            maxWidth: 236,
            height: 30,
            maxHeight: 30,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => {
            const v = getE2eDocumentViewport();

            return {
              start: v.scrollLeft + 50,
              top: v.offsetHeight - 30,
              width: 52,
              maxWidth: v.clientWidth - 50,
              height: 30,
              maxHeight: 30,
            };
          });
        });
      });

      describe('for bottom-left corner overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 126,
            width: 50,
            maxWidth: 285,
            height: 30,
            maxHeight: 59,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
          });

          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: document.documentElement.clientHeight - 59,
            width: 51,
            maxWidth: document.documentElement.clientWidth,
            height: 30,
            maxHeight: 74,
          }));
        });
      });

      describe('for bottom-left corner overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 126,
            width: 50,
            maxWidth: 285,
            height: 30,
            maxHeight: 59,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => {
            const v = getE2eDocumentViewport();

            return {
              start: v.scrollLeft,
              top: v.offsetHeight - 60,
              width: 51,
              maxWidth: v.clientWidth,
              height: 30,
              maxHeight: 74,
            };
          });
        });
      });

      describe('for bottom overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(10, 10),
            width: 300,
            height: 200,
            editor: 'my-editor',
            fixedRowsBottom: 2,
          });

          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: 126,
            width: 50,
            maxWidth: 285,
            height: 30,
            maxHeight: 59,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsBottom: 2,
          });

          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial(() => ({
            start: 0,
            top: document.documentElement.clientHeight - 59,
            width: 51,
            maxWidth: document.documentElement.clientWidth,
            height: 30,
            maxHeight: 74,
          }));
        });
      });

      describe('for bottom overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => ({
            start: 234,
            top: 155,
            width: 51,
            maxWidth: 51,
            height: 30,
            maxHeight: 30,
          }));
        });

        it('and the scrollable element is the Window object', async() => {
          if (getLoadedTheme() !== 'main') {
            pending();

            return;
          }

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

          expectGetEditedCellRectFromPartial(() => {
            const v = getE2eDocumentViewport();

            return {
              start: 4949,
              top: v.offsetHeight - 31,
              width: 51,
              maxWidth: 51,
              height: 30,
              maxHeight: 45,
            };
          });
        });
      });
    });
  });
});
