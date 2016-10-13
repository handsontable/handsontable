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

  it('should contain down arrow glyph', function (done) {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      type: 'autocomplete',
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 2, 'string');

    setTimeout(function () {
      var html = getCell(2, 2).innerHTML;
      
      expect(html).toContain('string');
      expect(html).toContain('\u25BC');
      done();
    }, 100);
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
