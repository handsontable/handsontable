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
    it('should be fired after the Walkontable\'s draw method call', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
      });

      spyOn(hot.view._wt, 'draw');

      const afterRender = jasmine.createSpy('afterRender');

      addHook('afterRender', afterRender);

      await render();

      expect(hot.view._wt.draw).toHaveBeenCalledBefore(afterRender);
    });

    it('should be fired as slow render path', async() => {
      const afterRender = jasmine.createSpy('afterRender');

      handsontable({
        data: createSpreadsheetData(10, 10),
        afterRender,
      });

      afterRender.calls.reset();

      await render();

      expect(afterRender).toHaveBeenCalledTimes(1);
      expect(afterRender.calls.argsFor(0)[0]).toBe(true);
    });

    it('should be fired as fast render path', async() => {
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
