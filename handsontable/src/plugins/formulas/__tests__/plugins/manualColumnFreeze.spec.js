import HyperFormula from 'hyperformula';

describe('Formulas', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Integration with Frozen Columns', () => {
    it('should calculate result of formula properly after freezing/unfreezing column using ManualColumnFreeze plugin API', () => {
      const hot = handsontable({
        data: [
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        manualColumnFreeze: true,
        manualColumnMove: true,
      });

      hot.getPlugin('manualColumnFreeze').freezeColumn(2);
      hot.render();

      expect(getData()).toEqual([
        [111, 1, 11, 1111, 1001111],
        [112, 2, 12, 1112, 1001112],
        [113, 3, 13, 1113, 1001113],
        [114, 4, 14, 1114, 1001114],
        [115, 5, 15, 1115, 1001115],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, '=B1+10', '=C1+100', '=A1+1000', '=D1+1000000'],
        [2, '=B2+10', '=C2+100', '=A2+1000', '=D2+1000000'],
        [3, '=B3+10', '=C3+100', '=A3+1000', '=D3+1000000'],
        [4, '=B4+10', '=C4+100', '=A4+1000', '=D4+1000000'],
        [5, '=B5+10', '=C5+100', '=A5+1000', '=D5+1000000'],
      ]);

      hot.getPlugin('manualColumnFreeze').freezeColumn(4);
      hot.render();

      expect(getData()).toEqual([
        [111, 1001111, 1, 11, 1111],
        [112, 1001112, 2, 12, 1112],
        [113, 1001113, 3, 13, 1113],
        [114, 1001114, 4, 14, 1114],
        [115, 1001115, 5, 15, 1115],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, '=C1+10', '=D1+100', '=A1+1000', '=E1+1000000'],
        [2, '=C2+10', '=D2+100', '=A2+1000', '=E2+1000000'],
        [3, '=C3+10', '=D3+100', '=A3+1000', '=E3+1000000'],
        [4, '=C4+10', '=D4+100', '=A4+1000', '=E4+1000000'],
        [5, '=C5+10', '=D5+100', '=A5+1000', '=E5+1000000'],
      ]);

      hot.getPlugin('manualColumnFreeze').freezeColumn(4);
      hot.render();

      expect(getData()).toEqual([
        [111, 1001111, 1111, 1, 11],
        [112, 1001112, 1112, 2, 12],
        [113, 1001113, 1113, 3, 13],
        [114, 1001114, 1114, 4, 14],
        [115, 1001115, 1115, 5, 15],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, '=D1+10', '=E1+100', '=A1+1000', '=C1+1000000'],
        [2, '=D2+10', '=E2+100', '=A2+1000', '=C2+1000000'],
        [3, '=D3+10', '=E3+100', '=A3+1000', '=C3+1000000'],
        [4, '=D4+10', '=E4+100', '=A4+1000', '=C4+1000000'],
        [5, '=D5+10', '=E5+100', '=A5+1000', '=C5+1000000'],
      ]);

      hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);
      hot.render();

      expect(getData()).toEqual([
        [1001111, 1111, 111, 1, 11],
        [1001112, 1112, 112, 2, 12],
        [1001113, 1113, 113, 3, 13],
        [1001114, 1114, 114, 4, 14],
        [1001115, 1115, 115, 5, 15],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, '=D1+10', '=E1+100', '=C1+1000', '=B1+1000000'],
        [2, '=D2+10', '=E2+100', '=C2+1000', '=B2+1000000'],
        [3, '=D3+10', '=E3+100', '=C3+1000', '=B3+1000000'],
        [4, '=D4+10', '=E4+100', '=C4+1000', '=B4+1000000'],
        [5, '=D5+10', '=E5+100', '=C5+1000', '=B5+1000000'],
      ]);

      hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);
      hot.render();

      expect(getData()).toEqual([
        [1111, 1001111, 111, 1, 11],
        [1112, 1001112, 112, 2, 12],
        [1113, 1001113, 113, 3, 13],
        [1114, 1001114, 114, 4, 14],
        [1115, 1001115, 115, 5, 15],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, '=D1+10', '=E1+100', '=C1+1000', '=A1+1000000'],
        [2, '=D2+10', '=E2+100', '=C2+1000', '=A2+1000000'],
        [3, '=D3+10', '=E3+100', '=C3+1000', '=A3+1000000'],
        [4, '=D4+10', '=E4+100', '=C4+1000', '=A4+1000000'],
        [5, '=D5+10', '=E5+100', '=C5+1000', '=A5+1000000'],
      ]);

      hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);
      hot.render();

      expect(getData()).toEqual([
        [1111, 1001111, 111, 1, 11],
        [1112, 1001112, 112, 2, 12],
        [1113, 1001113, 113, 3, 13],
        [1114, 1001114, 114, 4, 14],
        [1115, 1001115, 115, 5, 15],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, '=D1+10', '=E1+100', '=C1+1000', '=A1+1000000'],
        [2, '=D2+10', '=E2+100', '=C2+1000', '=A2+1000000'],
        [3, '=D3+10', '=E3+100', '=C3+1000', '=A3+1000000'],
        [4, '=D4+10', '=E4+100', '=C4+1000', '=A4+1000000'],
        [5, '=D5+10', '=E5+100', '=C5+1000', '=A5+1000000'],
      ]);
    });
  });
});
