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

  describe('beforeRender', () => {
    it('should be fired before the Walkontable\'s draw method call', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
      });

      spyOn(hot.view.wt, 'draw');

      const beforeRender = jasmine.createSpy('beforeRender');

      addHook('beforeRender', beforeRender);

      render();

      expect(beforeRender).toHaveBeenCalledBefore(hot.view.wt.draw);
    });

    it('should be fired as slow render path', () => {
      const beforeRender = jasmine.createSpy('beforeRender');

      handsontable({
        data: createSpreadsheetData(10, 10),
        beforeRender,
      });

      beforeRender.calls.reset();

      render();

      expect(beforeRender).toHaveBeenCalledTimes(1);
      expect(beforeRender.calls.argsFor(0)[0]).toBe(true);
    });

    it('should be fired as fast render path', () => {
      const beforeRender = jasmine.createSpy('beforeRender');
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
        beforeRender,
      });

      beforeRender.calls.reset();

      hot.view.render();

      expect(beforeRender).toHaveBeenCalledTimes(1);
      expect(beforeRender.calls.argsFor(0)[0]).toBe(false);
    });
  });
});
