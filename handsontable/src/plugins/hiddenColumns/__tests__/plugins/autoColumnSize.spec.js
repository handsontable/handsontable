describe('HiddenColumns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
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
        data: createSpreadsheetData(3, 3),
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
        data: createSpreadsheetData(3, 3),
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
        data: createSpreadsheetData(3, 3),
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

    it('should display proper column width (when indicator is disabled)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
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

    it('should return proper values from the `getColWidth` function (when indicator is enabled)', async() => {
      handsontable({
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

      const autoColSize = getPlugin('autoColumnSize');

      expect(getColWidth(0)).toBe(0);
      expect(getColWidth(1)).toBe(0);
      // With indicators enabled, getColWidth includes indicator padding (15px per adjacent hidden column)
      expect(getColWidth(2)).toBeGreaterThan(autoColSize.getColumnWidth(2));
      expect(getColWidth(2)).toBe(colWidth(spec().$container, 0));
    });

    it('should return proper values from the `getColWidth` function (when indicator is disabled)', async() => {
      handsontable({
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

      const autoColSize = getPlugin('autoColumnSize');

      expect(getColWidth(0)).toBe(0);
      expect(getColWidth(1)).toBe(0);
      // Without indicators, getColWidth matches the auto-sized width
      expect(getColWidth(2)).toBe(autoColSize.getColumnWidth(2));
    });

    it('should return proper values from the `getColHeader` function', async() => {
      handsontable({
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

      expect(getColHeader(0)).toBe('Identifier');
      expect(getColHeader(1)).toBe('Name');
      expect(getColHeader(2)).toBe('Last Name');
    });
  });
});
