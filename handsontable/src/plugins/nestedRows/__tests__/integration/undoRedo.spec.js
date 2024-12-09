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

  describe('working with UndoRedo plugin', () => {
    it('should properly undo remove of the child row', () => {
      handsontable({
        data: [
          {
            col1: 'A1',
            __children: [{ col1: 'A1.1' }],
          },
        ],
        nestedRows: true,
      });

      alter('remove_row', 1);
      getPlugin('undoRedo').undo();

      expect(getDataAtCell(1, 0)).toBe('A1.1');
    });
  });
});
