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

            const sbw = Handsontable.dom.getScrollbarWidth();

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: 0,
              width: getDefaultColumnWidth(),
              maxWidth: 300 - sbw,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: 200 - sbw,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: 0,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: document.documentElement.clientHeight,
            }));
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

            expectGetEditedCellRectFromPartial(L => L.e2eGcr_8b522d5d5b());
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

            expectGetEditedCellRectFromPartial((layout) => {
              const v = getE2eDocumentViewport();
              const scrollLeftAbs = Math.abs(v.scrollLeft);
              const td = getActiveEditor().TD;
              const tdWidth = Handsontable.dom.outerWidth(td);

              return {
                start: scrollLeftAbs + v.clientWidth - tdWidth,
                top: v.offsetHeight - v.clientHeight + layout.defaultDataRowHeight,
                width: tdWidth,
                maxWidth: tdWidth,
                height: layout.firstRenderedRowDefaultHeight,
              };
            });
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

            const sbw = Handsontable.dom.getScrollbarWidth();

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: 0,
              width: getDefaultColumnWidth(),
              maxWidth: 300 - sbw,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: 200 - sbw,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: 0,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: document.documentElement.clientHeight,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => ({
              start: getDefaultColumnWidth() - layout.cellBorderWidth,
              top: layout.defaultDataRowHeight,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              height: layout.firstRenderedRowDefaultHeight,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => {
              const v = getE2eDocumentViewport();
              const scrollLeftAbs = Math.abs(v.scrollLeft);

              return {
                start: scrollLeftAbs + getDefaultColumnWidth(),
                top: v.offsetHeight - v.clientHeight + layout.defaultDataRowHeight,
                width: getDefaultColumnWidth() + 2 * layout.cellBorderWidth,
                height: layout.firstRenderedRowDefaultHeight,
              };
            });
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

            const sbw = Handsontable.dom.getScrollbarWidth();

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: 0,
              width: getDefaultColumnWidth(),
              maxWidth: 300 - sbw,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: 200 - sbw,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: 0,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: document.documentElement.clientHeight,
            }));
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

            const sbw = Handsontable.dom.getScrollbarWidth();

            expectGetEditedCellRectFromPartial((layout) => ({
              start: getDefaultColumnWidth() - layout.cellBorderWidth,
              top: (200 - sbw) - layout.firstRenderedRowDefaultHeight,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: layout.firstRenderedRowDefaultHeight,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => {
              const v = getE2eDocumentViewport();
              const scrollLeftAbs = Math.abs(v.scrollLeft);

              return {
                start: scrollLeftAbs + getDefaultColumnWidth(),
                top: v.offsetHeight - layout.firstRenderedRowDefaultHeight,
                width: getDefaultColumnWidth() + 2 * layout.cellBorderWidth,
                height: layout.firstRenderedRowDefaultHeight,
                maxHeight: layout.firstRenderedRowDefaultHeight,
              };
            });
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

            const sbw = Handsontable.dom.getScrollbarWidth();

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: (200 - sbw) - layout.overlayHeight({ rows: 2 }),
              width: getDefaultColumnWidth(),
              maxWidth: 300 - sbw,
              height: layout.firstRenderedRowDefaultHeight,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: document.documentElement.clientHeight - layout.overlayHeight({ rows: 2 }),
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: layout.firstRenderedRowDefaultHeight,
            }));
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

            const sbw = Handsontable.dom.getScrollbarWidth();

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: (200 - sbw) - layout.overlayHeight({ rows: 2 }),
              width: getDefaultColumnWidth(),
              height: layout.firstRenderedRowDefaultHeight,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => {
              const v = getE2eDocumentViewport();
              const scrollLeftAbs = Math.abs(v.scrollLeft);

              return {
                start: scrollLeftAbs,
                top: v.offsetHeight - layout.overlayHeight({ rows: 2 }) - layout.cellBorderWidth,
                width: getDefaultColumnWidth() + layout.cellBorderWidth,
                height: layout.firstRenderedRowDefaultHeight,
              };
            });
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

            const sbw = Handsontable.dom.getScrollbarWidth();

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: (200 - sbw) - layout.overlayHeight({ rows: 2 }),
              width: getDefaultColumnWidth(),
              maxWidth: 300 - sbw,
              height: layout.firstRenderedRowDefaultHeight,
            }));
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

            expectGetEditedCellRectFromPartial((layout) => ({
              start: 0,
              top: document.documentElement.clientHeight - layout.overlayHeight({ rows: 2 }),
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: layout.firstRenderedRowDefaultHeight,
            }));
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

            const sbw = Handsontable.dom.getScrollbarWidth();

            expectGetEditedCellRectFromPartial((layout) => {
              const cw = 300 - sbw;
              const ch = 200 - sbw;
              const colOuter = getDefaultColumnWidth() + layout.cellBorderWidth;

              return {
                start: cw - colOuter,
                top: ch - layout.firstRenderedRowDefaultHeight,
                width: colOuter,
                maxWidth: colOuter,
                height: layout.firstRenderedRowDefaultHeight,
              };
            });
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

            expectGetEditedCellRectFromPartial(L => L.e2eGcr_3dc880f3f2(getE2eDocumentViewport()));
          });
        });
      });
    });
  });
});
