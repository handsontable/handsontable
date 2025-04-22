describe('ContextMenu', () => {
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

  describe('Redo', () => {
    it('should redo the last action using the Context Menu option', () => {
      handsontable({
        data: [
          ['']
        ],
        contextMenu: true
      });

      setDataAtCell(0, 0, 'test');

      expect(getDataAtCell(0, 0)).toEqual('test');

      getPlugin('undoRedo').undo();

      contextMenu(getCell(0, 0, true));

      const warnSpy = spyOn(console, 'warn');

      selectContextMenuOption('Redo');

      expect(getDataAtCell(0, 0)).toEqual('test');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
