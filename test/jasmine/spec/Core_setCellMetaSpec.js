describe('Core_setCellMeta', function () {
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

  it('should set correct meta className for cell', function () {

    var className = "htCenter htMiddle";

    handsontable({
      afterCellMetaReset: function() {
        this.setCellMeta(0, 0, "className", className );
      }
    });

    var cellMeta = getCellMeta(0,0);

    expect(cellMeta.className).not.toBeUndefined();
    expect(cellMeta.className).toEqual(className);
  });

  it('should call afterSetCellMeta plugin hook', function () {
    var className = "htCenter htMiddle";
    var res = {};

    handsontable({
      afterCellMetaReset: function () {
        this.setCellMeta(0, 1, "className", className);
      },
      afterSetCellMeta: function (row, col, key, val) {
        res.row = row;
        res.col = col;
        res.key = key;
        res.val = val;
      }
    });

    expect(res.row).toEqual(0);
    expect(res.col).toEqual(1);
    expect(res.key).toEqual("className");
    expect(res.val).toEqual(className);
  });

});
