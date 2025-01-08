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

  describe('afterSetDataAtCell', () => {
    it('should be called with value and source', () => {
      const afterSetDataAtCell = jasmine.createSpy('afterSetDataAtCell');

      handsontable({
        data: [[1, 2]],
        afterSetDataAtCell,
      });

      setDataAtCell(0, 0, 'test', 'my-source');

      expect(afterSetDataAtCell).toHaveBeenCalledWith([[0, 0, 1, 'test']], 'my-source');
    });

    it('should be called with normalized value when the cell is numeric cell type', () => {
      let dataChanges = null;

      handsontable({
        data: [[1, 2]],
        type: 'numeric',
        numericFormat: {
          pattern: '0,0.00000'
        },
        afterSetDataAtCell(changes) {
          dataChanges = structuredClone(changes);
        },
      });

      setDataAtCell(0, 0, '3,45');

      expect(dataChanges).toEqual([[0, 0, 1, 3.45]]);
    });
  });
});
