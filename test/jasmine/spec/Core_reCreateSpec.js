describe('Core_reCreate', function () {
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

  it('should correctly re-render corner header when there is multiline content', function () {
    var settings = {
      rowHeaders: true,
      colHeaders: function (col) {
        return 'Column<br>' + col;
      }
    };
    handsontable(settings);
    destroy();
    handsontable(settings);

    expect(getCornerClone().width()).toBe(54);
    expect(getCornerClone().height()).toBe(51);
  });
});
