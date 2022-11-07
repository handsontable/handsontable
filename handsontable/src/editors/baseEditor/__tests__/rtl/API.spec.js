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

            expect(getActiveEditor().getEditedCellRect()).toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: 24,
              maxHeight: 185,
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsTop: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: document.documentElement.clientWidth,
              height: 24,
              maxHeight: document.documentElement.clientHeight,
            });
          });
        });

        describe('for top overlay when viewport is scrolled to the bottom-left edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsTop: 2,
            });

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(1, countRows() - 1);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 234,
              top: 23,
              width: 51,
              maxWidth: 51,
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });

          it('and the scrollable element is the Window object', async() => {
            // For this configuration object "{ htmlDir: 'ltr', layoutDirection: 'rtl' }" it's necessary to force
            // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
            if (htmlDir === 'ltr' && layoutDirection === 'rtl') {
              $('html').attr('dir', 'rtl');
            }

            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsTop: 2,
            });

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(1, countCols() - 1);

            await sleep(100);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: Math.abs(document.documentElement.scrollLeft) + document.documentElement.clientWidth - 50, // 50 - the width of the first cell
              top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 23,
              width: 51,
              maxWidth: 50,
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });
        });

        describe('for top-right corner overlay when viewport is scrolled to the top-right edge', () => {
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

            expect(getActiveEditor().getEditedCellRect()).toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: 24,
              maxHeight: 185,
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: document.documentElement.clientWidth,
              height: 24,
              maxHeight: document.documentElement.clientHeight,
            });
          });
        });

        describe('for top-right corner overlay when viewport is scrolled to the bottom-left edge', () => {
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

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(1, 1);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 49,
              top: 23,
              width: 51,
              // maxWidth: ?, // returns wrong value! it will be fixed within #9206
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsTop: 2,
            });

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(1, 1);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: Math.abs(document.documentElement.scrollLeft) + 49, // 49 - the width of the first cell
              top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 23,
              width: 51,
              // maxWidth: ?, // returns wrong value! it will be fixed within #9206
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });
        });

        describe('for right overlay when viewport is scrolled to the top-right edge', () => {
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

            expect(getActiveEditor().getEditedCellRect()).toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: 285,
              height: 24,
              maxHeight: 185,
            });
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
            });

            selectCell(0, 0);

            expect(getActiveEditor().getEditedCellRect()).toEqual({
              start: 0,
              top: 0,
              width: 50,
              maxWidth: document.documentElement.clientWidth,
              height: 24,
              maxHeight: document.documentElement.clientHeight,
            });
          });
        });

        describe('for right overlay when viewport is scrolled to the bottom-left edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedColumnsStart: 2,
            });

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(countRows() - 1, 1);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 49,
              top: 161,
              width: 51,
              // maxWidth: ?, // returns wrong value! it will be fixed within #9206
              height: 24,
              maxHeight: 24,
            }));
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
            });

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(countRows() - 1, 1);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: Math.abs(document.documentElement.scrollLeft) + 49, // 49 - the width of the first cell
              top: document.documentElement.offsetHeight - 24, // 24 - the height of the last cell
              width: 51,
              // maxWidth: ?, // returns wrong value! it will be fixed within #9206
              height: 24,
              maxHeight: 24,
            }));
          });
        });

        describe('for bottom-right corner overlay when viewport is scrolled to the top-right edge', () => {
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

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 0,
              top: 138,
              width: 50,
              maxWidth: 285,
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
            });

            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 0,
              top: document.documentElement.clientHeight - 47, // 47 - height of the 2 last rows,
              width: 50,
              maxWidth: document.documentElement.clientWidth,
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });
        });

        describe('for bottom-right corner overlay when viewport is scrolled to the bottom-left edge', () => {
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

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 0,
              top: 138,
              width: 50,
              // maxWidth: ?, // returns wrong value! it will be fixed within #9206
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedColumnsStart: 2,
              fixedRowsBottom: 2,
            });

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: Math.abs(document.documentElement.scrollLeft),
              top: document.documentElement.offsetHeight - 47,
              width: 50,
              // maxWidth: ?, // returns wrong value! it will be fixed within #9206
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });
        });

        describe('for bottom overlay when viewport is scrolled to the top-right edge', () => {
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

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 0,
              top: 138,
              width: 50,
              maxWidth: 285,
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });

          it('and the scrollable element is the Window object', () => {
            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsBottom: 2,
            });

            selectCell(countRows() - 2, 0);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 0,
              top: document.documentElement.clientHeight - 47, // 47 - height of the 2 last rows
              width: 50,
              maxWidth: document.documentElement.clientWidth,
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });
        });

        describe('for bottom overlay when viewport is scrolled to the bottom-left edge', () => {
          it('and the scrollable element is not the Window object', () => {
            handsontable({
              layoutDirection,
              data: createSpreadsheetData(10, 10),
              width: 300,
              height: 200,
              editor: 'my-editor',
              fixedRowsBottom: 2,
            });

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(countRows() - 1, countCols() - 1);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 234,
              top: 161,
              width: 51,
              maxWidth: 51,
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });

          it('and the scrollable element is the Window object', () => {
            // For this configuration object "{ htmlDir: 'ltr', layoutDirection: 'rtl' }" it's necessary to force
            // always RTL on document, otherwise the horizontal scrollbar won't appear and test fail.
            if (htmlDir === 'ltr' && layoutDirection === 'rtl') {
              $('html').attr('dir', 'rtl');
            }

            handsontable({
              layoutDirection,
              licenseKey: 'non-commercial-and-evaluation',
              data: createSpreadsheetData(100, 100),
              editor: 'my-editor',
              fixedRowsBottom: 2,
            });

            scrollViewportTo(countRows() - 1, countCols() - 1);
            selectCell(countRows() - 1, countCols() - 1);

            expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
              start: 4950,
              top: document.documentElement.offsetHeight - 24,
              width: 51,
              maxWidth: 50,
              height: 24,
              // maxHeight: ?, // returns wrong value! it will be fixed within #9206
            }));
          });
        });
      });
    });
  });
});
