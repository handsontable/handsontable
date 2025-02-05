describe('HiddenRows', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('AutoRowSize', () => {
    it('should display proper row height (when indicator is enabled) #1', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoRowSize: true,
        hiddenRows: {
          rows: [0, 1],
          indicators: true,
        }
      });

      expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main }) => {
        classic.toBe(24);
        main.toBe(30);
      });
    });

    it('should display proper row height (when indicator is enabled) #2', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoRowSize: true,
        hiddenRows: {
          rows: [0, 2],
          indicators: true,
        }
      });

      expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main }) => {
        classic.toBe(24);
        main.toBe(30);
      });
    });

    it('should display proper row height (when indicator is enabled) #3', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoRowSize: true,
        hiddenRows: {
          rows: [1, 2],
          indicators: true,
        }
      });

      expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main }) => {
        classic.toBe(24);
        main.toBe(30);
      });
    });

    it('should display proper row height (when indicator is disabled)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoRowSize: true,
        hiddenRows: {
          rows: [0, 1]
        }
      });

      expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main }) => {
        classic.toBe(24);
        main.toBe(30);
      });
    });

    it('should return proper values from the `getRowHeight` function (when indicator is enabled)', async() => {
      const hot = handsontable({
        data: [
          { id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' },
          { id: 'Somewhat long', name: 'Long', lastName: 'The very longest one' },
          { id: 'Somewhat long', name: 'Somewhat long', lastName: 'Not very longest' },
        ],
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1],
          indicators: true,
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoRowSize: true,
      });

      // The AutoRowSize calculates the row heights asynchronously.
      await sleep(100);

      expect(hot.getRowHeight(0)).toBe(0);
      expect(hot.getRowHeight(1)).toBe(0);
      expect(hot.getRowHeight(2)).forThemes(({ classic, main }) => {
        classic.toBe(23);
        main.toBe(29);
      });
    });

    it('should return proper values from the `getRowHeight` function (when indicator is disabled)', async() => {
      const hot = handsontable({
        data: [
          { id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' },
          { id: 'Somewhat long', name: 'Long', lastName: 'The very longest one' },
          { id: 'Somewhat long', name: 'Somewhat long', lastName: 'Not very longest' },
        ],
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1],
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoRowSize: true,
      });

      // The AutoRowSize calculates the row heights asynchronously.
      await sleep(100);

      expect(hot.getRowHeight(0)).toBe(0);
      expect(hot.getRowHeight(1)).toBe(0);
      expect(hot.getRowHeight(2)).forThemes(({ classic, main }) => {
        classic.toBe(23);
        main.toBe(29);
      });
    });

    it('should return proper values from the `getRowHeight` function when the `ManualRowResize` plugin define sizes for some rows', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2],
        },
        manualRowResize: [30, 31, 32, 33, 34],
      });

      expect(hot.getRowHeight(0)).toBe(0);
      expect(hot.getRowHeight(1)).toBe(31);
      expect(hot.getRowHeight(2)).toBe(0);
      expect(hot.getRowHeight(3)).toBe(33);
      expect(hot.getRowHeight(4)).toBe(34);
      expect(hot.getRowHeight(5)).toBeUndefined();
    });

    it('should return proper values from the `getRowHeader` function', () => {
      const hot = handsontable({
        data: [
          { id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' },
          { id: 'Somewhat long', name: 'Long', lastName: 'The very longest one' },
          { id: 'Somewhat long', name: 'Somewhat long', lastName: 'Not very longest' },
        ],
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1],
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoRowSize: true,
      });

      expect(hot.getRowHeader(0)).toBe(1);
      expect(hot.getRowHeader(1)).toBe(2);
      expect(hot.getRowHeader(2)).toBe(3);
    });
  });
});
