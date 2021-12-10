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

  describe('afterRender', () => {
    it('should be fired after the Walkontable\'s draw method call', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
      });

      spyOn(hot.view.wt, 'draw');

      const afterRender = jasmine.createSpy('afterRender');

      addHook('afterRender', afterRender);

      render();

      expect(hot.view.wt.draw).toHaveBeenCalledBefore(afterRender);
    });

    it('should be fired as slow render path', () => {
      const afterRender = jasmine.createSpy('afterRender');

      handsontable({
        data: createSpreadsheetData(10, 10),
        afterRender,
      });

      afterRender.calls.reset();

      render();

      expect(afterRender).toHaveBeenCalledTimes(1);
      expect(afterRender.calls.argsFor(0)[0]).toBe(true);
    });

    it('should be fired as fast render path', () => {
      const afterRender = jasmine.createSpy('afterRender');
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
        afterRender,
      });

      afterRender.calls.reset();

      hot.view.render();

      expect(afterRender).toHaveBeenCalledTimes(1);
      expect(afterRender.calls.argsFor(0)[0]).toBe(false);
    });
  });
});
