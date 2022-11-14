describe('CopyPaste', () => {
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

  describe('`columnsLimit` setting', () => {
    it('should be set to `Infinity` by default', () => {
      handsontable({
        copyPaste: true
      });

      expect(getPlugin('CopyPaste').columnsLimit).toBe(Infinity);
    });

    it('should be the same as limit provided in the settings', () => {
      handsontable({
        copyPaste: {
          columnsLimit: 100,
        }
      });

      expect(getPlugin('CopyPaste').columnsLimit).toBe(100);
    });
  });
});
