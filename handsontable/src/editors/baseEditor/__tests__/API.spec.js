describe('BaseEditor API', () => {
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

    describe('getEditedCellRect()', () => {
      describe('should return an object with provided correct information about size and position of the cell', () => {
        describe('for top overlay when viewport is scrolled to the top-left edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsTop: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: 285,
                height: 24,
                maxHeight: 185,
              });
              main.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: 285,
                height: 30,
                maxHeight: 185,
              });
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsTop: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: document.documentElement.clientWidth,
                height: 24,
                maxHeight: document.documentElement.clientHeight,
              });
              main.toEqual({
                start: 0,
                top: 0,
                width: 51,
                maxWidth: document.documentElement.clientWidth,
                height: 30,
                maxHeight: document.documentElement.clientHeight,
              });
            });
          });
        });

        describe('for top overlay when viewport is scrolled to the bottom-right edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsTop: 2,
            });

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(1, countRows() - 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 234,
                top: 23,
                width: 51,
                maxWidth: 51,
                height: 24,
                maxHeight: 162,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 234,
                top: 29,
                width: 51,
                maxWidth: 51,
                height: 30,
                maxHeight: 156,
              }));
            });
          });

          it('and the scrollable element is the Window object', () => {
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

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(1, countCols() - 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: document.documentElement.scrollLeft + document.documentElement.clientWidth - 51, // 51 - the width of the first cell
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 23,
                width: 51,
                maxWidth: 51,
                height: 24,
                maxHeight: document.documentElement.clientHeight - 23,
              }));

              // Not sure about the values below - can be modified if found they're wrong (implemented after introducing the new themes).
              main.toEqual(jasmine.objectContaining({
                start: document.documentElement.scrollLeft + document.documentElement.clientWidth - 62,
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 29,
                width: 62,
                maxWidth: 62,
                height: 30,
                maxHeight: document.documentElement.clientHeight - 29,
              }));
            });
          });
        });

        describe('for top-left corner overlay when viewport is scrolled to the top-left edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: 285,
                height: 24,
                maxHeight: 185,
              });
              main.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: 285,
                height: 30,
                maxHeight: 185,
              });
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: document.documentElement.clientWidth,
                height: 24,
                maxHeight: document.documentElement.clientHeight,
              });
              main.toEqual({
                start: 0,
                top: 0,
                width: 51,
                maxWidth: document.documentElement.clientWidth,
                height: 30,
                maxHeight: document.documentElement.clientHeight,
              });
            });
          });
        });

        describe('for top-left corner overlay when viewport is scrolled to the bottom-right edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
            });

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(1, 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 49,
                top: 23,
                width: 51,
                maxWidth: 236,
                height: 24,
                maxHeight: 162,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 49,
                top: 29,
                width: 51,
                maxWidth: 236,
                height: 30,
                maxHeight: 156,
              }));
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
            });

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(1, 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: document.documentElement.scrollLeft + 49, // 49 - the width of the first cell
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 23,
                width: 51,
                maxWidth: document.documentElement.clientWidth - 49,
                height: 24,
                maxHeight: document.documentElement.clientHeight - 23,
              }));

              // Not sure about the values below - can be modified if found they're wrong (implemented after introducing the new themes).
              main.toEqual(jasmine.objectContaining({
                start: document.documentElement.scrollLeft + 50,
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 29,
                width: 52,
                maxWidth: document.documentElement.clientWidth - 50,
                height: 30,
                maxHeight: document.documentElement.clientHeight - 29,
              }));
            });
          });
        });

        describe('for left overlay when viewport is scrolled to the top-left edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: 285,
                height: 24,
                maxHeight: 185,
              });
              main.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: 285,
                height: 30,
                maxHeight: 185,
              });
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual({
                start: 0,
                top: 0,
                width: 50,
                maxWidth: document.documentElement.clientWidth,
                height: 24,
                maxHeight: document.documentElement.clientHeight,
              });
              main.toEqual({
                start: 0,
                top: 0,
                width: 51,
                maxWidth: document.documentElement.clientWidth,
                height: 30,
                maxHeight: document.documentElement.clientHeight,
              });
            });
          });
        });

        describe('for left overlay when viewport is scrolled to the bottom-right edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
            });

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(countRows() - 1, 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 49,
                top: 161,
                width: 51,
                maxWidth: 236,
                height: 24,
                maxHeight: 24,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 49,
                top: 155,
                width: 51,
                maxWidth: 236,
                height: 30,
                maxHeight: 30,
              }));
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
            });

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(countRows() - 1, 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: document.documentElement.scrollLeft + 49, // 49 - the width of the first cell
                top: document.documentElement.offsetHeight - 24, // 24 - the height of the last cell
                width: 51,
                maxWidth: document.documentElement.clientWidth - 49,
                height: 24,
                maxHeight: 24,
              }));
              main.toEqual(jasmine.objectContaining({
                start: document.documentElement.scrollLeft + 50, // 50 - the width of the first cell
                top: document.documentElement.offsetHeight - 30,
                width: 52,
                maxWidth: document.documentElement.clientWidth - 50,
                height: 30,
                maxHeight: 30,
              }));
            });
          });
        });

        describe('for bottom-left corner overlay when viewport is scrolled to the top-left edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
            });

            selectCell(8, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: 138,
                width: 50,
                maxWidth: 285,
                height: 24,
                maxHeight: 47,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: 126,
                width: 50,
                maxWidth: 285,
                height: 30,
                maxHeight: 59,
              }));
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
            });

            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 47, // 47 - height of the 2 last rows,
                width: 50,
                maxWidth: document.documentElement.clientWidth,
                height: 24,
                maxHeight: 62,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 59,
                width: 51,
                maxWidth: document.documentElement.clientWidth,
                height: 30,
                maxHeight: 74,
              }));
            });
          });
        });

        describe('for bottom-left corner overlay when viewport is scrolled to the bottom-right edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
            });

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: 138,
                width: 50,
                maxWidth: 285,
                height: 24,
                maxHeight: 47,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: 126,
                width: 50,
                maxWidth: 285,
                height: 30,
                maxHeight: 59,
              }));
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
            });

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: document.documentElement.scrollLeft,
                top: document.documentElement.offsetHeight - 47,
                width: 50,
                maxWidth: document.documentElement.clientWidth,
                height: 24,
                maxHeight: 62,
              }));
              main.toEqual(jasmine.objectContaining({
                start: document.documentElement.scrollLeft,
                top: document.documentElement.offsetHeight - 60,
                width: 51,
                maxWidth: document.documentElement.clientWidth,
                height: 30,
                maxHeight: 74,
              }));
            });
          });
        });

        describe('for bottom overlay when viewport is scrolled to the top-left edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsBottom: 2,
            });

            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: 138,
                width: 50, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
                maxWidth: 285,
                height: 24,
                maxHeight: 47,
              }));

              // Not sure about the values below - can be modified if found they're wrong (implemented after introducing the new themes).
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: 126,
                width: 50, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
                maxWidth: 285,
                height: 30,
                maxHeight: 59,
              }));
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsBottom: 2,
            });

            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 47, // 47 - height of the 2 last rows
                width: 50,
                maxWidth: document.documentElement.clientWidth,
                height: 24,
                maxHeight: 62,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 59,
                width: 51,
                maxWidth: document.documentElement.clientWidth,
                height: 30,
                maxHeight: 74,
              }));
            });
          });
        });

        describe('for bottom overlay when viewport is scrolled to the bottom-right edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsBottom: 2,
            });

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(countRows() - 1, countCols() - 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 234,
                top: 161,
                width: 51,
                maxWidth: 51,
                height: 24,
                maxHeight: 24,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 234,
                top: 155,
                width: 51,
                maxWidth: 51,
                height: 30,
                maxHeight: 30,
              }));
            });
          });

          it('and the scrollable element is the Window object', () => {
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

            scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            selectCell(countRows() - 1, countCols() - 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 4949,
                top: document.documentElement.offsetHeight - 24,
                width: 51,
                maxWidth: 51,
                height: 24,
                maxHeight: 39, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 4949,
                top: document.documentElement.offsetHeight - 31,
                width: 51,
                maxWidth: 51,
                height: 30,
                maxHeight: 45,
              }));
            });
          });
        });
      });
    });
  });
});
