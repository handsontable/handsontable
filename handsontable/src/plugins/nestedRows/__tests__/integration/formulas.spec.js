import { HyperFormula } from 'hyperformula';

describe('NestedRows', () => {
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

  describe('working with Formulas plugin', () => {
    it('should process formula in a child row', () => {
      handsontable({
        data: [
          {
            col1: null,
            __children: [{ col1: '=SUM(2+2)' }],
          },
        ],
        nestedRows: true,
        formulas: {
          engine: HyperFormula
        },
      });

      expect(getDataAtCell(1, 0)).toBe(4);
    });
  });
});
