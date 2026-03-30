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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 185,
            });
            main.toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 185,
            });
            horizon.toEqual({
              start: 0,
              top: 0,
              width: 51,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('horizon'),
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
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: document.documentElement.clientHeight,
            });
            main.toEqual({
              start: 0,
              top: 0,
              width: 51,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: document.documentElement.clientHeight,
            });
            horizon.toEqual({
              start: 0,
              top: 0,
              width: 59,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: document.documentElement.clientHeight,
            });
          });
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: 234,
              top: calcRowHeight('classic'),
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 159,
            }));
            main.toEqual(jasmine.objectContaining({
              start: 234,
              top: calcRowHeight('main'),
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 156,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 234,
              top: calcRowHeight('horizon'),
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 148,
            }));
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft + document.documentElement.clientWidth - 55, // 55 - the width of the first cell
              top: document.documentElement.offsetHeight - document.documentElement.clientHeight
                + calcRowHeight('classic'),
              width: 55,
              maxWidth: 55,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: document.documentElement.clientHeight - calcRowHeight('classic'),
            }));

            // Not sure about the values below - can be modified if found they're wrong (implemented after introducing the new themes).
            main.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft + document.documentElement.clientWidth - 62,
              top: document.documentElement.offsetHeight - document.documentElement.clientHeight
                + calcRowHeight('main'),
              width: 62,
              maxWidth: 62,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: document.documentElement.clientHeight - calcRowHeight('main'),
            }));

            horizon.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft + document.documentElement.clientWidth - 70,
              top: document.documentElement.offsetHeight - document.documentElement.clientHeight
                + calcRowHeight('horizon'),
              width: 70,
              maxWidth: 70,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: document.documentElement.clientHeight - calcRowHeight('horizon'),
            }));
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 185,
            });
            main.toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 185,
            });
            horizon.toEqual({
              start: 0,
              top: 0,
              width: 51,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('horizon'),
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
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: document.documentElement.clientHeight,
            });
            main.toEqual({
              start: 0,
              top: 0,
              width: 51,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: document.documentElement.clientHeight,
            });
            horizon.toEqual({
              start: 0,
              top: 0,
              width: 59,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: document.documentElement.clientHeight,
            });
          });
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: 49,
              top: calcRowHeight('classic'),
              width: 51,
              maxWidth: 236,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 159,
            }));
            main.toEqual(jasmine.objectContaining({
              start: 49,
              top: calcRowHeight('main'),
              width: 51,
              maxWidth: 236,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 156,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 50,
              top: calcRowHeight('horizon'),
              width: 52,
              maxWidth: 235,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 148,
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
              start: document.documentElement.scrollLeft + 49, // 49 - the width of the first cell
              top: document.documentElement.offsetHeight - document.documentElement.clientHeight
                + calcRowHeight('classic'),
              width: 51,
              maxWidth: document.documentElement.clientWidth - 49,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: document.documentElement.clientHeight - calcRowHeight('classic'),
            }));

            // Not sure about the values below - can be modified if found they're wrong (implemented after introducing the new themes).
            main.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft + 50,
              top: document.documentElement.offsetHeight - document.documentElement.clientHeight
                + calcRowHeight('main'),
              width: 52,
              maxWidth: document.documentElement.clientWidth - 50,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: document.documentElement.clientHeight - calcRowHeight('main'),
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft + 58,
              top: document.documentElement.offsetHeight - document.documentElement.clientHeight
                + calcRowHeight('horizon'),
              width: 60,
              maxWidth: document.documentElement.clientWidth - 58,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: document.documentElement.clientHeight - calcRowHeight('horizon'),
            }));
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 185,
            });
            main.toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 185,
            });
            horizon.toEqual({
              start: 0,
              top: 0,
              width: 51,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('horizon'),
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
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: document.documentElement.clientHeight,
            });
            main.toEqual({
              start: 0,
              top: 0,
              width: 51,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: document.documentElement.clientHeight,
            });
            horizon.toEqual({
              start: 0,
              top: 0,
              width: 59,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: document.documentElement.clientHeight,
            });
          });
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: 49,
              top: 158,
              width: 51,
              maxWidth: 236,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: calcFirstBodyRowHeight('classic'),
            }));
            main.toEqual(jasmine.objectContaining({
              start: 49,
              top: 155,
              width: 51,
              maxWidth: 236,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: calcFirstBodyRowHeight('main'),
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 50,
              top: 147,
              width: 52,
              maxWidth: 235,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: calcFirstBodyRowHeight('horizon'),
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
              start: document.documentElement.scrollLeft + 49, // 49 - the width of the first cell
              top: document.documentElement.offsetHeight - calcFirstBodyRowHeight('classic'), // last cell first-row outer height
              width: 51,
              maxWidth: document.documentElement.clientWidth - 49,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: calcFirstBodyRowHeight('classic'),
            }));
            main.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft + 50, // 50 - the width of the first cell
              top: document.documentElement.offsetHeight - calcFirstBodyRowHeight('main'),
              width: 52,
              maxWidth: document.documentElement.clientWidth - 50,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: calcFirstBodyRowHeight('main'),
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft + 58, // 50 - the width of the first cell
              top: document.documentElement.offsetHeight - calcFirstBodyRowHeight('horizon'),
              width: 60,
              maxWidth: document.documentElement.clientWidth - 58,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: calcFirstBodyRowHeight('horizon'),
            }));
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: 0,
              top: 132,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 53,
            }));
            main.toEqual(jasmine.objectContaining({
              start: 0,
              top: 126,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 59,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 0,
              top: 110,
              width: 51,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 75,
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
              top: document.documentElement.clientHeight - 53, // 53 - height of the 2 last rows,
              width: 50,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 68,
            }));
            main.toEqual(jasmine.objectContaining({
              start: 0,
              top: document.documentElement.clientHeight - 59,
              width: 51,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 74,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 0,
              top: document.documentElement.clientHeight - 75,
              width: 59,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 90,
            }));
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: 0,
              top: 132,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 53,
            }));
            main.toEqual(jasmine.objectContaining({
              start: 0,
              top: 126,
              width: 50,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 59,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 0,
              top: 110,
              width: 51,
              maxWidth: 285,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 75,
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
              start: document.documentElement.scrollLeft,
              top: document.documentElement.offsetHeight - 54,
              width: 50,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 68,
            }));
            main.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft,
              top: document.documentElement.offsetHeight - 60,
              width: 51,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 74,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: document.documentElement.scrollLeft,
              top: document.documentElement.offsetHeight - 76,
              width: 59,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 90,
            }));
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: 0,
              top: 132,
              width: 50, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
              maxWidth: 285,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 53,
            }));

            // Not sure about the values below - can be modified if found they're wrong (implemented after introducing the new themes).
            main.toEqual(jasmine.objectContaining({
              start: 0,
              top: 126,
              width: 50, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
              maxWidth: 285,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 59,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 0,
              top: 110,
              width: 51, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
              maxWidth: 285,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 75,
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
              top: document.documentElement.clientHeight - 53, // 53 - height of the 2 last rows
              width: 50,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 68,
            }));
            main.toEqual(jasmine.objectContaining({
              start: 0,
              top: document.documentElement.clientHeight - 59,
              width: 51,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 74,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 0,
              top: document.documentElement.clientHeight - 75,
              width: 59,
              maxWidth: document.documentElement.clientWidth,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 90,
            }));
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: 234,
              top: 158,
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: calcFirstBodyRowHeight('classic'),
            }));
            main.toEqual(jasmine.objectContaining({
              start: 234,
              top: 155,
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: calcFirstBodyRowHeight('main'),
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 234,
              top: 147,
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: calcFirstBodyRowHeight('horizon'),
            }));
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

          expect(getActiveEditor().getEditedCellRect()).forThemes(({ classic, main, horizon }) => {
            classic.toEqual(jasmine.objectContaining({
              start: 4949,
              top: document.documentElement.offsetHeight - 28,
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('classic'),
              maxHeight: 42, // returns wrong value! it will be fixed within #9206
            }));
            main.toEqual(jasmine.objectContaining({
              start: 4949,
              top: document.documentElement.offsetHeight - 31,
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('main'),
              maxHeight: 45,
            }));
            horizon.toEqual(jasmine.objectContaining({
              start: 4949,
              top: document.documentElement.offsetHeight - 39,
              width: 51,
              maxWidth: 51,
              height: calcFirstBodyRowHeight('horizon'),
              maxHeight: 53,
            }));
          });
        });
      });
    });
  });
});
