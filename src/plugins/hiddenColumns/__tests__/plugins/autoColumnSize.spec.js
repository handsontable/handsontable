describe('HiddenColumns', () => {
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

  describe('AutoColumnSize', () => {
    it('should display proper column width (when indicator is enabled) #1', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is enabled) #2', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 2],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is enabled) #3', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [1, 2],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is disabled)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 1]
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is unset).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(50, 3);
    });

    it('should return proper values from the `getColWidth` function (when indicator is enabled)', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true,
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(0);
      expect(hot.getColWidth(2)).toBe(188);
    });

    it('should return proper values from the `getColWidth` function (when indicator is disabled)', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(0);
      expect(hot.getColWidth(2)).toBe(173);
    });

    it('should return proper values from the `getColWidth` function when the `ManualColumnResize` plugin define sizes for some columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        manualColumnResize: [10, 11, 12, 13, 14],
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(11);
      expect(hot.getColWidth(2)).toBe(0);
      expect(hot.getColWidth(3)).toBe(13);
      expect(hot.getColWidth(4)).toBe(14);
    });

    it('should return proper values from the `getColHeader` function', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColHeader(0)).toBe('Identifier');
      expect(hot.getColHeader(1)).toBe('Name');
      expect(hot.getColHeader(2)).toBe('Last Name');
    });
  });
});
