describe('settings', () => {
  describe('maxRows', () => {
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

    describe('works on init', () => {
      it('should show data properly when `maxRows` is set to 0', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxRows: 0
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(0);
        expect(getDataAtCol(0)).toEqual([]);
        expect(countRows()).toEqual(0);
        expect(spec().$container.find('tr').length).toBe(0);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(0)).toEqual([]);
        expect(getDataAtRow(1)).toEqual([]);
      });

      it('should show data properly when `maxRows` is set to value > 0', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxRows: 5
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(5);
        expect(getDataAtCol(0).length).toEqual(5);
        expect(countRows()).toEqual(5);
        expect(spec().$container.find('tr').length).toBe(5);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(6)).toEqual([]);
      });

      it('should show data properly when `maxRows` is set to infinity value', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxRows: Infinity
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(10);
        expect(getDataAtCol(0).length).toEqual(10);
        expect(countRows()).toEqual(10);
        expect(spec().$container.find('tr').length).toBe(10);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });
    });

    describe('update settings works', () => {
      it('should show data properly after maxRows is updated to 0', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10)
        });

        updateSettings({
          maxRows: 0
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(0);
        expect(getDataAtCol(0)).toEqual([]);
        expect(countRows()).toEqual(0);
        expect(spec().$container.find('tr').length).toBe(0);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(0)).toEqual([]);
        expect(getDataAtRow(1)).toEqual([]);
      });

      it('should show data properly after maxRows is updated to value > 0 -> test no. 1', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10)
        });

        updateSettings({
          maxRows: 2
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(2);
        expect(getDataAtCol(0).length).toEqual(2);
        expect(countRows()).toEqual(2);
        expect(spec().$container.find('tr').length).toBe(2);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(3)).toEqual([]);
      });

      it('should show data properly after maxRows is updated to value > 0 -> test no. 2', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxRows: 5
        });

        updateSettings({
          maxRows: 2
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(2);
        expect(getDataAtCol(0).length).toEqual(2);
        expect(countRows()).toEqual(2);
        expect(spec().$container.find('tr').length).toBe(2);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(3)).toEqual([]);
      });

      it('should show data properly after maxRows is updated to value > 0 -> test no. 3', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxRows: 2
        });

        updateSettings({
          maxRows: 5
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(5);
        expect(getDataAtCol(0).length).toEqual(5);
        expect(countRows()).toEqual(5);
        expect(spec().$container.find('tr').length).toBe(5);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(6)).toEqual([]);
      });

      it('should show data properly after maxRows is updated to infinity value -> test no. 1', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10)
        });

        updateSettings({
          maxRows: Infinity
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(10);
        expect(getDataAtCol(0).length).toEqual(10);
        expect(countRows()).toEqual(10);
        expect(spec().$container.find('tr').length).toBe(10);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('should show data properly after maxRows is updated to infinity value -> test no. 2', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxRows: 2
        });

        updateSettings({
          maxRows: Infinity
        });

        expect(getSourceDataAtCol(0).length).toEqual(10);
        expect(countSourceRows()).toEqual(10);
        expect(getData().length).toEqual(10);
        expect(getDataAtCol(0).length).toEqual(10);
        expect(countRows()).toEqual(10);
        expect(spec().$container.find('tr').length).toBe(10);
        expect(countEmptyRows()).toEqual(0);
        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });
    });
  });
});
