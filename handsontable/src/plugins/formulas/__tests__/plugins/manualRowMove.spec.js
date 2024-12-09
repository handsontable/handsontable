import HyperFormula from 'hyperformula';

describe('Formulas', () => {
  const dataset = [
    [1, 2, 3, 4, 5],
    ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
    ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
    ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
    ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
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

  describe('manualRowMove', () => {
    describe('should not move elements for some calls', () => {
      it('[0, 1] -> 0', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1], 0);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
          ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
        ]);
      });

      it('[3, 4] -> 3', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([3, 4], 3);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
          ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
        ]);
      });

      it('[1, 2, 3, 4] -> 1', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([1, 2, 3, 4], 1);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
          ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
        ]);
      });

      it('[0, 1, 2, 3, 4] -> 0', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1, 2, 3, 4], 0);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
          ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
        ]);
      });
    });

    describe('should move elements from top to bottom properly', () => {
      it('[0, 1] -> 1', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1], 1);
        hot.render();

        expect(getData()).toEqual([
          [111, 112, 113, 114, 115],
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A2+10', '=B2+10', '=C2+10', '=D2+10', '=E2+10'],
          ['=A3+100', '=B3+100', '=C3+100', '=D3+100', '=E3+100'],
          ['=A1+1000', '=B1+1000', '=C1+1000', '=D1+1000', '=E1+1000'],
          ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
        ]);
      });

      it('[0, 1] -> 2', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1], 2);
        hot.render();

        expect(getData()).toEqual([
          [111, 112, 113, 114, 115],
          [1111, 1112, 1113, 1114, 1115],
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
          ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
          ['=A1+1000', '=B1+1000', '=C1+1000', '=D1+1000', '=E1+1000'],
          ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
        ]);
      });

      it('[0, 1] -> 3', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1], 3);
        hot.render();

        expect(getData()).toEqual([
          [111, 112, 113, 114, 115],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A4+10', '=B4+10', '=C4+10', '=D4+10', '=E4+10'],
          ['=A5+100', '=B5+100', '=C5+100', '=D5+100', '=E5+100'],
          ['=A1+1000', '=B1+1000', '=C1+1000', '=D1+1000', '=E1+1000'],
          ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
        ]);
      });

      it('[0, 2] -> 2', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 2], 2);
        hot.render();

        expect(getData()).toEqual([
          [11, 12, 13, 14, 15],
          [1111, 1112, 1113, 1114, 1115],
          [1, 2, 3, 4, 5],
          [111, 112, 113, 114, 115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
          ['=A1+100', '=B1+100', '=C1+100', '=D1+100', '=E1+100'],
          ['=A4+1000', '=B4+1000', '=C4+1000', '=D4+1000', '=E4+1000'],
          ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
        ]);
      });

      it('[0, 2] -> 3', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 2], 3);
        hot.render();

        expect(getData()).toEqual([
          [11, 12, 13, 14, 15],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1, 2, 3, 4, 5],
          [111, 112, 113, 114, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A4+10', '=B4+10', '=C4+10', '=D4+10', '=E4+10'],
          ['=A1+100', '=B1+100', '=C1+100', '=D1+100', '=E1+100'],
          ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
          ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
        ]);
      });

      it('[0, 3] -> 3', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 3], 3);
        hot.render();

        expect(getData()).toEqual([
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1, 2, 3, 4, 5],
          [1111, 1112, 1113, 1114, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A4+10', '=B4+10', '=C4+10', '=D4+10', '=E4+10'],
          ['=A1+100', '=B1+100', '=C1+100', '=D1+100', '=E1+100'],
          ['=A2+1000', '=B2+1000', '=C2+1000', '=D2+1000', '=E2+1000'],
          ['=A5+1000000', '=B5+1000000', '=C5+1000000', '=D5+1000000', '=E5+1000000'],
        ]);
      });

      it('[0, 1, 2] -> 2', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1, 2], 2);
        hot.render();

        expect(getData()).toEqual([
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
          ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
          ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
          ['=A1+1000000', '=B1+1000000', '=C1+1000000', '=D1+1000000', '=E1+1000000'],
        ]);
      });

      it('[0, 1, 2, 3] -> 1', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1, 2, 3], 1);
        hot.render();

        expect(getData()).toEqual([
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
          [1111, 1112, 1113, 1114, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A2+10', '=B2+10', '=C2+10', '=D2+10', '=E2+10'],
          ['=A3+100', '=B3+100', '=C3+100', '=D3+100', '=E3+100'],
          ['=A4+1000', '=B4+1000', '=C4+1000', '=D4+1000', '=E4+1000'],
          ['=A5+1000000', '=B5+1000000', '=C5+1000000', '=D5+1000000', '=E5+1000000'],
        ]);
      });

      describe('moving mixed elements', () => {
        it('[1, 0] -> 3', () => {
          const hot = handsontable({
            data: dataset,
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([1, 0], 3);
          hot.render();

          expect(getData()).toEqual([
            [111, 112, 113, 114, 115],
            [1111, 1112, 1113, 1114, 1115],
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [11, 12, 13, 14, 15],
            [1, 2, 3, 4, 5],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A5+10', '=B5+10', '=C5+10', '=D5+10', '=E5+10'],
            ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
            ['=A1+1000', '=B1+1000', '=C1+1000', '=D1+1000', '=E1+1000'],
            ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
          ]);
        });

        it('[1, 0, 3] -> 2', () => {
          const hot = handsontable({
            data: dataset,
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([1, 0, 3], 2);
          hot.render();

          expect(getData()).toEqual([
            [111, 112, 113, 114, 115],
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [11, 12, 13, 14, 15],
            [1, 2, 3, 4, 5],
            [1111, 1112, 1113, 1114, 1115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A4+10', '=B4+10', '=C4+10', '=D4+10', '=E4+10'],
            ['=A3+100', '=B3+100', '=C3+100', '=D3+100', '=E3+100'],
            ['=A1+1000', '=B1+1000', '=C1+1000', '=D1+1000', '=E1+1000'],
            ['=A5+1000000', '=B5+1000000', '=C5+1000000', '=D5+1000000', '=E5+1000000'],
          ]);
        });

        it('[1, 0, 3, 2] -> 1', () => {
          const hot = handsontable({
            data: dataset,
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([1, 0, 3, 2], 1);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [11, 12, 13, 14, 15],
            [1, 2, 3, 4, 5],
            [1111, 1112, 1113, 1114, 1115],
            [111, 112, 113, 114, 115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
            ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
            ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
            ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
          ]);
        });
      });
    });

    describe('should move elements from bottom to top properly', () => {
      it('[3, 4] -> 0', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
        hot.render();

        expect(getData()).toEqual([
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
          ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
          ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
          ['=A1+1000000', '=B1+1000000', '=C1+1000000', '=D1+1000000', '=E1+1000000'],
        ]);
      });

      it('[3, 4] -> 1', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([3, 4], 1);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
          ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
          ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
        ]);
      });

      it('[3, 4] -> 2', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([3, 4], 2);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [111, 112, 113, 114, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
          ['=A3+1000000', '=B3+1000000', '=C3+1000000', '=D3+1000000', '=E3+1000000'],
        ]);
      });

      it('[2, 4] -> 0', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([2, 4], 0);
        hot.render();

        expect(getData()).toEqual([
          [111, 112, 113, 114, 115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [1111, 1112, 1113, 1114, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
          ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
          ['=A1+1000', '=B1+1000', '=C1+1000', '=D1+1000', '=E1+1000'],
          ['=A5+1000000', '=B5+1000000', '=C5+1000000', '=D5+1000000', '=E5+1000000'],
        ]);
      });

      it('[2, 4] -> 1', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([2, 4], 1);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [111, 112, 113, 114, 115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [11, 12, 13, 14, 15],
          [1111, 1112, 1113, 1114, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
          ['=A2+1000', '=B2+1000', '=C2+1000', '=D2+1000', '=E2+1000'],
          ['=A5+1000000', '=B5+1000000', '=C5+1000000', '=D5+1000000', '=E5+1000000'],
        ]);
      });

      it('[2, 4] -> 2', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([2, 4], 2);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [111, 112, 113, 114, 115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1111, 1112, 1113, 1114, 1115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
          ['=A5+1000000', '=B5+1000000', '=C5+1000000', '=D5+1000000', '=E5+1000000'],
        ]);
      });

      describe('moving mixed elements', () => {
        it('[4, 2] -> 0', () => {
          const hot = handsontable({
            data: dataset,
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([4, 2], 0);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [111, 112, 113, 114, 115],
            [1, 2, 3, 4, 5],
            [11, 12, 13, 14, 15],
            [1111, 1112, 1113, 1114, 1115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
            ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
            ['=A2+1000', '=B2+1000', '=C2+1000', '=D2+1000', '=E2+1000'],
            ['=A5+1000000', '=B5+1000000', '=C5+1000000', '=D5+1000000', '=E5+1000000'],
          ]);
        });

        it('[4, 3, 1] -> 0', () => {
          const hot = handsontable({
            data: dataset,
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([4, 3, 1], 0);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [1111, 1112, 1113, 1114, 1115],
            [11, 12, 13, 14, 15],
            [1, 2, 3, 4, 5],
            [111, 112, 113, 114, 115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A4+10', '=B4+10', '=C4+10', '=D4+10', '=E4+10'],
            ['=A3+100', '=B3+100', '=C3+100', '=D3+100', '=E3+100'],
            ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
            ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
          ]);
        });

        it('[4, 3, 2, 1] -> 0', () => {
          const hot = handsontable({
            data: dataset,
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([4, 3, 2, 1], 0);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [1111, 1112, 1113, 1114, 1115],
            [111, 112, 113, 114, 115],
            [11, 12, 13, 14, 15],
            [1, 2, 3, 4, 5],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A5+10', '=B5+10', '=C5+10', '=D5+10', '=E5+10'],
            ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
            ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
            ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
          ]);
        });

        it('[4, 2, 3, 1] -> 0', () => {
          const hot = handsontable({
            data: dataset,
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([4, 2, 3, 1], 0);
          hot.render();

          expect(getData()).toEqual([
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [111, 112, 113, 114, 115],
            [1111, 1112, 1113, 1114, 1115],
            [11, 12, 13, 14, 15],
            [1, 2, 3, 4, 5],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A5+10', '=B5+10', '=C5+10', '=D5+10', '=E5+10'],
            ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
            ['=A2+1000', '=B2+1000', '=C2+1000', '=D2+1000', '=E2+1000'],
            ['=A3+1000000', '=B3+1000000', '=C3+1000000', '=D3+1000000', '=E3+1000000'],
          ]);
        });

        it('[0, 3, 4, 1] -> 0', () => {
          const hot = handsontable({
            data: dataset,
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([0, 3, 4, 1], 0);
          hot.render();

          expect(getData()).toEqual([
            [1, 2, 3, 4, 5],
            [1111, 1112, 1113, 1114, 1115],
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [11, 12, 13, 14, 15],
            [111, 112, 113, 114, 115],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
            ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
            ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
            ['=A2+1000000', '=B2+1000000', '=C2+1000000', '=D2+1000000', '=E2+1000000'],
          ]);
        });

        it('[5, 4, 3, 2, 1, 0] -> 0', () => {
          const hot = handsontable({
            data: [
              [1, 2, 3, 4, 5],
              ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
              ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
              ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
              ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
              ['=A5*0', '=B5*0', '=C5*0', '=D5*0', '=E5*0'],
            ],
            formulas: {
              engine: HyperFormula,
            },
            manualRowMove: true,
          });

          hot.getPlugin('manualRowMove').moveRows([5, 4, 3, 2, 1, 0], 0);
          hot.render();

          expect(getData()).toEqual([
            [0, 0, 0, 0, 0],
            [1001111, 1001112, 1001113, 1001114, 1001115],
            [1111, 1112, 1113, 1114, 1115],
            [111, 112, 113, 114, 115],
            [11, 12, 13, 14, 15],
            [1, 2, 3, 4, 5],
          ]);

          // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
          // (the same as at the start).
          expect(getSourceData()).toEqual([
            [1, 2, 3, 4, 5],
            ['=A6+10', '=B6+10', '=C6+10', '=D6+10', '=E6+10'],
            ['=A5+100', '=B5+100', '=C5+100', '=D5+100', '=E5+100'],
            ['=A4+1000', '=B4+1000', '=C4+1000', '=D4+1000', '=E4+1000'],
            ['=A3+1000000', '=B3+1000000', '=C3+1000000', '=D3+1000000', '=E3+1000000'],
            ['=A2*0', '=B2*0', '=C2*0', '=D2*0', '=E2*0'],
          ]);
        });
      });
    });

    describe('should move elements, placed on both sides, to the middle properly', () => {
      it('[2, 4] -> 3', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([2, 4], 3);
        hot.render();

        expect(getData()).toEqual([
          [1, 2, 3, 4, 5],
          [11, 12, 13, 14, 15],
          [1111, 1112, 1113, 1114, 1115],
          [111, 112, 113, 114, 115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A4+1000', '=B4+1000', '=C4+1000', '=D4+1000', '=E4+1000'],
          ['=A3+1000000', '=B3+1000000', '=C3+1000000', '=D3+1000000', '=E3+1000000'],
        ]);
      });

      it('[0, 3, 4] -> 1', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 3, 4], 1);
        hot.render();

        expect(getData()).toEqual([
          [11, 12, 13, 14, 15],
          [1, 2, 3, 4, 5],
          [1111, 1112, 1113, 1114, 1115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [111, 112, 113, 114, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5],
          ['=A2+10', '=B2+10', '=C2+10', '=D2+10', '=E2+10'],
          ['=A1+100', '=B1+100', '=C1+100', '=D1+100', '=E1+100'],
          ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
          ['=A3+1000000', '=B3+1000000', '=C3+1000000', '=D3+1000000', '=E3+1000000'],
        ]);
      });
    });

    describe('moving elements when there are some trimmed elements', () => {
      it('[0] -> 1 (trimmed [0, 1])', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
          trimRows: [0, 1]
        });

        hot.getPlugin('manualRowMove').moveRows([0], 1);
        hot.render();

        expect(getData()).toEqual([
          [1111, 1112, 1113, 1114, 1115],
          [111, 112, 113, 114, 115],
          [1001111, 1001112, 1001113, 1001114, 1001115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5], // Trimmed element
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'], // Trimmed element, creating formulas indexing also trimmed elements
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A4+1000', '=B4+1000', '=C4+1000', '=D4+1000', '=E4+1000'],
          ['=A3+1000000', '=B3+1000000', '=C3+1000000', '=D3+1000000', '=E3+1000000'],
        ]);
      });

      it('[2, 1] -> 0 (trimmed [0, 1])', () => {
        const hot = handsontable({
          data: dataset,
          formulas: {
            engine: HyperFormula,
          },
          manualRowMove: true,
          trimRows: [0, 1]
        });

        hot.getPlugin('manualRowMove').moveRows([2, 1], 0);
        hot.render();

        expect(getData()).toEqual([
          [1001111, 1001112, 1001113, 1001114, 1001115],
          [1111, 1112, 1113, 1114, 1115],
          [111, 112, 113, 114, 115],
        ]);

        // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
        // (the same as at the start).
        expect(getSourceData()).toEqual([
          [1, 2, 3, 4, 5], // Trimmed element
          ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'], // Trimmed element, creating formulas indexing also trimmed elements
          ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
          ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
          ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
        ]);
      });
    });

    it('should cooperate with UndoRedo properly', () => {
      const hot = handsontable({
        data: dataset,
        formulas: {
          engine: HyperFormula,
        },
        manualRowMove: true,
      });

      hot.getPlugin('manualRowMove').moveRows([0, 1, 2], 2);
      hot.render();

      getPlugin('undoRedo').undo();

      expect(getData()).toEqual([
        [1, 2, 3, 4, 5],
        [11, 12, 13, 14, 15],
        [111, 112, 113, 114, 115],
        [1111, 1112, 1113, 1114, 1115],
        [1001111, 1001112, 1001113, 1001114, 1001115],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, 2, 3, 4, 5],
        ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
        ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
        ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
        ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
      ]);

      hot.getPlugin('undoRedo').redo();

      expect(getData()).toEqual([
        [1111, 1112, 1113, 1114, 1115],
        [1001111, 1001112, 1001113, 1001114, 1001115],
        [1, 2, 3, 4, 5],
        [11, 12, 13, 14, 15],
        [111, 112, 113, 114, 115],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, 2, 3, 4, 5],
        ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
        ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
        ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
        ['=A1+1000000', '=B1+1000000', '=C1+1000000', '=D1+1000000', '=E1+1000000'],
      ]);

      getPlugin('undoRedo').undo();

      expect(getData()).toEqual([
        [1, 2, 3, 4, 5],
        [11, 12, 13, 14, 15],
        [111, 112, 113, 114, 115],
        [1111, 1112, 1113, 1114, 1115],
        [1001111, 1001112, 1001113, 1001114, 1001115],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, 2, 3, 4, 5],
        ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
        ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
        ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
        ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
      ]);

      hot.getPlugin('undoRedo').redo();

      expect(getData()).toEqual([
        [1111, 1112, 1113, 1114, 1115],
        [1001111, 1001112, 1001113, 1001114, 1001115],
        [1, 2, 3, 4, 5],
        [11, 12, 13, 14, 15],
        [111, 112, 113, 114, 115],
      ]);

      // Currently chosen approach, please keep in mind that it could be changed to represent pure source data
      // (the same as at the start).
      expect(getSourceData()).toEqual([
        [1, 2, 3, 4, 5],
        ['=A3+10', '=B3+10', '=C3+10', '=D3+10', '=E3+10'],
        ['=A4+100', '=B4+100', '=C4+100', '=D4+100', '=E4+100'],
        ['=A5+1000', '=B5+1000', '=C5+1000', '=D5+1000', '=E5+1000'],
        ['=A1+1000000', '=B1+1000000', '=C1+1000000', '=D1+1000000', '=E1+1000000'],
      ]);
    });
  });
});
