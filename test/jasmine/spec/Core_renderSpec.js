describe('Core_render', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('all cells should get green background', function () {
    function greenCell(instance, td, row, col, prop, value, rendererOptions) {
      Handsontable.TextRenderer.apply(this, arguments);
      td.style.backgroundColor = "green";

    }

    handsontable({
      data: [
        ["a", "b"],
        ["c", "d"]
      ],
      startCols: 4,
      startRows: 4,
      minSpareRows: 4,
      minSpareCols: 4,
      renderers: function () {
        return greenCell;
      }
    });

    var $tds = this.$container.find('.htCore tbody td');
    $tds.each(function () {
      expect(this.style.backgroundColor).toEqual('green');
    });
  });
});