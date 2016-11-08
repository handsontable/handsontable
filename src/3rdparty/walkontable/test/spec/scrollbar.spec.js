describe('WalkontableScrollbar', function () {
  var $table
    , $container
    , $wrapper
    , debug = false;

  beforeEach(function () {
    $wrapper = $('<div></div>').css({'overflow': 'hidden'});
    $container = $('<div></div>');
    $table = $('<table></table>'); //create a table that is not attached to document
    $wrapper.append($container);
    $container.append($table);
    $wrapper.appendTo('body');
    createDataArray();
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $wrapper.remove();
  });

  it("should table in DIV.wtHolder that contains 2 scrollbars", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();

    expect($table.parents('.wtHolder').length).toEqual(1);
  });

  it("scrolling should have no effect when totalRows is smaller than height", function () {
    this.data.splice(5, this.data.length - 5);

    try {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      wt.wtOverlays.topOverlay.onScroll(1);
      expect(wt.getViewport()[0]).toEqual(0);
      wt.wtOverlays.topOverlay.onScroll(-1);
      expect(wt.getViewport()[0]).toEqual(0);
    }
    catch (e) {
      expect(e).toBeUndefined();
    }
  });


});
