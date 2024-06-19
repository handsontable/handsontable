import HyperFormula from 'hyperformula';

describe('Formulas', () => {
  const dataset = [
    [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
    [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
    [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
    [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
    [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
  ];

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('manualColumnMove', () => {
    describe('should not move elements for some calls', () => {
      it('[0, 1] -> 0', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 1], 0);
        hot.render();

        expect(getData()).toEqual([
          [1, 11, 111, 1111, 1001111],
          [2, 12, 112, 1112, 1001112],
          [3, 13, 113, 1113, 1001113],
          [4, 14, 114, 1114, 1001114],
          [5, 15, 115, 1115, 1001115],
        ]);

        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ]);
      });

      it('[3, 4] -> 3', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([3, 4], 3);
        hot.render();

        expect(getData()).toEqual([
          [1, 11, 111, 1111, 1001111],
          [2, 12, 112, 1112, 1001112],
          [3, 13, 113, 1113, 1001113],
          [4, 14, 114, 1114, 1001114],
          [5, 15, 115, 1115, 1001115],
        ]);

        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ]);
      });

      it('[1, 2, 3, 4] -> 1', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([1, 2, 3, 4], 1);
        hot.render();

        expect(getData()).toEqual([
          [1, 11, 111, 1111, 1001111],
          [2, 12, 112, 1112, 1001112],
          [3, 13, 113, 1113, 1001113],
          [4, 14, 114, 1114, 1001114],
          [5, 15, 115, 1115, 1001115],
        ]);

        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ]);
      });

      it('[0, 1, 2, 3, 4] -> 0', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 1, 2, 3, 4], 0);
        hot.render();

        expect(getData()).toEqual([
          [1, 11, 111, 1111, 1001111],
          [2, 12, 112, 1112, 1001112],
          [3, 13, 113, 1113, 1001113],
          [4, 14, 114, 1114, 1001114],
          [5, 15, 115, 1115, 1001115],
        ]);

        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ]);
      });
    });

    describe('should move elements from the left to the right properly', () => {
      it('[0, 1] -> 1', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 1], 1);
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
      });

      it('[0, 1] -> 2', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 1], 2);
        hot.render();

        expect(getData()).toEqual([
          [111, 1111, 1, 11, 1001111],
          [112, 1112, 2, 12, 1001112],
          [113, 1113, 3, 13, 1001113],
          [114, 1114, 4, 14, 1001114],
          [115, 1115, 5, 15, 1001115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=C1+10', '=D1+100', '=A1+1000', '=B1+1000000'],
          [2, '=C2+10', '=D2+100', '=A2+1000', '=B2+1000000'],
          [3, '=C3+10', '=D3+100', '=A3+1000', '=B3+1000000'],
          [4, '=C4+10', '=D4+100', '=A4+1000', '=B4+1000000'],
          [5, '=C5+10', '=D5+100', '=A5+1000', '=B5+1000000'],
        ]);
      });

      it('[0, 1] -> 3', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 1], 3);
        hot.render();

        expect(getData()).toEqual([
          [111, 1111, 1001111, 1, 11],
          [112, 1112, 1001112, 2, 12],
          [113, 1113, 1001113, 3, 13],
          [114, 1114, 1001114, 4, 14],
          [115, 1115, 1001115, 5, 15],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=D1+10', '=E1+100', '=A1+1000', '=B1+1000000'],
          [2, '=D2+10', '=E2+100', '=A2+1000', '=B2+1000000'],
          [3, '=D3+10', '=E3+100', '=A3+1000', '=B3+1000000'],
          [4, '=D4+10', '=E4+100', '=A4+1000', '=B4+1000000'],
          [5, '=D5+10', '=E5+100', '=A5+1000', '=B5+1000000'],
        ]);
      });

      it('[0, 2] -> 2', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 2], 2);
        hot.render();

        expect(getData()).toEqual([
          [11, 1111, 1, 111, 1001111],
          [12, 1112, 2, 112, 1001112],
          [13, 1113, 3, 113, 1001113],
          [14, 1114, 4, 114, 1001114],
          [15, 1115, 5, 115, 1001115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=C1+10', '=A1+100', '=D1+1000', '=B1+1000000'],
          [2, '=C2+10', '=A2+100', '=D2+1000', '=B2+1000000'],
          [3, '=C3+10', '=A3+100', '=D3+1000', '=B3+1000000'],
          [4, '=C4+10', '=A4+100', '=D4+1000', '=B4+1000000'],
          [5, '=C5+10', '=A5+100', '=D5+1000', '=B5+1000000'],
        ]);
      });

      it('[0, 2] -> 3', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 2], 3);
        hot.render();

        expect(getData()).toEqual([
          [11, 1111, 1001111, 1, 111],
          [12, 1112, 1001112, 2, 112],
          [13, 1113, 1001113, 3, 113],
          [14, 1114, 1001114, 4, 114],
          [15, 1115, 1001115, 5, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=D1+10', '=A1+100', '=E1+1000', '=B1+1000000'],
          [2, '=D2+10', '=A2+100', '=E2+1000', '=B2+1000000'],
          [3, '=D3+10', '=A3+100', '=E3+1000', '=B3+1000000'],
          [4, '=D4+10', '=A4+100', '=E4+1000', '=B4+1000000'],
          [5, '=D5+10', '=A5+100', '=E5+1000', '=B5+1000000'],
        ]);
      });

      it('[0, 3] -> 3', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 3], 3);
        hot.render();

        expect(getData()).toEqual([
          [11, 111, 1001111, 1, 1111],
          [12, 112, 1001112, 2, 1112],
          [13, 113, 1001113, 3, 1113],
          [14, 114, 1001114, 4, 1114],
          [15, 115, 1001115, 5, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=D1+10', '=A1+100', '=B1+1000', '=E1+1000000'],
          [2, '=D2+10', '=A2+100', '=B2+1000', '=E2+1000000'],
          [3, '=D3+10', '=A3+100', '=B3+1000', '=E3+1000000'],
          [4, '=D4+10', '=A4+100', '=B4+1000', '=E4+1000000'],
          [5, '=D5+10', '=A5+100', '=B5+1000', '=E5+1000000'],
        ]);
      });

      it('[0, 1, 2] -> 2', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 1, 2], 2);
        hot.render();

        expect(getData()).toEqual([
          [1111, 1001111, 1, 11, 111],
          [1112, 1001112, 2, 12, 112],
          [1113, 1001113, 3, 13, 113],
          [1114, 1001114, 4, 14, 114],
          [1115, 1001115, 5, 15, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=C1+10', '=D1+100', '=E1+1000', '=A1+1000000'],
          [2, '=C2+10', '=D2+100', '=E2+1000', '=A2+1000000'],
          [3, '=C3+10', '=D3+100', '=E3+1000', '=A3+1000000'],
          [4, '=C4+10', '=D4+100', '=E4+1000', '=A4+1000000'],
          [5, '=C5+10', '=D5+100', '=E5+1000', '=A5+1000000'],
        ]);
      });

      it('[0, 1, 2, 3] -> 1', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 1, 2, 3], 1);
        hot.render();

        expect(getData()).toEqual([
          [1001111, 1, 11, 111, 1111],
          [1001112, 2, 12, 112, 1112],
          [1001113, 3, 13, 113, 1113],
          [1001114, 4, 14, 114, 1114],
          [1001115, 5, 15, 115, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=B1+10', '=C1+100', '=D1+1000', '=E1+1000000'],
          [2, '=B2+10', '=C2+100', '=D2+1000', '=E2+1000000'],
          [3, '=B3+10', '=C3+100', '=D3+1000', '=E3+1000000'],
          [4, '=B4+10', '=C4+100', '=D4+1000', '=E4+1000000'],
          [5, '=B5+10', '=C5+100', '=D5+1000', '=E5+1000000'],
        ]);
      });

      describe('moving mixed elements', () => {
        it('[1, 0] -> 3', () => {
          const hot = handsontable({
            data: JSON.parse(JSON.stringify(dataset)),
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([1, 0], 3);
          hot.render();

          expect(getData()).toEqual([
            [111, 1111, 1001111, 11, 1],
            [112, 1112, 1001112, 12, 2],
            [113, 1113, 1001113, 13, 3],
            [114, 1114, 1001114, 14, 4],
            [115, 1115, 1001115, 15, 5],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=E1+10', '=D1+100', '=A1+1000', '=B1+1000000'],
            [2, '=E2+10', '=D2+100', '=A2+1000', '=B2+1000000'],
            [3, '=E3+10', '=D3+100', '=A3+1000', '=B3+1000000'],
            [4, '=E4+10', '=D4+100', '=A4+1000', '=B4+1000000'],
            [5, '=E5+10', '=D5+100', '=A5+1000', '=B5+1000000'],
          ]);
        });

        it('[1, 0, 3] -> 2', () => {
          const hot = handsontable({
            data: JSON.parse(JSON.stringify(dataset)),
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([1, 0, 3], 2);
          hot.render();

          expect(getData()).toEqual([
            [111, 1001111, 11, 1, 1111],
            [112, 1001112, 12, 2, 1112],
            [113, 1001113, 13, 3, 1113],
            [114, 1001114, 14, 4, 1114],
            [115, 1001115, 15, 5, 1115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=D1+10', '=C1+100', '=A1+1000', '=E1+1000000'],
            [2, '=D2+10', '=C2+100', '=A2+1000', '=E2+1000000'],
            [3, '=D3+10', '=C3+100', '=A3+1000', '=E3+1000000'],
            [4, '=D4+10', '=C4+100', '=A4+1000', '=E4+1000000'],
            [5, '=D5+10', '=C5+100', '=A5+1000', '=E5+1000000'],
          ]);
        });

        it('[1, 0, 3, 2] -> 1', () => {
          const hot = handsontable({
            data: JSON.parse(JSON.stringify(dataset)),
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([1, 0, 3, 2], 1);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 11, 1, 1111, 111],
            [1001112, 12, 2, 1112, 112],
            [1001113, 13, 3, 1113, 113],
            [1001114, 14, 4, 1114, 114],
            [1001115, 15, 5, 1115, 115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=C1+10', '=B1+100', '=E1+1000', '=D1+1000000'],
            [2, '=C2+10', '=B2+100', '=E2+1000', '=D2+1000000'],
            [3, '=C3+10', '=B3+100', '=E3+1000', '=D3+1000000'],
            [4, '=C4+10', '=B4+100', '=E4+1000', '=D4+1000000'],
            [5, '=C5+10', '=B5+100', '=E5+1000', '=D5+1000000'],
          ]);
        });
      });
    });

    describe('should move elements from the right to the left properly', () => {
      it('[3, 4] -> 0', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([3, 4], 0);
        hot.render();

        expect(getData()).toEqual([
          [1111, 1001111, 1, 11, 111],
          [1112, 1001112, 2, 12, 112],
          [1113, 1001113, 3, 13, 113],
          [1114, 1001114, 4, 14, 114],
          [1115, 1001115, 5, 15, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=C1+10', '=D1+100', '=E1+1000', '=A1+1000000'],
          [2, '=C2+10', '=D2+100', '=E2+1000', '=A2+1000000'],
          [3, '=C3+10', '=D3+100', '=E3+1000', '=A3+1000000'],
          [4, '=C4+10', '=D4+100', '=E4+1000', '=A4+1000000'],
          [5, '=C5+10', '=D5+100', '=E5+1000', '=A5+1000000'],
        ]);
      });

      it('[3, 4] -> 1', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([3, 4], 1);
        hot.render();

        expect(getData()).toEqual([
          [1, 1111, 1001111, 11, 111],
          [2, 1112, 1001112, 12, 112],
          [3, 1113, 1001113, 13, 113],
          [4, 1114, 1001114, 14, 114],
          [5, 1115, 1001115, 15, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=D1+100', '=E1+1000', '=B1+1000000'],
          [2, '=A2+10', '=D2+100', '=E2+1000', '=B2+1000000'],
          [3, '=A3+10', '=D3+100', '=E3+1000', '=B3+1000000'],
          [4, '=A4+10', '=D4+100', '=E4+1000', '=B4+1000000'],
          [5, '=A5+10', '=D5+100', '=E5+1000', '=B5+1000000'],
        ]);
      });

      it('[3, 4] -> 2', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([3, 4], 2);
        hot.render();

        expect(getData()).toEqual([
          [1, 11, 1111, 1001111, 111],
          [2, 12, 1112, 1001112, 112],
          [3, 13, 1113, 1001113, 113],
          [4, 14, 1114, 1001114, 114],
          [5, 15, 1115, 1001115, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=B1+100', '=E1+1000', '=C1+1000000'],
          [2, '=A2+10', '=B2+100', '=E2+1000', '=C2+1000000'],
          [3, '=A3+10', '=B3+100', '=E3+1000', '=C3+1000000'],
          [4, '=A4+10', '=B4+100', '=E4+1000', '=C4+1000000'],
          [5, '=A5+10', '=B5+100', '=E5+1000', '=C5+1000000'],
        ]);
      });

      it('[2, 4] -> 0', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([2, 4], 0);
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
      });

      it('[2, 4] -> 1', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([2, 4], 1);
        hot.render();

        expect(getData()).toEqual([
          [1, 111, 1001111, 11, 1111],
          [2, 112, 1001112, 12, 1112],
          [3, 113, 1001113, 13, 1113],
          [4, 114, 1001114, 14, 1114],
          [5, 115, 1001115, 15, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=D1+100', '=B1+1000', '=E1+1000000'],
          [2, '=A2+10', '=D2+100', '=B2+1000', '=E2+1000000'],
          [3, '=A3+10', '=D3+100', '=B3+1000', '=E3+1000000'],
          [4, '=A4+10', '=D4+100', '=B4+1000', '=E4+1000000'],
          [5, '=A5+10', '=D5+100', '=B5+1000', '=E5+1000000'],
        ]);
      });

      it('[2, 4] -> 2', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([2, 4], 2);
        hot.render();

        expect(getData()).toEqual([
          [1, 11, 111, 1001111, 1111],
          [2, 12, 112, 1001112, 1112],
          [3, 13, 113, 1001113, 1113],
          [4, 14, 114, 1001114, 1114],
          [5, 15, 115, 1001115, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=B1+100', '=C1+1000', '=E1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=E2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=E3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=E4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=E5+1000000'],
        ]);
      });

      describe('moving mixed elements', () => {
        it('[4, 2] -> 0', () => {
          const hot = handsontable({
            data: JSON.parse(JSON.stringify(dataset)),
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([4, 2], 0);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 111, 1, 11, 1111],
            [1001112, 112, 2, 12, 1112],
            [1001113, 113, 3, 13, 1113],
            [1001114, 114, 4, 14, 1114],
            [1001115, 115, 5, 15, 1115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=C1+10', '=D1+100', '=B1+1000', '=E1+1000000'],
            [2, '=C2+10', '=D2+100', '=B2+1000', '=E2+1000000'],
            [3, '=C3+10', '=D3+100', '=B3+1000', '=E3+1000000'],
            [4, '=C4+10', '=D4+100', '=B4+1000', '=E4+1000000'],
            [5, '=C5+10', '=D5+100', '=B5+1000', '=E5+1000000'],
          ]);
        });

        it('[4, 3, 1] -> 0', () => {
          const hot = handsontable({
            data: JSON.parse(JSON.stringify(dataset)),
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([4, 3, 1], 0);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 1111, 11, 1, 111],
            [1001112, 1112, 12, 2, 112],
            [1001113, 1113, 13, 3, 113],
            [1001114, 1114, 14, 4, 114],
            [1001115, 1115, 15, 5, 115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=D1+10', '=C1+100', '=E1+1000', '=B1+1000000'],
            [2, '=D2+10', '=C2+100', '=E2+1000', '=B2+1000000'],
            [3, '=D3+10', '=C3+100', '=E3+1000', '=B3+1000000'],
            [4, '=D4+10', '=C4+100', '=E4+1000', '=B4+1000000'],
            [5, '=D5+10', '=C5+100', '=E5+1000', '=B5+1000000'],
          ]);
        });

        it('[4, 3, 2, 1] -> 0', () => {
          const hot = handsontable({
            data: JSON.parse(JSON.stringify(dataset)),
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([4, 3, 2, 1], 0);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 1111, 111, 11, 1],
            [1001112, 1112, 112, 12, 2],
            [1001113, 1113, 113, 13, 3],
            [1001114, 1114, 114, 14, 4],
            [1001115, 1115, 115, 15, 5],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=E1+10', '=D1+100', '=C1+1000', '=B1+1000000'],
            [2, '=E2+10', '=D2+100', '=C2+1000', '=B2+1000000'],
            [3, '=E3+10', '=D3+100', '=C3+1000', '=B3+1000000'],
            [4, '=E4+10', '=D4+100', '=C4+1000', '=B4+1000000'],
            [5, '=E5+10', '=D5+100', '=C5+1000', '=B5+1000000'],
          ]);
        });

        it('[4, 2, 3, 1] -> 0', () => {
          const hot = handsontable({
            data: JSON.parse(JSON.stringify(dataset)),
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([4, 2, 3, 1], 0);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 111, 1111, 11, 1],
            [1001112, 112, 1112, 12, 2],
            [1001113, 113, 1113, 13, 3],
            [1001114, 114, 1114, 14, 4],
            [1001115, 115, 1115, 15, 5],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=E1+10', '=D1+100', '=B1+1000', '=C1+1000000'],
            [2, '=E2+10', '=D2+100', '=B2+1000', '=C2+1000000'],
            [3, '=E3+10', '=D3+100', '=B3+1000', '=C3+1000000'],
            [4, '=E4+10', '=D4+100', '=B4+1000', '=C4+1000000'],
            [5, '=E5+10', '=D5+100', '=B5+1000', '=C5+1000000'],
          ]);
        });

        it('[0, 3, 4, 1] -> 0', () => {
          const hot = handsontable({
            data: JSON.parse(JSON.stringify(dataset)),
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([0, 3, 4, 1], 0);
          hot.render();

          expect(getData()).toEqual([
            [1, 1111, 1001111, 11, 111],
            [2, 1112, 1001112, 12, 112],
            [3, 1113, 1001113, 13, 113],
            [4, 1114, 1001114, 14, 114],
            [5, 1115, 1001115, 15, 115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=A1+10', '=D1+100', '=E1+1000', '=B1+1000000'],
            [2, '=A2+10', '=D2+100', '=E2+1000', '=B2+1000000'],
            [3, '=A3+10', '=D3+100', '=E3+1000', '=B3+1000000'],
            [4, '=A4+10', '=D4+100', '=E4+1000', '=B4+1000000'],
            [5, '=A5+10', '=D5+100', '=E5+1000', '=B5+1000000'],
          ]);
        });

        it('[5, 4, 3, 2, 1, 0] -> 0', () => {
          const hot = handsontable({
            data: [
              [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000', '=E1*0'],
              [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000', '=E2*0'],
              [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000', '=E3*0'],
              [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000', '=E4*0'],
              [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000', '=E5*0'],
            ],
            formulas: {
              engine: HyperFormula,
            },
            manualColumnMove: true,
          });

          hot.getPlugin('manualColumnMove').moveColumns([5, 4, 3, 2, 1, 0], 0);
          hot.render();

          expect(getData()).toEqual([
            [0, 1001111, 1111, 111, 11, 1],
            [0, 1001112, 1112, 112, 12, 2],
            [0, 1001113, 1113, 113, 13, 3],
            [0, 1001114, 1114, 114, 14, 4],
            [0, 1001115, 1115, 115, 15, 5],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, '=F1+10', '=E1+100', '=D1+1000', '=C1+1000000', '=B1*0'],
            [2, '=F2+10', '=E2+100', '=D2+1000', '=C2+1000000', '=B2*0'],
            [3, '=F3+10', '=E3+100', '=D3+1000', '=C3+1000000', '=B3*0'],
            [4, '=F4+10', '=E4+100', '=D4+1000', '=C4+1000000', '=B4*0'],
            [5, '=F5+10', '=E5+100', '=D5+1000', '=C5+1000000', '=B5*0'],
          ]);
        });
      });
    });

    describe('should move elements, placed on both sides, to the middle properly', () => {
      it('[2, 4] -> 3', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([2, 4], 3);
        hot.render();

        expect(getData()).toEqual([
          [1, 11, 1111, 111, 1001111],
          [2, 12, 1112, 112, 1001112],
          [3, 13, 1113, 113, 1001113],
          [4, 14, 1114, 114, 1001114],
          [5, 15, 1115, 115, 1001115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=A1+10', '=B1+100', '=D1+1000', '=C1+1000000'],
          [2, '=A2+10', '=B2+100', '=D2+1000', '=C2+1000000'],
          [3, '=A3+10', '=B3+100', '=D3+1000', '=C3+1000000'],
          [4, '=A4+10', '=B4+100', '=D4+1000', '=C4+1000000'],
          [5, '=A5+10', '=B5+100', '=D5+1000', '=C5+1000000'],
        ]);
      });

      it('[0, 3, 4] -> 1', () => {
        const hot = handsontable({
          data: JSON.parse(JSON.stringify(dataset)),
          formulas: {
            engine: HyperFormula,
          },
          manualColumnMove: true,
        });

        hot.getPlugin('manualColumnMove').moveColumns([0, 3, 4], 1);
        hot.render();

        expect(getData()).toEqual([
          [11, 1, 1111, 1001111, 111],
          [12, 2, 1112, 1001112, 112],
          [13, 3, 1113, 1001113, 113],
          [14, 4, 1114, 1001114, 114],
          [15, 5, 1115, 1001115, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, '=B1+10', '=A1+100', '=E1+1000', '=C1+1000000'],
          [2, '=B2+10', '=A2+100', '=E2+1000', '=C2+1000000'],
          [3, '=B3+10', '=A3+100', '=E3+1000', '=C3+1000000'],
          [4, '=B4+10', '=A4+100', '=E4+1000', '=C4+1000000'],
          [5, '=B5+10', '=A5+100', '=E5+1000', '=C5+1000000'],
        ]);
      });
    });

    // Covers case 1 from the comment https://github.com/handsontable/handsontable/pull/10215
    it('should work properly while moving, right after clearing a column #1', () => {
      const hot = handsontable({
        data: JSON.parse(JSON.stringify(dataset)),
        formulas: {
          engine: HyperFormula,
        },
        manualColumnMove: true,
      });

      hot.populateFromArray(0, 0, [[null]], 4, 0); // Clearing the first column.
      hot.getPlugin('manualColumnMove').moveColumns([1], 0);
      hot.render();

      hot.selectCell(0, 0);

      expect(() => {
        keyDownUp('enter');
        keyDownUp('enter');
      }).not.toThrow();
    });

    // Covers case 2 from the comment https://github.com/handsontable/handsontable/pull/10215
    it('should work properly while moving, right after clearing a column #2', () => {
      const hot = handsontable({
        data: JSON.parse(JSON.stringify(dataset)),
        formulas: {
          engine: HyperFormula,
        },
        manualColumnMove: true,
      });

      hot.populateFromArray(0, 3, [[null]], 4, 3); // Clearing the first column.
      hot.getPlugin('manualColumnMove').moveColumns([4], 3);
      hot.render();
      hot.selectCell(0, 3);

      expect(() => {
        keyDownUp('enter');
        keyDownUp('enter');
      }).not.toThrow();
    });
  });
});
