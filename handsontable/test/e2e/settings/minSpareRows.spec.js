describe('settings', () => {
  describe('minSpareRows', () => {
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

    it('should create a new row after ENTER hit', () => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        minSpareRows: 1,
      });

      selectCell(5, 0);
      keyDownUp('enter');
      getActiveEditor().TEXTAREA.value = 'test';
      keyDownUp('enter');

      expect(countRows()).toBe(7);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,0 from: 6,0 to: 6,0']);
    });

    it('should create a spare row after removing all rows', () => {
      handsontable({
        data: createSpreadsheetData(4, 1),
        rowHeaders: true,
        colHeaders: true,
        minSpareRows: 1,
      });

      alter('remove_row', 0, 5);

      expect(countRows()).toBe(1);
      expect(getCell(0, -1)).toBeInstanceOf(HTMLTableCellElement);
    });

    describe('works on init', () => {
      it('should show data properly when `minSpareRows` is set to 3', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minSpareRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(4);
        expect(countSourceRows()).toEqual(4);
        expect(countRows()).toEqual(4);
        expect(getData().length).toEqual(4);
        expect(countEmptyRows()).toEqual(3);
      });
    });

    describe('update settings works', () => {
      it('should show data properly after `minSpareRows` is updated to 3', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1)
        });

        updateSettings({
          minSpareRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(4);
        expect(countSourceRows()).toEqual(4);
        expect(countRows()).toEqual(4);
        expect(getData().length).toEqual(4);
        expect(countEmptyRows()).toEqual(3);
      });

      // Currently this is a bug (#6571)
      xit('should show data properly after `minSpareRows` is updated from 5 to 3', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minSpareRows: 5
        });

        updateSettings({
          minSpareRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(4);
        expect(countSourceRows()).toEqual(4);
        expect(countRows()).toEqual(4);
        expect(getData().length).toEqual(4);
        expect(countEmptyRows()).toEqual(3);
      });
    });

    describe('cell meta', () => {
      it('should be rendered as is without shifting the cell meta objects', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minSpareRows: 3,
        });

        getCellMeta(4, 0).test = 'foo';
        getCellMeta(5, 0).test = 'bar';

        updateSettings({
          minSpareRows: 5
        });

        expect(getCellMeta(0, 0).test).toBeUndefined();
        expect(getCellMeta(1, 0).test).toBeUndefined();
        expect(getCellMeta(2, 0).test).toBeUndefined();
        expect(getCellMeta(3, 0).test).toBeUndefined();
        expect(getCellMeta(4, 0).test).toBe('foo');
        expect(getCellMeta(5, 0).test).toBe('bar');
        expect(getCellMeta(6, 0).test).toBeUndefined();
      });
    });
  });
});
