describe('settings', () => {
  describe('maxCols', () => {
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
      it('should show data properly when `maxCols` is set to 0', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxCols: 0
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData().length).toEqual(0);
        expect(getDataAtRow(0)).toEqual([]);
        expect(countCols()).toEqual(0);
        expect(countEmptyCols()).toEqual(0);
        expect(getDataAtCol(0)).toEqual([]);
        expect(getDataAtCol(1)).toEqual([]);
      });

      it('should show data properly when `maxCols` is set to value > 0', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxCols: 5
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData()[0].length).toEqual(5);
        expect(getDataAtRow(0).length).toEqual(5);
        expect(countCols()).toEqual(5);
        expect(countEmptyCols()).toEqual(0);
        expect(getDataAtCol(6)).toEqual([]);
      });

      it('should show data properly when `maxCols` is set to infinity value', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxCols: Infinity
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData()[0].length).toEqual(10);
        expect(getDataAtRow(0).length).toEqual(10);
        expect(countCols()).toEqual(10);
        expect(countEmptyCols()).toEqual(0);
        expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });

      describe('when `columns` property was set', () => {
        it('should show data properly when `maxCols` is set to value > 0', () => {
          handsontable({
            columns: [
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
            ],
            minRows: 10,
            maxCols: 2
          });

          expect(getSourceDataAtRow(0).length).toEqual(5);
          expect(countSourceCols()).toEqual(5);
          expect(getData()[0].length).toEqual(2);
          expect(getDataAtRow(0).length).toEqual(2);
          expect(countCols()).toEqual(2);
          expect(getDataAtCol(3)).toEqual([]);
        });
      });
    });

    describe('update settings works', () => {
      it('should show data properly after maxCols is updated to 0', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10)
        });

        updateSettings({
          maxCols: 0
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData().length).toEqual(0);
        expect(getDataAtRow(0)).toEqual([]);
        expect(countCols()).toEqual(0);
        expect(getDataAtCol(0)).toEqual([]);
        expect(getDataAtCol(1)).toEqual([]);
      });

      it('should show data properly after maxCols is updated to value > 0 -> test no. 1', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10)
        });

        updateSettings({
          maxCols: 2
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData()[0].length).toEqual(2);
        expect(getDataAtRow(0).length).toEqual(2);
        expect(countCols()).toEqual(2);
        expect(countEmptyCols()).toEqual(0);
        expect(getDataAtCol(3)).toEqual([]);
      });

      it('should show data properly after maxCols is updated to value > 0 -> test no. 2', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxCols: 5
        });

        updateSettings({
          maxCols: 2
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData()[0].length).toEqual(2);
        expect(getDataAtRow(0).length).toEqual(2);
        expect(countCols()).toEqual(2);
        expect(countEmptyCols()).toEqual(0);
        expect(getDataAtCol(3)).toEqual([]);
      });

      it('should show data properly after maxCols is updated to value > 0 -> test no. 3', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxCols: 2
        });

        updateSettings({
          maxCols: 5
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData()[0].length).toEqual(5);
        expect(getDataAtRow(0).length).toEqual(5);
        expect(countCols()).toEqual(5);
        expect(countEmptyCols()).toEqual(0);
        expect(getDataAtCol(6)).toEqual([]);
      });

      it('should show data properly after maxCols is updated to infinity value -> test no. 1', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10)
        });

        updateSettings({
          maxCols: Infinity
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData()[0].length).toEqual(10);
        expect(getDataAtRow(0).length).toEqual(10);
        expect(countCols()).toEqual(10);
        expect(countEmptyCols()).toEqual(0);
        expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });

      it('should show data properly after maxCols is updated to infinity value -> test no. 2', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          maxCols: 2
        });

        updateSettings({
          maxCols: Infinity
        });

        expect(getSourceDataAtRow(0).length).toEqual(10);
        expect(countSourceCols()).toEqual(10);
        expect(getData()[0].length).toEqual(10);
        expect(getDataAtRow(0).length).toEqual(10);
        expect(countCols()).toEqual(10);
        expect(countEmptyCols()).toEqual(0);
        expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });

      describe('works when `columns` property was set', () => {
        it('should show data properly when `maxCols` is updated to value > 0', () => {
          handsontable({
            columns: [
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
              { type: 'text' },
            ],
            minRows: 10
          });

          updateSettings({
            maxCols: 2
          });

          expect(getSourceDataAtRow(0).length).toEqual(5);
          expect(countSourceCols()).toEqual(5);
          expect(getData()[0].length).toEqual(2);
          expect(getDataAtRow(0).length).toEqual(2);
          expect(countCols()).toEqual(2);
          expect(getDataAtCol(0).length).toEqual(10);
        });
      });
    });
  });
});
