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
    handsontable({
      type: 'autocomplete'
    });
    setDataAtCell(2, 2, 'string');

    var html = getCell(2, 2).innerHTML;
    expect(html).toContain('string');
    expect(html).toContain('\u25BC');
  });
});