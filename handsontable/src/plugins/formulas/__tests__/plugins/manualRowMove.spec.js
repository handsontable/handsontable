import HyperFormula from 'hyperformula';

const dataset = [
  [1, 2, 3, 4, 5],
  ['=A1+10', '=B1+10', '=C1+10', '=D1+10', '=E1+10'],
  ['=A2+100', '=B2+100', '=C2+100', '=D2+100', '=E2+100'],
  ['=A3+1000', '=B3+1000', '=C3+1000', '=D3+1000', '=E3+1000'],
  ['=A4+1000000', '=B4+1000000', '=C4+1000000', '=D4+1000000', '=E4+1000000'],
];

describe('Formulas', () => {
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

  describe('manualRowMove', () => {
    describe('should not move elements for some calls', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });

      it('#3', () => {
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
      });

      it('#4', () => {
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
      });
    });

    describe('should move elements from top to bottom properly', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });

      it('#3', () => {
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
      });

      it('#4', () => {
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
      });

      it('#5', () => {
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
      });

      it('#6', () => {
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
      });

      it('#7', () => {
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
      });

      it('#8', () => {
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
      });

      describe('moving mixed elements', () => {
        it('#1', () => {
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
        });

        it('#2', () => {
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
        });

        it('#3', () => {
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
        });
      });
    });

    describe('should move elements from bottom to top properly', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });

      it('#3', () => {
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
      });

      it('#4', () => {
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
      });

      it('#5', () => {
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
      });

      it('#6', () => {
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
      });

      describe('moving mixed elements', () => {
        it('#1', () => {
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
        });

        it('#2', () => {
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
        });

        it('#3', () => {
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
        });

        it('#4', () => {
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
        });

        it('#5', () => {
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
        });

        it('#6', () => {
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
        });
      });
    });

    describe('should move elements, placed on both sides, to the middle properly', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });
    });

    describe('moving elements when there are some trimmed elements', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });
    });
  });
});
