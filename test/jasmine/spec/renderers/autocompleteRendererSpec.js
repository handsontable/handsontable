describe('AutocompleteRenderer', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should contain down arrow glyph', function () {

    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      type: 'autocomplete',
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 2, 'string');

    waitsFor(function () {
      return onAfterValidate.calls.length > 0;
    }, 'Cell validation', 1000);

    runs(function () {
      var html = getCell(2, 2).innerHTML;
      expect(html).toContain('string');
      expect(html).toContain('\u25BC');
    });

  });

  it("should open cell editor after clicking on arrow glyph", function () {

    var hot = handsontable({
      type: 'autocomplete'
    });

    selectCell(0, 0);


    expect(hot.getActiveEditor().isOpened()).toBe(false);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    expect(hot.getActiveEditor().isOpened()).toBe(true);

  });

  it("should open cell editor after clicking on arrow glyph, after the table has been destroyed and reinitialized (#1367)", function () {
    var hot = handsontable({
      type: 'autocomplete'
    });

    destroy();

    hot = handsontable({
      type: 'autocomplete'
    });

    selectCell(0, 0);


    expect(hot.getActiveEditor().isOpened()).toBe(false);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
  });


});
