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

          const sbw = Handsontable.dom.getScrollbarWidth();

          expectGetEditedCellRectFromPartial((layout) => {
            const cw = 300 - sbw;
            const ch = 200 - sbw;
            const colOuter = getDefaultColumnWidth() + layout.cellBorderWidth;

            return {
              start: cw - colOuter,
              top: layout.defaultDataRowHeight,
              width: colOuter,
              maxWidth: colOuter,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: ch - layout.defaultDataRowHeight,
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

          expectGetEditedCellRectFromPartial((layout) => {
            const v = getE2eDocumentViewport();

            return {
              top: v.offsetHeight - v.clientHeight + layout.defaultDataRowHeight,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: v.clientHeight - layout.defaultDataRowHeight,
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

          const sbw = Handsontable.dom.getScrollbarWidth();
          const cw = 300 - sbw;
          const ch = 200 - sbw;

          expectGetEditedCellRectFromPartial((layout) => ({
            start: getDefaultColumnWidth() - layout.cellBorderWidth,
            top: layout.defaultDataRowHeight,
            width: getDefaultColumnWidth() + layout.cellBorderWidth,
            maxWidth: cw - (getDefaultColumnWidth() - layout.cellBorderWidth),
            height: layout.firstRenderedRowDefaultHeight,
            maxHeight: ch - layout.defaultDataRowHeight,
          }));
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

          expectGetEditedCellRectFromPartial((layout) => {
            const v = getE2eDocumentViewport();

            return {
              start: v.scrollLeft + getDefaultColumnWidth(),
              top: v.offsetHeight - v.clientHeight + layout.defaultDataRowHeight,
              width: getDefaultColumnWidth() + 2 * layout.cellBorderWidth,
              maxWidth: v.clientWidth - getDefaultColumnWidth(),
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: v.clientHeight - layout.defaultDataRowHeight,
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

          const sbw = Handsontable.dom.getScrollbarWidth();

          expectGetEditedCellRectFromPartial((layout) => {
            const cw = 300 - sbw;
            const ch = 200 - sbw;

            return {
              start: getDefaultColumnWidth() - layout.cellBorderWidth,
              top: ch - layout.firstRenderedRowDefaultHeight,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: cw - (getDefaultColumnWidth() - layout.cellBorderWidth),
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: layout.firstRenderedRowDefaultHeight,
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

          expectGetEditedCellRectFromPartial((layout) => {
            const v = getE2eDocumentViewport();

            return {
              start: v.scrollLeft + getDefaultColumnWidth(),
              top: v.offsetHeight - layout.firstRenderedRowDefaultHeight,
              width: getDefaultColumnWidth() + 2 * layout.cellBorderWidth,
              maxWidth: v.clientWidth - getDefaultColumnWidth(),
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: layout.firstRenderedRowDefaultHeight,
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

          const sbw = Handsontable.dom.getScrollbarWidth();
          const ch = 200 - sbw;

          expectGetEditedCellRectFromPartial((layout) => {
            const bottomOverlayHeight = layout.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: ch - bottomOverlayHeight,
              width: getDefaultColumnWidth(),
              maxWidth: 300 - sbw,
              height: layout.firstRenderedRowDefaultHeight,
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

          const sbw = Handsontable.dom.getScrollbarWidth();

          expectGetEditedCellRectFromPartial((layout) => {
            const bottomOverlayHeight = layout.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: document.documentElement.clientHeight - bottomOverlayHeight,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: bottomOverlayHeight + sbw,
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

          const sbw = Handsontable.dom.getScrollbarWidth();
          const ch = 200 - sbw;

          expectGetEditedCellRectFromPartial((layout) => {
            const bottomOverlayHeight = layout.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: ch - bottomOverlayHeight,
              width: getDefaultColumnWidth(),
              maxWidth: 300 - sbw,
              height: layout.firstRenderedRowDefaultHeight,
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

          const sbw = Handsontable.dom.getScrollbarWidth();

          expectGetEditedCellRectFromPartial((layout) => {
            const v = getE2eDocumentViewport();
            const bottomOverlayHeight = layout.overlayHeight({ rows: 2 });

            return {
              start: v.scrollLeft,
              top: v.offsetHeight - bottomOverlayHeight - layout.cellBorderWidth,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: v.clientWidth,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: bottomOverlayHeight + sbw,
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

          const sbw = Handsontable.dom.getScrollbarWidth();
          const ch = 200 - sbw;

          expectGetEditedCellRectFromPartial((layout) => {
            const bottomOverlayHeight = layout.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: ch - bottomOverlayHeight,
              width: getDefaultColumnWidth(),
              maxWidth: 300 - sbw,
              height: layout.firstRenderedRowDefaultHeight,
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

          const sbw = Handsontable.dom.getScrollbarWidth();

          expectGetEditedCellRectFromPartial((layout) => {
            const bottomOverlayHeight = layout.overlayHeight({ rows: 2 });

            return {
              start: 0,
              top: document.documentElement.clientHeight - bottomOverlayHeight,
              width: getDefaultColumnWidth() + layout.cellBorderWidth,
              maxWidth: document.documentElement.clientWidth,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: bottomOverlayHeight + sbw,
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
              maxHeight: layout.firstRenderedRowDefaultHeight,
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

          const sbw = Handsontable.dom.getScrollbarWidth();

          expectGetEditedCellRectFromPartial((layout) => {
            const v = getE2eDocumentViewport();
            const colOuter = getDefaultColumnWidth() + layout.cellBorderWidth;
            const lastColStart = 99 * getDefaultColumnWidth() - layout.cellBorderWidth;

            return {
              start: lastColStart,
              top: v.offsetHeight - (layout.defaultDataRowHeight + 2 * layout.cellBorderWidth),
              width: colOuter,
              maxWidth: colOuter,
              height: layout.firstRenderedRowDefaultHeight,
              maxHeight: layout.firstRenderedRowDefaultHeight + sbw,
            };
          });
        });
      });
    });
  });
});
