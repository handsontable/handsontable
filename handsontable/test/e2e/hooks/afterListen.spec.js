describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
    this.$container1 = $('<div id="testContainer1"></div>').appendTo('body');
    this.$container2 = $('<div id="testContainer2"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
    this.$container1.data('handsontable')?.destroy();
    this.$container1.remove();
    this.$container2.data('handsontable')?.destroy();
    this.$container2.remove();
  });

  describe('afterListen', () => {
    it('should be fired once after `listen` method call', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
      });
      const hot1 = handsontable({
        data: createSpreadsheetData(5, 5),
      }, false, spec().$container1);
      const hot2 = handsontable({
        data: createSpreadsheetData(5, 5),
      }, false, spec().$container2);

      const afterListen = jasmine.createSpy('afterListen');
      const afterListen1 = jasmine.createSpy('afterListen1');
      const afterListen2 = jasmine.createSpy('afterListen2');

      hot.addHook('afterListen', afterListen);
      hot1.addHook('afterListen', afterListen1);
      hot2.addHook('afterListen', afterListen2);

      hot.listen();
      hot.listen();
      hot.listen();

      expect(afterListen).toHaveBeenCalledTimes(1);
      expect(afterListen1).toHaveBeenCalledTimes(0);
      expect(afterListen2).toHaveBeenCalledTimes(0);

      afterListen.calls.reset();
      afterListen1.calls.reset();
      afterListen2.calls.reset();

      hot1.listen();
      hot1.listen();
      hot1.listen();

      expect(afterListen).toHaveBeenCalledTimes(0);
      expect(afterListen1).toHaveBeenCalledTimes(1);
      expect(afterListen2).toHaveBeenCalledTimes(0);

      afterListen.calls.reset();
      afterListen1.calls.reset();
      afterListen2.calls.reset();

      hot2.listen();
      hot2.listen();
      hot2.listen();

      expect(afterListen).toHaveBeenCalledTimes(0);
      expect(afterListen1).toHaveBeenCalledTimes(0);
      expect(afterListen2).toHaveBeenCalledTimes(1);
    });
  });
});
