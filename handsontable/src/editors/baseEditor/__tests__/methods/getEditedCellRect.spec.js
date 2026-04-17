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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);

            return {
              start: 0,
              top: 0,
              width: L.defaultColumnWidth,
              maxWidth: 300 - sb,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: 200 - sb,
            };
          });
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial((L) => ({
            start: 0,
            top: 0,
            width: L.defaultColumnWidth + L.cellBorderWidth,
            maxWidth: document.documentElement.clientWidth,
            height: L.cellContentHeight + (2 * L.cellBorderWidth),
            maxHeight: document.documentElement.clientHeight,
          }));
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const colOuter = L.defaultColumnWidth + L.cellBorderWidth;

            return {
              start: 300 - sb - colOuter,
              top: L.defaultDataRowHeight,
              width: colOuter,
              maxWidth: colOuter,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: 200 - sb - L.defaultDataRowHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const v = getE2eDocumentViewport();
            const lastColWidth = hot().getColWidth(countCols() - 1) + L.cellBorderWidth;

            return {
              start: v.scrollLeft + v.clientWidth - lastColWidth,
              top: v.offsetHeight - v.clientHeight + L.defaultDataRowHeight,
              width: lastColWidth,
              maxWidth: lastColWidth,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: v.clientHeight - L.defaultDataRowHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);

            return {
              start: 0,
              top: 0,
              width: L.defaultColumnWidth,
              maxWidth: 300 - sb,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: 200 - sb,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => ({
            start: 0,
            top: 0,
            width: L.defaultColumnWidth + L.cellBorderWidth,
            maxWidth: document.documentElement.clientWidth,
            height: L.cellContentHeight + (2 * L.cellBorderWidth),
            maxHeight: document.documentElement.clientHeight,
          }));
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const col1Start = L.defaultColumnWidth - L.cellBorderWidth;

            return {
              start: col1Start,
              top: L.defaultDataRowHeight,
              width: L.defaultColumnWidth + L.cellBorderWidth,
              maxWidth: 300 - sb - col1Start,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: 200 - sb - L.defaultDataRowHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const v = getE2eDocumentViewport();
            const col0Width = hot().getColWidth(0);
            const col1Start = col0Width - L.cellBorderWidth;

            return {
              start: v.scrollLeft + col1Start,
              top: v.offsetHeight - v.clientHeight + L.defaultDataRowHeight,
              width: hot().getColWidth(1) + (2 * L.cellBorderWidth),
              maxWidth: v.clientWidth - col1Start,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: v.clientHeight - L.defaultDataRowHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);

            return {
              start: 0,
              top: 0,
              width: L.defaultColumnWidth,
              maxWidth: 300 - sb,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: 200 - sb,
            };
          });
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          await selectCell(0, 0);

          expectGetEditedCellRectFromPartial((L) => ({
            start: 0,
            top: 0,
            width: L.defaultColumnWidth + L.cellBorderWidth,
            maxWidth: document.documentElement.clientWidth,
            height: L.cellContentHeight + (2 * L.cellBorderWidth),
            maxHeight: document.documentElement.clientHeight,
          }));
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const cellOuterHeight = L.cellContentHeight + (2 * L.cellBorderWidth);
            const col1Start = L.defaultColumnWidth - L.cellBorderWidth;

            return {
              start: col1Start,
              top: 200 - sb - cellOuterHeight,
              width: L.defaultColumnWidth + L.cellBorderWidth,
              maxWidth: 300 - sb - col1Start,
              height: cellOuterHeight,
              maxHeight: cellOuterHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const v = getE2eDocumentViewport();
            const cellOuterHeight = L.cellContentHeight + (2 * L.cellBorderWidth);
            const col0Width = hot().getColWidth(0);
            const col1Start = col0Width - L.cellBorderWidth;

            return {
              start: v.scrollLeft + col1Start,
              top: v.offsetHeight - cellOuterHeight,
              width: hot().getColWidth(1) + (2 * L.cellBorderWidth),
              maxWidth: v.clientWidth - col1Start,
              height: cellOuterHeight,
              maxHeight: cellOuterHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: 200 - sb - bottomOverlayHeight,
              width: L.defaultColumnWidth,
              maxWidth: 300 - sb,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: bottomOverlayHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: document.documentElement.clientHeight - bottomOverlayHeight,
              width: L.defaultColumnWidth + L.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: bottomOverlayHeight + sb,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: 200 - sb - bottomOverlayHeight,
              width: L.defaultColumnWidth,
              maxWidth: 300 - sb,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: bottomOverlayHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const v = getE2eDocumentViewport();
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

            return {
              start: v.scrollLeft,
              top: v.offsetHeight - bottomOverlayHeight - L.cellBorderWidth,
              width: L.defaultColumnWidth + L.cellBorderWidth,
              maxWidth: v.clientWidth,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: bottomOverlayHeight + sb,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: 200 - sb - bottomOverlayHeight,
              width: L.defaultColumnWidth,
              maxWidth: 300 - sb,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: bottomOverlayHeight,
            };
          });
        });

        it('and the scrollable element is the Window object', async() => {
          handsontable({
            layoutDirection,
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsBottom: 2,
          });

          await selectCell(countRows() - 2, 0);

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: document.documentElement.clientHeight - bottomOverlayHeight,
              width: L.defaultColumnWidth + L.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: L.cellContentHeight + (2 * L.cellBorderWidth),
              maxHeight: bottomOverlayHeight + sb,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const colOuter = L.defaultColumnWidth + L.cellBorderWidth;
            const cellOuterHeight = L.cellContentHeight + (2 * L.cellBorderWidth);

            return {
              start: 300 - sb - colOuter,
              top: 200 - sb - cellOuterHeight,
              width: colOuter,
              maxWidth: colOuter,
              height: cellOuterHeight,
              maxHeight: cellOuterHeight,
            };
          });
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

          expectGetEditedCellRectFromPartial((L) => {
            const v = getE2eDocumentViewport();
            const sb = Handsontable.dom.getScrollbarWidth(document);
            const colOuter = L.defaultColumnWidth + L.cellBorderWidth;
            const cellOuterHeight = L.cellContentHeight + (2 * L.cellBorderWidth);

            return {
              start: 4949,
              top: v.offsetHeight - cellOuterHeight - L.cellBorderWidth,
              width: colOuter,
              maxWidth: colOuter,
              height: cellOuterHeight,
              maxHeight: cellOuterHeight + sb,
            };
          });
        });
      });
    });
  });
});
