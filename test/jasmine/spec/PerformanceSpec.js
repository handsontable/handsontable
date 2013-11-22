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
    var originalTextRenderer = Handsontable.renderers.TextRenderer;
    spyOn(Handsontable.renderers, 'TextRenderer');
    Handsontable.renderers.registerRenderer('text', Handsontable.renderers.TextRenderer);

    handsontable({
      startRows: 4,
      startCols: 4
    });

    expect(Handsontable.renderers.TextRenderer.callCount).toEqual(32); //16 in main table and 16 in autocellsize

    Handsontable.renderers.registerRenderer('text', originalTextRenderer);
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