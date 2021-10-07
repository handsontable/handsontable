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

  describe('afterViewRender', () => {
    it('should be fired at the end of the Walkontable\'s draw method call (only on slow render path)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(100, 100),
        width: 100,
        height: 100,
      });

      const afterViewRender = jasmine.createSpy('afterViewRender');
      const beforeViewRender = jasmine.createSpy('beforeViewRender');

      addHook('afterViewRender', afterViewRender);
      addHook('beforeViewRender', beforeViewRender);

      hot.view.wt.draw(false);

      expect(afterViewRender).toHaveBeenCalledTimes(1);
      expect(beforeViewRender).toHaveBeenCalledBefore(afterViewRender);

      hot.view.wt.draw(true);

      expect(afterViewRender).toHaveBeenCalledTimes(1);
      expect(beforeViewRender).toHaveBeenCalledTimes(1);

      hot.view.wt.draw(false);

      expect(afterViewRender).toHaveBeenCalledTimes(2);
    });
  });
});
