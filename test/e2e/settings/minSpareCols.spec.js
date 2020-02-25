describe('settings', () => {
  describe('minSpareCols', () => {
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
      it('should show data properly when `minSpareCols` is set to 0', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minSpareCols: 0
        });

        expect(getSourceDataAtRow(0).length).toEqual(1);
        expect(countSourceCols()).toEqual(1);
        expect(getData().length).toEqual(1);
        expect(countCols()).toEqual(1);
        expect(countEmptyCols()).toEqual(0);
      });

      it('should show data properly when `minSpareCols` is set to value > 0', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minSpareCols: 5
        });

        expect(getSourceDataAtRow(0).length).toBe(6);
        expect(countSourceCols()).toBe(6);
        expect(getData()[0].length).toBe(6);
        expect(countCols()).toBe(6);
        expect(countEmptyCols()).toBe(5);
      });

      describe('when `columns` property was set', () => {
        it('should render the number of columns defined in `column` properly ignoring `minSpareCols` option', () => {
          handsontable({
            columns: [
              { type: 'text' },
              { type: 'text' },
            ],
            minSpareCols: 5,
          });

          expect(getSourceDataAtRow(0).length).toBe(5);
          expect(countSourceCols()).toBe(5);
          expect(getData()[0].length).toBe(2);
          expect(countCols()).toBe(2);
          expect(countEmptyCols()).toBe(2);
        });

        it('should render the number of columns defined in `minSpareCols` properly ignoring `columns` option', () => {
          handsontable({
            columns: [
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
            ],
            minSpareCols: 3
          });

          expect(getSourceDataAtRow(0).length).toBe(5);
          expect(countSourceCols()).toBe(5);
          expect(getData()[0].length).toBe(5);
          expect(countCols()).toBe(5);
          expect(countEmptyCols()).toBe(5);
        });
      });
    });

    describe('update settings works', () => {
      it('should show data properly after `minSpareCols` is updated to 5', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1)
        });

        updateSettings({
          minSpareCols: 5
        });

        expect(getSourceDataAtRow(0).length).toBe(6);
        expect(countSourceCols()).toBe(6);
        expect(getData()[0].length).toBe(6);
        expect(countCols()).toBe(6);
        expect(countEmptyCols()).toBe(5);
      });

      // Currently this is a bug (#6571)
      xit('should show data properly after `minSpareCols` is updated from 5 to 2', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minSpareCols: 5
        });

        updateSettings({
          minSpareCols: 2
        });

        expect(getSourceDataAtRow(0).length).toBe(2);
        expect(countSourceCols()).toBe(2);
        expect(getData()[0].length).toBe(2);
        expect(countCols()).toBe(2);
        expect(countEmptyCols()).toBe(1);
      });

      it('should show data properly after `minSpareCols` is updated from 2 to 5', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minSpareCols: 2
        });

        updateSettings({
          minSpareCols: 5
        });

        expect(getSourceDataAtRow(0).length).toBe(6);
        expect(countSourceCols()).toBe(6);
        expect(getData()[0].length).toBe(6);
        expect(countCols()).toBe(6);
        expect(countEmptyCols()).toBe(5);
      });
    });

    describe('cell meta', () => {
      it('should be rendered as is without shifting the cell meta objects', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(1, 1),
          minSpareCols: 3,
        });

        getCellMeta(0, 4).test = 'foo';
        getCellMeta(0, 5).test = 'bar';

        updateSettings({
          minSpareCols: 5
        });

        expect(getCellMeta(0, 0).test).toBeUndefined();
        expect(getCellMeta(0, 1).test).toBeUndefined();
        expect(getCellMeta(0, 2).test).toBeUndefined();
        expect(getCellMeta(0, 3).test).toBeUndefined();
        expect(getCellMeta(0, 4).test).toBe('foo');
        expect(getCellMeta(0, 5).test).toBe('bar');
        expect(getCellMeta(0, 6).test).toBeUndefined();
      });
    });
  });
});
