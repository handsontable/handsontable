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

  describe('maxCols', () => {
    it('all columns are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        maxCols: 3,
        hiddenColumns: {
          columns: [0, 1, 2],
          indicators: true
        },
        colHeaders: true,
        rowHeaders: true
      });

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        ['A4', 'B4', 'C4'],
        ['A5', 'B5', 'C5'],
      ]);

      expect(spec().$container.find('.ht_master thead th').length).toBe(1); // corner
      expect(spec().$container.find('.ht_master tbody th').length).toBe(5); // row headers
      expect(spec().$container.find('.ht_master tbody td').length).toBe(0); // cells
    });

    it('just some column is hidden #1', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        maxCols: 3,
        hiddenColumns: {
          columns: [0],
          indicators: true
        },
        colHeaders: true,
        rowHeaders: true
      });

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        ['A4', 'B4', 'C4'],
        ['A5', 'B5', 'C5'],
      ]);

      expect(getCell(0, 0)).toBe(null); // Hidden column
      expect(getCell(1, 0)).toBe(null); // Hidden column
      expect(getCell(2, 0)).toBe(null); // Hidden column
      expect(getCell(3, 0)).toBe(null); // Hidden column
      expect(getCell(4, 0)).toBe(null); // Hidden column

      expect(getCell(0, 1).innerText).toBe('B1');
      expect(getCell(1, 1).innerText).toBe('B2');
      expect(getCell(2, 1).innerText).toBe('B3');
      expect(getCell(3, 1).innerText).toBe('B4');
      expect(getCell(4, 1).innerText).toBe('B5');

      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(1, 2).innerText).toBe('C2');
      expect(getCell(2, 2).innerText).toBe('C3');
      expect(getCell(3, 2).innerText).toBe('C4');
      expect(getCell(4, 2).innerText).toBe('C5');

      expect(spec().$container.find('.ht_master thead th').length).toBe(3); // corner + column headers
      expect(spec().$container.find('.ht_master tbody th').length).toBe(5); // row headers
      expect(spec().$container.find('.ht_master tbody td').length).toBe(10); // cells
    });

    it('just some column is hidden #2', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        maxCols: 3,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        colHeaders: true,
        rowHeaders: true
      });

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        ['A4', 'B4', 'C4'],
        ['A5', 'B5', 'C5'],
      ]);

      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(1, 0).innerText).toBe('A2');
      expect(getCell(2, 0).innerText).toBe('A3');
      expect(getCell(3, 0).innerText).toBe('A4');
      expect(getCell(4, 0).innerText).toBe('A5');

      expect(getCell(0, 1)).toBe(null); // Hidden column
      expect(getCell(1, 1)).toBe(null); // Hidden column
      expect(getCell(2, 1)).toBe(null); // Hidden column
      expect(getCell(3, 1)).toBe(null); // Hidden column
      expect(getCell(4, 1)).toBe(null); // Hidden column

      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(1, 2).innerText).toBe('C2');
      expect(getCell(2, 2).innerText).toBe('C3');
      expect(getCell(3, 2).innerText).toBe('C4');
      expect(getCell(4, 2).innerText).toBe('C5');

      expect(spec().$container.find('.ht_master thead th').length).toBe(3); // corner + column headers
      expect(spec().$container.find('.ht_master tbody th').length).toBe(5); // row headers
      expect(spec().$container.find('.ht_master tbody td').length).toBe(10); // cells
    });

    it('just some columns are hidden #1', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        maxCols: 3,
        hiddenColumns: {
          columns: [1, 2],
          indicators: true
        },
        colHeaders: true,
        rowHeaders: true
      });

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        ['A4', 'B4', 'C4'],
        ['A5', 'B5', 'C5'],
      ]);

      expect(getCell(0, 0).innerText).toBe('A1');
      expect(getCell(1, 0).innerText).toBe('A2');
      expect(getCell(2, 0).innerText).toBe('A3');
      expect(getCell(3, 0).innerText).toBe('A4');
      expect(getCell(4, 0).innerText).toBe('A5');

      expect(getCell(0, 1)).toBe(null); // Hidden column
      expect(getCell(1, 1)).toBe(null); // Hidden column
      expect(getCell(2, 1)).toBe(null); // Hidden column
      expect(getCell(3, 1)).toBe(null); // Hidden column
      expect(getCell(4, 1)).toBe(null); // Hidden column

      expect(getCell(0, 2)).toBe(null); // Hidden column
      expect(getCell(1, 2)).toBe(null); // Hidden column
      expect(getCell(2, 2)).toBe(null); // Hidden column
      expect(getCell(3, 2)).toBe(null); // Hidden column
      expect(getCell(4, 2)).toBe(null); // Hidden column

      expect(spec().$container.find('.ht_master thead th').length).toBe(2); // corner + column headers
      expect(spec().$container.find('.ht_master tbody th').length).toBe(5); // row headers
      expect(spec().$container.find('.ht_master tbody td').length).toBe(5); // cells
    });

    it('just some columns are hidden #2', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        maxCols: 3,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true
        },
        colHeaders: true,
        rowHeaders: true
      });

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        ['A4', 'B4', 'C4'],
        ['A5', 'B5', 'C5'],
      ]);

      expect(getCell(0, 0)).toBe(null); // Hidden column
      expect(getCell(1, 0)).toBe(null); // Hidden column
      expect(getCell(2, 0)).toBe(null); // Hidden column
      expect(getCell(3, 0)).toBe(null); // Hidden column
      expect(getCell(4, 0)).toBe(null); // Hidden column

      expect(getCell(0, 1)).toBe(null); // Hidden column
      expect(getCell(1, 1)).toBe(null); // Hidden column
      expect(getCell(2, 1)).toBe(null); // Hidden column
      expect(getCell(3, 1)).toBe(null); // Hidden column
      expect(getCell(4, 1)).toBe(null); // Hidden column

      expect(getCell(0, 2).innerText).toBe('C1');
      expect(getCell(1, 2).innerText).toBe('C2');
      expect(getCell(2, 2).innerText).toBe('C3');
      expect(getCell(3, 2).innerText).toBe('C4');
      expect(getCell(4, 2).innerText).toBe('C5');

      expect(spec().$container.find('.ht_master thead th').length).toBe(2); // corner + column headers
      expect(spec().$container.find('.ht_master tbody th').length).toBe(5); // row headers
      expect(spec().$container.find('.ht_master tbody td').length).toBe(5); // cells
    });

    it('is set to Infinity value', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        maxCols: Infinity,
        hiddenColumns: {
          columns: [0, 1, 2],
          indicators: true
        },
        colHeaders: true,
        rowHeaders: true
      });

      expect(getCell(0, 0)).toBe(null); // Hidden column
      expect(getCell(1, 0)).toBe(null); // Hidden column
      expect(getCell(2, 0)).toBe(null); // Hidden column
      expect(getCell(3, 0)).toBe(null); // Hidden column
      expect(getCell(4, 0)).toBe(null); // Hidden column

      expect(getCell(0, 1)).toBe(null); // Hidden column
      expect(getCell(1, 1)).toBe(null); // Hidden column
      expect(getCell(2, 1)).toBe(null); // Hidden column
      expect(getCell(3, 1)).toBe(null); // Hidden column
      expect(getCell(4, 1)).toBe(null); // Hidden column

      expect(getCell(0, 2)).toBe(null); // Hidden column
      expect(getCell(1, 2)).toBe(null); // Hidden column
      expect(getCell(2, 2)).toBe(null); // Hidden column
      expect(getCell(3, 2)).toBe(null); // Hidden column
      expect(getCell(4, 2)).toBe(null); // Hidden column

      expect(getCell(0, 3).innerText).toBe('D1');
      expect(getCell(1, 3).innerText).toBe('D2');
      expect(getCell(2, 3).innerText).toBe('D3');
      expect(getCell(3, 3).innerText).toBe('D4');
      expect(getCell(4, 3).innerText).toBe('D5');

      expect(getCell(0, 4).innerText).toBe('E1');
      expect(getCell(1, 4).innerText).toBe('E2');
      expect(getCell(2, 4).innerText).toBe('E3');
      expect(getCell(3, 4).innerText).toBe('E4');
      expect(getCell(4, 4).innerText).toBe('E5');

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);

      expect(spec().$container.find('.ht_master thead th').length).toBe(3); // corner + column headers
      expect(spec().$container.find('.ht_master tbody th').length).toBe(5); // row headers
      expect(spec().$container.find('.ht_master tbody td').length).toBe(10); // cells
    });

    it('is set to value > nr of columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        maxCols: 10,
        hiddenColumns: {
          columns: [0, 1, 2],
          indicators: true
        },
        colHeaders: true,
        rowHeaders: true
      });

      expect(getCell(0, 0)).toBe(null); // Hidden column
      expect(getCell(1, 0)).toBe(null); // Hidden column
      expect(getCell(2, 0)).toBe(null); // Hidden column
      expect(getCell(3, 0)).toBe(null); // Hidden column
      expect(getCell(4, 0)).toBe(null); // Hidden column

      expect(getCell(0, 1)).toBe(null); // Hidden column
      expect(getCell(1, 1)).toBe(null); // Hidden column
      expect(getCell(2, 1)).toBe(null); // Hidden column
      expect(getCell(3, 1)).toBe(null); // Hidden column
      expect(getCell(4, 1)).toBe(null); // Hidden column

      expect(getCell(0, 2)).toBe(null); // Hidden column
      expect(getCell(1, 2)).toBe(null); // Hidden column
      expect(getCell(2, 2)).toBe(null); // Hidden column
      expect(getCell(3, 2)).toBe(null); // Hidden column
      expect(getCell(4, 2)).toBe(null); // Hidden column

      expect(getCell(0, 3).innerText).toBe('D1');
      expect(getCell(1, 3).innerText).toBe('D2');
      expect(getCell(2, 3).innerText).toBe('D3');
      expect(getCell(3, 3).innerText).toBe('D4');
      expect(getCell(4, 3).innerText).toBe('D5');

      expect(getCell(0, 4).innerText).toBe('E1');
      expect(getCell(1, 4).innerText).toBe('E2');
      expect(getCell(2, 4).innerText).toBe('E3');
      expect(getCell(3, 4).innerText).toBe('E4');
      expect(getCell(4, 4).innerText).toBe('E5');

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);

      expect(spec().$container.find('.ht_master thead th').length).toBe(3); // corner + column headers
      expect(spec().$container.find('.ht_master tbody th').length).toBe(5); // row headers
      expect(spec().$container.find('.ht_master tbody td').length).toBe(10); // cells
    });
  });
});
