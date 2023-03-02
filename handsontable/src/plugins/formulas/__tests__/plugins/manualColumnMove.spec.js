import HyperFormula from "hyperformula";

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

  describe('manualColumnMove', () => {
    describe('should not move elements for some calls', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });

      it('#3', () => {
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
      });

      it('#4', () => {
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
      });
    });

    describe('should move elements from the left to the right properly', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });

      it('#3', () => {
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
      });

      it('#4', () => {
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
      });

      it('#5', () => {
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
      });

      it('#6', () => {
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
      });

      it('#7', () => {
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
      });

      it('#8', () => {
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
      });

      describe('moving mixed elements', () => {
        it('#1', () => {
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
        });

        it('#2', () => {
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
        });

        it('#3', () => {
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
        });
      });
    });

    describe('should move elements from the right to the left properly', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });

      it('#3', () => {
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
      });

      it('#4', () => {
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
      });

      it('#5', () => {
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
      });

      it('#6', () => {
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
      });

      describe('moving mixed elements', () => {
        it('#1', () => {
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
        });

        it('#2', () => {
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
        });

        it('#3', () => {
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
        });

        it('#4', () => {
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
        });

        it('#5', () => {
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
        });

        it('#6', () => {
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
        });
      });
    });

    describe('should move elements, placed on both sides, to the middle properly', () => {
      it('#1', () => {
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
      });

      it('#2', () => {
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
      });
    });
  });
});
