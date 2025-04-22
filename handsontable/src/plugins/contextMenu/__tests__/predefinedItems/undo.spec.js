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

  describe('Undo', () => {
    it('should undo the last action using the Context Menu option', () => {
      handsontable({
        data: [
          ['']
        ],
        contextMenu: true
      });

      setDataAtCell(0, 0, 'test');

      expect(getDataAtCell(0, 0)).toEqual('test');

      contextMenu(getCell(0, 0, true));

      const warnSpy = spyOn(console, 'warn');

      selectContextMenuOption('Undo');

      expect(getDataAtCell(0, 0)).toEqual('');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
