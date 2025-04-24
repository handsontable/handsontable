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
            });

            await selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
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
              horizon.toEqual({
                start: 0,
                top: 0,
                width: 51,
                maxWidth: 285,
                height: 38,
                maxHeight: 185,
              });
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

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
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
              horizon.toEqual({
                start: 0,
                top: 0,
                width: 59,
                maxWidth: document.documentElement.clientWidth,
                height: 38,
                maxHeight: document.documentElement.clientHeight,
              });
            });
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
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(1, countRows() - 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 234,
                top: 23,
                width: 51,
                maxWidth: 51,
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 234,
                top: 29,
                width: 51,
                maxWidth: 51,
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 234,
                top: 37,
                width: 51,
                maxWidth: 51,
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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
              fixedRowsTop: 2,
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(1, countCols() - 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + document.documentElement.clientWidth - 51, // 51 - the width of the first cell
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 23,
                width: 51,
                maxWidth: 51,
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));

              // Not sure about the values below - can be modified if found they're wrong (implemented after introducing the new themes).
              main.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + document.documentElement.clientWidth - 62,
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 29,
                width: 62,
                maxWidth: 62,
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + document.documentElement.clientWidth - 70, // 51 - the width of the first cell
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 37,
                width: 70,
                maxWidth: 70,
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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
            });

            await selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
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
              horizon.toEqual({
                start: 0,
                top: 0,
                width: 51,
                maxWidth: 285,
                height: 38,
                maxHeight: 185,
              });
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

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
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
              horizon.toEqual({
                start: 0,
                top: 0,
                width: 59,
                maxWidth: document.documentElement.clientWidth,
                height: 38,
                maxHeight: document.documentElement.clientHeight,
              });
            });
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
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(1, 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 49,
                top: 23,
                width: 51,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 49,
                top: 29,
                width: 51,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 50,
                top: 37,
                width: 52,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + 49, // 49 - the width of the first cell
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 23,
                width: 51,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + 50,
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 29,
                width: 52,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + 58,
                top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 37,
                width: 60,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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
            });

            await selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
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
              horizon.toEqual({
                start: 0,
                top: 0,
                width: 51,
                maxWidth: 285,
                height: 38,
                maxHeight: 185,
              });
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

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
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
              horizon.toEqual({
                start: 0,
                top: 0,
                width: 59,
                maxWidth: document.documentElement.clientWidth,
                height: 38,
                maxHeight: document.documentElement.clientHeight,
              });
            });
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
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 1, 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 49,
                top: 161,
                width: 51,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 24,
                maxHeight: 24,
              }));
              main.toEqual(jasmine.objectContaining({
                start: 49,
                top: 155,
                width: 51,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 30,
                maxHeight: 30,
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 50,
                top: 147,
                width: 52,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 38,
                maxHeight: 38,
              }));
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

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + 49, // 49 - the width of the first cell
                top: document.documentElement.offsetHeight - 24, // 24 - the height of the last cell
                width: 51,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 24,
                maxHeight: 24,
              }));
              main.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + 50,
                top: document.documentElement.offsetHeight - 30,
                width: 52,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 30,
                maxHeight: 30,
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft) + 58,
                top: document.documentElement.offsetHeight - 38,
                width: 60,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 38,
                maxHeight: 38,
              }));
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
            });

            await selectCell(8, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: 138,
                width: 50,
                maxWidth: 285,
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: 126,
                width: 50,
                maxWidth: 285,
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 0,
                top: 110,
                width: 51,
                maxWidth: 285,
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 47, // 47 - height of the 2 last rows,
                width: 50,
                maxWidth: document.documentElement.clientWidth,
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 59,
                width: 51,
                maxWidth: document.documentElement.clientWidth,
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 75,
                width: 59,
                maxWidth: document.documentElement.clientWidth,
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
            });
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
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: 138,
                width: 50,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: 126,
                width: 50,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 0,
                top: 110,
                width: 51,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft),
                top: document.documentElement.offsetHeight - 47,
                width: 50,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft),
                top: document.documentElement.offsetHeight - 60,
                width: 51,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: Math.abs(document.documentElement.scrollLeft),
                top: document.documentElement.offsetHeight - 76,
                width: 59,
                // maxWidth: ?, // returns wrong value! it will be fixed within #9206
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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
            });

            await selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: 138,
                width: 50,
                maxWidth: 285,
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: 126,
                width: 50,
                maxWidth: 285,
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 0,
                top: 110,
                width: 51,
                maxWidth: 285,
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 47, // 47 - height of the 2 last rows
                width: 50,
                maxWidth: document.documentElement.clientWidth,
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 59,
                width: 51,
                maxWidth: document.documentElement.clientWidth,
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 0,
                top: document.documentElement.clientHeight - 75,
                width: 59,
                maxWidth: document.documentElement.clientWidth,
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
            });
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
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 1, countCols() - 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 234,
                top: 161,
                width: 51,
                maxWidth: 51,
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              main.toEqual(jasmine.objectContaining({
                start: 234,
                top: 155,
                width: 51,
                maxWidth: 51,
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 234,
                top: 147,
                width: 51,
                maxWidth: 51,
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
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
              autoColumnSize: false
            });

            await scrollViewportTo({
              row: countRows() - 1,
              col: countCols() - 1,
              verticalSnap: 'top',
              horizontalSnap: 'start',
            });
            await selectCell(countRows() - 1, countCols() - 1);

            expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
              classic.toEqual(jasmine.objectContaining({
                start: 4949,
                top: document.documentElement.offsetHeight - 24,
                width: 51,
                maxWidth: 51,
                height: 24,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));

              // Not sure about the values below - can be modified if found they're wrong (implemented after introducing the new themes).
              main.toEqual(jasmine.objectContaining({
                start: 4949,
                top: document.documentElement.offsetHeight - 31,
                width: 51,
                maxWidth: 51,
                height: 30,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
              horizon.toEqual(jasmine.objectContaining({
                start: 4949,
                top: document.documentElement.offsetHeight - 39,
                width: 51,
                maxWidth: 51,
                height: 38,
                // maxHeight: ?, // returns wrong value! it will be fixed within #9206
              }));
            });
          });
        });
      });
    });
  });
});
