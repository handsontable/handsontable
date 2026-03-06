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

  describe('`close()` method', () => {
    it('should close the context menu', async() => {
      handsontable({
        contextMenu: true,
      });

      await selectCell(0, 0);
      await contextMenu();

      expect($(document.body).find('.htContextMenu:visible').length).toBe(1);

      getPlugin('contextMenu').close();

      expect($(document.body).find('.htContextMenu:visible').length).toBe(0);
    });
  });
});
