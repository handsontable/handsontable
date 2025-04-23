describe('settings', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  describe('viewportRowRenderingThreshold', () => {
    it('should be possible to change the threshold in the rendering engine', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        width: 100,
        height: 100,
      });

      expect(tableView()._wt.getSetting('viewportRowRenderingThreshold')).toBe(0);

      await updateSettings({ viewportRowRenderingThreshold: 5 });

      expect(tableView()._wt.getSetting('viewportRowRenderingThreshold')).toBe(5);
    });
  });
});
