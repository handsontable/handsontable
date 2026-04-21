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

            const { rect, expected, wh } = getEditedCellRectExpectation(() => {
              const sb = Handsontable.dom.getScrollbarWidth(document);

              return {
                start: 0,
                top: 0,
                maxWidth: 300 - sb,
                maxHeight: 200 - sb,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(() => ({
              start: 0,
              top: 0,
              maxWidth: document.documentElement.clientWidth,
              maxHeight: document.documentElement.clientHeight,
            }));

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(rtlEditorRectAtColumnStart234);

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const v = getE2eDocumentViewport();
              const scrollLeftAbs = Math.abs(v.scrollLeft);
              const lastColWidth = hot().getColWidth(countCols() - 1) + L.cellBorderWidth;

              return {
                start: scrollLeftAbs + v.clientWidth - lastColWidth,
                top: v.offsetHeight - v.clientHeight + L.defaultDataRowHeight,
                maxWidth: lastColWidth,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(() => {
              const sb = Handsontable.dom.getScrollbarWidth(document);

              return {
                start: 0,
                top: 0,
                maxWidth: 300 - sb,
                maxHeight: 200 - sb,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(() => ({
              start: 0,
              top: 0,
              maxWidth: document.documentElement.clientWidth,
              maxHeight: document.documentElement.clientHeight,
            }));

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(L => ({
              // Use live rendered column widths because AutoColumnSize may widen data columns
              // beyond `defaultColumnWidth` under themes with wider fonts.
              start: hot().getColWidth(0) - L.cellBorderWidth,
              top: L.defaultDataRowHeight,
            }));

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const v = getE2eDocumentViewport();
              const scrollLeftAbs = Math.abs(v.scrollLeft);
              const col0Width = hot().getColWidth(0);
              const col1Start = col0Width - L.cellBorderWidth;

              return {
                start: scrollLeftAbs + col1Start,
                top: v.offsetHeight - v.clientHeight + L.defaultDataRowHeight,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(() => {
              const sb = Handsontable.dom.getScrollbarWidth(document);

              return {
                start: 0,
                top: 0,
                maxWidth: 300 - sb,
                maxHeight: 200 - sb,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(() => ({
              start: 0,
              top: 0,
              maxWidth: document.documentElement.clientWidth,
              maxHeight: document.documentElement.clientHeight,
            }));

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const sb = Handsontable.dom.getScrollbarWidth(document);
              const cellOuterHeight = L.cellContentHeight + (2 * L.cellBorderWidth);

              return {
                // Use live rendered column widths because AutoColumnSize may widen data columns
                // beyond `defaultColumnWidth` under themes with wider fonts.
                start: hot().getColWidth(0) - L.cellBorderWidth,
                top: 200 - sb - cellOuterHeight,
                maxHeight: cellOuterHeight,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const v = getE2eDocumentViewport();
              const scrollLeftAbs = Math.abs(v.scrollLeft);
              const cellOuterHeight = L.cellContentHeight + (2 * L.cellBorderWidth);
              const col0Width = hot().getColWidth(0);
              const col1Start = col0Width - L.cellBorderWidth;

              return {
                start: scrollLeftAbs + col1Start,
                top: v.offsetHeight - cellOuterHeight,
                maxHeight: cellOuterHeight,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const sb = Handsontable.dom.getScrollbarWidth(document);
              const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

              return {
                start: 0,
                top: 200 - sb - bottomOverlayHeight,
                maxWidth: 300 - sb,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(L => ({
              start: 0,
              top: document.documentElement.clientHeight - L.overlayHeight({ rows: 2 }),
              maxWidth: document.documentElement.clientWidth,
            }));

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const sb = Handsontable.dom.getScrollbarWidth(document);
              const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

              return {
                start: 0,
                top: 200 - sb - bottomOverlayHeight,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const v = getE2eDocumentViewport();
              const scrollLeftAbs = Math.abs(v.scrollLeft);
              const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

              return {
                start: scrollLeftAbs,
                top: v.offsetHeight - bottomOverlayHeight - L.cellBorderWidth,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const sb = Handsontable.dom.getScrollbarWidth(document);
              const bottomOverlayHeight = L.overlayHeight({ rows: 2 });

              return {
                start: 0,
                top: 200 - sb - bottomOverlayHeight,
                maxWidth: 300 - sb,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(L => ({
              start: 0,
              top: document.documentElement.clientHeight - L.overlayHeight({ rows: 2 }),
              maxWidth: document.documentElement.clientWidth,
            }));

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation((L) => {
              const sb = Handsontable.dom.getScrollbarWidth(document);
              const colOuter = L.defaultColumnWidth + L.cellBorderWidth;
              const cellOuterHeight = L.cellContentHeight + (2 * L.cellBorderWidth);

              return {
                start: 300 - sb - colOuter,
                top: 200 - sb - cellOuterHeight,
                maxWidth: colOuter,
              };
            });

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
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

            const { rect, expected, wh } = getEditedCellRectExpectation(
              L => rtlEditorRectAtColumnStart4949SnapBottom(L, getE2eDocumentViewport())
            );

            expect(rect).toEqual(jasmine.objectContaining({ ...expected, ...wh }));
          });
        });
      });
    });
  });
});
