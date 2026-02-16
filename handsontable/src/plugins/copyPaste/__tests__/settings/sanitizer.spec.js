describe('CopyPaste', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    // Installing spy stabilizes the tests. Without that on CI and real browser there are some
    // differences in results.
    spyOn(document, 'execCommand');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`sanitizer` setting', () => {
    it('should be called with proper arguments before the value is pasted', async() => {
      const sanitizer = jasmine.createSpy('sanitizer');

      handsontable({
        copyPaste: true,
        sanitizer,
      });

      const clipboardEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', '<div>test</div>');

      await selectCell(0, 0);

      plugin.onPaste(clipboardEvent);

      expect(sanitizer).toHaveBeenCalledWith('<div>test</div>', 'CopyPaste.paste');
    });
  });
});
