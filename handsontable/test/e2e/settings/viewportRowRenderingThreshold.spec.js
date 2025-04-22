describe('settings', () => {
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

  describe('viewportRowRenderingThreshold', () => {
    it('should be possible to change the threshold in the rendering engine', () => {
      const hot = handsontable({
        data: createSpreadsheetData(50, 50),
        width: 100,
        height: 100,
      });

      expect(hot.view._wt.getSetting('viewportRowRenderingThreshold')).toBe(0);

      updateSettings({ viewportRowRenderingThreshold: 5 });

      expect(hot.view._wt.getSetting('viewportRowRenderingThreshold')).toBe(5);
    });
  });
});
