describe('Core.countSourceCols', function () {
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

  it('should return properly index from ', function () {
    var hot = handsontable({
      data: [['','','','','','','','','','','','','','','']],
      columns: function (column) {
        return [1, 5, 9].indexOf(column) > -1 ? {} : null;
      }
    });

    expect(hot.countSourceCols()).toBe(15);
  });
});
