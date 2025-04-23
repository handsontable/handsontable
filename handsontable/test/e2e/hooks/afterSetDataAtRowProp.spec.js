describe('Hook', () => {
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

  describe('afterSetDataAtRowProp', () => {
    it('should be called with value and source', async() => {
      const afterSetDataAtRowProp = jasmine.createSpy('afterSetDataAtRowProp');

      handsontable({
        data: [{ a: 1, b: 2 }],
        columns: [
          { data: 'a' },
          { data: 'b' },
        ],
        afterSetDataAtRowProp,
      });

      await setDataAtRowProp(0, 'a', 'test', 'my-source');

      expect(afterSetDataAtRowProp).toHaveBeenCalledWith([[0, 'a', 1, 'test']], 'my-source');
    });

    it('should be called with normalized value when the cell is numeric cell type', async() => {
      let dataChanges = null;

      handsontable({
        data: [{ a: 1, b: 2 }],
        columns: [
          { data: 'a' },
          { data: 'b' },
        ],
        type: 'numeric',
        numericFormat: {
          pattern: '0,0.00000'
        },
        afterSetDataAtRowProp(changes) {
          dataChanges = structuredClone(changes);
        },
      });

      await setDataAtRowProp(0, 'a', '3,45');

      expect(dataChanges).toEqual([[0, 'a', 1, 3.45]]);
    });
  });
});
