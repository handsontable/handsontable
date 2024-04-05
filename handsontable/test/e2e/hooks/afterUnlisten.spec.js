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

  describe('afterUnlisten', () => {
    it('should be fired once after `unlisten` method call', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
      });
      const hot1 = handsontable({
        data: createSpreadsheetData(5, 5),
      }, false, spec().$container1);
      const hot2 = handsontable({
        data: createSpreadsheetData(5, 5),
      }, false, spec().$container2);

      const afterUnlisten = jasmine.createSpy('afterUnlisten');
      const afterUnlisten1 = jasmine.createSpy('afterUnlisten1');
      const afterUnlisten2 = jasmine.createSpy('afterUnlisten2');

      hot.addHook('afterUnlisten', afterUnlisten);
      hot1.addHook('afterUnlisten', afterUnlisten1);
      hot2.addHook('afterUnlisten', afterUnlisten2);

      hot.listen();
      hot.unlisten();
      hot.unlisten();
      hot.unlisten();

      expect(afterUnlisten).toHaveBeenCalledTimes(1);
      expect(afterUnlisten1).toHaveBeenCalledTimes(0);
      expect(afterUnlisten2).toHaveBeenCalledTimes(0);

      afterUnlisten.calls.reset();
      afterUnlisten1.calls.reset();
      afterUnlisten2.calls.reset();

      hot1.listen();
      hot1.unlisten();
      hot1.unlisten();
      hot1.unlisten();

      expect(afterUnlisten).toHaveBeenCalledTimes(0);
      expect(afterUnlisten1).toHaveBeenCalledTimes(1);
      expect(afterUnlisten2).toHaveBeenCalledTimes(0);

      afterUnlisten.calls.reset();
      afterUnlisten1.calls.reset();
      afterUnlisten2.calls.reset();

      hot2.listen();
      hot2.unlisten();
      hot2.unlisten();
      hot2.unlisten();

      expect(afterUnlisten).toHaveBeenCalledTimes(0);
      expect(afterUnlisten1).toHaveBeenCalledTimes(0);
      expect(afterUnlisten2).toHaveBeenCalledTimes(1);
    });

    it('should be fired once after the element that is not belong to the root element is clicked', () => {
      const afterUnlisten = jasmine.createSpy('afterUnlisten');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterUnlisten,
      }, true);
      listen();
      simulateClick(document.body);

      expect(afterUnlisten).toHaveBeenCalled();

      listen();
      simulateClick(document.querySelector('.hot-display-license-info'));

      expect(afterUnlisten).toHaveBeenCalled();
    });
  });
});
