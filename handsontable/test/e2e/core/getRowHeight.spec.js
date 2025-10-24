describe('Core.getRowHeight', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('using `rowHeights`', () => {
    it('should call the `modifyRowHeight` internally', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeights: 50,
        rowHeaders: false,
        colHeaders: false,
      });

      const modifyRowHeight = jasmine.createSpy('modifyRowHeight');

      addHook('modifyRowHeight', modifyRowHeight);
      getRowHeight(1);

      expect(modifyRowHeight.calls.count()).toBe(1);
      expect(modifyRowHeight).toHaveBeenCalledWith(50, 1);
    });

    it('should return the same value as the `rowHeights` if the value is greater than minimum theme row height', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeights: 50,
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(50);
      expect(getMaster().find('table tr:last-child td:eq(0)').outerHeight()).toBe(50);
    });

    it('should return the minimum theme row height if the lower value is defined', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeights: 12,
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(getDefaultRowHeight());
      expect(getMaster().find('table tr:last-child td:eq(0)').outerHeight()).toBe(getDefaultRowHeight());
    });

    it('should return the minimum theme row height if the value is equal to `0`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeights: 0,
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(getDefaultRowHeight());
      expect(getMaster().find('table tr:last-child td:eq(0)').outerHeight()).toBe(getDefaultRowHeight());
    });

    it('should return correct row heights when using `rowHeights` as an array', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeights: [50, 60, 70, 80, 90],
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(50);
      expect(getMaster().find('table tr:nth-child(1) td:eq(0)').outerHeight()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(51); // classic styles 1px border compensation
        main.toBe(50);
        horizon.toBe(50);
      });
      expect(getRowHeight(1)).toBe(60);
      expect(getMaster().find('table tr:nth-child(2) td:eq(0)').outerHeight()).toBe(60);
      expect(getRowHeight(2)).toBe(70);
      expect(getMaster().find('table tr:nth-child(3) td:eq(0)').outerHeight()).toBe(70);
      expect(getRowHeight(3)).toBe(80);
      expect(getMaster().find('table tr:nth-child(4) td:eq(0)').outerHeight()).toBe(80);
      expect(getRowHeight(4)).toBe(90);
      expect(getMaster().find('table tr:nth-child(5) td:eq(0)').outerHeight()).toBe(90);
    });

    it('should return correct row heights when using `rowHeights` as a function', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeights: (row) => (row + 1) * 50,
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(50);
      expect(getMaster().find('table tr:nth-child(1) td:eq(0)').outerHeight()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(51); // classic styles 1px border compensation
        main.toBe(50);
        horizon.toBe(50);
      });
      expect(getRowHeight(1)).toBe(100);
      expect(getMaster().find('table tr:nth-child(2) td:eq(0)').outerHeight()).toBe(100);
      expect(getRowHeight(2)).toBe(150);
      expect(getMaster().find('table tr:nth-child(3) td:eq(0)').outerHeight()).toBe(150);
      expect(getRowHeight(3)).toBe(200);
      expect(getMaster().find('table tr:nth-child(4) td:eq(0)').outerHeight()).toBe(200);
      expect(getRowHeight(4)).toBe(250);
      expect(getMaster().find('table tr:nth-child(5) td:eq(0)').outerHeight()).toBe(250);
    });
  });

  describe('using `minRowHeights`', () => {
    it('should call the `modifyRowHeight` internally', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        minRowHeights: 50,
        rowHeaders: false,
        colHeaders: false,
      });

      const modifyRowHeight = jasmine.createSpy('modifyRowHeight');

      addHook('modifyRowHeight', modifyRowHeight);
      getRowHeight(1);

      expect(modifyRowHeight.calls.count()).toBe(1);
      expect(modifyRowHeight).toHaveBeenCalledWith(50, 1);
    });

    it('should return the same value as the `minRowHeights` if the value is greater than minimum theme row height', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        minRowHeights: 50,
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(50);
      expect(getMaster().find('table tr:last-child td:eq(0)').outerHeight()).toBe(50);
    });

    it('should return the minimum theme row height if the lower value is defined', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        minRowHeights: 12,
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(getDefaultRowHeight());
      expect(getMaster().find('table tr:last-child td:eq(0)').outerHeight()).toBe(getDefaultRowHeight());
    });

    it('should return the minimum theme row height if the value is equal to `0`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        minRowHeights: 0,
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(getDefaultRowHeight());
      expect(getMaster().find('table tr:last-child td:eq(0)').outerHeight()).toBe(getDefaultRowHeight());
    });

    it('should return correct row heights when using `minRowHeights` as an array', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        minRowHeights: [50, 60, 70, 80, 90],
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(50);
      expect(getMaster().find('table tr:nth-child(1) td:eq(0)').outerHeight()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(51); // classic styles 1px border compensation
        main.toBe(50);
        horizon.toBe(50);
      });
      expect(getRowHeight(1)).toBe(60);
      expect(getMaster().find('table tr:nth-child(2) td:eq(0)').outerHeight()).toBe(60);
      expect(getRowHeight(2)).toBe(70);
      expect(getMaster().find('table tr:nth-child(3) td:eq(0)').outerHeight()).toBe(70);
      expect(getRowHeight(3)).toBe(80);
      expect(getMaster().find('table tr:nth-child(4) td:eq(0)').outerHeight()).toBe(80);
      expect(getRowHeight(4)).toBe(90);
      expect(getMaster().find('table tr:nth-child(5) td:eq(0)').outerHeight()).toBe(90);
    });

    it('should return correct row heights when using `minRowHeights` as a function', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        minRowHeights: (row) => (row + 1) * 50,
        rowHeaders: false,
        colHeaders: false,
      });

      expect(getRowHeight(0)).toBe(50);
      expect(getMaster().find('table tr:nth-child(1) td:eq(0)').outerHeight()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(51); // classic styles 1px border compensation
        main.toBe(50);
        horizon.toBe(50);
      });
      expect(getRowHeight(1)).toBe(100);
      expect(getMaster().find('table tr:nth-child(2) td:eq(0)').outerHeight()).toBe(100);
      expect(getRowHeight(2)).toBe(150);
      expect(getMaster().find('table tr:nth-child(3) td:eq(0)').outerHeight()).toBe(150);
      expect(getRowHeight(3)).toBe(200);
      expect(getMaster().find('table tr:nth-child(4) td:eq(0)').outerHeight()).toBe(200);
      expect(getRowHeight(4)).toBe(250);
      expect(getMaster().find('table tr:nth-child(5) td:eq(0)').outerHeight()).toBe(250);
    });
  });
});
