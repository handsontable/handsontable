describe('BaseEditor API', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('.jasmine_html-reporter').hide();
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('.jasmine_html-reporter').show();

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  Handsontable.editors.registerEditor('my-editor', class BaseEditor extends Handsontable.editors.BaseEditor {
    open() {}
    close() {}
    getValue() {}
    setValue() {}
    focus() {}
  });

  describe('getEditedCellRect()', () => {
    describe('should return an object with provided correct information about size and position of the cell', () => {
      describe('for top overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: 276,
            height: 23,
            maxHeight: 185,
          });
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
            licenseKey: 'non-commercial-and-evaluation',
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          selectCell(0, 0);

          expect(getActiveEditor().getEditedCellRect()).toEqual({
            start: 0,
            top: 0,
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: document.documentElement.clientWidth - 9, // padding
            height: 23,
            maxHeight: document.documentElement.clientHeight,
          });
        });
      });

      describe('for top overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 41, // 49px (the default cell width) - 8px (padding)
            maxWidth: 41,
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
            licenseKey: 'non-commercial-and-evaluation',
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsTop: 2,
          });

          scrollViewportTo(countRows() - 1, countCols() - 1);
          selectCell(1, countCols() - 1);

          expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
            start: document.documentElement.scrollLeft + document.documentElement.clientWidth - 50, // 50 - the width of the first cell
            top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 23,
            width: 41, // 49px (the default cell width) - 8px (padding)
            maxWidth: 40,
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });
      });

      describe('for top-left corner overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: 276,
            height: 23,
            maxHeight: 185,
          });
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
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
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: document.documentElement.clientWidth - 9, // padding
            height: 23,
            maxHeight: document.documentElement.clientHeight,
          });
        });
      });

      describe('for top-left corner overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 41, // 49px (the default cell width) - 8px (padding)
            // maxWidth: ?, // returns wrong value! it will be fixed within #9206
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
            licenseKey: 'non-commercial-and-evaluation',
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
          });

          scrollViewportTo(countRows() - 1, countCols() - 1);
          selectCell(1, 1);

          expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
            start: document.documentElement.scrollLeft + 49, // 49 - the width of the first cell
            top: document.documentElement.offsetHeight - document.documentElement.clientHeight + 23,
            width: 41, // 49px (the default cell width) - 8px (padding)
            // maxWidth: ?, // returns wrong value! it will be fixed within #9206
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });
      });

      describe('for left overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: 276,
            height: 23,
            maxHeight: 185,
          });
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
            licenseKey: 'non-commercial-and-evaluation',
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          selectCell(0, 0);

          expect(getActiveEditor().getEditedCellRect()).toEqual({
            start: 0,
            top: 0,
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: document.documentElement.clientWidth - 9, // padding
            height: 23,
            maxHeight: document.documentElement.clientHeight,
          });
        });
      });

      describe('for left overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 41, // 49px (the default cell width) - 8px (padding)
            // maxWidth: ?, // returns wrong value! it will be fixed within #9206
            height: 23,
            maxHeight: 23,
          }));
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
            licenseKey: 'non-commercial-and-evaluation',
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
          });

          scrollViewportTo(countRows() - 1, countCols() - 1);
          selectCell(countRows() - 1, 1);

          expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
            start: document.documentElement.scrollLeft + 49, // 49 - the width of the first cell
            top: document.documentElement.offsetHeight - 24, // 24 - the height of the last cell
            width: 41, // 49px (the default cell width) - 8px (padding)
            // maxWidth: ?, // returns wrong value! it will be fixed within #9206
            height: 23,
            maxHeight: 23,
          }));
        });
      });

      describe('for bottom-left corner overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: 276,
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
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
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: document.documentElement.clientWidth - 9, // padding
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });
      });

      describe('for bottom-left corner overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            // maxWidth: ?, // returns wrong value! it will be fixed within #9206
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
            licenseKey: 'non-commercial-and-evaluation',
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
          });

          scrollViewportTo(countRows() - 1, countCols() - 1);
          selectCell(countRows() - 2, 0);

          expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
            start: document.documentElement.scrollLeft,
            top: document.documentElement.offsetHeight - 47,
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            // maxWidth: ?, // returns wrong value! it will be fixed within #9206
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });
      });

      describe('for bottom overlay when viewport is scrolled to the top-left edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: 276,
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
            licenseKey: 'non-commercial-and-evaluation',
            data: createSpreadsheetData(100, 100),
            editor: 'my-editor',
            fixedRowsBottom: 2,
          });

          selectCell(countRows() - 2, 0);

          expect(getActiveEditor().getEditedCellRect()).toEqual(jasmine.objectContaining({
            start: 0,
            top: document.documentElement.clientHeight - 47, // 47 - height of the 2 last rows
            width: 40, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
            maxWidth: document.documentElement.clientWidth - 9, // padding
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });
      });

      describe('for bottom overlay when viewport is scrolled to the bottom-right edge', () => {
        it('and the scrollable element is not the Window object', () => {
          handsontable({
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
            width: 41, // 49px (the default cell width) - 8px (padding)
            maxWidth: 41,
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });

        it('and the scrollable element is the Window object', () => {
          handsontable({
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
            width: 41, // 49px (the default cell width) - 8px (padding)
            maxWidth: 40,
            height: 23,
            // maxHeight: ?, // returns wrong value! it will be fixed within #9206
          }));
        });
      });
    });
  });
});
