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

  describe('rowHeaders', () => {
    it('should show proper row headers for the table with hidden row (hidden first row)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: ['AA', 'BB', 'CC', 'DD', 'EE'],
        colHeaders: true,
        hiddenRows: {
          rows: [0]
        }
      });

      expect(getCell(0, -1)).toBe(null);
      expect(getCell(1, -1).textContent).toBe('BB');
      expect(getCell(2, -1).textContent).toBe('CC');
      expect(getCell(3, -1).textContent).toBe('DD');
      expect(getCell(4, -1).textContent).toBe('EE');
    });

    it('should show proper row headers for the table with hidden row (hidden row in the middle)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: ['AA', 'BB', 'CC', 'DD', 'EE'],
        colHeaders: true,
        hiddenRows: {
          rows: [2]
        }
      });

      expect(getCell(0, -1).textContent).toBe('AA');
      expect(getCell(1, -1).textContent).toBe('BB');
      expect(getCell(2, -1)).toBe(null);
      expect(getCell(3, -1).textContent).toBe('DD');
      expect(getCell(4, -1).textContent).toBe('EE');
    });

    it('should show proper row headers for the table with hidden row (hidden last row)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: ['AA', 'BB', 'CC', 'DD', 'EE'],
        colHeaders: true,
        hiddenRows: {
          rows: [4]
        }
      });

      expect(getCell(0, -1).textContent).toBe('AA');
      expect(getCell(1, -1).textContent).toBe('BB');
      expect(getCell(2, -1).textContent).toBe('CC');
      expect(getCell(3, -1).textContent).toBe('DD');
      expect(getCell(4, -1)).toBe(null);
    });
  });
});
