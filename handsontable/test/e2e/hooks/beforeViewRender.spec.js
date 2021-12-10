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

  describe('beforeViewRender', () => {
    it('should be fired right after the Walkontable\'s draw method call (only on slow render path)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(100, 100),
        width: 100,
        height: 100,
      });

      const beforeViewRender = jasmine.createSpy('beforeViewRender');
      const afterViewRender = jasmine.createSpy('afterViewRender');

      addHook('beforeViewRender', beforeViewRender);
      addHook('afterViewRender', afterViewRender);

      hot.view.wt.draw(false);

      expect(beforeViewRender).toHaveBeenCalledTimes(1);
      expect(beforeViewRender).toHaveBeenCalledBefore(afterViewRender);

      hot.view.wt.draw(true);

      expect(beforeViewRender).toHaveBeenCalledTimes(1);
      expect(afterViewRender).toHaveBeenCalledTimes(1);

      hot.view.wt.draw(false);

      expect(beforeViewRender).toHaveBeenCalledTimes(2);
    });
  });
});
