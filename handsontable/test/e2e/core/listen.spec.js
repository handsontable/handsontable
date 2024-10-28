describe('Core.listen', () => {
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

  it('should make the table active', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    expect(isListening()).toBe(false);

    listen();

    expect(isListening()).toBe(true);
  });

  it('should be possible to make active only one instance at a time', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });
    const hot1 = handsontable({
      data: createSpreadsheetData(5, 5),
    }, false, spec().$container1);
    const hot2 = handsontable({
      data: createSpreadsheetData(5, 5),
    }, false, spec().$container2);

    expect(hot.isListening()).toBe(false);
    expect(hot1.isListening()).toBe(false);
    expect(hot2.isListening()).toBe(false);

    hot.listen();

    expect(hot.isListening()).toBe(true);
    expect(hot1.isListening()).toBe(false);
    expect(hot2.isListening()).toBe(false);

    hot1.listen();

    expect(hot.isListening()).toBe(false);
    expect(hot1.isListening()).toBe(true);
    expect(hot2.isListening()).toBe(false);

    hot2.listen();

    expect(hot.isListening()).toBe(false);
    expect(hot1.isListening()).toBe(false);
    expect(hot2.isListening()).toBe(true);
  });

  it('should call `unlisten` method on a different instance than the one being activated', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });
    const hot1 = handsontable({
      data: createSpreadsheetData(5, 5),
    }, false, spec().$container1);

    hot1.listen();

    spyOn(hot, 'unlisten').and.callThrough();
    spyOn(hot1, 'unlisten').and.callThrough();

    hot.listen();

    expect(hot.unlisten).toHaveBeenCalledTimes(0);
    expect(hot1.unlisten).toHaveBeenCalledTimes(1);
  });
});
