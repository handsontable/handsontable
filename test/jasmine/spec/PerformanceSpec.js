describe('Performance', function () {
  var id = 'testContainer';

  //this is a test suite to test if there are no redundant operations

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call renderer once for each cell', function () {
    var spy = spyOn(Handsontable.TextCell, 'renderer').andCallThrough();

    handsontable({
      startRows: 4,
      startCols: 4
    });

    expect(spy.callCount).toEqual(32); //16 in main table and 16 in autocellsize
  });

  it('should call getCellMeta once for each cell', function () {
    var count = 0;

    handsontable({
      startRows: 4,
      startCols: 4,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(28); //16 in main table and 4 in autocellsize and 8 in getColWidth
  });
});