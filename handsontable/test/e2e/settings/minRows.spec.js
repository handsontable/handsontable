describe('settings', () => {
  describe('minRows', () => {
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
      it('should show data properly when `minRows` is set to 3', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(3);
        expect(countSourceRows()).toEqual(3);
        expect(countRows()).toEqual(3);
        expect(getData().length).toEqual(3);
        expect(countEmptyRows()).toEqual(2);
      });
    });

    describe('update settings works', () => {
      it('should show data properly after `minRows` is updated to 3', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1)
        });

        updateSettings({
          minRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(3);
        expect(countSourceRows()).toEqual(3);
        expect(countRows()).toEqual(3);
        expect(getData().length).toEqual(3);
        expect(countEmptyRows()).toEqual(2);
      });

      // Currently this is a bug (#6571)
      xit('should show data properly after `minRows` is updated from 5 to 3', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minRows: 5
        });

        updateSettings({
          minRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(3);
        expect(countSourceRows()).toEqual(3);
        expect(countRows()).toEqual(3);
        expect(getData().length).toEqual(3);
        expect(countEmptyRows()).toEqual(2);
      });
    });

    describe('cell meta', () => {
      it('should be rendered as is without shifting the cell meta objects', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minRows: 3,
        });

        getCellMeta(4, 0).test = 'foo';
        getCellMeta(5, 0).test = 'bar';

        updateSettings({
          minRows: 5
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
