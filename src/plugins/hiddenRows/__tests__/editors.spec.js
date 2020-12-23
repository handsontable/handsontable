describe('HiddenRows', () => {
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

  describe('editors', () => {
    it('should properly detect if editor is in a viewport', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        hiddenRows: {
          rows: [0, 1, 2, 3, 4, 5],
        },
        width: 250,
        height: 250,
        rowHeights: 50,
      });

      selectCell(6, 0);

      const $mainHolder = spec().$container.find('.ht_master .wtHolder');
      const startScrollTop = $mainHolder.scrollTop();

      keyDownUp('enter');

      await sleep(200);

      expect($mainHolder.scrollTop()).toBe(startScrollTop);
    });
  });
});
